# Home Visits + Clinical Sign-off Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:**
1. Add Glasgow-area home visits to the booking flow and the site copy.
2. Apply Shivaliba's clinical sign-off answers to the Phase B/C pages.

Everything ships together with Phases B and C in one go-live.

**Facts from the owner (2026-10-03), binding:**
- The practice offers **home visits only** as in-person care: no clinic or premises.
- Home visits cover the **Glasgow area**.
- Prices are the same as online (initial assessment / follow-up / bundles from `lib/site-data.ts`).
- Home visits are booked through the **same booking flow and calendar** as video sessions.
- Video appointments stay available UK-wide.

**Shivaliba's answers (sign-off page, 2026-10-03), binding:**

| Q | Ruling |
|---|---|
| Q1 | Home visits in Glasgow are offered. Everything else in Q1 is correct: we don't order scans, patients need a camera/mic/connection for video, no needles, no medicines. |
| Q2 | Session counts depend on the condition. Don't state fixed ranges as a promise; say they depend on the condition and are estimated after assessment. |
| Q3 | Insurers need premises to register; she is waiting on replies. Keep the current "we cannot promise any insurer will pay" wording. |
| Q4 | Pelvic health will be offered, following NICE. Future work, not this plan. |
| Q5 | **We do not work alongside the NHS.** Remove every claim that we work alongside or coordinate with NHS teams. |
| Q6 | For MS (and likewise all neuro conditions), we don't treat until the GP or MS/specialist team allows it. The pages must require that clearance before starting. Follow NICE. |
| Q7 / Q8 | Fine. Outcomes and follow-up depend on the patient's condition. Follow NICE. |
| Q9 | Post-op rehab starts only with clearance from the post-op/surgical team confirming there are **no restrictions**. |
| Q10–15 | **Follow NICE guidelines; don't rely only on NHS pages.** Re-source the post-surgery content, red-flag routing and the sessions guide against fact-sheet item 15 (NICE). Keep NHS routing too: safety is never less urgent than the NHS. |
| Q16 | **Don't mention any competitor's name or website** on the site. Comparison by facts/ranges is OK, but anonymised. |
| Q17 / Q18 | Double-check against UK guidelines. **Avoid taking responsibility if a patient starts exercises without physio guidance.** Strengthen disclaimers on the exercise library and the new pages. |

**Architecture:**
- Visit type and address follow the existing `focusAreas` path through the system: `components/booking-flow.tsx` → `app/api/checkout/create` → Stripe metadata (`lib/payments/*`, `metadataToIntent`) → `app/api/payments/webhook` → `createCalBooking` (`lib/cal-booking.ts`, Cal metadata) and the Firestore booking record → emails → admin bookings table.
- Copy changes reuse existing data files.

## Global Constraints

- Work in worktree `.worktrees/seo-phase-b`, branch `feat/seo-phase-b`. It has real node_modules; never symlink them.
- All rules in `/Users/iamkjn/Documents/Playground/.git/worktrees/seo-phase-b/sdd/global-constraints.md` and `.../sdd/content-lessons.md` still apply, EXCEPT these lines, now superseded by the owner's facts above:
  - "online-only, no in-person or home visits";
  - "no claims of in-person care".
- Facts only from `docs/seo/phase-b-sources.md` (item 15 = NICE). Never imply NICE endorses us.
- **Home visits wording:**
  - Use "home visits in the Glasgow area".
  - Never claim a clinic, premises, or coverage outside Glasgow.
  - Never claim the Glasgow area means a specific radius or postcode list (none is defined).
  - Say "we'll confirm by email if your address is outside the area we cover".
- **Prices:** never hardcode; use the site-data helpers or the `{INITIAL_PRICE}` / `{FOLLOW_UP_PRICE}` tokens.
- **Privacy:** a home address is personal data.
  - Collect it only for home visits.
  - Cap its length.
  - Never log it to the console.
  - Never put it in analytics events.
  - Keep it out of URLs.
  - Update the privacy policy.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Known pre-existing failures:** 11 on master (body-chart; booking-flow x2; exercise-library-interactive x2; start-session-flow-status; condition-hub "from" price; exercise-page dose string; checkout-create x3). A task that touches booking-flow or checkout-create tests must keep those pre-existing failures, or fix them if the fix is the obvious stale expectation. It must report which.

---

### Task 1: Booking — visit type and home address

