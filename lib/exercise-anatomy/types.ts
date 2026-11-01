// lib/exercise-anatomy/types.ts
// Shapes for the exercise-page anatomy: the muscle dictionary entries, what each
// exercise works, and the shared healing-copy tracks.

import type { MuscleKey } from "@/lib/exercise-anatomy/muscles";

export type BodyView = "front" | "back" | "left" | "right";

/** Where a muscle's 3D parts come from: the booking model, the add-on, or nowhere. */
export type MuscleSource = "base" | "addon" | "none";

export interface MuscleGroup {
  /** "Gluteus medius" */
  label: string;
  /** "side of your hip": shown as "Gluteus medius (side of your hip)" */
  plain: string;
  source: MuscleSource;
  /** Matched against model part names (case-insensitive, never /g). Empty when source is "none": a group lights only its own parts. */
  parts: readonly RegExp[];
  /** The side it is best seen from; the 3D view starts there. */
  view: BodyView;
}

export type TissueTrack = "muscle-tendon" | "joint-ligament" | "post-surgery" | "nerve-brain" | "pelvic-floor";

export type AnatomyStatus = "draft" | "approved";

export interface ExerciseAnatomy {
  /** 1–3, no duplicates. */
  main: MuscleKey[];
  /** 0–4, none also in main. */
  helpers: MuscleKey[];
  /** 2–3 sentences, at most 60 words. */
  howItHelps: string;
  /** Omitted for general fitness, falls-prevention balance and pain education. */
  tissue?: TissueTrack;
  /** Overrides the first main muscle's view. */
  view?: BodyView;
  /** Clinical override: text section only, no 3D button. */
  hide3D?: true;
  status: AnatomyStatus;
}
