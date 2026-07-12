# Online-Launch Content Cleanup, Local Login Fix, Nav Sign-In — Design Spec
**Date:** 2026-07-12
**Status:** Approved

## Problem

Three unrelated gaps surfaced while checking the site ahead of the online-only launch:

1. Several pages still advertise "home visits" / "in-person in Glasgow", contradicting the online-initially positioning in `docs/PRD.md`.
2. Signing in on the web app locally doesn't work — it just bounces back to the login form.
3. There's no visible "Sign In" entry point in the site nav for existing patients — the only way in is via `/patient` directly or the booking auth-gate.

## Goal

Ship online-only copy everywhere, get local login working, and add a discoverable sign-in link in the header.

## Scope

- Remove/replace all home-visit and in-person-Glasgow copy in homepage, contact, pricing, services, about, and footer
- Rewrite `/glasgow-physiotherapist` from an in-person landing page into an online-service landing page, keeping the URL and sitemap entry for its existing SEO value
- Document the local emulator seeding workflow so login works locally with demo accounts (no code change — this is a workflow/environment gap, not a bug)
- Add a "Sign In" link to the site header, desktop and mobile, visible only when signed out

Out of scope: production/live-site login (no bug found locally; would need the live URL and separate investigation if still broken there), any change to the actual auth logic in `components/auth-panel.tsx`, removing the `mode: "In-person"` type option from `PricingItem` (leaving the type as-is, just removing the dead render branch and copy that referenced it).

## Part A — Home-visit / in-person content removal

| File | Change |
|---|---|
| `app/page.tsx:21` | Remove "Home visits in Glasgow" from the homepage trust bar; keep "Online appointments across the UK" |
| `app/contact/page.tsx:19` | Location line → "Online consultations across the UK" |
| `app/pricing/page.tsx:10` | Meta description → drop "Glasgow home visits" |
| `app/pricing/page.tsx:41` | Remove the dead "In-Person Sessions (Glasgow home visits)" heading block (never renders today since no pricing item has `mode: "In-person"`, but it's leftover copy) |
| `app/services/page.tsx:25` | → "delivered online across the UK" |
| `app/about/page.tsx:71` | Drop "both in-person in Glasgow and" → "through online appointments across the UK" |
| `app/about/page.tsx:181` | → "Book an online assessment today" |
| `components/site-footer.tsx:11` | → "Evidence-based physiotherapy online across the UK" |
| `app/glasgow-physiotherapist/page.tsx` | Rewrite for online: swap FAQ ("Do you offer in-person physiotherapy in Glasgow?") for an online-relevant one; replace `MedicalBusiness`/`PostalAddress` JSON-LD with a schema appropriate for an online service (e.g. `Physiotherapy`/`MedicalOrganization` without a physical visit address, or drop the address fields); replace "In-person care in Glasgow" bullet and "In-person assessments in Glasgow…" body copy with online-service equivalents targeting Glasgow searchers |
| `components/site-footer.tsx:33` | Footer link to `/glasgow-physiotherapist` stays; label reviewed for consistency with the rewritten page |

Not touched: `lib/site-data.ts` and blog "home exercise programme" / "home support" copy — those describe at-home exercises, not a visiting service.

## Part B — Local login fix (no code change)

**Root cause:** `.env.local` correctly sets `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` plus matching `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` vars — that's the intended local-dev setup (see `lib/firebase.ts:41-55`). But `.firebase-emulator-data/` is empty: the emulator has been started before but the seed script was never run against it, so it holds zero users. Any sign-in attempt gets `auth/user-not-found` / `auth/wrong-password`, surfaced as "Your email or password is incorrect" (`components/auth-panel.tsx:55-58`), which reads as "it won't let me in."

Verified not the cause: error handling, redirects, and Firestore rules (`firestore.rules:82-132`) in the auth path are all correct. Firebase Auth emulator rules pass through the same `firestore.rules` because `firebase.json` points both at the same file.

**Fix (procedural, one-time):**
1. `npm run emulators` — starts the local Auth/Firestore/Storage emulator suite; leave it running
2. In a second terminal: `npm run seed:firestore` — populates the running emulator, including the demo patient Auth users and their password (`scripts/seed-firestore.ts`)
3. `npm run dev`, then sign in at `/patient` with a demo account (e.g. `sarah.demo@physioonclick.co.uk` / `PhysioDemo2026!`)

The `emulators` script already runs with `--export-on-exit`, so once seeded, data persists across restarts (no need to reseed every session unless `.firebase-emulator-data/` is deleted).

**Live/deployed site:** `.env.local` is gitignored and never deployed, so this flag cannot be the cause there. If the live site also fails to log in, that's a separate issue requiring the live URL to investigate — not addressed by this spec.

## Part C — Sign-in button in nav

Add a "Sign In" link to `components/site-header.tsx`:
- Desktop actions area (near lines 84-96): render a "Sign In" link to `/patient` when `user` is `null`, alongside the existing conditional "Sign out" (shown only when `user` is set) — the two are mutually exclusive based on auth state
- Mobile nav panel (near lines 116-147): same pattern, "Sign In" link shown when signed out, "Sign out" button shown when signed in
- Links to `/patient`, which already renders `<AuthPanel role="patient" />` as the sign-in form — no new route needed

## Files Touched

| File | Action |
|---|---|
| `app/page.tsx` | Edit |
| `app/contact/page.tsx` | Edit |
| `app/pricing/page.tsx` | Edit |
| `app/services/page.tsx` | Edit |
| `app/about/page.tsx` | Edit |
| `components/site-footer.tsx` | Edit |
| `app/glasgow-physiotherapist/page.tsx` | Edit (rewrite) |
| `components/site-header.tsx` | Edit |

No new environment variables, no new routes, no changes to `components/auth-panel.tsx`, `lib/firebase.ts`, or Firestore rules.

## Success Criteria

- No page contains "home visit" or "in-person in Glasgow" copy; `/glasgow-physiotherapist` reads as an online service for Glasgow patients while keeping its URL and sitemap entry
- Following the three-step local seeding workflow, a demo patient can sign in locally and land on `/patient`
- A signed-out visitor sees a "Sign In" link in both the desktop header and the mobile menu; it disappears (replaced by "Sign out") once signed in
