# Exercise Write-Ups — Batch Plan (Plan 2 of 2)

**Date:** 2026-09-07
**Depends on:** Plan 1 (`2026-09-06-exercise-content-model-and-ui.md`) — SHIPPED. The `Exercise` type already has optional `setup` / `steps` / `cues` / `mistakes` / `equipment` / `defaultDosage` / `pose`; the patient card, admin dose form, PDF and shape test all consume them and degrade gracefully.
**Spec:** `docs/superpowers/specs/2026-09-06-exercise-content-overhaul-design.md` §2.

## Goal

Fill the structured how-to + `defaultDosage` for all 158 catalogue exercises in `lib/exercises.ts`, batch by batch, each batch clinically reviewed by Shivaliba before it reaches production.

## Content conventions (bake into every batch brief)

- **Voice:** second person ("you"), plain UK English, ~reading age 12. No unexplained clinical terms — gloss anything unavoidable. Calm and encouraging, never alarmist.
- **`setup`** — 1–2 sentences: starting position + equipment/support needed.
- **`steps`** — 2–6 numbered items, one movement each, imperative present tense ("Tighten your lower tummy", "Lift your hips until your body is straight").
- **`cues`** — 2–4 "doing it right" checks ("Your lower back stays flat against the floor", "The movement comes from your hip, not your waist").
- **`mistakes`** — 2–4 "ease off / avoid" items. Where clinically relevant, ONE is a plain-language safety line ("Stop and message your physio if pain travels further down your leg, or you notice new weakness or numbness").
- **`equipment`** — `[]` when none; else short (`["Resistance band"]`, `["Chair or wall for balance"]`).
- **`defaultDosage`** — an evidence-informed *starting point*, labelled as such in the UI. Rough guides (Shivaliba adjusts):
  - Strengthening: `{ sets: 2–3, reps: 8–12, perDay: 1, perWeek: 5 }` (or `perWeek: 3` for heavier loading)
  - Isometric holds: `{ sets: 3, holdSeconds: 20–45, perDay: 1, perWeek: 6 }`
  - Mobility / nerve glides: `{ sets: 1–2, reps: 5–10, perDay: 2–3, perWeek: 7 }`, `tempo` "slow and controlled"
  - Acute-phase gentle movement: `{ sets: 1, reps: 5–10, perDay: 4, perWeek: 7 }`
- **`pose`** — set only when one of the `SPECS` keys in `components/exercise-figure.tsx` genuinely matches; else omit (name-guess fallback stays).
- **Never** touch `id`, `title` (rename only if Shivaliba asks), `clinicalArea`, `tags`, `condition`, `stage`, `videoUrl`.

## Batches (review units — order is flexible)

| # | Region (`bodyPart`) | ids | Draft | In review | Approved | Live dev | Live prod |
|---|---|---|---|---|---|---|---|
| 1 | Lumbar spine + Core | ex-3, 14, 15, 17, 18, 24, 25, 26, 27, 28, 31, 32, 34 (13) | | | | | |
| 2 | Cervical + Thoracic spine + Neck | ex-19, 20, 21, 22, 23, 29, 30, 33 + neck (9) | | | | | |
| 3 | Shoulder + Elbow | (14) | | | | | |
| 4 | Wrist + Hand | (9) | | | | | |
| 5 | Hip + Hamstring | (8) | | | | | |
| 6 | Knee + Lower limb | (10) | | | | | |
| 7 | Ankle | (7) | | | | | |
| 8 | Balance | (18) | | | | | |
| 9 | Neuro | (16) | | | | | |
| 10 | Post-op | (16) | | | | | |
| 11 | Pelvic health | (14) | | | | | |
| 12 | Paediatric | (10) | | | | | |
| 13 | General | (8) | | | | | |
| 14 | Face | (8) | | | | | |

*(Face exercises are graded by the facial-symmetry engine — dosage there = reps × holds; steps describe the facial movement.)*

## Per-batch procedure

1. **Draft** the fields into `lib/exercises.ts` for that batch's ids (leave all other entries untouched).
2. `npx vitest run tests/lib/exercise-content-shape.test.ts` — must stay green (2–8 steps, ≤5 cues/mistakes, dosage has reps or holdSeconds, known pose). `npx tsc --noEmit`, `npm run lint`.
3. **Generate the review doc** `docs/exercises-review/NN-<region>.md` — one section per exercise: title, current `description` (for context), then every drafted field laid out readably, then `- [ ] Approved` + a `Notes:` line for Shivaliba.
4. Commit (`content(exercises): draft <region> write-ups (batch N)`), push, `npm run deploy:dev`.
5. Hand Shivaliba the review doc (or publish it as an Artifact for phone review). Apply her changes → commit → re-deploy dev.
6. **Only after her written sign-off** does that batch go to production (folded into the next `npm run deploy`).

## Batch 1 is the calibration batch

Draft batch 1, get Shivaliba's review, and **adjust these conventions from her feedback before starting batch 2** — voice, depth, dosage defaults, how safety lines are worded.

## Finalisation (after the last batch is approved)

- Tighten the new `Exercise` fields from optional → required in `lib/exercises.ts`; `tsc` then enforces completeness.
- Add a teeth-bearing assertion to `tests/lib/exercise-content-shape.test.ts` (e.g. every non-retired exercise has `steps` and `defaultDosage`).
- Recheck `retired` filtering in `lib/exercise-suggestions.ts` + `scripts/seed-firestore.ts`.
- `npm run seed:firestore` to refresh the `exerciseVideos` mirror for mobile.
