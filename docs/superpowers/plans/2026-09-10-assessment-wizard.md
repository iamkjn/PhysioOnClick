# Assessment Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 1,996-line clinician-grade assessment form with a short, full-screen, one-question-per-screen patient wizard fronted by a clickable SVG body chart.

**Architecture:** New `assessment-wizard.tsx` stepper + reusable `body-chart.tsx` SVG + `lib/body-chart.ts` (region taxonomy & derivations). The wizard collects ~7 screens of patient-answerable input, fills `default*` sub-objects from `lib/assessment-forms.ts` for everything the clinician now captures at the session, and submits through the unchanged `submitPatientAssessmentForm`. The old `patient-assessment-form.tsx` is deleted; `PatientAssessmentHistory` is extracted first.

**Tech Stack:** Next.js 15 App Router (client components), React 19, Firebase Firestore, Vitest + Testing Library, plain inline SVG (no chart lib), CSS in `app/globals.css`.

## Global Constraints

- Design system "The Clarity System": warm paper background, navy ink, single sky-blue accent, Fraunces (`--font-serif`) headings / DM Sans (`--font-sans`) body. Use existing CSS custom properties (`--color-primary`, `--color-navy`, `--color-border`, `--color-surface`, `--color-text-secondary`, `--space-*`, `--radius-*`, `--text-*`). No new colour literals except the body-chart fill which may reuse `--color-primary`.
- All step transitions/animations gated behind `window.matchMedia("(prefers-reduced-motion: reduce)")`.
- Every `localStorage` read/write wrapped in try/catch.
- Red-flag screen and consent screen stay MANDATORY. An urgent red flag shows an escalation panel but still allows submit.
- `ASSESSMENT_FORM_VERSION` is bumped to `"2.0"` so admin can distinguish new short-flow submissions.
- Tests live under `tests/` mirroring source. Run a single file with `npx vitest run tests/<path> --exclude '**/.worktrees/**'`.
- Concurrent-session hazard: implement in an isolated git worktree (see `superpowers:using-git-worktrees`), deploy from there.
- Branch: `feat/assessment-wizard` (spec already committed there).

---

### Task 1: Body-chart taxonomy & derivations (`lib/body-chart.ts`)

**Files:**
- Create: `lib/body-chart.ts`
- Test: `tests/lib/body-chart.test.ts`

**Interfaces:**
- Produces:
  - `interface BodyRegion { key: string; label: string; view: "front" | "back" | "both"; side?: "left" | "right"; clinicalArea: ClinicalArea; areaKey?: BodyAreaKey }` (`ClinicalArea` from `@/lib/assessment-forms`, `BodyAreaKey` from `@/lib/body-areas`)
  - `const BODY_REGIONS: BodyRegion[]` — 14 entries: `neck`, `shoulder-left`, `shoulder-right`, `upper-arm-left`, `upper-arm-right`, `elbow-hand-left`, `elbow-hand-right`, `chest`, `upper-back`, `lower-back`, `hip-left`, `hip-right`, `thigh-left`, `thigh-right`, `knee-left`, `knee-right`, `lower-leg-left`, `lower-leg-right`, `ankle-foot-left`, `ankle-foot-right`. (20 entries — left/right pairs. Adjust count in code; taxonomy is the source of truth.)
  - `const SOMEWHERE_ELSE = "somewhere-else"` sentinel key.
  - `function regionLabel(key: string): string`
  - `function deriveClinicalArea(keys: string[]): ClinicalArea` — priority: any spine key (`neck`/`upper-back`/`lower-back`) → `"spine"`; any arm/shoulder → `"upper_limb"`; any hip/leg/knee/ankle → `"lower_limb"`; `chest` alone → `"general"`; empty or only `somewhere-else` → `"general"`. Mixed upper+lower → `"general"`.
  - `function describeRegions(keys: string[]): string` — human string, e.g. `"Right shoulder, lower back"`; `[somewhere-else]` → `"Somewhere else / not sure"`; empty → `""`. Cap at 120 chars.
  - `function deriveSymptomStartDate(howLong: HowLong): string` — `HowLong = "days" | "weeks" | "months" | "since-op" | "not-sure"`. `days` → ISO date 7 days ago; `weeks` → 21 days ago; `months` → 90 days ago; else `""`.
  - `function deriveOnsetPattern(howLong: HowLong): OnsetPattern` — `since-op` → `"post_surgery"`; `days` → `"sudden"`; `weeks`/`months` → `"gradual"`; `not-sure` → `"not_sure"`.

