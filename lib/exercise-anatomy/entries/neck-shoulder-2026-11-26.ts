// lib/exercise-anatomy/entries/neck-shoulder-2026-11-26.ts
// What the six seated neck and shoulder exercises (ex-188..ex-193) work.
// Still "draft", so the live site leaves this section off their pages until
// Shivaliba has read it.

import type { ExerciseAnatomy } from "@/lib/exercise-anatomy/types";

export const NECK_SHOULDER_2026_11_26_ANATOMY: Readonly<Record<string, ExerciseAnatomy>> = {
  "seated-neck-bending": { main: ["cervical-spine"], helpers: ["deep-neck-flexors", "neck-extensors"], howItHelps: "Bending your neck gently forward and back moves the joints of your neck within a comfortable range. Keeping it moving may help ease stiffness.", status: "draft" },
  "pillow-lift": { main: ["front-deltoid"], helpers: ["serratus-anterior"], howItHelps: "Lifting a pillow with both hands moves your shoulders forwards and up, with one arm helping the other. This may help keep reaching movements comfortable.", status: "draft" },
  "pillow-side-to-side": { main: ["deltoid"], helpers: ["pectoralis-major", "rotator-cuff"], howItHelps: "Moving a pillow from side to side takes your shoulders out and across your body while your trunk stays still. This may help keep them moving comfortably.", status: "draft" },
  "seated-chest-stretch": { main: ["pectoralis-major"], helpers: ["pectoralis-minor"], howItHelps: "Taking your elbows back gently stretches the muscles across the front of your chest. This may help you sit more upright and feel more open.", tissue: "muscle-tendon", status: "draft" },
  "hook-grip-pull": { main: ["rear-deltoid"], helpers: ["middle-trapezius", "rhomboids"], howItHelps: "Pulling against your own hooked fingers makes the muscles behind your shoulders work without the joints moving. This gentle effort may help build strength.", tissue: "muscle-tendon", status: "draft" },
  "fist-press": { main: ["pectoralis-major"], helpers: ["front-deltoid", "triceps"], howItHelps: "Pressing one fist against the other makes your chest and shoulder muscles work without the joints moving. This gentle effort may help build strength.", tissue: "muscle-tendon", status: "draft" },
};
