// lib/exercise-anatomy/healing.ts
// Shared copy for "Where it fits in recovery" in the exercise anatomy section.
// One status covers all of it: Shivaliba reviews it once, with batch 1. Until
// then only the dev site (drafts flag) shows it.

import { draftsVisible } from "@/lib/exercise-anatomy/drafts";
import type { AnatomyStatus, TissueTrack } from "@/lib/exercise-anatomy/types";

export const HEALING_COPY_STATUS: AnatomyStatus = "draft";

/** The catalogue's four recovery stages, in order. "Facial rehab" has no strip. */
export const HEALING_STAGES = [
  { stage: "Early rehab", label: "Early rehab", caption: "Calm pain and keep moving gently." },
  { stage: "Mobility phase", label: "Mobility", caption: "Win back comfortable movement." },
  { stage: "Strength phase", label: "Strength", caption: "Build strength so the area copes with more." },
  { stage: "Return to function", label: "Return to function", caption: "Get back to work, sport and daily life." },
] as const;

export const TISSUE_LINES: Record<TissueTrack, string> = {
  "muscle-tendon":
    "Muscles and tendons: muscle strains often settle within a few weeks, but tendons rebuild strength slowly, often over three months or more, so steady, gradual loading matters.",
  "joint-ligament":
    "Joints and ligaments: swelling and soreness usually ease over the first few weeks, while ligaments keep remodelling for months. Strength and balance work protects the joint as they do.",
  "post-surgery":
    "After surgery: follow your surgeon's and physio's limits first. Tissues usually knit over about six weeks, then strength and confidence are rebuilt step by step.",
  "nerve-brain":
    "Nerves and the brain: recovery after a nerve or brain injury is often slow and can carry on for months. Regular, repeated practice helps your brain and nerves relearn movement.",
  "pelvic-floor":
    "Pelvic floor: like any muscle, it gets stronger with regular practice. Most people notice a difference after about three months of daily exercises.",
};

export const HEALING_CLOSING = "Everyone heals at their own pace. Your physio will tell you when to move on.";

export function healingCopyVisible(): boolean {
  return HEALING_COPY_STATUS === "approved" || draftsVisible();
}
