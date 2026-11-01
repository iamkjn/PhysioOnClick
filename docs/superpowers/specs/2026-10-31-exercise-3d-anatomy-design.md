# Exercise 3D Anatomy — Design (Phase 1)

**Date:** 2026-10-31
**Status:** Design approved by owner ("Yes, write it up"); spec awaiting owner review
**Branch:** `feat/exercise-3d-anatomy` (worktree `.claude/worktrees/exercise-3d-anatomy`, from master 2d37ecf3)

## Goal

On each public exercise page, show which muscles the exercise works on the same 3D
muscles-and-skeleton body that is live in the booking assessment, and explain how the
exercise helps recovery. Build and test on dev first. The current exercise pages (their
look, their Google presence, the booking prompts) must not be disturbed.

## Non-goals

- **Animated movement** (the body doing the exercise). It is Phase 2 with its own spec,
  because the model is a static mesh with no skeleton rig. Phase 2 starts with a
  feasibility test on two or three exercises.
- No changes to `lib/exercises.ts`, the mobile app, exercise PDFs, embeds, or the booking
  chart (`components/body-chart-3d.tsx`, `components/body-chart-picker.tsx`,
  `lib/body-chart-3d-regions.ts`, `public/models/body-chart/*`).
- No new URLs, no sitemap change, no change to any page's `<title>`, meta description,
  canonical, H1, quick answer or structured data.
- No admin editing or Firestore storage. The anatomy content is code, reviewed in git.

## Decisions made with the owner

| Question | Answer |
| --- | --- |
| How should it show "how it heals"? | All four: highlight muscles worked, "How this helps" text, healing stages, animated movement (animation moves to Phase 2). |
| Where does the 3D go? | In the top picture: a "View in 3D" button on the main illustration swaps it for the 3D body in the same box. |
| Rollout | Top 20 first: draft all exercises on dev; Shivaliba reviews the 20 most-visited pages first; approved batches go live. |
| Architecture | A separate anatomy data file keyed by slug, plus a muscle dictionary. Reuse the live model files and shared model libraries. A small add-on model holds the deep parts the booking model leaves out. |

## Refinements found while writing (2026-10-31)

1. **The section goes after the booking prompt, not straight after the steps.** The
   "Not getting better…" prompt has sat straight after "How to do it" since 2026-10-09,
   and its clicks are being measured. The new section goes below it, so that prompt stays
   where it is.
2. **The add-on also covers deep neck flexors and spinal discs.** The source atlas has
   longus colli/capitis, rectus capitis anterior/lateralis and the intervertebral discs.
   The booking model leaves them out. Chin tuck is a top-20 page and works the deep neck
   flexors; McKenzie press-up is another top-20 page and is about the disc. So the add-on
   holds pelvic floor + diaphragm + deep neck flexors + discs.
3. **Nerves are not in the model** (the atlas has only head nerves). Nerve-glide
   exercises (median nerve glide is a top-20 page) are text-only: nothing is lit for a
   nerve (see refinement 11).
4. **The tissue line is optional.** General fitness and falls-prevention balance
   exercises do not heal one tissue. They show the stages strip without a tissue line,
   rather than being forced into one of the five tracks.
5. **Model part labels are matched by name, not by "system".** The atlas files some
   muscles under "skeletal" (tibialis anterior, fibularis, levator scapulae,
   subscapularis) and tensor fasciae latae under "connective".

### Refinements found while planning (2026-10-31)

6. **Files live in folders.** The data and helpers go in `lib/exercise-anatomy/`
   (`types.ts`, `muscles.ts`, `healing.ts`, `addon-parts.ts`, `addon-loader.ts`,
   `scene.ts`, `entries/*.ts`, `index.ts`). The components go in
   `components/exercise-library/`, next to the other library components. This replaces
   the single-file names under "Architecture" below.
7. **Headings say "Main focus" / "Also working", not "muscles".** Some targets aren't
   muscles: McKenzie press-up targets the lower back discs, and Spanish squat the kneecap
   tendon. The legend says "Main focus" / "Helpers".