- [ ] **Step 1: Write failing tests** covering `deriveClinicalArea` (spine, upper_limb, lower_limb, mixed→general, empty→general, somewhere-else→general), `describeRegions` (single, multiple, somewhere-else, empty, >120 char truncation), `deriveSymptomStartDate` (each `HowLong`, dates are valid ISO `YYYY-MM-DD` and in the past), `deriveOnsetPattern` (each), and that every `BODY_REGIONS[].areaKey` (when set) is a real key from `allBodyAreaKeys` (`@/lib/body-areas`).
- [ ] **Step 2: Run** `npx vitest run tests/lib/body-chart.test.ts --exclude '**/.worktrees/**'` — expect FAIL (module missing).
- [ ] **Step 3: Implement `lib/body-chart.ts`** — the data + pure functions above. No React, no SVG here.
- [ ] **Step 4: Run tests** — expect PASS. Also `npx tsc --noEmit -p tsconfig.json` clean for this file.
- [ ] **Step 5: Commit** `feat(assessment): body-region taxonomy and derivations`

---

### Task 2: Body chart component (`components/body-chart.tsx`)

**Files:**
- Create: `components/body-chart.tsx`
- Modify: `app/globals.css` (append `.body-chart*` rules)
- Test: `tests/components/body-chart.test.tsx`

**Interfaces:**
- Consumes: `BODY_REGIONS`, `regionLabel`, `SOMEWHERE_ELSE` from Task 1.
- Produces: `function BodyChart(props: { value: string[]; onChange?: (next: string[]) => void; readOnly?: boolean; idPrefix?: string }): JSX.Element`
  - `"use client"`.
  - Renders an anterior/posterior `<svg viewBox="0 0 240 440">` silhouette (a single body outline `<path>` + one shape per visible region). Front/back toggle buttons (two `<button aria-pressed>`); `both`-view regions render in each view.
  - Each region shape: `<path>`/`<ellipse>` with `role="button"`, `tabIndex={readOnly ? -1 : 0}`, `aria-pressed`, `aria-label={regionLabel(key)}`, class `body-chart__region` + `is-selected` when in `value`. Click and `keydown` Enter/Space toggle via `onChange([...])` (dedupe; toggling a key removes it). No-op when `readOnly`.
  - Selected regions also listed as removable chips below the SVG (`readOnly` → non-removable).
  - A "Somewhere else / not sure" `<button aria-pressed>` toggles the `SOMEWHERE_ELSE` key; selecting it clears all anatomical keys and vice-versa.

- [ ] **Step 1: Write failing tests** — render with `value=[]`; clicking the region with `aria-label="Neck"` calls `onChange(["neck"])`; clicking it again calls `onChange([])`; keyboard (`fireEvent.keyDown` Enter) toggles; `readOnly` region has `tabIndex=-1` and clicking it does not call `onChange`; selecting "Somewhere else" when `value=["neck"]` calls `onChange(["somewhere-else"]))`; front/back toggle switches which regions are in the document.
- [ ] **Step 2: Run** the test — expect FAIL.
- [ ] **Step 3: Implement `components/body-chart.tsx`** + minimal `.body-chart` CSS (grid layout, region default `fill: var(--color-border)`, `.is-selected { fill: var(--color-primary) }`, focus ring, toggle buttons, chips). Keep the SVG paths simple, readable shapes — anatomical precision is not required, recognisability is.
- [ ] **Step 4: Run** tests — PASS. `npx tsc --noEmit` clean. `npx next lint` clean for the file.
- [ ] **Step 5: Commit** `feat(assessment): clickable SVG body chart component`

