# PhysioOnClick — Remaining / Editable Tasks

Produced by auditing the actual code against every requirement in [docs/PRD.md](PRD.md), file by file — not a restatement of the PRD, only what's missing, contradictory, or needs a decision. Dated 2026-07-10.

## Critical — resolved (2026-07-12)

- [x] **Orphaned booking pipeline — resolved: deleted.** `components/booking-form.tsx`, `app/api/booking/route.ts`, `lib/google-calendar.ts`, and `app/api/checkout/route.ts` were confirmed to have zero callers anywhere in web or mobile code, and were fully superseded by Cal.com's native Stripe Connect payment flow (confirmed set up: GBP currency, £50/£40 pricing matching the site, "Collect payment on booking" enabled). Deleted all four, plus their now-orphaned tests (`tests/api/booking.test.ts`, `tests/components/booking-form.test.tsx`). This also removes the hardcoded personal-looking email fallback (`zalashivali1998@gmail.com`) and the missing `bookedBy`/`patientId` fields bug that lived in the deleted `/api/booking` route. Verified: `tsc` clean, full test suite passes (20/20), production build succeeds with `/api/booking` and `/api/checkout` no longer in the route list.
- [x] **Online payment — resolved: Cal.com's native Stripe Connect**, not a custom integration. PRD §4.4/§4.11 should be read as: payment and video both happen through Cal.com's own paid-event-type flow.

## Should fix — real but lower-stakes

- [x] **Mobile `symptom_checker` directory** — deleted (confirmed unreferenced in navigation).
- [x] **Session summary download** — added `DownloadSummaryButton` to the appointment detail page.

## Verified accurate — no action needed

- §4.1 Registration & Login — magic-link expiry/invalid-link handling and the "request a new link" retry flow both match the PRD exactly (`app/auth/verify/page.tsx`).
- §4.5 Patient Profile — edits persist to both `users` and `patients` collections via `mergePatientProfileDetails`, matching the PRD.
- §4.9 Exercise Programme — assignment (`admin-exercise-assigner.tsx`) and patient view/completion (`assigned-exercises.tsx`, `adherence-bar.tsx`) are wired together correctly in `app/patient/recovery/page.tsx`.

## Already fixed this session (for the record, not re-flagged)

- Guest-booking-to-account linking was writing the wrong field name (`patientUid` instead of `bookedBy`) — fixed.
- `bookings` and `payments` Firestore rules were open/unused-permissive — locked down.
- Bookings weren't scoped per family member despite the PRD claiming they were — fixed with a `personId` filter and `PersonSwitcher` wired into the appointments page.

## Deploy Readiness (2026-07-10 audit)

Checked against both "does the code work" and "is the business actually live" — full findings below.

### Blocking — must resolve before going live

- [ ] **`NEXT_PUBLIC_SITE_URL` is not set anywhere.** Used in 6 places (`app/robots.ts`, `app/sitemap.ts`, `app/layout.tsx` metadata, `app/api/auth/magic-link/route.ts`, the orphaned `app/api/booking/route.ts`, `lib/utils.ts`) — all fall back to `http://localhost:3000` when unset. In production this means: every magic-link sign-in email sent to a real patient contains a broken localhost link, and your sitemap/robots.txt advertise localhost to search engines. **Must be set to `https://physioonclick.co.uk`** in whichever hosting platform's environment variables once the domain is live.
- [ ] **Hosting isn't chosen or deployed yet.** Nothing is live — still deciding between Vercel Pro, Firebase App Hosting, or Railway (see chat discussion). Domain DNS can't be pointed anywhere until this is picked.
- [x] **Cal.com Stripe Connect** — confirmed set up (GBP currency, £50/£40 pricing, "Collect payment on booking" enabled). Test-mode end-to-end verification (a real test booking with Stripe test card `4242 4242 4242 4242`) was walked through but not explicitly confirmed completed — worth doing once before real patients arrive.
- [ ] **Cal Video** — not yet confirmed enabled on the event type. Free on Cal.com's plan (confirmed), just needs turning on as the location option.
- [ ] **No mailbox exists yet for `hello@`/`admin@physioonclick.co.uk`.** Resend can send from these addresses but there's no inbox to receive replies. IONOS Mail (since you're already there) or Google Workspace — pick one.

### Should fix — real, not blocking

