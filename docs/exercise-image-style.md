# Exercise Image Style Specification

This document defines the visual brand contract for all AI-generated exercise
illustrations across PhysioOnClick. Every exercise image must conform to these
specifications to ensure medical accuracy, visual consistency, and brand
alignment.

The contract lives in code as `IMAGE_STYLE_PREFIX` + a per-exercise `core` +
`IMAGE_STYLE_SUFFIX` in `lib/exercise-image-prompts.ts`. `fullImagePrompt(id)`
assembles the three parts. All 158 catalogue exercises have an authored `core`.

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

## Authoring & Review

Prompts are authored in `lib/exercise-image-prompts.ts` (all 158 done). The
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
