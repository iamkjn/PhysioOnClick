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
export const DEFAULT_MOTION_TARGETS: Record<string, MotionTarget> = {
  'ex-1': { exerciseId: 'ex-1', bodyPart: 'Lower limb',
    joint: { a: POSE.R_HIP, vertex: POSE.R_KNEE, b: POSE.R_ANKLE },
    targetRomMin: 85, targetRomMax: 170, repEnterAngle: 160, repExitAngle: 100, repTarget: 10 },
  'ex-2': { exerciseId: 'ex-2', bodyPart: 'Shoulder',
    joint: { a: POSE.R_HIP, vertex: POSE.R_SHOULDER, b: POSE.R_ELBOW },
    targetRomMin: 20, targetRomMax: 160, repEnterAngle: 140, repExitAngle: 50, repTarget: 10 },
  'ex-3': { exerciseId: 'ex-3', bodyPart: 'Lumbar spine',
    joint: { a: POSE.R_SHOULDER, vertex: POSE.R_HIP, b: POSE.R_KNEE },
    targetRomMin: 120, targetRomMax: 175, repEnterAngle: 165, repExitAngle: 135, repTarget: 10 },
};
