# PhysioOnClick — Go-Live Runbook

Single source of truth for taking the paid-booking build live. Two environments:
- **dev** = `physioonclick-dev` (test data, Stripe **test** keys) — run locally via `.env.development`
- **prod** = `physioonclick-prod` (real data, Stripe **live** keys) — deployed to `physioonclick.co.uk` via `.env.production`

Public domain stays `physioonclick.co.uk`. Both mobile + web use package/bundle `com.iamkjn.physioonclick`.

---

## 0. Status snapshot (2026-08-01)

**Done**
- Stripe pay-first booking + insurance receipt — built, reviewed, verified end-to-end in sandbox.
- Receipt email sends from `hello@physioonclick.co.uk` (Resend domain verified).
- Two Firebase projects fully configured (both `europe-west*`, EU/UK data residency):
  - Firestore + rules + indexes ✅ (dev + prod)
  - Storage + rules ✅ (dev + prod)
  - Auth: Email/Password + **Email link**, Google, Apple, Phone; authorized domains ✅
- Env-separated builds: `.env.development` / `.env.production` (no `.env.local` — it would leak dev into prod).
- Mobile per-env Firebase config + `mobile_app/scripts/switch-firebase-env.sh`.
- Cal.com: **Paid booking OFF** on both event types (bookings now come back `accepted`, not `pending`).

**Remaining (this runbook)**
1. Cal.com — give **Online Follow-Up** an availability schedule (currently 0 slots).
2. Stripe — activate a real (non-sandbox) account + live keys + live webhook.
3. Prod secrets on the Cloudflare Worker.
4. Deploy + smoke test.

---

## 1. Cal.com — fix Online Follow-Up availability

Online Follow-Up currently returns **0 bookable slots**. In Cal.com → **Online Follow-Up → Availability**, assign it the same working schedule as Initial Assessment. Verify slots appear on `/book` for the follow-up service.

Also keep **Paid booking OFF** on both event types (Payments & Seats tab). Cal.com only holds the calendar; your Stripe checkout takes the money.

---

## 2. Stripe — go live

**Critical path.** Live keys require an **activated, non-sandbox** Stripe account.

1. **Activate the account:** Stripe Dashboard (your real business account, not a sandbox) → Settings → Business/Account → submit business details + **bank account**. Wait for approval.
2. **Switch to Live mode** (top-right toggle). Developers → API keys now show `pk_live_…` / `sk_live_…`.
3. **Enable payment methods in LIVE mode** on the **Default (Your account)** payment-method config: card, Apple Pay, Google Pay, and any others you want (Klarna/Revolut/Amazon Pay/PayPal). Toggles are per-mode, so redo them in Live. For PayPal, finish its activation until status = Active.
4. **Create a live webhook:** Developers → Webhooks → Add endpoint →
   - URL: `https://physioonclick.co.uk/api/payments/webhook`
   - Event: `checkout.session.completed`
   - Copy its **live** signing secret (`whsec_…`).

---

## 3. Prod config + secrets

### Build-time (public) — in `.env.production`
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```
(Firebase prod client keys + site URL + measurement id are already set.)

### Runtime secrets — Cloudflare Worker (`wrangler secret put`, values never committed)
```bash
wrangler secret put STRIPE_SECRET_KEY          # sk_live_...
wrangler secret put STRIPE_WEBHOOK_SECRET      # whsec_... (LIVE endpoint)
wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON   # physioonclick-prod service account (one line)
wrangler secret put ENQUIRY_EMAIL_FROM         # PhysioOnClick <hello@physioonclick.co.uk>
wrangler secret put RESEND_API_KEY
wrangler secret put CAL_API_KEY
wrangler secret put CAL_WEBHOOK_SECRET
wrangler secret put GEMINI_API_KEY
```
Non-secret prod vars (`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_STORAGE_BUCKET`) are already `physioonclick-prod` in `wrangler.jsonc`.

> Server secrets live on the Worker at runtime, NOT baked into the build. `.env.production` only supplies them for a local `npm run preview`.

---

## 4. Cal.com live webhook (Firestore booking records)

The prod site needs Cal.com to POST booking events to it so `bookings` docs are written:
- Cal.com → Settings → Developer → **Webhooks** → point at `https://physioonclick.co.uk/api/cal-webhook`
- Set the signing secret to match the `CAL_WEBHOOK_SECRET` you set on the Worker.

---

## 5. Deploy

Branch `feat/paid-booking-stripe` holds all the work. Merge to `master` (or deploy from the branch), then:
```bash
npm run deploy      # opennextjs-cloudflare build (loads .env.production) + deploy
```
`next build` loads `.env.production` (prod Firebase + `pk_live_`); the Worker reads secrets/vars at runtime.

---

## 6. Post-deploy smoke test (LIVE — real card, small amount, then refund)

1. Open `https://physioonclick.co.uk/book`, book the cheapest service.
2. Pay with a **real** card (this is a real charge).
3. Confirm: redirected to `/book/success` → "you're booked"; Stripe live webhook 200; a `payments` doc `status:paid` + `bookings` doc in **prod** Firestore; receipt email arrives from `hello@physioonclick.co.uk`; receipt page at `/book/receipt/<session>` renders with real HCPC/CSP details.
4. **Refund** the test charge in the Stripe dashboard and cancel the test booking in Cal.com.

---

## 7. Rollback

- Revert to the previous Worker deploy in the Cloudflare dashboard (Workers → Deployments → rollback), or `git revert` + redeploy.
- The old `physioonclick` Firebase project is untouched during all this; prod data lives in `physioonclick-prod`.

---

## Reference — who owns what
- **Stripe** account (patient payments) — separate from Cal.com billing and from Cal.com's own Stripe integration (unused).
- **Firebase prod** (`physioonclick-prod`) — owned by the secondary Google account; `krunalnayak49@gmail.com` added as Owner for CLI/tooling.
- **Resend** — domain `physioonclick.co.uk` verified; sender `hello@physioonclick.co.uk`.
- **Go-live TODO already handled:** `invoiceIssuer` in `lib/site-data.ts` has real HCPC (PH155757) + CSP (128230) + address.
