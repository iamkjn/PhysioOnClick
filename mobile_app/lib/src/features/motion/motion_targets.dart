// Pure Dart port of `lib/motion-targets.ts` (web). Keep values identical to
// the TS defaults — they were tuned, not guessed. If the web defaults change,
// mirror the change here too.

import 'motion_engine.dart';

/// The three landmark indices whose interior angle (a -> vertex -> b) is
/// tracked for a given exercise.
class MotionJoint {
  const MotionJoint({required this.a, required this.vertex, required this.b});

  final int a;
  final int vertex;
  final int b;
}

class MotionTarget {
  const MotionTarget({
    required this.exerciseId,
    required this.bodyPart,
    required this.joint,
    required this.targetRomMin,
    required this.targetRomMax,
    required this.repEnterAngle,
    required this.repExitAngle,
    required this.repTarget,
  });

  final String exerciseId;
  final String bodyPart;
  final MotionJoint joint;
  final int targetRomMin;
  final int targetRomMax;
  final int repEnterAngle;
  final int repExitAngle;
  final int repTarget;
}

// v1 defaults for the three rep-based exercises. Balance (ex-4) has none, so
// its "Check your motion" button never renders. Admin can override any of
// these in Firestore (exerciseMotionTargets/{exerciseId}); these are the
// fallback.
//
// These are eyeballed starting points, not clinically-derived thresholds —
// each enter/exit pair is spaced widely enough that ordinary tracking jitter
// near a boundary can't register a phantom rep or silently swallow a real
// one, but the actual degree values need tuning against a real webcam (and
// ideally a few real patients) before they're trusted for anything beyond
// "does this look roughly right".
const Map<String, MotionTarget> defaultMotionTargets = {
  // Sit to Stand: knee angle goes from a seated bend (~85 deg) to standing
  // extension (~170 deg). 60 deg of enter/exit hysteresis (160 -> 100)
  // comfortably spans the noisiest part of the transition.
  'ex-1': MotionTarget(
    exerciseId: 'ex-1',
    bodyPart: 'Lower limb',
    joint: MotionJoint(
      a: PoseIndex.rHip,
      vertex: PoseIndex.rKnee,
      b: PoseIndex.rAnkle,
    ),
    targetRomMin: 85,
    targetRomMax: 170,
    repEnterAngle: 160,
    repExitAngle: 100,
    repTarget: 10,
  ),
  // Scapular Setting: "gentle activation" for a painful shoulder, not an
  // overhead reach — the hip-shoulder-elbow angle is a proxy for arm
  // elevation (BlazePose has no scapula landmark), so the rep band targets a
  // moderate raise to roughly shoulder height (~85 deg) rather than the
  // ~140 deg+ an overhead motion would need, which would be an inappropriate
  // ask this early in shoulder-pain rehab.
  'ex-2': MotionTarget(
    exerciseId: 'ex-2',
    bodyPart: 'Shoulder',
    joint: MotionJoint(
      a: PoseIndex.rHip,
      vertex: PoseIndex.rShoulder,
      b: PoseIndex.rElbow,
    ),
    targetRomMin: 15,
    targetRomMax: 110,
    repEnterAngle: 85,
    repExitAngle: 30,
    repTarget: 10,
  ),
  // Bridge Progression: hip angle at rest (knees bent, hips down, ~120 deg)
  // to hips lifted into a near-straight line through the shoulder (~175 deg).
  'ex-3': MotionTarget(
    exerciseId: 'ex-3',
    bodyPart: 'Lumbar spine',
    joint: MotionJoint(
      a: PoseIndex.rShoulder,
      vertex: PoseIndex.rHip,
      b: PoseIndex.rKnee,
    ),
    targetRomMin: 120,
    targetRomMax: 175,
    repEnterAngle: 165,
    repExitAngle: 135,
    repTarget: 10,
  ),
};