8. **The 3D body takes the picture's exact square.** Its view buttons, legend, notes and
   credit sit just under the square while 3D is open. Content below therefore moves only
   after the patient taps, which doesn't count as layout shift.
9. **One shared-library change.** `lib/body-model-loader.ts` exports its private
   download-and-gunzip helper as `readModelFile`, so the add-on loader reuses it. Its
   behaviour is unchanged and covered by the existing loader tests.
10. **The model ships no "tap to select".** The exercise view is read-only: a tap shows a
    name, and lit parts are picked first, so a tap lands on the highlighted muscle even
    under see-through ones.
11. **Exact match only (owner, 2026-11-01): no stand-ins.** A muscle that isn't in the
    model is listed in the text and named in a "Not in the 3D model, so not lit" note;
    the 3D view shows only when at least one main muscle is in the model. Group part
    lists are locked by `tests/lib/exercise-anatomy/lit-parts.json`.

## What the model has

The live booking model (569 parts) has the major limb, shoulder and back muscles:
glutes (max/med/min), quads, hamstrings, adductors, calf (gastrocnemius, soleus),
tibialis anterior/posterior, fibularis, psoas, iliacus, piriformis, deep hip rotators,
deltoid, rotator cuff (including subscapularis), pecs, serratus anterior, rhomboids,
trapezius, levator scapulae, erector spinae (iliocostalis, longissimus, spinalis), the
small deep back muscles (rotators, interspinales, intertransversarii), external oblique,
the arm and forearm muscles, Achilles (calcaneal) tendon, iliotibial tract and tensor
fasciae latae.

**The add-on (new, small)** adds pelvic floor (levator ani parts, coccygeus), diaphragm,
deep neck flexors and the intervertebral discs.

**Not in any open model we use:** latissimus dorsi, rectus abdominis, transversus
abdominis, internal oblique, quadratus lumborum, multifidus, limb nerves, knee ligaments
and menisci, facial muscles. Nothing is lit in their place: they are listed in the text
section and named in a note under the body ("Not in the 3D model, so not lit: …"). An
exercise whose main muscles are all in this list shows text only (see "When the button
shows").

## Patient experience

### The picture (top of the page)

- The illustration stays the default, exactly as today.
- A small "View in 3D" button sits in the illustration's top-right corner (the bottom-right
  holds the "© physioonclick.co.uk" watermark, which it must not cover). Tapping it
  swaps the illustration for the 3D body **in the same box**, so nothing else on the
  page moves. A "Back to picture" button in the same corner swaps back. The illustration
  stays mounted (hidden), so it doesn't reload.
- While the model downloads, the box shows "Loading the 3D body…" with a progress bar,
  and "Back to picture" works throughout.
- **Colours:** main muscles in the site's sky-blue accent; helper muscles in a lighter
  tint of it. Every other muscle and bone is faint and see-through ("x-ray"), so deep
  muscles such as psoas, piriformis and the rotator cuff show through.
