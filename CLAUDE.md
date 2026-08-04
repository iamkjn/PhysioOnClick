# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server at http://localhost:3000
npm run build        # production build
npm run rebuild      # clean .next then build
npm run lint         # ESLint via next lint
npm test             # run tests in watch mode (vitest)
npm run test:run     # run tests once
npx vitest run tests/lib/recovery.test.ts   # run a single test file
npm run emulators    # Firebase emulators (needs Java 21 via homebrew openjdk@21)
npm run emulator:smoke-test                  # smoke-test against emulators
npm run seed:firestore                       # seed all Firestore collections
npm run seed:firestore -- --only=blogs,services   # seed specific collections
```

Tests live in `tests/`, mirroring the source tree (`tests/lib/`, `tests/app/`, `tests/api/`, ...). Vitest uses jsdom, globals, and the `@/` alias to repo root; `.claude/worktrees/` is excluded from test discovery.

**Environments:** two Firebase projects — `physioonclick-dev` (dev) and `physioonclick-prod` (prod). Env config uses Next's auto-selected files (both gitignored): `.env.development` (loaded by `npm run dev` → dev project + Stripe **test** keys) and `.env.production` (loaded by `next build`/`npm run deploy` → prod project + Stripe **live** keys). Do NOT keep an `.env.local` — Next loads it last in every mode, so a stray `.env.local` would override `.env.production` and leak dev config into a prod build. Copy `.env.example` → `.env.development` to start locally. Mobile mirrors this via `mobile_app/firebase/{dev,prod}/` + `scripts/switch-firebase-env.sh`.

## Architecture

**Stack:** Next.js 15 (App Router) + React 19, Firebase (Auth/Firestore/Storage/Functions), Cal.com (booking), Google Gemini (chat assistant), Resend (email), GSAP (animation), Recharts.

### Booking flow (Cal.com-backed, custom UI)

Booking is a custom 3-step flow (`components/booking-flow.tsx`: service → time → confirmation) on `app/book/` — no Cal.com embed. It talks to Cal.com's public v2 API through two server routes that deliberately don't use `CAL_API_KEY`:

- `app/api/cal/slots/` — fetches availability (event types resolved via `lib/cal-services.ts` from `NEXT_PUBLIC_CAL_USERNAME`)
- `app/api/cal/book/` — creates the booking
- `app/api/cal-webhook/` — receives Cal.com booking events, verifies HMAC signature with `CAL_WEBHOOK_SECRET`, writes bookings to Firestore
- `app/api/appointments/sync/` — syncs appointment state
- `app/api/auth/magic-link/` + `app/api/auth/link-bookings/` — passwordless sign-in via Resend email, then links guest bookings to the account
- `lib/patient-bookings.ts` — booking Firestore helpers; admin cancel calls Cal.com via `cancelCalBooking` in `app/admin/actions.ts` with server-only `CAL_API_KEY`

Payments: paid booking runs through Stripe hosted Checkout. `app/api/checkout/create/`
creates a Checkout Session (amount derived server-side from `lib/site-data.ts`),
`app/api/payments/webhook/` verifies the Stripe signature and creates the Cal.com booking
after payment (pay-first), and `app/api/checkout/status/` backs the `/book/success` page.
`lib/payments/` holds the provider interface + Stripe implementation (REST over `fetch`,
Workers-safe). PayPal is a planned phase-2 provider behind the same interface.
Paid bookings generate an insurance-ready receipt (pay-and-claim): `lib/patient-receipt.ts`
assembles it, it is printable at `/book/receipt/[session]` (reachable by the unguessable
Stripe session id, same trust model as Stripe's own hosted receipts), and it is emailed
via Resend (`lib/emails/receipt-email.ts`). Issuer details live in `invoiceIssuer` in
`lib/site-data.ts` (HCPC/CSP/address filled). On payment the webhook also builds a real
**PDF** invoice (`lib/invoice-pdf.ts`, pdf-lib — Workers-safe), attaches it to the receipt
email, and stores it in Firebase Storage at `invoices/{invoiceNumber}.pdf` (client access
denied in `storage.rules`; upload/download via the `uploadObject`/`downloadObject` helpers
on the `firebase-admin` shim). Admins list paid invoices at `/admin/invoices` and download
the stored PDF via `app/api/admin/invoice/[invoice]/` (admin-gated by `ADMIN_EMAIL`).

Pre-appointment assessments are gated on a paid booking: only bookings with `paid: true`
get `assessmentRequired`/`assessmentFormId` stamped, and `assessmentCompletedAt` is written
server-only when the patient submits. The assessment link is emailed alongside the
receipt/invoice via a magic-link sign-in (same passwordless flow as above), including the
Cal.com `meetingUrl` when one exists. Admins only ever see submitted assessments — unsubmitted
ones don't show up in the dashboard. A scheduled Cloud Function, `sendAssessmentReminders`
(`functions/src/index.ts`), runs periodically and, for each paid booking whose appointment is
~1h away and whose assessment isn't done, re-sends the link by calling
`POST /api/assessment/reminder-email` (guarded by `CRON_SECRET`, see `.env.example`) and by
pushing an FCM notification.

### AI chat assistant

`app/api/chat/route.ts` runs a Gemini-powered assistant (`GEMINI_API_KEY`). `lib/chat-prompt.ts` holds the system prompt; `lib/chat-tools.ts` declares function-calling tools in two tiers — guest tools (get_services, redirect, open_booking) and authenticated tools that add get_appointments and cancel_appointment. Chat transcripts are viewable at `app/admin/chat-logs/`.

### Content layer

Public content (services, pricing, testimonials) is static in `lib/site-data.ts`; the 108 generated blog articles live in `lib/blog.ts`. Pages read via `lib/public-content.ts` (static only). `lib/firestore-content.ts` layers dynamic content on top: when `NEXT_PUBLIC_USE_LIVE_CONTENT=true` it fetches admin-created blogs from Firestore (e.g. `fetchDynamicBlogBySlug`), falling back to the static arrays. Cover images are SVGs generated by `lib/blog-image-svg.ts` / `lib/service-image-svg.ts`, served from the `app/blog-images/`, `app/service-images/`, and `app/specialism-images/` routes.

### App structure

- `app/` — public marketing routes at root level (about, services, pricing, blog, glasgow-physiotherapist local-SEO page, policies), plus:
  - `app/patient/` — patient portal (account, appointments, people/dependents, recovery tracking)
  - `app/admin/` — admin dashboard, gated via `lib/admin-auth.ts` + `ADMIN_EMAIL`; server actions in `app/admin/actions.ts`
- `components/` — shared React components
- `lib/` — data, Firebase clients, domain helpers (`recovery.ts`, `dependents.ts`, `session-summaries.ts`, `patient-account.ts`)
- `functions/` — Firebase Cloud Functions (separate npm project): sends FCM push notifications when a session summary is published
- `mobile_app/` — separate Flutter project (Dart SDK ^3.8.1), not part of the Next.js build
- `docs/` — PRD, TODOs, strategic review

### Firebase setup

- `lib/firebase.ts` — client SDK (`db`, `auth`, `storage` exports)
- `lib/firebase-admin.ts` — **not** the `firebase-admin` package. A REST-backed shim that mirrors the subset of the admin API this app uses, because firebase-admin cannot run on Cloudflare Workers (its credential layer calls `XMLHttpRequest`; Firestore defaults to gRPC). It speaks the Firestore + Identity Toolkit REST APIs over `fetch` and signs/verifies JWTs with `jose`. Auth via `FIREBASE_SERVICE_ACCOUNT_JSON` only — `FIREBASE_SERVICE_ACCOUNT_PATH` is gone, since Workers has no filesystem.
  - Implemented surface: `collection`/`doc`/`batch`, `where`/`orderBy`/`limit`/`get`/`add`/`set`/`update`/`delete`/`commit`, `FieldValue.serverTimestamp`/`arrayUnion`, `auth.verifyIdToken`/`generateSignInWithEmailLink`. Anything else (transactions, collectionGroup, aggregates) is deliberately unimplemented — add it when a call site needs it.
  - Honours `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` **per service**; they are independent.
  - Covered by `tests/lib/firebase-admin.test.ts` (unit, mocked fetch). Payload shapes were verified against the real Firestore emulator.
- `lib/firestore-helpers.ts` — generic query helpers
- Security rules: `firestore.rules`, `storage.rules`; indexes: `firestore.indexes.json`

### Deployment (Cloudflare Workers)

Deployed via `@opennextjs/cloudflare` (OpenNext adapter) — not Pages, not `next-on-pages`.

```bash
npm run preview     # build + run in the real workerd runtime locally
npm run deploy      # build + deploy to Cloudflare
npm run cf-typegen  # regenerate cloudflare-env.d.ts from wrangler.jsonc
```

- `wrangler.jsonc` — Worker config. `compatibility_date` must stay ≥ `2025-04-01` or vars stop appearing in `process.env`. Only non-secret vars belong here (the file is committed).
- `open-next.config.ts` — no incremental cache override; add the R2 one if a route ever uses `revalidate`.
- Secrets are set with `wrangler secret put NAME` (or the dashboard), never in `wrangler.jsonc`.
- `NEXT_PUBLIC_*` are inlined at **build** time, so they must exist in the build environment — setting them as Worker vars/secrets does nothing.
- `next.config.mjs` aliases `@firebase/firestore` to its browser build for the server bundle. The client SDK's node build uses gRPC/protobufjs, which calls `new Function()` — workerd forbids that and every SSR'd page 500s. Do not remove that alias.
- `images.unoptimized` is on: Next's optimizer needs sharp, which Workers lacks. Every image is currently an SVG, which Next passes through anyway.

### Environment variables

See `.env.example` for the full list. Key server-only vars: `CAL_WEBHOOK_SECRET`, `CAL_API_KEY`, `ADMIN_EMAIL`, `GEMINI_API_KEY`, `RESEND_API_KEY`, `ENQUIRY_EMAIL_TO`/`ENQUIRY_EMAIL_FROM`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and Firebase admin credentials. Key client vars: `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_CAL_USERNAME`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_USE_LIVE_CONTENT`. Local dev works without `RESEND_API_KEY` — magic links log to the console instead of emailing.

## Design Context

`PRODUCT.md` and `DESIGN.md` at the repo root carry the strategic and visual design system for this project (read by `/impeccable` and other design work). Register defaults to `product`; the public marketing pages (`/`, `/about`, `/pricing`, `/blog`, `/glasgow-physiotherapist`) override to `brand`. Brand personality is modern & efficient, explicitly not a "cold SaaS dashboard." Visual system is "The Clarity System": warm paper background, navy ink, a single sky-blue accent graded down for legibility, Fraunces/DM Sans pairing, flat-at-rest/lift-on-hover elevation.
