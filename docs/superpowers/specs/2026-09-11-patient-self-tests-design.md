# Patient self-tests section

## Problem

The public exercise library (`lib/self-tests.ts`, `/exercises/tests/...`) has self-check
tests (e.g. "Full can test") mapped to condition hubs (`lib/conditions.ts`), which are in
turn mapped to exercises via `program[].exerciseSlugs`. None of this reaches a signed-in
patient. The patient portal (`app/patient/exercises/`) already shows assigned exercises
with do's/don'ts (`AssignedExercises`'s "How to do it" drawer, from `ex.cues`/`ex.mistakes`)
but nothing about self-tests.

## Goal

Add a "Check your progress" section to `/patient/exercises` showing the self-tests relevant
to what the patient is actually working on, with zero new admin work.

## Linking logic

New pure helper, `getRelevantSelfTests(exerciseSlugs: string[]): SelfTest[]` in
`lib/exercise-library.ts` (same barrel every other public-library reader goes through):

1. For each `exerciseSlugs` entry, find every `Condition` in `lib/conditions.ts` whose
   `program[].exerciseSlugs` includes it.
2. Collect the matched conditions' `slug`s into a `Set<string>`.
3. Return every `SelfTest` whose `conditionSlugs` intersects that set, de-duped by
   `SelfTest.slug`, in `selfTests` source order.

No Firestore reads, no new fields on `AssignedExercise` — purely derived from the two
existing static catalogues, so it can't drift out of sync with what the physio assigns.

## Component

New `components/patient-self-tests.tsx` ("use client"), props `{ exerciseSlugs: string[] }`:

- Computes `getRelevantSelfTests(exerciseSlugs)` via `useMemo`.
- Renders nothing (section omitted entirely) when the result is empty — most patients
  won't have a self-test match, and an empty panel would look broken.
- One card per self-test: icon, name, `assesses` line, a "Full guide" link to
  `/exercises/tests/{slug}` (opens in the same tab — it's the informational public page,
  not an external site), and inline negative/positive result boxes (reusing the plain-list
  shape already in `SelfTest.negativeResult` / `positiveResult`, styled as green/red boxes
  matching the mockup, not the full illustrated step-by-step from the public page — that
  stays a "Full guide" click-through to avoid duplicating the whole public template inline).
- A fixed disclaimer line under every card: "This is a guide, not a diagnosis. Only a
  hands-on assessment can confirm what's going on." (matches the existing tone in
  `lib/self-tests.ts`'s `interpretation` field).

## Wiring

`app/patient/exercises/page.tsx`: after `<AssignedExercises>`, add
`<PatientSelfTests exerciseSlugs={...} />`. `AssignedExercises` currently owns the
assigned-exercise fetch internally and doesn't expose the resolved list to its parent, so
`ExercisesPage` needs the exercise slugs itself. Simplest path: `PatientSelfTests` takes
`uid`/`personId` (like `AssignedExercises` does) and calls `getAssignedExercises` itself,
resolving `exerciseId -> Exercise.slug` via the shared `exercises` array — no prop drilling,
no change to `AssignedExercises`'s existing interface.

## Out of scope

- No change to the do's/don'ts UI — it already exists and works.
- No admin-side self-test assignment UI (auto-derived per the approved approach).
- No interactivity (patients don't record a self-test result) — informational only, same
  trust level as the public pages.
- No changes to `/patient/recovery`.

## Testing

- `tests/lib/exercise-library.test.ts`: unit tests for `getRelevantSelfTests` — matches via
  a shared condition, returns `[]` for an exercise with no condition match, de-dupes when
  two assigned exercises point at the same condition.
- `tests/app/patient-exercises.test.tsx` (or similar existing test file for this page):
  smoke test that the section renders when a match exists and stays absent when it doesn't.