**Files:**
- `components/booking-flow.tsx` and `components/booking-step-service.tsx` (or the details step where name/email are collected; read the flow first).
- `app/api/checkout/create/route.ts`.
- `lib/payments/index.ts` and `lib/payments/stripe.ts` (intent ↔ metadata).
- `app/api/payments/webhook/route.ts`.
- `lib/cal-booking.ts`.
- `lib/patient-bookings.ts` (Firestore booking fields), if booking records are written there.
- `lib/emails/*` (confirmation, receipt, assessment-link emails).
- `components/admin-bookings-table.tsx`.
- Tests under `tests/api`, `tests/lib`, `tests/components`.

**Behaviour:**
- Patients choose **"Video call (anywhere in the UK)"** (the default) or **"Home visit (Glasgow area)"**.
- Choosing Home visit reveals required fields: address line and postcode (trimmed; max 120 and 10 characters), plus a hint: "Home visits cover the Glasgow area. We'll confirm by email if your address is outside it."
- The price is unchanged.
- **Server:** checkout/create validates `visitType ∈ {"video","home"}` (default "video"). For "home" it requires a non-empty address and a UK-postcode-shaped value (loose regex); otherwise it returns 400 with a clear error. visitType and address go into Stripe metadata within the 500-character limits, as focusAreas already do.
- The webhook passes them into the Cal.com booking metadata (`visitType`, `homeVisitAddress`) and into the Firestore booking record (`visitType`, `homeVisitAddress`).
- **Emails:** for home visits, every patient email shows "Home visit at <address>" and omits the video "Join your appointment" link/meetingUrl. Video bookings stay as now.
- **Admin bookings table:** shows a "Home visit" badge and the address. Video bookings show nothing new.
- **Analytics:** may record `visit_type` only, never the address.
- **Tests (TDD):**
  - checkout/create rejects a home visit without an address or postcode, and accepts video without them;
  - metadata round-trip for visitType and address;
  - the webhook passes them to createCalBooking;
  - the email omits the meeting link for home visits;
  - the booking-flow UI reveals the address fields only for home visits;
  - the admin table renders the badge.

Commit: `feat: book Glasgow home visits through the same booking flow`.

### Task 2: Privacy policy and terms

**Files:** `app/privacy-policy/page.tsx`, `app/terms/page.tsx`, `app/cancellation-policy/page.tsx` (only if visit-specific rules are needed), and their existing tests.

**Privacy policy:**
- We collect a home address only when you book a home visit.
- We use it to attend the appointment.
- Storage follows the existing booking-record retention.

**Terms:**
- Home visits are in the Glasgow area.
- The patient provides a safe space to exercise.
- Access arrangements.
- We may decline or rearrange a visit if the address is outside the area.

Say nothing about premises or insurance. Keep the existing structure and tone. Update the tests that assert section headings.

Commit: `docs: privacy policy and terms cover Glasgow home visits`.

### Task 3: Site copy — online + Glasgow home visits

**Files:** `lib/site-data.ts`, `app/page.tsx`, `app/how-online-physiotherapy-works/page.tsx`, `app/glasgow-physiotherapist/page.tsx`, `app/online-physiotherapy-scotland/page.tsx`, `lib/guides.ts`, `lib/online-physio-pages.ts`, `app/online-physiotherapy-for/[slug]/page.tsx`, `lib/structured-data.ts`, plus tests.

Find every "video only / no home visits / online-only / no clinic visit / entirely online" claim and correct it:
- Video appointments anywhere in the UK.
- Home visits in the Glasgow area.

**Glasgow page:** reposition it as "Physiotherapist in Glasgow: home visits and online appointments".
- It keeps its URL.
- New title targets "physiotherapist Glasgow home visits" / "home physio Glasgow" (≤65 characters).
- Section on what a home visit includes and the area covered (Glasgow; we confirm by email if outside it).
- Same prices.
- Book CTA preselects home visit (`/book?visit=home`, which the booking flow from Task 1 must honour).

**Scotland page:**
- Video across Scotland, plus home visits in the Glasgow area.
- The "Can I see you in person?" FAQ becomes "Yes, home visits in the Glasgow area; elsewhere in Scotland by video".

**"What online physiotherapy cannot do" guide:** it currently says to see someone in person for hands-on care. Add that Glasgow-area patients can book a home visit; elsewhere, get in-person care locally. Keep the safety content unchanged.

