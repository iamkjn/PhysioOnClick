# Patient assessment — short full-screen wizard + body chart

Approved by the product owner 2026-09-10 (all four decisions).

## Problem

`components/patient-assessment-form.tsx` is 1,996 lines: ~30 clinician-grade
fields in 9 sections (subjective scales, PSFS outcome measures, objective video
assessment, detailed goal-setting). Patients can't meaningfully answer most of
it and the clinician re-does it live. It renders as a wall of cards on
`/patient/assessment`.

## Solution — one-question-at-a-time wizard

Replace the card grid on `/patient/assessment` with a full-screen wizard
(inside the normal site header/footer): progress bar at the top, one focal
question per screen, large touch targets, Back / Continue, smooth
slide+fade step transitions (disabled under `prefers-reduced-motion`).
Fraunces headings, sky-accent progress + selections, paper background.
Draft autosaved to `localStorage` (keyed by `bookingId`) so a refresh doesn't
lose progress; cleared on submit.

### Screens (~7, ~3 minutes)

| # | Screen | Required | Writes |
|---|--------|----------|--------|
| 1 | **Who is this for** — person switcher + "takes about 3 minutes" | person selected | `patientName`, `completedBy`, `relationshipToPatient` |
| 2 | **Where is the problem?** — SVG body chart, front/back toggle, multi-select; "somewhere else / not sure" chip below | ≥1 region **or** "somewhere else" | `bodyRegions[]`, derived `bodyArea` (human string), derived `subjective.clinicalArea` |
| 3 | **Tell us what's going on** — one textarea + "How long?" chips (a few days / weeks / months / since an operation / not sure) + **pain right now** 0–10 slider | textarea ≥ 10 chars; a "how long" chip | `symptoms`, `presentingComplaint` (= same text), `onsetPattern`, `symptomStartDate` (approx ISO or ""), `painScore` |
| 4 | **What is it stopping you doing?** — one textarea | ≥ 5 chars | `functionalImpact`, `goals` (= same text) |
| 5 | **Anything we should know?** *(optional)* — one textarea (meds, past injuries, conditions) + emergency contact name + phone (**both optional**) | none | `medicalHistory`; `emergencyContactName`, `emergencyContactPhone` (phone validated only if entered) |
| 6 | **Safety check** — the 6 red-flag yes/no items + "none of these" | must resolve (≥1 flag, or "none of these" ticked) | `redFlags` |
| 7 | **Consent** — 4 items in plain language + "type your name to confirm" | all 4 ticked + name typed | `consent.{careConsent,dataConsent,privacyConsent,safetySharing}`, `signature` |

An urgent red flag on screen 6 shows a prominent "please contact NHS 111 / 999"
panel but still lets them submit (so the clinician sees it) — matches current
behaviour.

### Dropped from the patient (clinician captures at the session)

`subjective` scales, `outcomes` (PSFS etc.), `objectiveVideo` (entirely),
`goalsPlan` detail, `onlineReadiness`, separate `aggravatingFactors` /
`easingFactors` / `previousTreatment` / `communicationNeeds` / `allergies` /
`medications` (folded into the one "anything we should know" field).
The wizard submits `default*` values (already exported from
`lib/assessment-forms.ts`) for these sub-objects, `consultationMode: "online"`,
`completedVia: "online_form"`, `formType` from the caller.

## Body chart — `components/body-chart.tsx`

Reusable. Inline SVG, no library. Anterior + posterior silhouette (toggle;
default anterior). ~14 tappable regions as `<path>`/`<ellipse>`:
head-neck, shoulder L/R, upper-arm L/R, elbow L/R, forearm-wrist-hand L/R,
chest, upper-back, lower-back / abdomen, hip-groin L/R, thigh L/R, knee L/R,
lower-leg L/R, ankle-foot L/R. Left/right collapsed to one region key where
the exercise-library taxonomy doesn't split them.

- Region keys align to `BODY_AREAS` (`lib/body-areas.ts`) where possible
  (`neck`, `shoulder`, `upper-back`, `lower-back`, `elbow-wrist-hand`, `hip`,
  `knee`, `ankle-foot`) so a later "exercises for your shoulder" link is free.
- Each region: `role="button"`, `tabIndex=0`, `aria-pressed`, `aria-label`,
  Enter/Space toggles, filled with the sky accent + a check when selected.
- Props: `value: string[]`, `onChange`, `readOnly?` (admin thumbnail).
- A `BODY_REGIONS` array in `lib/body-chart.ts`: `{ key, label, view,
  clinicalArea, areaKey? }`. `deriveClinicalArea(keys)` and
  `describeRegions(keys)` (→ "Right shoulder, lower back") live here too.

## Data model

`lib/assessment-forms.ts`:
- `PatientAssessmentFormInput`: add `bodyRegions?: string[]`.
- `ASSESSMENT_LIMITS`: no change (bodyArea stays 120, derived string is capped).
- `mapAssessmentForm`: add `bodyRegions: readStringArray(data, "bodyRegions")`
  (new tiny helper; missing/legacy → `[]`).
- `ASSESSMENT_FORM_VERSION` bumped so admin can tell old vs new submissions.

## Admin review — `components/admin-assessment-review.tsx`

- New read-only `<BodyChart value={form.bodyRegions} readOnly />` thumbnail at
  the top of the expanded detail, beside "Body area".
- Fields the short flow never collects render **"Not provided by patient"**
  (greyed) instead of an empty value, gated on
  `form.version === ASSESSMENT_FORM_VERSION` or `bodyRegions.length > 0`.
- Everything else unchanged (submission date, linked-appointment line, review
  status controls, red-flag / consent display).

## Route — `app/patient/assessment/page.tsx`

- Keeps the gate (`selectTargetBooking` — needs an upcoming booking) and the
  booking-link call on submit.
- When a target exists: render `<AssessmentWizard>` full-width instead of the
  `assessment-page-grid` (form + history side by side).
- `PatientAssessmentHistory` moves to a small "View past check-ups" link on the
  wizard's intro screen and a confirmation screen after submit.
- The page hero copy shortens.

## Component split

- `components/assessment-wizard.tsx` — the stepper (state, progress, transitions,
  per-step validation, submit). ~1 file, target < 500 lines; each step is a
  small local component or a `steps/` folder if it grows.
- `components/body-chart.tsx` — the SVG chart.
- `lib/body-chart.ts` — `BODY_REGIONS`, derivations.
- The old `patient-assessment-form.tsx` + its `PatientAssessmentForm` export is
  **deleted**. `PatientAssessmentHistory` is kept (moved into its own file
  `components/patient-assessment-history.tsx`).

## Testing

- `tests/lib/body-chart.test.ts` — `deriveClinicalArea`, `describeRegions`,
  region key/taxonomy alignment.
- `tests/components/body-chart.test.tsx` — select/deselect via click + keyboard,
  `readOnly` renders no handlers.
- `tests/components/assessment-wizard.test.tsx` — can't advance past a required
  step; red-flag + consent gates; a full happy-path submit calls
  `submitPatientAssessmentForm` with the derived `bodyArea` + default
  sub-objects; urgent red flag shows the escalation panel but still submits.
- `tests/components/admin-assessment-review.test.tsx` — extend: body-chart
  thumbnail renders; "Not provided by patient" shows for new-version forms.

## Out of scope

- Voice input, photo upload, "save and finish later" across devices (localStorage
  draft only).
- Changing the assessment **gate** (still needs an upcoming booking).
- Reworking the checkup vs initial distinction — same wizard for both in v1.
- Migrating historical submissions (they keep their old shape; admin handles it).