---

### Task 3: Data model — `bodyRegions` on the assessment form

**Files:**
- Modify: `lib/assessment-forms.ts` (interface `PatientAssessmentFormInput`, `mapAssessmentForm`, add `readStringArray`, bump `ASSESSMENT_FORM_VERSION`)
- Test: `tests/lib/assessment-forms.test.ts` (create if absent, else extend)

**Interfaces:**
- Produces: `PatientAssessmentFormInput.bodyRegions?: string[]`; `PatientAssessmentFormRecord.bodyRegions: string[]` (always an array after `mapAssessmentForm`).

- [ ] **Step 1: Write failing test** — a fake Firestore `QueryDocumentSnapshot` (`{ id, data: () => ({...}) }`) with `bodyRegions: ["neck","lower-back"]` maps to a record whose `bodyRegions` equals that array; a snapshot with no `bodyRegions` maps to `bodyRegions: []`; `ASSESSMENT_FORM_VERSION === "2.0"`.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement** — add `bodyRegions?: string[]` to `PatientAssessmentFormInput`; add `function readStringArray(data, key): string[]` (returns `[]` unless `Array.isArray` of strings); add `bodyRegions: readStringArray(data, "bodyRegions")` to `mapAssessmentForm`'s return; change `ASSESSMENT_FORM_VERSION` to `"2.0"`.
- [ ] **Step 4: Run** the new test + `npx vitest run tests/lib/assessment-forms.test.ts` + existing assessment tests + `npx tsc --noEmit`. Fix any type fallout (the record type now requires `bodyRegions`).
- [ ] **Step 5: Commit** `feat(assessment): persist bodyRegions; bump form version to 2.0`

---

### Task 4: Extract `PatientAssessmentHistory` to its own file

**Files:**
- Create: `components/patient-assessment-history.tsx` (move the `PatientAssessmentHistory` export + its private helpers verbatim from `components/patient-assessment-form.tsx`)
- Modify: `app/patient/assessment/page.tsx` (import from the new path)
- Modify: `components/patient-assessment-form.tsx` (delete the moved code only — leave the rest for Task 7)
- Test: reuse any existing history test; update its import path.

- [ ] **Step 1:** grep for `PatientAssessmentHistory` usages; note the import sites.
- [ ] **Step 2:** Move the component + only-it-uses helpers to the new file. Keep the same props and export name.
- [ ] **Step 3:** Update imports in `app/patient/assessment/page.tsx` and any test.
- [ ] **Step 4: Run** `npx tsc --noEmit` + `npx vitest run tests/ --exclude '**/.worktrees/**' -t "assessment"` — green (or no-worse than the known-flaky baseline; verify only touched files).
- [ ] **Step 5: Commit** `refactor(assessment): split PatientAssessmentHistory into its own file`

---

### Task 5: The wizard (`components/assessment-wizard.tsx`)

**Files:**
- Create: `components/assessment-wizard.tsx`
- Modify: `app/globals.css` (append `.assessment-wizard*` rules)
- Test: `tests/components/assessment-wizard.test.tsx`

