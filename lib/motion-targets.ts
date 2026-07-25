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
};
