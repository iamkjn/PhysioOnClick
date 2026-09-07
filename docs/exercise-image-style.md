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
- **No text baked into images**: All instructional text lives in the PDF/website layout, not the illustration.
- **Neutral clothing**: Leggings and top in neutral tones to keep the visual focus on joint position and movement.
- **Consistent camera angle per body region**: All lumbar exercises shown from the same 3/4 side view; cervical, shoulder, ankle, and other regions use consistent angles within their category.
- **Props only when used**: Chair, wall, resistance band, low step, exercise mat, or other equipment included only when essential to the exercise technique.
- **Output format**: Square PNG, approximately 768px × 768px, with transparent or paper-coloured background.

## Authoring & Review

Exercises are batched (e.g., batch 1: 13 lumbar/core exercises). Each batch's prompts are authored in `lib/exercise-image-prompts.ts`, generated via Gemini Imagen, clinically reviewed by the physiotherapist, and uploaded to Firebase Storage for serving on web and in PDFs.
