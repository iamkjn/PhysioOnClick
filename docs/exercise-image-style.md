# Exercise Image Style Specification

This document defines the visual brand contract for all AI-generated exercise
illustrations across PhysioOnClick. Every exercise image must conform to these
specifications to ensure medical accuracy, visual consistency, and brand
alignment.

The contract lives in code as `IMAGE_STYLE_PREFIX` + a per-exercise `core` +
`IMAGE_STYLE_SUFFIX` in `lib/exercise-image-prompts.ts`. `fullImagePrompt(id)`
assembles the three parts. All 174 catalogue exercises have an authored `core`.

## Style Principles

- **Detailed anatomical illustration**: A clean anatomical-textbook look, not a
  flat vector cartoon. Realistic body proportions, clothed neutral figure,
  accurate joint angles. No photo-realism, no heavy rendering.
- **Single human figure** shown mid-movement, in a consistent three-quarter
  view. A two-panel start/end pair is used only where the exercise is a range
  the reader must see both ends of (e.g. ankle pumps, inversion/eversion).
- **Working muscles subtly shaded**: the primary muscles the exercise targets
  are picked out in a soft warm tone so the reader can see *what the exercise is
  for*. Each `core` names the region to shade (e.g. "the gluteus medius on the
  upper outer hip", "the calf and Achilles tendon under load"). Shading is
  subtle, not a full ecorche flayed-muscle diagram.
- **Sky-blue motion arrow**: a single arrow (`#0EA5E9`) showing the direction of
  movement. Omitted for the static face exercises.
- **Colour palette**:
  - Navy outlines: `#043246` (line work and detail)
  - Sky accent: `#0EA5E9` (motion arrow, emphasis)
  - Warm muscle shading tone (soft terracotta / ochre)
  - Neutral pale studio background
  - Otherwise only skin and clothing neutrals.
- **Realistic head, no baked-in text**: the figure has a normal head; there are
  no labels, callouts, or captions in the illustration itself. All instructional
  text lives in the PDF/website layout. The one exception is the PhysioOnClick
  brand footer (see below), composited on afterwards.
- **Face exercises** are a close-up of a face performing the movement with both
  sides shown for symmetry (used for facial palsy / stroke rehab). No motion
  arrow; the `core` still lives in `exerciseImagePrompts` so `hasImagePrompt` is
  true for them.
- **Props only when used**: chair, wall, resistance band, low step, exercise
  mat, wobble board, walking frame, etc. included only when essential to the
  technique described in the exercise `setup`.
- **Consistent camera angle per body region**: within a region (lumbar,
  cervical, shoulder, ankle, balance, ...) the figure is drawn from the same
  three-quarter angle so a hub page of thumbnails reads as one set.
- **Output format**: square PNG, approximately 768px x 768px, on the pale studio
  background.

## Fallback

Until an exercise's image has been generated, reviewed and uploaded, the web
card and the plan PDF render the built-in stick-figure fallback
(`components/exercise-figure.tsx`). An authored prompt alone does **not** change
what renders — see the go-live gate below. The public library ships regardless.

## Brand footer

Every stored image carries a slim PhysioOnClick footer band (~11% of height) so
the asset is unmistakably ours wherever it ends up: the "P" mark in a sky-blue
rounded square, the **PhysioOnClick** wordmark, `physioonclick.co.uk`, and the
sky-blue accent bar along the bottom edge. This is added by
`scripts/brand-exercise-images.ts` (sharp compositing) *after* generation — the
image generator is never asked for the logo. Colours match "The Clarity System"
(`lib/exercise-plan-pdf.ts`).

## Self-check test photos

The public self-check tests (`lib/self-tests.ts`, Phase 1 Part B) use a
**distinct** contract, held in `lib/self-test-image-prompts.ts` as
`SELF_TEST_IMAGE_STYLE_PREFIX` + a per-step `core` + `SELF_TEST_IMAGE_STYLE_SUFFIX`,
assembled by `fullSelfTestImagePrompt(id)`. There is one `core` for every
`step.imageId` across the launch set (49 in total, one per numbered step).

- **A real photograph, not an illustration.** This is the single biggest
  difference from the exercise set. The reference sample cards for the self-check
  tests use photos, and a photo of a person in the test position reads as "a
  real thing I can copy" rather than "a diagram I have to interpret". So the
  brief asks for a realistic, photorealistic photograph of a person
  demonstrating the position - never the anatomical-textbook look used for the
  exercises, and no muscle shading.
- **One consistent model across the whole set**: the same adult in plain grey
  activewear on a plain pale neutral studio background, natural even lighting, a
  consistent three-quarter camera angle, so a page of test thumbnails reads as
  one set.
- **Sky-blue direction arrow only where movement direction matters**: a single
  `#0EA5E9` arrow appears on the steps that show a movement (raise the arm,
  rotate the forearm down, straighten the knee, rise onto the toes, ...) and is
  omitted from the static setup and "note the response" steps.
- **No text, no labels, no watermark** baked into the image. All instructional
  text lives in the page layout. The PhysioOnClick brand footer is composited on
  afterwards, exactly as for the exercise illustrations.
- **Same pipeline, same Storage prefix.** Generate -> brand-footer -> clinical
  review -> upload is the same manual, image-gen-API-gated sequence described
  below. The self-check photos land at `exercise-images/{stepImageId}.png` in
  Storage - the one route and prefix the exercise illustrations use, which is
  also where `SelfTestImage` looks (`exerciseImageUrl(id)` -> `/exercise-images/<id>`).
  The step image ids (`test-<slug>-<n>`) keep them from colliding with the
  `ex-*` illustration ids. `scripts/upload-exercise-images.ts --only=test-...`
  uploads them; there is no separate self-test uploader.
- **`uploadedSelfTestImageIds` is the go-live gate.** It starts empty. Until a
  step image id is in that set, the self-test page renders a labelled
  placeholder for that step and the page still ships. Adding an id there (in the
  same commit that uploads the photo) is what flips the step from placeholder to
  the real photo. Keep it a strict subset of the authored prompts.

## Authoring & Review

Prompts are authored in `lib/exercise-image-prompts.ts` (all 174 done). The
generate -> brand -> review -> upload pipeline is a manual step, gated on the
image-generation API key:

1. `scripts/generate-exercise-images.ts --only=… | --all` (needs `OPENAI_API_KEY`
   in `.env.development`) -> `exercise-images-src/{id}.png`
2. `scripts/brand-exercise-images.ts --only=… | --all` ->
   `exercise-images-src/{id}.branded.png`
3. Physiotherapist clinically reviews the illustrations (joint positions, safety,
   the shaded muscle group).
4. `scripts/upload-exercise-images.ts --only=… | --all` -> Firebase Storage
   (`exercise-images/{id}.png`, prefers the branded file).
5. Add the ids to `uploadedImageIds` in `lib/exercise-image-prompts.ts` and
   commit. **That set is the go-live gate** — adding an id there is what flips
   the web card and the PDF from the stick-figure fallback to the real image.
   Keep it a strict subset of the authored prompts.
