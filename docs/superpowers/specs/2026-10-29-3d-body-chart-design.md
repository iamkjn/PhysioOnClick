# 3D Body Chart — Design

**Date:** 2026-10-29
**Status:** Approved by owner ("deploy this to the development environment, not live prod")
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
  licensed; the open BodyParts3D data is a single adult male reference. Area-level
  picking is unaffected.
- No change to red-flag routing, clinical-area derivation, Firestore shape, or old
  assessments.
- No change to the admin assessment review (see "Admin" below).
- No zoom (see "Patient experience").
- No public anatomy explorer page (separate idea).
- Dev deployment only. Prod needs a separate owner sign-off.

## Decisions made with the owner

| Question | Decision |
|---|---|
| Main goal | Look more professional; keep the same areas |
| Look | Muscles + skeleton (like today's chart, in 3D) |
| Rollout shape | 3D first, flat chart as automatic backup |
| Environment | Deploy to dev only, never prod |

## Refinements found while planning (2026-10-29)

These came out of testing against the real model data, after the owner approved the
design:

1. **Areas are per surface point, not per part.** Each vertex carries its area, so a joint
   area like "Left knee" covers the ends of the femur and tibia as well as the patella. The
   area lights up where the patient tapped. A per-part mapping would have left the knee and
   elbow almost untappable, because those joints sit between bones.
2. **No zoom.** The areas are big enough at full-body size, and pinch/scroll zoom would
   fight page scrolling on phones. Sideways drag turns the body. Vertical swipes still
   scroll the page.
3. **Admin keeps the flat chart.** The admin page renders every assessment at once, inside
   `<details>`. Browsers cap 3D canvases at about 16 per page, and the flat chart is
   quicker for Shivaliba to read at a glance. Both charts show the same saved areas.
4. **Measured size: about 3.5 MB** gzipped (about 300k triangles, quantised), under the
   5 MB target.

## Source and licence

- **Geometry:** BodyParts3D 4.0, © The Database Center for Life Science, CC BY 4.0.
- **Packaging:** Human Atlas by ashemag, MIT, `https://github.com/ashemag/human-atlas`
  pinned at commit `1c38bf35c254a891200d3cedecfd57abebe83d8d`. Its `public/models/`
  `atlas.json` + `body-*.bin.gz` hold BodyParts3D converted to metres, Y-up, with +X as
  the patient's left and +Z as the front.
- We download from that GitHub commit, never from Astra's CDN.
- Credit line under the model: "Anatomy adapted from BodyParts3D © DBCLS, CC BY 4.0 · licence
  details" (the last link opens the full notice). Full CC BY and
  MIT notices ship in `public/models/body-chart/ATTRIBUTION.md`.

## Patient experience

1. On "Your concern", the patient sees a 3D body on the warm-paper surface (Clarity
   tokens, not Astra's black). Muscles are a muted warm tone and bones ivory: anatomical but
   not graphic.
2. Sideways drag turns the body (turntable, small tilt allowed). Buttons: Front / Back /
   Left / Right. Left and Right are the patient's own sides.
3. Tapping the body toggles the area under the finger. The whole area is tinted the
   sky-blue accent. On desktop, hover tints the area lightly.
4. A tooltip shows the plain label plus the anatomical name of the tapped structure, e.g.
   "Left thigh · Rectus femoris".
5. The selected-area chips, the "Somewhere else / not sure" option, the selected count and
   the rest of the step behave exactly as now.
6. Under the canvas: a one-line hint and the credit line, "Anatomy adapted from BodyParts3D © DBCLS, CC BY 4.0 · licence details".
7. A small "Use simple chart instead" link is above the model. It is also the keyboard and
   screen-reader route.

## Architecture

The wizard swaps one import. Nothing downstream changes.

### 1. `lib/body-chart-3d-regions.ts` (pure, build-time only)

- `ruleForPart(name)` gives each part one of three rules: `exclude` (teeth, larynx, eye,
  tongue, pelvic floor, deep neck, disks, papillary muscles, diaphragm), `fixed` (skull →
  head-jaw, hyoid → neck, rotator cuff → shoulder), or a `segment` (arm, leg or trunk).
- `regionKeyForVertex(rule, side, x, y, z)` splits a segment into areas by height, plus
  depth for back versus front and for buttock versus hip, plus lateral distance for the
  trunk "side" area.
- Trunk structures are split by the angle around the body: front within 55° → chest or
  abdomen; behind within 55° → back areas; otherwise side below the armpits. Above the
  armpits the front half is chest and the back half upper-back. Trapezius and levator
  scapulae use the back segment; front-of-neck muscles (sternocleidomastoid, strap
  muscles, platysma, scalenes) are fixed to neck.
- Side comes from the part name (`left`/`right`), else from the vertex's x sign.
- Every key it returns is a `BODY_REGIONS` key.

### 2. `lib/body-model-format.ts` (shared reader/writer + colour helpers)

- One chunk is one merged mesh of at most 65,535 vertices (so indices are Uint16).
- Each chunk holds Int16 normalised positions (× 2 = metres), Int8 normalised normals,
  a Uint8 area index per vertex, and Uint16 indices. Each block is 4-byte aligned.
- `manifest.json`: regions (the `BODY_REGIONS` keys in order), systems, parts (name,
  system, chunk, vertex/index ranges), and chunks (file, bytes, gzip bytes, counts).
- Pure helpers: `readChunk`, `writeChunk`, `partForFace`, `baseColors`, `paintColors`,
  `linearBytes`.

### 3. `scripts/build-body-model.ts` (run by hand: `npm run build:body-model`)

- Downloads the pinned Human Atlas files into `.cache/` (gitignored).
- Keeps the skeletal, muscular and connective systems, minus excluded parts.
- Simplifies with `meshoptimizer` at a 2% error limit (48 triangles minimum per part). The
  error limit binds before the 200k-triangle target, giving about 300k triangles.
- Quantises, bakes the areas, and writes `public/models/body-chart/{manifest.json,
  chunk-N.bin.gz, ATTRIBUTION.md}` plus `docs/body-chart-3d-mapping.md` (a part → area
  table for spot-checks).
- Fails if the gzipped total exceeds 6 MB.

### 4. `lib/body-model-loader.ts`

- `loadBodyModel()` is memoised per page. It fetches the manifest and chunks, gunzips with
  `DecompressionStream` when the payload is gzip (checked by magic bytes), and checks sizes.
- `onBodyModelProgress(listener)` reports download progress.
- `prefetchBodyModel()` runs at idle time.
- `canUse3D()` checks for WebGL and `DecompressionStream`, and that data-saver is off. The
  result is cached.

### 5. `components/body-chart-selection.tsx` + `toggleRegion` in `lib/body-chart.ts`

- The "somewhere else" button and the chips, shared by both charts.
- `toggleRegion(value, key)` holds the existing toggle rule.
- The flat chart is refactored to use both. Its behaviour is unchanged.

### 6. `components/body-chart-3d.tsx` (client viewer)

- three.js and OrbitControls are dynamically imported inside the effect, so they're
  loaded only on this step.
- One mesh per chunk, vertex colours, and render on demand.
- Raycast on tap (pointer moved ≤ 8 px): the hit vertex's area goes to `toggleRegion` and
  then `onChange`.
- The canvas uses `touch-action: pan-y`.
- Calls `onReady` once built. Calls `onError` on load failure or WebGL context loss.

### 7. `components/body-chart-picker.tsx`

- The component the wizard imports. Props: `{ value, onChange }`.
- Shows the 3D chart when `canUse3D()` is true. Otherwise it shows the flat `BodyChart`
  with no message.
- Falls back to the flat chart on `onError`, if not ready within 10 s, or when the
  patient taps the link. It never swaps back once on the flat chart.

### 8. Prefetch

- `components/booking-flow.tsx` calls `prefetchBodyModel()` when the patient reaches the time step (step 2).
- `/patient/assessment` relies on the chart's own load.

## Data flow

Tap → raycast → vertex area index → `manifest.regions[i]` → `toggleRegion` → wizard
`regions: string[]` → saved as `bodyRegions` / `bodyArea` exactly as today.

## Error handling

| Failure | Behaviour |
|---|---|
| No WebGL, no DecompressionStream, data-saver on | Flat chart |
| Manifest or chunk fetch fails, size mismatch | Flat chart (`onError`) |
| Not ready within 10 s | Flat chart |
| WebGL context lost | Flat chart |
| Tap on empty space | Nothing |

No error UI is shown to the patient. Errors are logged to the console.

## Testing

- Unit tests for the area rules: name rules, height bands, side handling, and every key
  being valid and reachable.
- Unit tests for the binary format and colour helpers.
- A manifest test against the committed files. It checks:
  - regions equal `BODY_REGIONS`;
  - every area is present in the vertex data, with no vertex left without an area;
  - the gzipped total is ≤ 6 MB;
  - `ATTRIBUTION.md` exists.
- Loader tests: memoisation, gzip decoding, retry after failure, progress, and support
  detection.
- Picker tests: no-WebGL fallback, error fallback, timeout fallback, the link, and no swap
  back. The existing flat-chart and wizard tests still pass.
- Manual: local preview on desktop and a mobile viewport, then the dev site.

## Rollout

1. Build on `feat/3d-body-chart` and deploy to dev with `npm run deploy:dev` only.
2. The owner compares it with the current chart on their phone.
3. Prod only after explicit owner sign-off, as a separate step.
4. Rollback: point the wizard back at `BodyChart` (one import).

## Known limitations

- Single male reference body for all patients.
- Hands and feet are small on phones. Area bands keep them tappable, and chips confirm
  what was picked.
- Educational reference anatomy, not a diagnostic tool.
