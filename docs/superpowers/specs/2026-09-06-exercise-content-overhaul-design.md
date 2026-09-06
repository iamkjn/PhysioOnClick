# Exercise Content Overhaul — Structured How-To + Dosage

**Date:** 2026-09-06
**Status:** Approved for planning
**Builds on:** `2026-08-11-exercise-library-and-suggestions-design.md` (established the 150-exercise
library, `ClinicalArea` tagging, deterministic suggestions, stick-figure diagrams).

## Problem

The 150-exercise library gives a patient almost nothing to act on:

- Each exercise has a single one-line `description` — vague ("Builds confidence and
  functional strength for everyday transfers"), inconsistent (some describe *why*, some
  *how*), and until 2026-09-06 **never rendered on any patient screen**.
- There is **no dosage** anywhere — no reps, sets, holds, or frequency, in the catalogue
  or per-patient.
- Only 24 of 150 exercises carry a `videoUrl`, and those 24 share **4** generic YouTube
  clips between them — not real per-exercise demos.

During a real patient test (2026-09-06) the assigned person's carer could not tell what
any exercise required from the title alone.

## Goals

1. Give every exercise a structured, plain-language how-to: `setup`, numbered `steps`,
   `cues` (good form), `mistakes` (common errors / when to ease off), `equipment`.
2. Add a dosage model: an evidence-informed `defaultDosage` per exercise, overridable
   per patient by the physio when assigning.
3. Redesign the patient exercise card to surface dose + how-to (progressive disclosure)
   and the admin assign flow to set per-patient dose.
4. Draft and clinically review all 150 write-ups as part of this work.

## Non-goals

- **Video** — no video sourcing/licensing/production this round. `videoUrl` stays on the
  type for a later track. Patient visual = the (upgraded) stick-figure diagram + the
  existing "Check your motion" camera feature.
- **Mobile UI** — web-first. The Flutter exercise card and admin assign screen are
  unchanged this round; `ExerciseVideo.fromMap` ignores unknown fields so nothing breaks.
  A follow-up mobile pass adds the fields + UI.
- **Firestore-first CMS** — the TypeScript catalogue stays the authoring source.
- **Retiring/renumbering IDs** — see Rollout.
- **LLM-based content generation at runtime** — write-ups are authored once, in code.

## Design

### 1. Data model

Extract `exercises` from `lib/site-data.ts` into **`lib/exercises.ts`**. `site-data.ts`
re-exports `{ exercises, type Exercise }` so existing imports don't churn. `ClinicalArea`
stays in `lib/assessment-forms.ts` (shared with the assessment form); `lib/exercises.ts`
imports it from there.

```ts
export type ExerciseDosage = {
  sets?: number;
  reps?: number;          // per set
  holdSeconds?: number;   // isometric holds / stretches
  perDay?: number;        // sessions per day
  perWeek?: number;       // days per week
  tempo?: string;         // optional, e.g. "3s down, 1s up"
  notes?: string;         // optional freeform (per-patient note lives here when overriding)
};

export type Exercise = {
  // existing
  id: string;
  title: string;
  bodyPart: string;
  clinicalArea: ClinicalArea;
  tags: string[];
  condition: string;
  stage: string;
  description: string;      // KEPT — the one-line "what & why" summary
  videoUrl?: string;        // KEPT — future video track
  // new (optional during migration, required after the final batch)
  equipment?: string[];     // [] = none needed; e.g. ["Resistance band", "Chair"]
  setup?: string;           // starting position, 1–2 sentences
  steps?: string[];         // numbered movement, 2–6
  cues?: string[];          // "good form" checks, 2–4
  mistakes?: string[];      // common errors / when to ease off or stop, 2–4
  defaultDosage?: ExerciseDosage;
  pose?: PoseName;          // explicit stick-figure pose (else name-guessed as today)
  retired?: boolean;        // dropped from picker + suggestions, kept as a record
};
```

`PoseName` = the `Pose` union currently local to `components/exercise-figure.tsx`; the
plan exports it (or moves it beside the `SPECS` map) so `lib/exercises.ts` can reference
it. `formatDosage` maps frequency to words: `perDay` → "once/twice/N times a day",
`perWeek` → "N days a week"; both absent → no frequency clause.

