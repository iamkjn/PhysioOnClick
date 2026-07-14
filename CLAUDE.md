# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server at http://localhost:3000
npm run build        # production build
npm run rebuild      # clean .next then build
npm run lint         # ESLint via next lint
npm test             # run tests (vitest)
npm run test:run     # run tests once (vitest run)
npm run seed:firestore                            # seed all Firestore collections
npm run seed:firestore -- --only=blogs,services  # seed specific collections only
```

## Architecture

**Stack:** Next.js 15 (App Router) + React 19, Firebase (Auth/Firestore/Storage), Stripe Checkout, Recharts.

### Content layer (dual-source pattern)

All public content (services, pricing, testimonials, blog articles) has a **static fallback** in `lib/site-data.ts` and `lib/blog.ts`. When `NEXT_PUBLIC_USE_LIVE_CONTENT=true`, `lib/firestore-content.ts` fetches the same data from Firestore and falls back to the static arrays if the fetch fails or the collection is empty. Pages import from `lib/public-content.ts`, which delegates to this dual-source logic.

The 108 blog articles are generated and live in `lib/blog.ts`. Cover images are SVGs generated in `lib/blog-image-svg.ts` and uploaded to Firebase Storage by the seed script.

### App structure

- `app/` — Next.js App Router pages; public marketing routes at root level, plus:
  - `app/patient/` — patient portal (auth-gated)
  - `app/admin/` — admin dashboard (auth-gated)
  - `app/api/checkout/` — Stripe Checkout session creation
- `components/` — shared React components; UI pieces consumed by pages
- `lib/` — data, Firebase clients, Stripe client, utility helpers

### Firebase setup

- `lib/firebase.ts` — client-side Firebase app + `db`, `auth`, `storage` exports
- `lib/firebase-admin.ts` — server-side admin SDK (used in API routes and seed script)
- `lib/patient-account.ts` — patient Firestore CRUD helpers
- `lib/firestore-helpers.ts` — generic Firestore query helpers
- Security rules live in `firestore.rules` and `storage.rules`

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Client-side Firebase config |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client |
| `NEXT_PUBLIC_CAL_USERNAME` | Cal.com username for scheduling embed |
| `STRIPE_SECRET_KEY` | Stripe server |
| `CAL_WEBHOOK_SECRET` | HMAC secret to verify Cal.com webhook signatures |
| `CAL_API_KEY` | Server-only Cal.com API key for admin cancel action |
| `NEXT_PUBLIC_USE_LIVE_CONTENT` | `"true"` to read content from Firestore instead of static files |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used in metadata and sitemap |
| `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT_JSON` | Admin SDK auth for seed script |

Copy `.env.example` → `.env.local` and fill in values before running locally.

### Mobile app

`mobile_app/` is a separate React Native project (not part of the Next.js build).