- [ ] **`lib/firebase.ts` hardcodes a live Firebase project config as a fallback** (`providedFirebaseConfig` — real API key, real `projectId: "physioonclick"`) used whenever `NEXT_PUBLIC_FIREBASE_*` env vars are absent. Not a security issue (Firebase client config is meant to be public, protected by security rules not secrecy), but it's an unusual pattern — for a clean deploy, set the explicit `NEXT_PUBLIC_FIREBASE_*` env vars in the hosting platform rather than relying on the source-code fallback silently kicking in.
- [ ] **Confirm at least one real admin account exists** in the production Firebase project via `scripts/grant-admin.ts` — not verified this session, only that the script exists.
- [ ] **Confirm content source setting** (`NEXT_PUBLIC_USE_LIVE_CONTENT`) matches intent — if `true`, confirm `npm run seed:firestore` has been run against the production project; if unset/false, the static fallback content in `lib/site-data.ts`/`lib/blog.ts` is what ships, which is fine but worth being a deliberate choice.
- [ ] Test coverage is thin specifically on the booking/payment path (`cal-webhook`, `link-bookings`, `checkout` have no tests) — see [docs/strategic-review.md](strategic-review.md).

### Dev/live environment separation (added 2026-07-12)

Local development now runs against the **Firebase Local Emulator Suite** instead of the real `physioonclick` project — a second cloud project wasn't possible (Google account hit its GCP project quota), so the emulator was the better fit anyway: zero cost, zero quota impact, fully isolated.

- `npm run emulators` — starts Firestore/Auth/Storage emulators, persisting data in `.firebase-emulator-data/` between runs (gitignored).
- `npm run seed:firestore` — now loads `.env.local` automatically (via Node's `--env-file`, a pre-existing gap that silently affected the original real-project seeding too, not just this) and, with the emulator running, seeds it instead of production.
- `lib/firebase.ts` connects the client SDK to the emulators when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` (now set in `.env.local`).
- Requires **Java 21+** for the Firestore/Auth emulator backend — installed via `brew install openjdk@21` (kept separate from the system's existing Java 17, not linked globally, only used via PATH override in the `emulators` script).
- **To deploy to the real project** (rules, indexes, or seed real content) going forward: unset/override `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` for that one command, or work from a shell without the emulator env vars set.

### Already fixed this session (for the record)

- `computeRecoveryPercent` returned `0` instead of `null` for a zero-baseline pain score, contradicting its own test — fixed to return `null`, matching the correct product behavior (you can't show "0% recovery" for a patient who started at zero pain without it reading as "got worse").
- **`firestore.rules` and `firestore.indexes.json` are now actually deployed to production** (`physioonclick` project) — previously all of this session's rules fixes only existed in the local file and were never pushed live. Also found and fixed: two missing composite indexes (`bookings: bookedBy+createdAt`, `bookings: email+createdAt`, `enquiries: email+createdAt`) that `components/patient-live-overview.tsx` needed but never had, causing real `failed-precondition` errors on `/patient` — pre-existing gap, not something introduced this session. Also removed an invalid single-field index entry for `chatSessions` that was silently blocking every index deploy.

### Confirmed good — no action needed

- Production build succeeds cleanly (`npm run build`, zero errors).
- Full test suite passes (20/20 — down from 27 after removing the orphaned booking-pipeline tests).
- Lint and TypeScript both clean.
- CSP legal/compliance work is fully implemented and tested: symptom checker removed, informed-consent checkbox on the booking form, Terms & Conditions page, UK-GDPR-shaped Privacy Policy, footer links — all committed (`docs/superpowers/plans/2026-06-21-launch-compliance.md`).
- `firestore.rules` and `storage.rules` both reviewed — storage rules are already admin-gated with per-user isolation and a default-deny fallback, no changes needed there.
- Domain purchased (`physioonclick.co.uk`, IONOS).

### Out of scope for this check

- Mobile app store submission (Apple/Google) is a separate, longer-running process with its own review timeline — not a blocker for the web deploy, track separately.

## Resolved: the open question this list originally surfaced

Online payment is now confirmed wired up — through Cal.com's native Stripe Connect, not the custom `/api/checkout` route (which has been deleted along with the rest of the orphaned pipeline). Remaining before real patients: confirm a real test booking end-to-end with Stripe's test card, and enable Cal Video on the event type.