**Per-patient override.** `assignedExercises/{exerciseId}` docs gain an optional
`dosage?: ExerciseDosage`. Helper:

```ts
// lib/exercises.ts
export function resolveDosage(ex: Exercise, assigned?: { dosage?: ExerciseDosage }): ExerciseDosage {
  return { ...(ex.defaultDosage ?? {}), ...(assigned?.dosage ?? {}) }; // per-field merge
}
export function formatDosage(d: ExerciseDosage): string; // → "3 sets × 12 reps · twice a day"
```

**No `description` rename** — keeps mobile's `ExerciseVideo.fromMap`, `seedExerciseVideos`,
`suggestExercises`, and the PDF working untouched.

**No Firestore rules change** — `assignedExercises` already allows admin writes / owner
reads with no shape validation; `exerciseVideos` new fields ride the existing
`...exercise` spread in `seedExerciseVideos`.

### 2. Authoring & clinical review workflow

**Batches** — ~9, by region: Lumbar spine · Cervical spine · Thoracic spine · Shoulder ·
Elbow/Wrist/Hand · Hip · Knee · Ankle/foot · Balance-neuro-post-op + `face-*`.

Per batch:
1. Draft the full structure into `lib/exercises.ts`.
2. Generate `docs/exercises-review/<region>.md` — one readable section per exercise, all
   fields laid out. Publishable as an Artifact for phone review.
3. Shivaliba reviews clinically — inline edits or a call. Apply changes.
4. Only an **approved** batch's commit deploys to **production** (dev may carry drafts).

**Clinical safety (hard rule).** AI-drafted health content. No batch reaches patients
without Shivaliba's sign-off. `defaultDosage` values are evidence-informed *starting
points*, labelled as such in the UI. `mistakes` / "when to stop" lines get specific
physio review.

**Batch tracking**

| Batch | Region | Draft | In review | Approved | Live (dev) | Live (prod) |
|---|---|---|---|---|---|---|
| 1 | Lumbar spine | | | | | |
| 2 | Cervical spine | | | | | |
| 3 | Thoracic spine | | | | | |
| 4 | Shoulder | | | | | |
| 5 | Elbow/Wrist/Hand | | | | | |
| 6 | Hip | | | | | |
| 7 | Knee | | | | | |
| 8 | Ankle/foot | | | | | |
| 9 | Balance/neuro/post-op + face | | | | | |