**Interfaces:**
- Consumes: `BodyChart` (Task 2); `BODY_REGIONS`, `deriveClinicalArea`, `describeRegions`, `deriveSymptomStartDate`, `deriveOnsetPattern`, `HowLong` (Task 1); `submitPatientAssessmentForm`, `defaultSubjectiveProfile`, `defaultOutcomeMeasures`, `defaultObjectiveVideo`, `defaultGoalSetting`, `defaultOnlineReadiness`, `defaultRedFlags`, `defaultAssessmentConsent`, `hasUrgentRedFlags`, `ASSESSMENT_LIMITS`, type `PatientAssessmentFormInput`, `AssessmentFormType` (`@/lib/assessment-forms`); `validateUKPhone` (`@/lib/validation`); `PersonSwitcher`, `usePerson`; `useToast`.
- Produces: `function AssessmentWizard(props: { uid: string; personId: string; displayName: string; personName: string; bookingId: string; formType?: AssessmentFormType; onSubmitted: (formId: string) => void }): JSX.Element`
  - `"use client"`.
  - Internal `WizardState` holds: `regions: string[]`, `somewhereElse: boolean` (folded into `regions` via `SOMEWHERE_ELSE`), `story: string`, `howLong: HowLong | ""`, `pain: number` (default 3), `impact: string`, `context: string`, `ecName: string`, `ecPhone: string`, `redFlags: AssessmentRedFlags`, `consent: { care/data/privacy/safety: boolean }`, `signature: string`.
  - Steps array `["intro","body","story","impact","context","safety","consent"]`; `step` index state; a `dir` (1/-1) for transition direction.
  - Per-step `canAdvance(step, state): boolean`. `body`: `regions.length > 0`. `story`: `story.trim().length >= 10 && howLong !== ""`. `impact`: `impact.trim().length >= 5`. `context`: always true; if `ecPhone` non-empty, `validateUKPhone(ecPhone) === null`. `safety`: `redFlags.none || anyFlagTrue`. `consent`: all four consent booleans && `signature.trim().length >= 2`.
  - Progress bar `width: ((step+1)/steps.length)*100%`.
  - Draft: on state change, `localStorage.setItem("poc-assessment-draft-"+bookingId, JSON.stringify(state))` (try/catch); on mount, hydrate if present; on successful submit, `removeItem`.
  - `handleSubmit()` builds a `PatientAssessmentFormInput`:
    - `formType: props.formType ?? "initial"`, `consultationMode: "online"`, `completedVia: "online_form"`
    - `patientName: props.personName`, `completedBy: props.displayName`, `relationshipToPatient: props.personName === props.displayName ? "self" : ""`
    - `bodyRegions: regions`, `bodyArea: describeRegions(regions)`, `subjective: { ...defaultSubjectiveProfile, clinicalArea: deriveClinicalArea(regions) }`
    - `presentingComplaint: story`, `symptoms: story`, `onsetPattern: deriveOnsetPattern(howLong)`, `symptomStartDate: deriveSymptomStartDate(howLong)`, `painScore: pain`
    - `functionalImpact: impact`, `goals: impact`
    - `medicalHistory: context`, `medications: ""`, `allergies: ""`, `previousTreatment: ""`, `communicationNeeds: ""`, `aggravatingFactors: ""`, `easingFactors: ""`
    - `emergencyContactName: ecName`, `emergencyContactPhone: ecPhone`
    - `redFlags`, `onlineReadiness: defaultOnlineReadiness`
    - `outcomes: defaultOutcomeMeasures`, `objectiveVideo: defaultObjectiveVideo`, `goalsPlan: { ...defaultGoalSetting, meaningfulGoal: impact }`
    - `consent: { careConsent, dataConsent, privacyConsent, safetySharing, videoConsent: false }`
    - `signature`, `completedAt: new Date().toISOString().slice(0,10)`, `submittedByUid: props.uid`, `bookingId: props.bookingId`
    - `await submitPatientAssessmentForm(uid, personId, input)` → on success `onSubmitted(id)` + show the confirmation screen.
  - Confirmation screen: "Thank you — your physiotherapist will review this before your appointment." + a link to `/patient/appointments`.

