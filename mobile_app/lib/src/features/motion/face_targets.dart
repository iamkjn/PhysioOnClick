// Pure Dart port of `lib/face-targets.ts` (web). Facial-rehab targets for
// facial-palsy / stroke / older patients — the facial sibling of
// defaultMotionTargets in motion_targets.dart. Keep values identical to the TS
// defaults so web and mobile grade facial movement the same; if the web
// defaults change, mirror the change here too.
//
// Deliberately GENTLE: low rep targets (6) and wide enter/exit bands. Admin can
// override any of these in Firestore (faceMotionTargets/{exerciseId}).

import 'face_engine.dart';

const Map<String, FaceTarget> defaultFaceTargets = {
  'face-smile': FaceTarget(
    exerciseId: 'face-smile',
    label: 'Smile / mouth raise',
    bodyPart: 'Face',
    leftPair: [FaceIndex.lMouthCorner, FaceIndex.noseTip],
    rightPair: [FaceIndex.rMouthCorner, FaceIndex.noseTip],
    restSignal: 0.9,
    activeSignal: 1.15,
    repEnterPct: 55,
    repExitPct: 25,
    repTarget: 6,
  ),
  'face-brow-raise': FaceTarget(
    exerciseId: 'face-brow-raise',
    label: 'Eyebrow raise',
    bodyPart: 'Face',
    leftPair: [FaceIndex.lBrow, FaceIndex.lEyeUpper],
    rightPair: [FaceIndex.rBrow, FaceIndex.rEyeUpper],
    restSignal: 0.12,
    activeSignal: 0.22,
    repEnterPct: 55,
    repExitPct: 25,
    repTarget: 6,
  ),
  'face-eye-close': FaceTarget(
    exerciseId: 'face-eye-close',
    label: 'Gentle eye close',
    bodyPart: 'Face',
    leftPair: [FaceIndex.lEyeUpper, FaceIndex.lEyeLower],
    rightPair: [FaceIndex.rEyeUpper, FaceIndex.rEyeLower],
    invert: true,
    restSignal: 0.11,
    activeSignal: 0.02,
    repEnterPct: 55,
    repExitPct: 25,
    repTarget: 6,
  ),
  'face-cheek-puff': FaceTarget(
    exerciseId: 'face-cheek-puff',
    label: 'Cheek puff',
    bodyPart: 'Face',
    leftPair: [FaceIndex.lCheek, FaceIndex.noseTip],
    rightPair: [FaceIndex.rCheek, FaceIndex.noseTip],
    restSignal: 1.05,
    activeSignal: 1.25,
    repEnterPct: 55,
    repExitPct: 25,
    repTarget: 6,
  ),
  'face-frown': FaceTarget(
    exerciseId: 'face-frown',
    label: 'Brow furrow (frown)',
    bodyPart: 'Face',
    leftPair: [FaceIndex.lBrow, FaceIndex.lEyeUpper],
    rightPair: [FaceIndex.rBrow, FaceIndex.rEyeUpper],
    invert: true,
    restSignal: 0.12,
    activeSignal: 0.07,
    repEnterPct: 55,
    repExitPct: 25,
    repTarget: 6,
  ),
  'face-big-smile': FaceTarget(
    exerciseId: 'face-big-smile',
    label: 'Big smile',
    bodyPart: 'Face',
    leftPair: [FaceIndex.lMouthCorner, FaceIndex.noseTip],
    rightPair: [FaceIndex.rMouthCorner, FaceIndex.noseTip],
    restSignal: 0.9,
    activeSignal: 1.3,
    repEnterPct: 55,
    repExitPct: 25,
    repTarget: 6,
  ),
};
