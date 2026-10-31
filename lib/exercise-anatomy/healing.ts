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
    "Muscles and tendons: a strained muscle often settles within a few weeks. Tendons get stronger more slowly, so build up your exercises steadily and give them time.",
  "joint-ligament":
    "Joints and ligaments: stronger muscles around a sore joint share the load and help it settle. After a sprain, your ligaments can keep getting stronger for months, so build up steadily.",
  "post-surgery":
    "After surgery: follow your surgeon's and physio's limits first. As the area heals, you rebuild strength and confidence step by step.",
  "nerve-brain":
    "Nerves and the brain: a sensitive or irritated nerve often settles gradually. After a nerve or brain injury, recovery can be slow and carry on for months. Gentle, regular practice helps your nerves move more freely and your brain relearn movement, so build up steadily.",
  "pelvic-floor":
    "Pelvic floor: like any muscle, your pelvic floor can get stronger with regular practice. It can take a few months to notice a difference, so keep going as your physio advises.",
};

export const HEALING_CLOSING = "Everyone heals at their own pace. Your physio will tell you when to move on.";

export function healingCopyVisible(): boolean {
  return HEALING_COPY_STATUS === "approved" || draftsVisible();
}
