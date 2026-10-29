# 3D Body Chart — Design

**Date:** 2026-10-29
**Status:** Approved by owner, awaiting spec review
**Branch:** `feat/3d-body-chart`

## Goal

Replace the flat front/back body chart on the assessment "Your concern" step with a
rotatable 3D anatomical body (muscles over skeleton), so the booking flow looks more
professional. Patients still pick the same 31 areas they pick today. This is a
presentation upgrade, not a data change.

## Non-goals

- No finer-grained pain location (e.g. "left hamstring" as saved data). Saved data stays
  the existing 31 region keys plus `somewhere-else`.
- No female body variant. Astra's female model is Astra's own work and not openly
  licensed; the open BodyParts3D data is a single adult male reference. Region-level
  picking is unaffected.
- No change to red-flag routing, clinical-area derivation, Firestore shape, or old
  assessments.
- No public anatomy explorer page (separate idea, not this spec).

## Decisions made with the owner

| Question | Decision |
|---|---|
| Main goal | Look more professional; keep the same areas |
| Look | Muscles + skeleton (like today's chart, in 3D) |
| Rollout shape | 3D first, flat chart as automatic backup |

## Source and licence

- **Geometry:** BodyParts3D 4.0, © The Database Center for Life Science, CC BY 4.0.
- **Packaging/viewer reference:** Human Atlas by ashemag, MIT,
  `https://github.com/ashemag/human-atlas` pinned at commit `1c38bf35c254` (the same
  commit Astra builds on). Its `public/models/atlas.json` + `body-*.bin.gz` already hold
  BodyParts3D converted to metres / Y-up and lightly simplified.
- We take files from the upstream repo, never from Astra's CDN.
- Credit line under the model: "Anatomy: BodyParts3D © DBCLS, CC BY 4.0". Full CC BY and
  MIT notices ship in `public/models/body-chart/ATTRIBUTION.md`.

## Patient experience

1. On "Your concern", the patient sees a 3D body on the warm-paper background (Clarity
   tokens, not Astra's black). Muscles in a muted warm tone, bones ivory — anatomical but
   not graphic.
2. Drag to rotate, pinch/scroll to zoom, and Front / Back / Side buttons. No auto-rotation
   (respects `prefers-reduced-motion` by default).
3. Tapping any muscle or bone toggles its region. Every mesh in a selected region is
   tinted the sky-blue accent; hover/focus tints lighter.
4. Tooltip shows the plain label plus the structure's anatomical name, e.g.
   "Left thigh · Rectus femoris".
5. The selected-area chips, the "Somewhere else / not sure" option, the selected count and
   everything else on the step stay as they are.
6. Small credit line under the canvas.

## Architecture

Five units, each with one job. The wizard and admin swap one import; nothing downstream
changes.

### 1. `scripts/build-body-model.mjs` (build-time, run by hand)

- Input: Human Atlas `atlas.json` + `body-*.bin(.gz)` at the pinned commit, downloaded to
  a scratch directory.
- Keeps systems `skeletal`, `muscular`, `connective` (738 parts). Drops parts that cannot
  be tapped from outside or aren't relevant: teeth, gingiva, laryngeal/hyoid/ocular
  structures, diaphragm and other deep-only parts (explicit exclude list in the script).
- Re-simplifies with `meshoptimizer` (dev dependency) to a size budget: **target ≤ 5 MB
  gzipped total, hard cap 6 MB**.
- Assigns each kept part a region key using unit 2.
- Writes `public/models/body-chart/manifest.json` (parts: id, name, region, chunk offsets,
  bounds) and pre-gzipped `chunk-N.bin.gz` files, each well under Workers' 25 MiB
  per-file limit.
- Writes `docs/body-chart-3d-mapping.md`: a human-readable part → region table for
  spot-checking.

### 2. `lib/body-chart-3d-regions.ts` (pure, tested)

- `regionForPart(name, bounds): string | null` — rules on the part name (`left`/`right`
  plus keywords like femur, deltoid, gluteus, calcaneal) and the part's height/centroid
  for midline or ambiguous parts (vertebrae → neck / upper-back / mid-back / lower-back by
  level).
- A small explicit overrides map for parts the rules get wrong, e.g. muscles that span
  regions (sartorius, latissimus dorsi), assigned by centroid.
- Side convention: anatomical left/right from the source names. That is the patient's
  own left/right, which matches the existing region keys.
- Only returns keys that exist in `BODY_REGIONS` (`lib/body-chart.ts`).

### 3. `components/body-chart-3d.tsx` (client-only viewer)

- Props identical to today's `BodyChart`: `{ value, onChange?, readOnly?, idPrefix? }`.
- Uses `three` (new dependency), loaded via dynamic import so it only ships on this step.
- Loads the manifest and chunks, decompresses with `DecompressionStream('gzip')`, builds
  batched geometry (few draw calls) with per-part region ids for picking and tinting.
- Renders on demand (only when the camera or selection changes), not a constant loop.
- Raycast tap → part → region key → same toggle logic as `BodyChart`, including the
  `somewhere-else` exclusivity rule.
- `readOnly`: rotation and zoom still work, selection is disabled (same as the flat chart).
- Reports `onReady` / `onError` / progress to its parent.

### 4. `components/body-chart-picker.tsx` (chooser)

- The component the wizard and admin import. Same props as `BodyChart`.
- Shows the 3D chart when all of these are true:
  - WebGL is available;
  - the browser isn't in data-saver mode (`navigator.connection.saveData` isn't set);
  - the model loads without error within 10 seconds.
- Otherwise it renders today's flat `BodyChart`, with no error message.
- While loading: a calm placeholder with a progress bar and a keyboard-reachable
  "Use simple chart instead" link (also the route for screen-reader users, since the flat
  chart has accessible buttons).
- Once the patient is on the flat chart (via fallback or the link), it never swaps back to
  3D mid-task.
- The flat `BodyChart` stays in the codebase unchanged as the fallback.

### 5. `lib/body-model-prefetch.ts`

- `prefetchBodyModel()` fetches the manifest and chunks into the browser HTTP cache at
  idle time.
- Called from `components/booking-flow.tsx` on step 1 (service), so the model is usually
  cached by the time the assessment opens on step 2. Skipped when data-saver is on.
- `app/patient/assessment/page.tsx` relies on the picker's own load (no prefetch needed).

### Integration points

- `components/assessment-wizard.tsx`: `BodyChart` → `BodyChartPicker` (one import, one tag).
- `components/admin-assessment-review.tsx`: same swap, `readOnly`.
- `app/globals.css`: styles for the picker, canvas, placeholder and credit line, under the
  existing body-chart section, using Clarity tokens.

## Data flow

Tap mesh → part id → region key (from manifest) → `onChange(regions)` → wizard state
`regions: string[]` → saved as `bodyRegions` / `bodyArea` exactly as today →
`describeRegions`, `deriveClinicalArea` and `regionToConditionGroups` are unchanged.

## Error handling

| Failure | Behaviour |
|---|---|
| No WebGL / context lost | Flat chart |
| Data-saver on | Flat chart, no prefetch |
| Manifest or chunk fetch fails | Flat chart |
| Load exceeds 10 s | Flat chart (download is abandoned) |
| Part with no region (shouldn't happen; build test guards) | Not tappable |

No error UI is shown to the patient in any of these cases. Failures are logged to the
console for debugging.

## Performance budget

- Model: ≤ 5 MB gzipped target, 6 MB hard cap, enforced by a test that reads the manifest.
- `three` loaded only by the 3D chart chunk; no change to other pages' JS.
- Static files served from the Worker's assets; cached by the browser after first load.

## Testing

- **Unit (`tests/lib/body-chart-3d-regions.test.ts`):** representative names map
  correctly (left/right, vertebra levels, spanning muscles).
- **Manifest test (`tests/lib/body-chart-3d-manifest.test.ts`):**
  - every part maps to a valid `BODY_REGIONS` key;
  - every one of the 31 regions has at least one part;
  - total gzipped size is within the cap;
  - the attribution file exists.
- **Picker (`tests/components/body-chart-picker.test.tsx`):** with no WebGL in jsdom, the
  flat chart renders. The fallback link works. Load error and timeout fall back. Existing
  `body-chart.test.tsx` and wizard tests still pass unchanged.
- **Manual:** dev deploy, then the owner compares on a real phone (mobile data and wifi)
  against the current chart. Admin review is checked with an existing assessment.

## Rollout

1. Build on `feat/3d-body-chart`, deploy to the dev site only.
2. The owner compares it with the current chart on their own phone.
3. Prod only after explicit owner sign-off. The chart has been replaced and restored twice
   before (late Sept 2026), so no auto-promotion.
4. Rollback: point the wizard and admin back at `BodyChart` (two imports).

## Known limitations

- Single male reference body for all patients.
- Hands and feet are small in 3D on phones; patients may need to zoom. The region chips
  and "somewhere else" still cover this.
- The geometry is educational reference anatomy, not a diagnostic tool.