- [ ] **Step 1: Write failing tests** (mock `@/lib/assessment-forms`'s `submitPatientAssessmentForm` with `vi.fn().mockResolvedValue("form_1")`, keep the real `default*`/derivation-independent exports via `importActual`; mock `@/components/person-switcher` to a stub; wrap in a `ToastProvider` or mock `useToast`):
  - renders the intro step; "Continue" advances to the body step.
  - on the body step, "Continue" is disabled until a region is picked (simulate by calling the mocked `BodyChart`'s `onChange`, or select via the real chart).
  - the safety step won't advance until "none of these" or a flag is set.
  - the consent step won't advance/submit until all four boxes + signature.
  - a full happy path calls `submitPatientAssessmentForm` once with an input where `bodyArea` is the derived string, `subjective.clinicalArea` is derived, `outcomes` deep-equals `defaultOutcomeMeasures`, `painScore` is the slider value, and `signature` is the typed name; then `onSubmitted("form_1")` fires and the confirmation text shows.
  - setting an urgent red flag (e.g. `chestPainBreathlessness`) shows the escalation panel text but the consent step is still reachable and submit still succeeds.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement** the wizard + CSS. Keep the file focused: one `Step*` render function per screen, shared `<WizardShell>` (progress bar + heading + body slot + Back/Continue footer). Target < 550 lines; if it exceeds, split steps into `components/assessment-steps/`.
- [ ] **Step 4: Run** the wizard tests + `npx tsc --noEmit` + `npx next lint` for the file — all green.
- [ ] **Step 5: Commit** `feat(assessment): short full-screen wizard`

---

### Task 6: Wire the route, delete the old form

**Files:**
- Modify: `app/patient/assessment/page.tsx` (render `<AssessmentWizard>` full-width in place of `assessment-page-grid`; shorten hero; move history to a link + post-submit)
- Delete: `components/patient-assessment-form.tsx`
- Modify: `app/globals.css` (remove now-dead `.assessment-section` / `.assessment-page-grid` rules only if nothing else uses them — grep first)
- Grep for any other `PatientAssessmentForm` import and remove it.
- Test: `tests/app/*assessment*` — update to the wizard.

- [ ] **Step 1:** grep `PatientAssessmentForm\b` across `app/ components/ tests/`. Confirm the only non-history usage is the assessment page.
- [ ] **Step 2:** Edit `app/patient/assessment/page.tsx`: import `AssessmentWizard`; in the `target` branch render `<section className="page-section"><AssessmentWizard uid={uid} personId={personId as string} displayName={displayName} personName={personName} bookingId={target.id} onSubmitted={handleSubmitted} /></section>`. Keep the gate + `handleSubmitted`. Remove `PatientAssessmentForm` import + the grid + the inline `PatientAssessmentHistory` render; add a `<Link href="#" onClick>`—no: add `<PatientAssessmentHistory>` behind a `<details>` "Past check-ups" below the wizard, or only on the confirmation screen. Simplest: keep `<PatientAssessmentHistory>` in a collapsed `<details className="assessment-history-disclosure">` under the wizard.
- [ ] **Step 3:** `git rm components/patient-assessment-form.tsx`. Fix the resulting import error in the page. Run `npx tsc --noEmit` — must be clean.
- [ ] **Step 4:** Update `tests/app/*assessment*`: the page test should now assert the wizard intro renders for a gated user (mock bookings so `selectTargetBooking` returns a target). Run the file.
- [ ] **Step 5: Commit** `feat(assessment): wizard replaces the long form on /patient/assessment`

---

### Task 7: Admin review — body-chart thumbnail + "Not provided"

**Files:**
- Modify: `components/admin-assessment-review.tsx`
- Test: `tests/components/admin-assessment-review.test.tsx`

**Interfaces:**
- Consumes: `BodyChart` (Task 2, `readOnly`), `form.bodyRegions` + `form.version` (Task 3).

- [ ] **Step 1: Write failing tests** — a form record with `version: "2.0"` and `bodyRegions: ["neck"]` renders a read-only `BodyChart` (assert an element with `aria-label="Neck"` and `aria-pressed="true"`, and that it has `tabindex="-1"`); the "Symptom behaviour" / "PSFS" / "Objective task" detail cells render the literal text "Not provided by patient" for a `2.0` form; a legacy (`version: "1.x"`) form still renders its stored values unchanged.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** — a `isShortForm = form.version === "2.0" || (form.bodyRegions?.length ?? 0) > 0` helper; add `<BodyChart value={form.bodyRegions ?? []} readOnly idPrefix={form.id} />` near the "Body area" cell; wrap the clinician-only cells in a `notProvided(value)` helper that returns `<span className="assessment-not-provided">Not provided by patient</span>` when `isShortForm && !value.trim()`.
- [ ] **Step 4: Run** tests + `npx tsc --noEmit` + lint — green.
- [ ] **Step 5: Commit** `feat(admin): body-chart thumbnail + "not provided" on short assessments`

---

### Task 8: Verify end-to-end & deploy to dev

**Files:** none (verification + deploy)

- [ ] **Step 1:** From the isolated worktree: `npx tsc --noEmit -p tsconfig.json` (only the known pre-existing test-file errors remain), `npx next lint` (no new errors), `npx vitest run tests/lib/body-chart.test.ts tests/components/body-chart.test.tsx tests/components/assessment-wizard.test.tsx tests/components/admin-assessment-review.test.tsx tests/lib/assessment-forms.test.ts --exclude '**/.worktrees/**'` — all green.
- [ ] **Step 2:** `preview_start` "Next.js (web)"; open `/patient/assessment`. It will hit the "book a session first" gate for a signed-out session — that's fine, confirm no console error and the gate renders. Manually eyeball the wizard by temporarily rendering it on a scratch route if needed, or rely on the component tests + a screenshot of the body chart in isolation.
- [ ] **Step 3:** Deploy: `cp .env.development .env.production` into the worktree if missing, `npm ci` (NOT a symlink), `npm run deploy:dev`. Healthy build = "Generating static pages (N/N)" with N ≈ full count. Verify `curl -s -o /dev/null -w "%{http_code}" https://dev.physioonclick.co.uk/patient/assessment` → 200.
- [ ] **Step 4:** Grep the deployed `/patient/assessment` chunk for a wizard string (e.g. "Where is the problem") to confirm the new code shipped.
- [ ] **Step 5: Commit** any verification fixups; leave the branch ready. Do NOT merge to master or push unless asked.

---

## Self-Review

**Spec coverage:**
- Full-screen wizard, 7 screens → Task 5 ✓
- SVG body chart, front/back, multi-select, keyboard, "somewhere else" → Task 2 ✓
- Region taxonomy aligned to `BODY_AREAS` → Task 1 ✓
- Dropped fields submit `default*` → Task 5 handleSubmit ✓
- `bodyRegions` on model + version bump → Task 3 ✓
- Emergency contact optional (phone validated only if entered) → Task 5 `canAdvance("context")` ✓
- Red flags + consent mandatory, urgent still submits → Task 5 tests ✓
- Admin thumbnail + "not provided" → Task 7 ✓
- Old form deleted, history extracted → Tasks 4 + 6 ✓
- Draft autosave in localStorage → Task 5 ✓
- Route keeps the booking gate → Task 6 Step 2 ✓
- Tests enumerated in spec → Tasks 1,2,3,5,7 ✓

**Placeholder scan:** SVG path `d` strings are produced during Task 2 implementation (recognisable shapes, not clinically precise) — acceptable, the interface (region keys, a11y contract) is fully specified. No "TODO"/"handle edge cases"/"similar to" left.

**Type consistency:** `HowLong`, `BodyRegion`, `deriveClinicalArea`, `describeRegions`, `deriveSymptomStartDate`, `deriveOnsetPattern`, `readStringArray`, `AssessmentWizard` props, `isShortForm` — names used consistently across Tasks 1/3/5/7.
