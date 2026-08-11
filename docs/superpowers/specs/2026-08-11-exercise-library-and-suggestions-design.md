# Exercise Library Overhaul + Assessment/Session-Driven Suggestions

**Date:** 2026-08-11
**Status:** Approved for planning
**Phase:** A of 2 (Phase B = motion-check categorization + camera-guided body-part detection, separate design)

## Problem

The exercise library (`lib/site-data.ts`) has ~16 body exercises and 8 face exercises,
each tagged only with a free-text `bodyPart` string. There's no structured link between
an exercise and the clinical taxonomy already used elsewhere in the app (the
`ClinicalArea` enum in `lib/assessment-forms.ts`), so admins currently pick exercises to
assign by manual search/browse only (`components/admin-exercise-assigner.tsx`). There is
no automatic suggestion of exercises from a patient's submitted self-assessment or from
what the admin writes in a session summary, even though both already capture rich
clinical detail (`clinicalArea`, symptoms, goals, `sessionOutcome`, `workedOn`,
`nextSteps`).

## Goals

1. Expand the exercise library to 150+ exercises covering the full range of physiotherapy
   presentation areas, each grounded in recognised physio concepts (graded exposure,
   McKenzie extension principle, closed/open kinetic chain progression, post-op loading
   stages) reflected in plain-language `description` text.
2. Tag every exercise with the same `ClinicalArea` taxonomy used by the assessment form,
   plus finer-grained free-text `tags` for matching.
3. Deterministically suggest exercises to the admin from (a) a patient's submitted
   self-assessment and (b) the current session summary being written, so the admin can
   assign with one click instead of manually browsing.
4. Give every exercise a reasonable stick-figure diagram even where no video exists.

## Non-goals

- AI/LLM-based suggestion reasoning (explicitly rejected in favour of deterministic rule
  matching — free, fast, predictable, no added Gemini cost).
- Motion-check categorization or camera-guided detection (Phase B, separate design).
- Sourcing 150+ unique real videos — videos become optional; the stick-figure diagram is
  the primary visual.
- Retiring or renumbering existing exercise IDs (`ex-1`..`ex-16` etc. stay as-is; new
  exercises are appended).

## Design

### 1. Data model

Extend `Exercise` in `lib/site-data.ts`:

```ts
export type Exercise = {
  id: string;
  title: string;
  bodyPart: string;       // existing free-text label, kept for display continuity
  clinicalArea: ClinicalArea; // NEW — reuses lib/assessment-forms.ts's ClinicalArea enum
  tags: string[];          // NEW — e.g. ["rotator-cuff", "impingement", "early-rehab"]
  condition: string;
  stage: string;           // "Early rehab" | "Strength phase" | "Return to function" etc.
  description: string;
  videoUrl?: string;       // now optional
};
```

`ClinicalArea` is imported from `lib/assessment-forms.ts` (already exported there) rather
than redefined, so the two stay in sync by construction.

Existing 16 exercises are retagged in place with `clinicalArea`/`tags` (no ID changes).
New exercises are appended to reach 150+ total, spread across all `ClinicalArea` values,
each clinical area getting a 2-3 stage progression (early rehab → strength phase → return
to function) per common condition within that area.

### 2. Stick-figure diagrams

`components/exercise-figure.tsx`'s `SPECS`/`poseForName` gains new poses to cover
categories not yet represented: neck rotation, hip abduction, ankle pump, pelvic tilt,
arm reach, trunk rotation, wrist/hand grip. `poseForName` keyword matching extends to
route new exercise titles to the closest pose; anything unmatched still falls back to
`standing` (existing behaviour, unchanged).

### 3. Suggestion engine

New `lib/exercise-suggestions.ts`, pure/deterministic, no I/O:

```ts
export type SuggestionInput = {
  clinicalArea?: ClinicalArea;
  freeText?: string;          // symptoms + goals + functionalImpact, or workedOn + nextSteps
  alreadyAssignedIds: string[]; // excluded from results
};

export type Suggestion = { exercise: Exercise; reason: string; score: number };

export function suggestExercises(input: SuggestionInput, limit = 6): Suggestion[]
```

Scoring:
- `clinicalArea` exact match: +3
- each `tags` entry found as a substring/keyword in `freeText` (lowercased): +2 each
- `condition` keyword found in `freeText`: +1
- excludes any exercise whose `id` is in `alreadyAssignedIds`
- ties broken by `stage` order (early rehab first) so suggestions favour appropriate
  progression, not advanced exercises for a fresh presentation
- `reason` is a short deterministic string built from what matched, e.g. "Matches lower
  limb + 'knee' from assessment", not AI-generated

Two call sites feed this:
- **From assessment**: `clinicalArea` = assessment's `SubjectiveAssessmentProfile.clinicalArea`;
  `freeText` = concatenation of `presentingComplaint`, `symptoms`, `functionalImpact`, `goals`.
- **From session summary**: `clinicalArea` = the patient's most recent assessment's
  `clinicalArea` (looked up), `freeText` = `workedOn` + `nextSteps` fields being typed in
  `summary-form.tsx`; `alreadyAssignedIds` = the patient's current `AssignedExercise[]` so
  progressions are suggested over repeats.

### 4. UI integration

New shared component `components/suggested-exercises.tsx`:
- Props: `{ suggestions: Suggestion[]; onAssign(exerciseId): Promise<void>; assigning: string | null }`
- Renders a compact card list (exercise title, clinical area badge, one-line reason,
  "Assign" button) reusing existing panel/badge styling conventions from
  `admin-exercise-assigner.tsx`.
- Assign button calls the same `assignExercise` (`lib/recovery.ts`) already used by
  `AdminExerciseAssigner`, then removes the suggestion from view (already-assigned).

Two integration points:
- **`components/admin-assessment-review.tsx`**: below the clinical detail sections, a
  "Suggested exercises" panel computed once from the assessment fields (via
  `suggestExercises`), using `<SuggestedExercises>`.
- **`components/summary-form.tsx`**: inside the drawer, above `<AdminExerciseAssigner>`, a
  "Suggested for this session" strip recomputed as `workedOn`/`nextSteps` change
  (debounced), using `<SuggestedExercises>` with the patient's current assigned exercises
  excluded.

### 5. Testing

- `tests/lib/exercise-suggestions.test.ts` — scoring correctness: clinical area match,
  tag keyword match, exclusion of already-assigned, stage-order tie-break.
- `tests/components/suggested-exercises.test.tsx` — renders suggestions, assign button
  calls `onAssign` and removes the item, empty state when no suggestions.
- Existing `tests/lib/exercise-videos.test.ts`, `tests/components/admin-exercise-assigner.test.tsx`
  updated only if the `Exercise` type change breaks their fixtures (add required
  `clinicalArea`/`tags` fields to test fixtures).

## Risks / open questions

- 150+ exercises is a large content-writing effort; will be produced in batches by
  clinical area to keep each batch reviewable.
- `poseForName` keyword matching is heuristic — some new exercises may fall back to a
  generic pose; acceptable per existing behaviour, not a regression.
- Re-tagging the 16 existing exercises must not change their `id`, since assigned
  exercises reference IDs in Firestore (`assignedExercises` collection) — only additive
  fields change on existing entries.
