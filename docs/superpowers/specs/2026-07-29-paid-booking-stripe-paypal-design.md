# Paid Booking — Stripe + PayPal (mandatory full fee)

**Date:** 2026-07-29
**Status:** Approved design, pending implementation plan

## Goal

Collect the **full service fee (GBP), mandatory**, at the time a patient books, before
the Cal.com slot is confirmed. Present the **standard UK payment-selection screen**
(Apple Pay / Google Pay / PayPal express row + card, with a £ order summary). Ship
**Stripe first**, prove it in sandbox end-to-end, then add PayPal.

## Non-goals

- Subscriptions / recurring rehab packages (GoCardless is the future path, not now).
- Refunds/partial-payment UI, admin-issued payment links, or in-clinic (Square) payments.
- Replacing Cal.com as the scheduling source of truth.

## Context (current state)

- Booking is a custom 3-step flow in `components/booking-flow.tsx` (service → time →
  confirmation) that calls `app/api/cal/book/` to create the Cal.com booking directly.
- `app/api/cal-webhook/` already receives Cal.com events, verifies an HMAC signature with
  `CAL_WEBHOOK_SECRET`, and writes bookings to Firestore via `lib/patient-bookings.ts`.
- `lib/stripe.ts` is an unused shim (`getStripeServer()`), no checkout route exists.
- Service prices live in `lib/site-data.ts` (`price: number`, e.g. 50, 40, 180, 340).
- Deployed on **Cloudflare Workers** (OpenNext). No Node filesystem, `new Function()` is
  forbidden. The established pattern (see `lib/firebase-admin.ts`) is to call REST APIs
  over `fetch` and verify signatures with `jose` — payments follow the same pattern.

## Core flow — pay-first, then book (APPROVED)

1. Patient completes booking-flow steps 1–2 (service → time).
2. Step 3 shows an **order summary** (service, date/time, amount in £) + a single
   **"Continue to secure payment"** button. It calls a new
   `app/api/checkout/create/` route with `{ serviceSlug, slotStart, attendee }`.
3. `checkout/create` validates the service and re-derives the **amount server-side** from
   `lib/site-data.ts` (never trusts a client-sent amount), creates a **Stripe hosted
   Checkout Session** with the booking details in `metadata`, and returns the redirect URL.
4. Patient is redirected to Stripe's hosted Checkout, which renders the standard UK screen:
   Apple Pay / Google Pay (device-aware) + card, GBP-localised, PCI handled by Stripe.
   Apple/Google Pay come for free by enabling them in the Stripe dashboard.
5. On successful payment, Stripe's **webhook** hits a new `app/api/payments/webhook/`
   route. It verifies the signature, **re-checks the slot is still free**, creates the
   Cal.com booking (reusing the logic behind `app/api/cal/book/`), and writes the paid
   booking to Firestore (same write path as `cal-webhook` → `patient-bookings.ts`).
   Handler is **idempotent** on the Stripe event ID.
6. Patient lands on the existing `book/` confirmation step, which reads booking status
   from Firestore.

**Rationale:** On Workers the webhook is the reliable source of truth (mirrors the
existing `cal-webhook` HMAC pattern). Creating the Cal.com booking only after payment
avoids "confirmed but unpaid" ghost bookings. The one tradeoff — a slot could be taken
during the ~1 min on the payment page — is handled by the re-check in step 5 (if the slot
is gone, the payment is refunded/void and the patient is told to pick another slot), and
is very low-risk for a single-practice calendar.

## Payment-selection UX (standard UK pattern)

Rather than hand-building the payment screen, we use **Stripe hosted Checkout**, which
renders the conventional UK layout automatically:

- Express wallet row first: Apple Pay / Google Pay (shown only on supporting devices).
- Divider, then card entry with Visa/Mastercard/Amex.
- Order summary with the £ amount and a "Secure payment • powered by Stripe" reassurance.

This means **no custom card fields or provider-choice buttons** in `booking-flow.tsx` —
just the order summary + redirect. **PayPal** is added in phase 2 either as a Stripe
payment method or as a separate express button.

## Components & routes

### New server routes (all `fetch`-based, Workers-safe)

