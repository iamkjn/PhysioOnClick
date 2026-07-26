import { FACE, type FaceTarget } from '@/lib/face-engine';

// Re-exported so callers can pull the target type from the same module as the
// concrete defaults (mirrors how motion-targets.ts owns MotionTarget).
export type { FaceTarget } from '@/lib/face-engine';

// v1 facial-rehab targets for palsy / stroke / elderly patients. These are the
// facial analogue of DEFAULT_MOTION_TARGETS in `lib/motion-targets.ts`.
//
// Deliberately GENTLE: low rep targets (6) and wide enter/exit bands, because
// the population is people recovering facial-muscle control — asking for 10
// crisp reps would be the wrong clinical ask. The rest/active signal readings
// are eyeballed starting points (distance ratios normalised by inter-ocular
// width) and need tuning against a real webcam and real patients before the
// numbers are trusted for anything beyond "roughly right". Admin can override
// any of these in Firestore (faceMotionTargets/{exerciseId}).
//
// Signal reference (raw normalised distance, before rest/active mapping):
//  - smile:      mouth-corner ↔ nose-tip widens as the corner pulls up/out
//  - brow-raise: brow ↔ eye-centre gap grows as the brow lifts
//  - eye-close:  upper-lid ↔ lower-lid gap shrinks (invert)
//  - cheek-puff: cheek ↔ nose-tip widens as the cheek balloons out
export const DEFAULT_FACE_TARGETS: Record<string, FaceTarget> = {
  'face-smile': {
    exerciseId: 'face-smile',
    label: 'Smile / mouth raise',
    bodyPart: 'Face',
    leftPair: [FACE.L_MOUTH_CORNER, FACE.NOSE_TIP],
    rightPair: [FACE.R_MOUTH_CORNER, FACE.NOSE_TIP],
    restSignal: 0.9,
    activeSignal: 1.15,
    repEnterPct: 55,
    repExitPct: 25,
    repTarget: 6,
  },
  'face-brow-raise': {
    exerciseId: 'face-brow-raise',
    label: 'Eyebrow raise',
    bodyPart: 'Face',
    leftPair: [FACE.L_BROW, FACE.L_EYE_UPPER],
    rightPair: [FACE.R_BROW, FACE.R_EYE_UPPER],
    restSignal: 0.12,
    activeSignal: 0.22,
    repEnterPct: 55,
    repExitPct: 25,
    repTarget: 6,
  },
  'face-eye-close': {
    exerciseId: 'face-eye-close',
    label: 'Gentle eye close',
    bodyPart: 'Face',
    leftPair: [FACE.L_EYE_UPPER, FACE.L_EYE_LOWER],
    rightPair: [FACE.R_EYE_UPPER, FACE.R_EYE_LOWER],
    invert: true,
    restSignal: 0.11,
    activeSignal: 0.02,
    repEnterPct: 55,
    repExitPct: 25,
    repTarget: 6,
  },
  'face-cheek-puff': {
    exerciseId: 'face-cheek-puff',
    label: 'Cheek puff',
    bodyPart: 'Face',
    leftPair: [FACE.L_CHEEK, FACE.NOSE_TIP],
    rightPair: [FACE.R_CHEEK, FACE.NOSE_TIP],
    restSignal: 1.05,
    activeSignal: 1.25,
    repEnterPct: 55,
    repExitPct: 25,
    repTarget: 6,
  },
};

export function getDefaultFaceTarget(exerciseId: string): FaceTarget | null {
  return DEFAULT_FACE_TARGETS[exerciseId] ?? null;
}
