# Exercise Image Style Specification

This document defines the visual brand contract for all AI-generated exercise illustrations across PhysioOnClick. Every exercise image must conform to these specifications to ensure medical accuracy, visual consistency, and brand alignment.

## Style Principles

- **Flat 2-D vector illustration**: Clean, minimal aesthetic with no photo-realistic shading or depth effects.
- **Single human figure**: Shown mid-movement, with a 2-panel pair only where the exercise is a range (e.g., ankle pumps, inversion/eversion).
- **Sky-blue motion arrow**: A single curved arrow (`#0EA5E9`) showing the direction of movement, placed to guide the eye through the action.
- **Colour palette**: 
  - Navy ink: `#14213D` / `#1B2A4A` (line work and details)
  - Sky accent: `#0EA5E9` (motion arrow, emphasis)
  - Warm paper ground: `#FBF7F0` (background)
  - No other colours beyond skin and clothing neutrals.
- **No facial features**: Neutral, featureless head to focus on body position and movement.
- **No text baked into the illustration itself**: All instructional text lives in the PDF/website layout. The one exception is the PhysioOnClick brand footer (see below), which is composited on afterwards — never asked of the image generator, which cannot render our logo legibly.
- **Neutral clothing**: Leggings and top in neutral tones to keep the visual focus on joint position and movement.
- **Consistent camera angle per body region**: All lumbar exercises shown from the same 3/4 side view; cervical, shoulder, ankle, and other regions use consistent angles within their category.
- **Props only when used**: Chair, wall, resistance band, low step, exercise mat, or other equipment included only when essential to the exercise technique.
- **Output format**: Square PNG, approximately 768px × 768px, with transparent or paper-coloured background.

## Brand footer

Every stored image carries a slim PhysioOnClick footer band (~11% of height) so
the asset is unmistakably ours wherever it ends up: the "P" mark in a sky-blue
rounded square, the **PhysioOnClick** wordmark, `physioonclick.co.uk`, and the
sky-blue accent bar along the bottom edge. This is added by
`scripts/brand-exercise-images.ts` (sharp compositing) *after* generation — the
image generator is never asked for the logo. Colours match "The Clarity System"
(`lib/exercise-plan-pdf.ts`).

## Authoring & Review

Exercises are batched (batch 1: 13 lumbar/core; batch A: 14 ankle/shoulder/neck).
Each batch's prompts are authored in `lib/exercise-image-prompts.ts`. Pipeline:

1. `scripts/generate-exercise-images.ts --only=… | --all` → `exercise-images-src/{id}.png`
2. `scripts/brand-exercise-images.ts --only=… | --all` → `exercise-images-src/{id}.branded.png`
3. Physiotherapist clinically reviews the illustrations.
4. `scripts/upload-exercise-images.ts --only=… | --all` → Firebase Storage (`exercise-images/{id}.png`, prefers the branded file).
5. Add the ids to `uploadedImageIds` in `lib/exercise-image-prompts.ts` and commit — that flips the web card and PDF from the stick-figure fallback to the real image.