- **Starting view:** the camera turns to the side where the first main muscle is seen
  best (the entry's `view` overrides it). It frames the box around all main muscles
  with a 25% margin on each side, so the joint they move stays in view. A "Whole body" button
  zooms out; it then reads "Close-up".
- The same controls as the booking chart: the "360° / Drag to turn" label,
  Front/Back/Left/Right buttons, horizontal drag to turn (a vertical swipe still scrolls
  the page on phones). Tapping any part names it, e.g. "Gluteus medius: side of your
  hip (main muscle)".
- A legend under the body: "Main muscles" / "Helpers", plus a "not lit" note when a
  muscle isn't in the model, e.g. "Not in the 3D model, so not lit: multifidus."

### When the button shows

The button renders only when all of these are true:

1. The exercise has an anatomy entry that is visible (see Rollout: approved on prod,
   any draft on dev).
2. At least one main muscle is actually in the model or the add-on. Face muscles,
   nerves and the other unmodelled muscles cannot be drawn, so the 8 face exercises (and
   any other exercise whose main muscles are all unmodelled) get no button.
3. The entry does not set `hide3D` (kept for clinical overrides, e.g. if Shivaliba
   prefers no 3D for a page).
4. The browser can do 3D (`canUse3D()`: WebGL available, no Save-Data). This check
   runs after hydration, so the server HTML never contains the button.

### New section: "What it works and how it helps"

A server-rendered section placed after the booking prompt that follows "How to do it".
It is real HTML text, so it reads without the 3D view and without JavaScript.

- **Muscles worked:** main muscles, then helpers, each in plain words, e.g.
  "Gluteus medius (side of your hip)".
- **How this helps your recovery:** 2–3 sentences specific to the exercise.
- **Healing stages strip:** Early rehab → Mobility → Strength → Return to function. These
  map one-to-one to the existing `stage` values ("Early rehab", "Mobility phase",
  "Strength phase", "Return to function"). The exercise's stage is highlighted and
  marked "This exercise". Each step has a
  short shared caption (e.g. "Early rehab: calm pain and keep moving gently"). Exercises
  whose stage is "Facial rehab" get no strip; the nerve-recovery line still shows.
- **Tissue line (optional):** one sentence about how that tissue heals, from five shared
  tracks: muscle & tendon, joint & ligament, after surgery, nerve & brain recovery,
  pelvic floor.
- Ends with: "Everyone heals at their own pace. Your physio will tell you when to move
  on."

The section follows the site-wide spacing rule: paragraph margin is 0 globally, so every
heading/text and list pair gets explicit spacing.

## Content

### Per-exercise entry

```ts
type BodyView = "front" | "back" | "left" | "right";
type TissueTrack = "muscle-tendon" | "joint-ligament" | "post-surgery" | "nerve-brain" | "pelvic-floor";

interface ExerciseAnatomy {
  main: MuscleKey[];      // 1–3, no duplicates
  helpers: MuscleKey[];   // 0–4, none also in main
  howItHelps: string;     // 2–3 sentences, at most 60 words
  tissue?: TissueTrack;   // omitted for general fitness / falls-prevention balance
  view?: BodyView;        // overrides the starting side
  hide3D?: true;          // clinical override: text section only
  status: "draft" | "approved";
}
```

### Writing rules

Claude drafts entries for all 174 exercises, working one body area at a time:

- UK spelling and plain words, at a reading age of about 11. Latin name first, then
  where it is: "Soleus (deep calf muscle)".
- No promises. Write "helps" and "can", never "will heal" or "cures". Give no personal
  timelines.
- Each entry must agree with the exercise's existing description, steps, cues and
  `helpsWith`.

A second pass checks the anatomy of each batch before it reaches dev. Claude also drafts
the shared copy: the four stage captions, the five tissue lines and the closing line.

### Top-20 review for Shivaliba

- **Batch 1** is the 20 slugs in `lib/exercise-search-titles.ts`, the pages with real
  Search Console impressions (90 days to 2026-10-07). It is re-pulled from Search
  Console before the sheet goes out; any newer top page replaces the lowest.
- The review sheet goes in `docs/exercises-review/`, following the existing batch files.
  For each exercise it shows: the dev link, main muscles, helpers, how-it-helps text,
  any "not lit" note, the tissue line, and "Approve / Change: ____".
- The sheet also carries the shared copy (stage captions, tissue lines, closing line).
- Her answers are applied as edits and `status: "approved"`. Later batches go by body
  area.

## Architecture

New files only, except for: the two page insertions, one analytics line, appended CSS
and one `package.json` script (`build:anatomy-addon`).

### 1. `lib/anatomy-muscles.ts` (pure data)

The muscle dictionary, about 50 groups:

```ts
interface MuscleGroup {
  label: string;        // "Gluteus medius"
  plain: string;        // "side of your hip"
  parts: RegExp[];      // matched against model part names, both sides
  source: "base" | "addon" | "none";
  view: BodyView;       // best side to see it from
}
```

Left and right are both lit; the exercises are done on both sides.

### 2. `lib/exercise-anatomy.ts` (pure data + rules)

- `EXERCISE_ANATOMY: Record<slug, ExerciseAnatomy>`.
- `visibleAnatomy(slug)` returns the entry or `null`. An entry is visible when it is
  approved, or when `NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS === "1"`.
- `canShow3D(entry)` implements rules 2–3 under "When the button shows".

### 3. `lib/healing-stages.ts` (pure data)

The four stage captions, the five tissue lines and the closing line, with their own
`status`. On prod the strip and tissue line need approved copy.

### 4. `scripts/build-anatomy-addon.ts` (`npm run build:anatomy-addon`, run by hand)

- Reads the same pinned Human Atlas cache as `build-body-model` and writes
  `public/models/exercise-anatomy/` (manifest + one gzipped chunk) in the existing
  `lib/body-model-format.ts` format. Vertices carry the format's no-region value.
- It is a separate script, so the booking model's build is untouched.
- The existing `/models/*` rule in `public/_headers` already gives these files
  `x-robots-tag: noindex`.

### 5. `lib/anatomy-addon-loader.ts`

- Loads and caches the add-on, the same way `lib/body-model-loader.ts` does for the
  base model.
- It is fetched only for exercises whose muscles need it.
- The base model is loaded through the existing `loadBodyModel()`, so it shares the
  browser cache with the booking chart.

### 6. `components/exercise-body-3d.tsx` (client, dynamically imported)

- The viewer, with its own stage code. It reuses `lib/body-model-format.ts`,
  `lib/body-model-loader.ts` and `lib/body-model-pick.ts`, and does not edit the booking
  component. Some duplication of stage setup is accepted for zero risk to the live
  booking flow; the two can be merged once both are stable.
- Each chunk gets geometry groups built from the parts' `firstIndex`/`indexCount`, with
  four materials:
  - main: accent, opaque;
  - helper: light accent, opaque;
  - other muscle: translucent;
  - bone: translucent, slightly stronger, for orientation.
- Translucent materials don't write depth.
- Framing uses the per-part boxes from `computePartBoxes`.
- Tap names come from the dictionary when the part belongs to this exercise; otherwise
  they are the atlas name with "left/right" removed.
- `role="img"` with an aria-label that lists the main muscles.
- Respects `prefers-reduced-motion` (no animated camera moves; the 360° icon doesn't
  swing).

### 7. `components/exercise-hero-media.tsx` (client)

- Wraps the existing `<ExerciseImage>`, which is passed as children, unchanged.
- Adds the "View in 3D" / "Back to picture" button and loads the viewer with `import()`
  on first tap.
- Starts fetching the model on hover or focus of the button (desktop), to shorten the
  wait.
- Moves focus into the viewer on open, and back to the button on close.
- Fires `trackLibraryEvent("library_3d_view", slug)` once per open.

### 8. `components/exercise-anatomy-section.tsx` (server)

Renders "What it works and how it helps" from the entry, the dictionary and the
healing copy.

### 9. `app/exercises/[slug]/page.tsx`: two insertions

1. Inside `exlib-detail-hero__media`: when `visibleAnatomy(slug)` and `canShow3D` hold,
   wrap the unchanged `<ExerciseImage>` in `<ExerciseHeroMedia>`. Otherwise the markup
   is exactly today's.
2. After the after-steps booking prompt section: `<ExerciseAnatomySection>` when the
   entry is visible.

### 10. `app/globals.css` and `lib/analytics.ts`

- CSS is a new appended block under `exlib-anatomy` / `exercise-body-3d` class names,
  using the Clarity tokens. No existing selector changes.
- `lib/analytics.ts` gains one `LibraryEvent` member: `library_3d_view`.

## Data flow

1. **Build time:** the page reads `visibleAnatomy(slug)` (the drafts flag is inlined at
   build) and renders the section and, if allowed, the hero wrapper.
2. **First tap in the browser:** `import()` the viewer → `loadBodyModel()` (and
   `loadAnatomyAddon()` when needed) → resolve dictionary patterns to part indices →
   build groups and materials → frame the main muscles.

## Error handling

| Situation | What happens |
| --- | --- |
| No WebGL / Save-Data on | No button. The page looks exactly as today; the text section still shows. |
| Model or add-on fails to download, or WebGL context lost | Back to the picture, with a one-line note "The 3D view couldn't load", and the button stays available to retry. |
| Slow network | No timeout (the patient chose to wait); progress bar plus "Back to picture". |
| A pattern matches no part at runtime (shouldn't happen; tests guard it) | That muscle is skipped in 3D. The text section still lists it. |
| Viewer chunk fails to import | Same as a download failure. |

## Testing

**Unit (Vitest):**

- Every dictionary group with source `base` matches at least one part on each side in
  `public/models/body-chart/manifest.json`.
- Every `addon` group matches parts in the add-on manifest.
- The exact part names every group lights are locked in
  `tests/lib/exercise-anatomy/lit-parts.json`; the test recomputes them from the
  manifests and fails on any difference (a group that isn't in a model lights nothing).
- Every `EXERCISE_ANATOMY` key is a real exercise slug.
- Every exercise has an entry (the drafts are complete).
- Main has 1–3 items, helpers 0–4, no overlap, `howItHelps` at most 60 words, tissue is
  valid.
- Face exercises fail `canShow3D`.
- `visibleAnatomy`: drafts are hidden when the flag is off, and shown when it is on;
  approved entries always show.
- The base model manifest is unchanged: still 569 parts, and none matches add-on
  patterns.

**Component (Testing Library, three.js mocked):**

- The button is hidden when `canUse3D()` is false.
- Tap → loading → viewer.
- A load error brings back the picture and the note.
- "Back to picture" restores the image and focus.
- The section renders the muscles, stage highlight and tissue line, and leaves out the
  strip for "Facial rehab".

**Page:**

- With the flag off and nothing approved, an exercise page renders no anatomy markup.
- `generateMetadata` and the JSON-LD don't depend on anatomy.

**Before/after HTML check:** build with the flag off and diff three exercise pages
against a master build. Only build hashes and inert script references may differ.

**Browser on dev, desktop and phone width:**

- A knee, a shoulder, a back, a pelvic-floor (add-on) and a chin-tuck (add-on)
  exercise, plus one page with a "not lit" note.
- Page scroll works over the viewer on touch.
- No console errors.
- The illustration (the page's largest image) is unchanged and loads the same.

## Rollout

1. Build on `feat/exercise-3d-anatomy` and deploy to **dev only** with
   `npm run deploy:dev` from the worktree. `.env.development` gets
   `NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS=1`, so dev shows every draft.
   `.env.production` never has it. A build without the flag (including a stray
   Cloudflare Git auto-build) shows only approved entries; until batch 1 is approved,
   that is nothing.
2. The owner checks dev.
3. Re-pull the top 20 from Search Console and send Shivaliba the batch-1 review sheet.
4. Apply her answers and mark them approved. Prod deploys only on the owner's go: from
   origin/master in a fresh worktree with real node_modules and the deploy guard, then
   checking `wrangler deployments list` for concurrent deploys.
5. Later batches (by body area) follow the same review → approve → deploy loop.

## Known limitations

- The model is one adult male body. Pregnancy, postnatal and children's exercises show
  the same body; the pelvic floor shape differs between sexes. Shivaliba reviews the
  pelvic-health pages with this in mind and can set `hide3D` on any of them.
- Some muscles aren't in the model (listed above). They are never lit in place of
  something else; the 3D view names them in a "not lit" note.
- No ligaments, menisci or limb nerves; the text section carries that detail.
- Drafts are Claude-written clinical content. None reaches prod without Shivaliba's
  approval.
