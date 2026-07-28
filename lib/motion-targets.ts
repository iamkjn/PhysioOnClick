import { POSE } from '@/lib/motion-engine';

export type MotionTarget = {
  exerciseId: string;
  bodyPart: string;
  joint: { a: number; vertex: number; b: number };
  targetRomMin: number;
  targetRomMax: number;
  repEnterAngle: number;
  repExitAngle: number;
  repTarget: number;
  // Which way the tracked joint angle moves during the effort phase of a rep:
  //  - "extend" (default): angle INCREASES to the peak (sit-to-stand, bridge,
  //    arm raise). Rep enters above repEnterAngle, completes below repExitAngle,
  //    quality = how close the peak got to targetRomMax.
  //  - "flex": angle DECREASES to the effort (leg raise, heel slide, knee bend).
  //    Rep enters below repEnterAngle, completes above repExitAngle, quality =
  //    how deep the trough got toward targetRomMin.
  // Omitted on legacy targets/docs, which are all "extend".
  direction?: 'extend' | 'flex';
};

// v1 defaults for the three rep-based exercises. Balance (ex-4) has none, so its
// "Check your motion" button never renders. Admin can override any of these in
// Firestore (exerciseMotionTargets/{exerciseId}); these are the fallback.
//
// These are eyeballed starting points, not clinically-derived thresholds —
// each enter/exit pair is spaced widely enough that ordinary tracking jitter
// near a boundary can't register a phantom rep or silently swallow a real
// one, but the actual degree values need tuning against a real webcam (and
// ideally a few real patients) before they're trusted for anything beyond
// "does this look roughly right".
export const DEFAULT_MOTION_TARGETS: Record<string, MotionTarget> = {
  // Sit to Stand: knee angle goes from a seated bend (~85°) to standing
  // extension (~170°). 60° of enter/exit hysteresis (160 -> 100) comfortably
  // spans the noisiest part of the transition.
  'ex-1': { exerciseId: 'ex-1', bodyPart: 'Lower limb',
    joint: { a: POSE.R_HIP, vertex: POSE.R_KNEE, b: POSE.R_ANKLE },
    targetRomMin: 85, targetRomMax: 170, repEnterAngle: 160, repExitAngle: 100, repTarget: 10 },
  // Scapular Setting: "gentle activation" for a painful shoulder, not an
  // overhead reach — the hip-shoulder-elbow angle is a proxy for arm
  // elevation (BlazePose has no scapula landmark), so the rep band targets a
  // moderate raise to roughly shoulder height (~85°) rather than the ~140°+
  // an overhead motion would need, which would be an inappropriate ask this
  // early in shoulder-pain rehab.
  'ex-2': { exerciseId: 'ex-2', bodyPart: 'Shoulder',
    joint: { a: POSE.R_HIP, vertex: POSE.R_SHOULDER, b: POSE.R_ELBOW },
    targetRomMin: 15, targetRomMax: 110, repEnterAngle: 85, repExitAngle: 30, repTarget: 10 },
  // Bridge Progression: hip angle at rest (knees bent, hips down, ~120°) to
  // hips lifted into a near-straight line through the shoulder (~175°).
  'ex-3': { exerciseId: 'ex-3', bodyPart: 'Lumbar spine',
    joint: { a: POSE.R_SHOULDER, vertex: POSE.R_HIP, b: POSE.R_KNEE },
    targetRomMin: 120, targetRomMax: 175, repEnterAngle: 165, repExitAngle: 135, repTarget: 10 },

  // ── Additional checks (extend-type: angle peaks high during the effort) ──
  // Straight Leg Raise: supine, lift the straight leg — the hip FLEXES, so the
  // trunk→hip→knee angle drops from lying-flat (~175°) toward ~110°. Flex-type.
  'ex-5': { exerciseId: 'ex-5', bodyPart: 'Knee', direction: 'flex',
    joint: { a: POSE.R_SHOULDER, vertex: POSE.R_HIP, b: POSE.R_KNEE },
    targetRomMin: 110, targetRomMax: 175, repEnterAngle: 150, repExitAngle: 165, repTarget: 8 },
  // Heel Slide: bend the knee, sliding the heel in — knee angle drops from
  // straight (~175°) toward ~95°. Flex-type.
  'ex-6': { exerciseId: 'ex-6', bodyPart: 'Knee', direction: 'flex',
    joint: { a: POSE.R_HIP, vertex: POSE.R_KNEE, b: POSE.R_ANKLE },
    targetRomMin: 95, targetRomMax: 175, repEnterAngle: 150, repExitAngle: 165, repTarget: 10 },
  // Mini Squat: knee extends back to standing (~175°) at the top of each rep,
  // dipping to ~120° — same shape as Sit-to-Stand. Extend-type.
  'ex-7': { exerciseId: 'ex-7', bodyPart: 'Knee',
    joint: { a: POSE.R_HIP, vertex: POSE.R_KNEE, b: POSE.R_ANKLE },
    targetRomMin: 120, targetRomMax: 175, repEnterAngle: 165, repExitAngle: 130, repTarget: 10 },
  // Shoulder Flexion: raise the arm forward/overhead — hip→shoulder→elbow angle
  // climbs from ~20° to ~160°. A larger reach than the gentle Scapular Setting.
  'ex-8': { exerciseId: 'ex-8', bodyPart: 'Shoulder',
    joint: { a: POSE.R_HIP, vertex: POSE.R_SHOULDER, b: POSE.R_ELBOW },
    targetRomMin: 20, targetRomMax: 160, repEnterAngle: 135, repExitAngle: 50, repTarget: 10 },
  // Hip Bridge: lift the hips into a straight line (~175°) and lower to ~120° —
  // the same extension shape as Bridge Progression. Extend-type.
  'ex-11': { exerciseId: 'ex-11', bodyPart: 'Hip',
    joint: { a: POSE.R_SHOULDER, vertex: POSE.R_HIP, b: POSE.R_KNEE },
    targetRomMin: 120, targetRomMax: 175, repEnterAngle: 165, repExitAngle: 135, repTarget: 10 },
};