Along the way, **flag** (don't act on) redundant / mis-titled / clinically-off exercises
for Shivaliba to decide keep / merge / `retired`.

### 3. Patient exercise card

`<AssignedExercises>` (used by `/patient/exercises` and `/patient/recovery`).
Progressive disclosure — daily actions always visible, how-to one tap away.

**Collapsed:** diagram + title + `bodyPart · stage` · **dose line** (prominent,
`formatDosage(resolveDosage(...))`) · physio's per-patient note if set · actions:
**Done today** toggle · **How to do it ▾** · Check your motion · Watch demo (only if a
video exists).

**Expanded adds:** *You'll need* (equipment, hidden if none) · *Get set up* (`setup`) ·
*The movement* (numbered `steps`) · *Good form* (`cues`, check bullets) · *Ease off or
stop if* (`mistakes`, caution bullets) · line: "Your physio set this dose — tell her at
your next session if it's too easy or too hard."

Expansion = per-card local state, default collapsed. Degrades gracefully when
`steps`/etc. are absent (description + dose only, no expand control).

**Diagram:** honour `Exercise.pose` when set; extend the `SPECS` pose map in
`exercise-figure.tsx` for recurring movements (ankle, prone, side-lying, wrist). Falls
back to today's name-guess → "standing".

### 4. Admin assign-with-dosage flow

`components/admin-exercise-assigner.tsx` (patient detail page):

- **Assign** stays one click — adds the exercise with its `defaultDosage`, no override
  written.
- Each **assigned row** shows `title · effective dose` with **Edit dose** → inline form:
  `sets`, `reps`, `hold (s)`, `times/day`, `days/week`, `tempo`, `note to patient` (all
  optional, pre-filled with effective values). **Reset to default** clears the override.
- Writes to `assignedExercises/{exerciseId}.dosage`.

Helpers (`lib/recovery.ts`):
- `assignExercise(uid, personId, exerciseId, adminUid, dosage?)` — optional param.
- `setAssignedDosage(uid, personId, exerciseId, dosage)` — merges the one field.

**Validation** (`validateDosage`): non-negative ints; caps `sets ≤ 10`, `reps ≤ 100`,
`hold ≤ 600`, `perDay ≤ 10`, `perWeek 1–7`; `notes ≤ 300` chars.

`SuggestedExercises` quick-assign (assessment review) — unchanged, one click with default
dose.

Mobile admin (`admin_recovery_panel_screen.dart`) — unchanged this round.

### 5. Downstream consumers

| Consumer | Change |
|---|---|
| `download-report-button.tsx` (PDF) | Each exercise line → `title · dose · description`. No steps/cues/mistakes in the PDF — stays concise for GP/insurer use. |
| `seed-firestore.ts` `seedExerciseVideos` | No code change (`...exercise` spread carries new fields). **Re-run `npm run seed:firestore` after each content batch** to refresh the mobile mirror. |
| `exercise-figure.tsx` | Honour explicit `pose`; extend `SPECS`. Backward-compatible. |
| `suggested-exercises.tsx` | Show `title · default dose`. Cosmetic. |
| `exercise-suggestions.ts` (`suggestExercises`) | No change. |
| Mobile (`exercise_video.dart`, `profile_screen.dart`, admin) | No change this round. `fromMap` ignores unknown fields. |

### 6. Rollout & data safety

- **No data migration.** Existing `assignedExercises` docs lack `dosage`; `resolveDosage`
  falls back to `defaultDosage`. Every current assignment shows a sensible dose on deploy.
- **Type stays loose during migration** — new fields optional while batches land; the
  card renders whatever is present. **Final batch's commit tightens them to required**;
  `tsc --noEmit` then enforces all 150 are complete.
- **Deploy sequence:**
  1. First deploy = infra + all UI (type extraction, card redesign, admin dose form,
     PDF, `exercise-figure`) + **batch 1 content**. UI degrades gracefully for
     not-yet-written exercises.
  2. Each later deploy = one approved batch + a `npm run seed:firestore` run.
- **IDs never deleted or renumbered.** Cut exercises get `retired: true` (dropped from
  picker + suggestions, kept as a record) so patient assignments and the `exerciseVideos`
  mirror never dangle. Renames touch `title` only.
- **Prod gate:** no batch to production without Shivaliba's sign-off.

### 7. Testing

Vitest unit + component (repo norm, no e2e).

**Pure functions:** `resolveDosage` (per-field merge, missing sides, empty objects);
`formatDosage` (all shapes — reps only, sets+reps, hold, hold+sets, per-day/per-week,
empty → fallback); `validateDosage` (caps, non-negative, note length).

**Firestore helpers (mocked):** `setAssignedDosage` (writes `dosage`, merge keeps
`active`/`assignedAt`); `assignExercise(…, dosage?)` (with/without); `setExercisesCompletion`
(batch write shape).

**Component (extend existing):** `assigned-exercises.test.tsx` (dose line; expand shows
setup/steps/cues/mistakes; description; "Mark all as done"); `admin-exercise-assigner.test.tsx`
(edit-dose form, reset to default); `exercise-figure` (explicit pose honoured, unknown
falls back).

**Content safety net:** one test iterates all 150 — `steps` 2–8 when present,
`cues`/`mistakes` 1–5, `defaultDosage` has at least one of `reps`/`holdSeconds`, no empty
strings, any `pose` exists in `SPECS`.

## Follow-up projects (not this spec)

- **Self-assessment form redesign** — plain-language "i" tooltips per field, remove the
  `objectiveVideo` section (form + `validAssessmentForm` rules + admin review), redesign
  toward a short "get started" flow. Its own spec, next.
- **Mobile parity** — Flutter `ExerciseVideo` model + exercise card + admin dose UI.
- **Video** — licence vs. curate vs. film; plugs into `videoUrl`.
