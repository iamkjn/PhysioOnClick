// Pure Dart port of `lib/motion-engine.ts` (web). Keep this file free of
// camera, Firebase, and Flutter-widget dependencies — it is the reusable
// judging core shared by whatever capture layer the mobile app builds on top.
//
// Any behavioral change here should be mirrored back into the TS source (and
// vice versa) so web and mobile grade movement identically.

import 'dart:math' as math;

import 'motion_targets.dart';

/// A single pose landmark. Only `x`/`y` are used for angle math; `z` and
/// `visibility` are carried through for callers that need them later.
class Landmark {
  const Landmark({required this.x, required this.y, this.z, this.visibility});

  final double x;
  final double y;
  final double? z;
  final double? visibility;
}

/// Landmark-index constants matching MediaPipe/BlazePose's 33-point pose
/// order — the same numeric indices as the web `POSE` object. The camera
/// layer is responsible for supplying landmarks in this index order.
abstract final class PoseIndex {
  static const int nose = 0;
  static const int lShoulder = 11;
  static const int rShoulder = 12;
  static const int lElbow = 13;
  static const int rElbow = 14;
  static const int lWrist = 15;
  static const int rWrist = 16;
  static const int lHip = 23;
  static const int rHip = 24;
  static const int lKnee = 25;
  static const int rKnee = 26;
  static const int lAnkle = 27;
  static const int rAnkle = 28;
}

/// Interior angle (degrees, 0-180) at `vertex` formed by vertex->a and
/// vertex->b. Returns 0 if either arm has zero length.
double computeAngle(Landmark a, Landmark vertex, Landmark b) {
  final v1x = a.x - vertex.x;
  final v1y = a.y - vertex.y;
  final v2x = b.x - vertex.x;
  final v2y = b.y - vertex.y;
  final dot = v1x * v2x + v1y * v2y;
  final m1 = math.sqrt(v1x * v1x + v1y * v1y);
  final m2 = math.sqrt(v2x * v2x + v2y * v2y);
  if (m1 == 0 || m2 == 0) return 0;
  final cos = math.min(1.0, math.max(-1.0, dot / (m1 * m2)));
  return (math.acos(cos) * 180) / math.pi;
}

/// Per-frame judging output. `phase` is `'down'` or `'up'`.
class FrameResult {
  const FrameResult({
    required this.angle,
    required this.reps,
    required this.romMin,
    required this.romMax,
    required this.phase,
    required this.cue,
  });

  final int angle;
  final int reps;
  final int romMin;
  final int romMax;
  final String phase;
  final String cue;
}

/// End-of-session rollup.
class SessionSummary {
  const SessionSummary({
    required this.reps,
    required this.romMin,
    required this.romMax,
    required this.avgQuality,
    required this.passed,
  });

  final int reps;
  final int romMin;
  final int romMax;
  final int avgQuality;
  final bool passed;
}

/// Hysteresis-based rep counter + range-of-motion + quality judge for a
/// single [MotionTarget]. Feed it landmarks frame by frame via [update];
/// call [summary] once the session ends.
class MotionJudge {
  MotionJudge(this._target);

  final MotionTarget _target;

  String _phase = 'down';
  int _reps = 0;
  double _romMin = double.infinity;
  double _romMax = double.negativeInfinity;
  double _peakThisRep = double.negativeInfinity;
  final List<int> _qualities = [];

  FrameResult update(List<Landmark> landmarks) {
    final joint = _target.joint;
    final a = _landmarkAt(landmarks, joint.a);
    final v = _landmarkAt(landmarks, joint.vertex);
    final b = _landmarkAt(landmarks, joint.b);
    final angle = (a != null && v != null && b != null)
        ? computeAngle(a, v, b)
        : 0.0;

    _romMin = math.min(_romMin, angle);
    _romMax = math.max(_romMax, angle);

    var cue = 'Keep going';
    if (_target.direction == 'flex') {
      // Effort DECREASES the angle (bend/lift): enter below repEnterAngle,
      // complete a rep once the joint returns above repExitAngle, grade on how
      // deep the trough (_peakThisRep holds the trough here) got.
      if (_phase == 'down' && angle <= _target.repEnterAngle) {
        _phase = 'up';
        _peakThisRep = angle;
      } else if (_phase == 'up') {
        _peakThisRep = math.min(_peakThisRep, angle);
        if (angle >= _target.repExitAngle) {
          _phase = 'down';
          _reps += 1;
          final range = (_target.targetRomMax - _target.targetRomMin) == 0
              ? 1
              : _target.targetRomMax - _target.targetRomMin;
          final q = math.max(
            0,
            math.min(
              100,
              (((_target.targetRomMax - _peakThisRep) / range) * 100).round(),
            ),
          );
          _qualities.add(q);
          cue = q >= 90 ? 'Good rep' : 'Try for more range';
          _peakThisRep = double.infinity;
        }
      }
      if (_phase == 'up' && angle > _target.targetRomMin + 15) {
        cue = 'Bend further';
      }
    } else {
      // Effort INCREASES the angle (extend/raise): the original behaviour.
      if (_phase == 'down' && angle >= _target.repEnterAngle) {
        _phase = 'up';
        _peakThisRep = angle;
      } else if (_phase == 'up') {
        _peakThisRep = math.max(_peakThisRep, angle);
        if (angle <= _target.repExitAngle) {
          _phase = 'down';
          _reps += 1;
          final q = math.min(
            100,
            ((_peakThisRep / _target.targetRomMax) * 100).round(),
          );
          _qualities.add(q);
          cue = q >= 90 ? 'Good rep' : 'Try for more range';
          _peakThisRep = double.negativeInfinity;
        }
      }
      if (_phase == 'up' && angle < _target.targetRomMax - 15) {
        cue = 'Go further';
      }
    }

    return FrameResult(
      angle: angle.round(),
      reps: _reps,
      romMin: _romMin.round(),
      romMax: _romMax.round(),
      phase: _phase,
      cue: cue,
    );
  }

  SessionSummary summary() {
    final avgQuality = _qualities.isEmpty
        ? 0
        : (_qualities.reduce((sum, q) => sum + q) / _qualities.length).round();
    return SessionSummary(
      reps: _reps,
      romMin: _romMin == double.infinity ? 0 : _romMin.round(),
      romMax: _romMax == double.negativeInfinity ? 0 : _romMax.round(),
      avgQuality: avgQuality,
      passed: _reps >= _target.repTarget && avgQuality >= 60,
    );
  }

  Landmark? _landmarkAt(List<Landmark> landmarks, int index) {
    if (index < 0 || index >= landmarks.length) return null;
    return landmarks[index];
  }
}