**Condition pages:**
- Add one line where relevant: "If you're in the Glasgow area, you can book a home visit instead of a video call."
- Where pages say "we can't do hands-on treatment", make it explicit that this applies to video sessions.
- Don't add a home-visit claim to conditions she hasn't approved for in-person care. Neuro pages: keep the clearance requirement from Task 4.

**Structured data:**
- The practice node keeps UK-wide areaServed.
- Add `areaServed` Glasgow for the home-visit service, as an `availableService` / `Offer`, or as text on the existing service schema.
- No street address and no `geo` (it's a service-area business).

**Homepage and how-it-works:** one clear line plus FAQ updates.

**Tests:** update the assertions that encoded "video only". Add a test that no page data contains "no home visits" or "video only".

Commit: `content: offer Glasgow home visits alongside video across the site`.

### Task 4: Apply Shivaliba's clinical rulings to the Phase B/C content

**Files:** `lib/online-physio-pages.ts`, `lib/guides.ts`, tests.

- **Q5:** remove every "alongside your NHS team / work with your stroke team / neurologist / MS nurse" claim. Replace it with "we ask you to keep your GP or specialist team informed" only where safe and true; otherwise just remove it.
- **Q6:** all four neuro pages require that "your GP or specialist team has said it is safe to start physiotherapy" before booking or starting. MS relapse: pause until the GP or MS team clears restarting.
- **Q9:** post-surgery pages require clearance from the surgical/post-op team confirming **no restrictions**.
- **Q2:** replace fixed session/recovery ranges presented as typical with "depends on your condition; your physio will estimate it after the assessment". Keep NHS or NICE ranges only when attributed as general information from that source.
- **Q10–15:** re-source using fact-sheet item 15 (NICE). Add NICE citations (sources lists) to:
  - the post-surgery pages (NG157);
  - knee (NG226);
  - back/sciatica (NG59);
  - stroke (NG236);
  - MS (NG220);
  - Parkinson's (NG71);
  - the shoulder/neck/heel/elbow/hip CKS pages;
  - the sessions guide.

  Align the red flags with NICE CKS **in addition to** the NHS (keep whichever is more urgent).
- **Q16:** in the choosing guide, remove every competitor name and website and the per-provider table. Keep an anonymised factual range ("among four UK providers we checked in October 2026, first appointments ranged from 44 to 125 pounds"). Remove competitor URLs from that guide's sources (the fact sheet may keep them as research notes). Add a test that guide text contains none of: Nuffield, Complete Physio, PhysioFast, Ascenti, Bupa-as-provider.
- **Q17/18:** add a standard disclaimer line to every guide and landing page: "This information is general and not a substitute for an assessment. Don't start a new exercise programme without advice from a physiotherapist or doctor who knows your condition. If an exercise causes pain that doesn't settle, stop and seek advice."

Commit: `content: apply Shivaliba's sign-off rulings (no NHS-team claims, clearance, NICE, no competitor names)`.

### Task 5: Exercise library disclaimer (Q18)

**Files:** components that render the exercise and self-test disclaimers (`components/exercise-library/exercise-safety-note.tsx`, `by-line`, self-test DISCLAIMER constant, library copyright notice) and `app/terms/page.tsx` (exercise-use clause), plus tests.

- Strengthen the visible safety note on every exercise page and the library index: "General information only. Don't start these exercises without guidance from a physiotherapist who has assessed you. PhysioOnClick accepts no responsibility for exercises done without an assessment."
- Mirror it in the terms (a "use of exercise content" clause).
- Keep it calm and plain. Check it against UK consumer-law fairness: no blanket exclusion of liability for negligence or personal injury. Phrase it as guidance plus "use at your own risk", not "we exclude all liability".

Commit: `content: stronger exercise library safety disclaimer`.

### Task 6: Google Business Profile guide for the owner + review pack

Write `docs/seo/google-business-profile-home-visits.md`, a plain step-by-step for the owner:
- Set the business as a service-area business with the address hidden.
- Service area: Glasgow, plus the localities she covers.
- Category: Physiotherapist.
- Verification: video showing the equipment and branding she brings, and proof of the business.
- NAP must match the site (see `invoiceIssuer` / public NAP).
- Note Google's eligibility rule: in-person contact at the customer's location qualifies.

Regenerate `docs/seo/phase-b-clinical-review.md` with the changes, plus a short "Changes made from your answers" section mapping each answer to a change. Run the final verification (tsc, lint, vitest: only the known failures).

Commit: `docs: GBP home-visit guide and updated review pack`.