- `app/api/checkout/create/route.ts` — validates service + slot, derives GBP amount
  server-side, creates the Stripe Checkout Session (metadata = booking intent), returns
  the redirect URL. `success_url`/`cancel_url` built from `NEXT_PUBLIC_SITE_URL`.
- `app/api/payments/webhook/route.ts` — verifies the Stripe signature, re-checks the
  slot, creates the Cal.com booking, writes the paid booking to Firestore. Idempotent on
  the provider event ID.

### New lib

- `lib/payments/index.ts` — a thin provider-agnostic interface:
  `createCheckout(order)` and `verifyWebhook(req)`. Keeps the booking flow independent of
  which processor is used and makes PayPal (and later GoCardless) a one-file addition.
- `lib/payments/stripe.ts` — implements the interface by calling Stripe's REST API over
  `fetch` for Checkout Sessions + webhook signature verification (extends existing
  `lib/stripe.ts`; avoids relying on the Node SDK internals that break on Workers).
- `lib/payments/paypal.ts` — **phase 2**: PayPal Orders v2 REST implementation.

### Modified

- `components/booking-flow.tsx` — step 3 shows the order summary + "Continue to secure
  payment" and calls `checkout/create` instead of `cal/book`. The direct `cal/book` call
  is removed from the happy path (kept only if a free/£0 service ever exists — out of
  scope now).
- `lib/site-data.ts` — no schema change; the existing `price` field is the GBP charge
  amount. Currency is GBP throughout. No Stripe Price objects (avoids dual bookkeeping).

## Config & secrets

Server-only, set via `wrangler secret put` (never in `wrangler.jsonc`):

- `STRIPE_SECRET_KEY` (already in `.env.example`), `STRIPE_WEBHOOK_SECRET`
- Phase 2: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENV`
  (`sandbox` | `live`)
- Build-time inlined: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (only if a client-side Stripe.js
  bit is ever needed; hosted Checkout does not require it).
- Reuse `NEXT_PUBLIC_SITE_URL` for success/cancel redirects.

Add all of the above to `.env.example`.

## Error handling

- Client-sent amount is ignored; amount is always re-derived server-side. Reject unknown
  `serviceSlug`.
- Webhook signature failure → 400, no side effects.
- Duplicate webhook event ID → no-op (idempotency key = Stripe event ID stored/checked in
  Firestore).
- Slot taken between checkout and webhook → refund/void the payment, mark the attempt
  failed, surface a "slot no longer available, please rebook" message on the confirmation
  page.
- Payment cancelled/abandoned → `cancel_url` returns the patient to booking-flow step 2;
  no Cal.com booking is created (nothing to clean up, since we book pay-first).

## Testing strategy

### Unit (Vitest, mocked `fetch`, mirrors `tests/lib/firebase-admin.test.ts`)

- `lib/payments/stripe.ts`: `createCheckout` builds the correct Checkout Session payload
  (amount, currency GBP, metadata); `verifyWebhook` accepts a valid signature and rejects
  a tampered body.
- `app/api/checkout/create/`: derives amount server-side, rejects unknown service, rejects
  client-supplied amount.
- `app/api/payments/webhook/`: slot re-check, idempotency on event ID, Firestore write
  shape matches the `cal-webhook` path.

### Sandbox end-to-end (guided, manual)

- Stripe **test mode**: card `4242 4242 4242 4242`.
- Forward webhooks locally: `stripe listen --forward-to localhost:3000/api/payments/webhook`.
- Run `npm run dev`, complete a test booking, confirm the paid booking lands in Firestore,
  verify in the browser preview with a screenshot.
- **No live keys** touched until sandbox is green end-to-end.
- Phase 2 repeats the same with a PayPal **sandbox** buyer account.

## Delivery order

1. Stripe: `lib/payments/` interface + Stripe impl, both routes, booking-flow step 3,
   unit tests, sandbox validation. **Ship / verify before touching PayPal.**
2. PayPal: `lib/payments/paypal.ts`, wire the button/method, unit tests, sandbox
   validation.

## Open risks

- Cal.com booking creation from the webhook must reuse (not duplicate) the logic in
  `app/api/cal/book/`; refactor that into a shared helper the route and webhook both call.
- Refund-on-lost-slot needs a Stripe refund call — small, but part of phase 1.
