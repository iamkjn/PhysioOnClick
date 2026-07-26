// Pure Dart port of `lib/face-engine.ts` (web). Facial-motion judging core for
// facial-palsy / stroke / older patients: left-vs-right SYMMETRY plus gentle
// rep counting on FaceMesh landmarks.
//
// Keep this file free of camera, Firebase, and Flutter-widget dependencies — it
// is the reusable judging core, the facial sibling of `motion_engine.dart`. Any
// behavioural change here must be mirrored back into the TS source (and vice
// versa) so web and mobile grade facial movement identically.

import 'dart:math' as math;

/// A single face landmark. Only `x`/`y` are used for the distance math.
class FaceLandmark {
  const FaceLandmark({required this.x, required this.y, this.z});

  final double x;
  final double y;
  final double? z;
}

/// FaceMesh canonical index subset — same indices as the web `FACE` object.
/// The camera layer must supply landmarks in FaceMesh order.
abstract final class FaceIndex {
  static const int noseTip = 1;
  static const int lEyeOuter = 33;
  static const int rEyeOuter = 263;
  static const int lEyeUpper = 159;
  static const int lEyeLower = 145;
  static const int rEyeUpper = 386;
  static const int rEyeLower = 374;
  static const int lBrow = 105;
  static const int rBrow = 334;
  static const int lMouthCorner = 61;
  static const int rMouthCorner = 291;
  static const int lCheek = 234;
  static const int rCheek = 454;
}

double _dist(FaceLandmark a, FaceLandmark b) {
  final dx = a.x - b.x;
  final dy = a.y - b.y;
  return math.sqrt(dx * dx + dy * dy);
}

/// Distance between a landmark pair normalised by inter-ocular width, so a
/// reading means the same regardless of camera distance. Returns 0 when a
/// point is missing or the face is degenerate.
double normalisedSignal(List<FaceLandmark> landmarks, List<int> pair) {
  final a = _at(landmarks, pair[0]);
  final b = _at(landmarks, pair[1]);
  final eyeL = _at(landmarks, FaceIndex.lEyeOuter);
  final eyeR = _at(landmarks, FaceIndex.rEyeOuter);
  if (a == null || b == null || eyeL == null || eyeR == null) return 0;
  final interocular = _dist(eyeL, eyeR);
  if (interocular == 0) return 0;
  return _dist(a, b) / interocular;
}

/// Symmetry between two side signals, 0-100. 100 = perfectly matched sides.
int symmetryScore(double left, double right) {
  final denom = left.abs() + right.abs();
  if (denom == 0) return 100;
  final asymmetry = (left - right).abs() / denom;
  return math.max(0, math.min(100, ((1 - asymmetry) * 100).round()));
}

class FaceFrameResult {
  const FaceFrameResult({
    required this.ratio,
    required this.reps,
    required this.symmetry,
    required this.leftPct,
    required this.rightPct,
    required this.phase,
    required this.cue,
  });

  final int ratio;
  final int reps;
  final int symmetry;
  final int leftPct;
  final int rightPct;
  final String phase; // 'rest' | 'hold'
  final String cue;
}

class FaceSessionSummary {
  const FaceSessionSummary({
    required this.reps,
    required this.symmetryAvg,
    required this.weakerSide,
    required this.leftRangePct,
    required this.rightRangePct,
    required this.avgQuality,
    required this.passed,
  });

  final int reps;
  final int symmetryAvg;
  final String weakerSide; // 'left' | 'right' | 'even'
  final int leftRangePct;
  final int rightRangePct;
  final int avgQuality;
  final bool passed;
}

class FaceTarget {
  const FaceTarget({
    required this.exerciseId,
    required this.label,
    required this.bodyPart,
    required this.leftPair,
    required this.rightPair,
    required this.restSignal,
    required this.activeSignal,
    required this.repEnterPct,
    required this.repExitPct,
    required this.repTarget,
    this.invert = false,
  });

  final String exerciseId;
  final String label;
  final String bodyPart;
  final List<int> leftPair;
  final List<int> rightPair;
  final bool invert;
  final double restSignal;
  final double activeSignal;
  final int repEnterPct;
  final int repExitPct;
  final int repTarget;
}

int _activation(FaceTarget t, double raw) {
  final span = t.activeSignal - t.restSignal;
  if (span == 0) return 0;
  var pct = ((raw - t.restSignal) / span) * 100;
  if (t.invert) pct = -pct;
  return math.max(0, math.min(100, pct.round()));
}

/// Hysteresis rep counter + running symmetry tracker for one [FaceTarget].
/// Mirrors [MotionJudge]'s shape so the capture layer treats both the same.
class FaceJudge {
  FaceJudge(this._target);

  final FaceTarget _target;

  String _phase = 'rest';
  int _reps = 0;
  int _leftMax = 0;
  int _rightMax = 0;
  // Symmetry samples taken only while the movement is meaningfully active — a
  // relaxed face is trivially symmetric, so counting those frames would wash
  // the average up towards 100 and hide real droop.
  final List<int> _symmetries = [];
  final List<int> _repQualities = [];
  // Symmetry at the frame of PEAK activation within the current rep.
  int _peakRatioThisRep = 0;
  int _symAtPeakThisRep = 0;

  FaceFrameResult update(List<FaceLandmark> landmarks) {
    final rawL = normalisedSignal(landmarks, _target.leftPair);
    final rawR = normalisedSignal(landmarks, _target.rightPair);
    final leftPct = _activation(_target, rawL);
    final rightPct = _activation(_target, rawR);
    final ratio = ((leftPct + rightPct) / 2).round();
    final sym = symmetryScore(leftPct.toDouble(), rightPct.toDouble());

    _leftMax = math.max(_leftMax, leftPct);
    _rightMax = math.max(_rightMax, rightPct);

    var cue = 'Relax your face';
    if (_phase == 'rest' && ratio >= _target.repEnterPct) {
      _phase = 'hold';
      _peakRatioThisRep = ratio;
      _symAtPeakThisRep = sym;
      _symmetries.add(sym);
      cue = sym >= 75 ? 'Hold — nicely even' : 'Hold — try to match both sides';
    } else if (_phase == 'hold') {
      if (ratio > _target.repExitPct) _symmetries.add(sym);
      if (ratio > _peakRatioThisRep) {
        _peakRatioThisRep = ratio;
        _symAtPeakThisRep = sym;
      }
      cue = sym >= 75 ? 'Good — keep it even' : 'Lift the weaker side to match';
      if (ratio <= _target.repExitPct) {
        _phase = 'rest';
        _reps += 1;
        _repQualities.add(_symAtPeakThisRep);
        _peakRatioThisRep = 0;
        _symAtPeakThisRep = 0;
        cue = 'Relax your face';
      }
    } else {
      cue = 'Make the movement';
    }

    return FaceFrameResult(
      ratio: ratio,
      reps: _reps,
      symmetry: sym,
      leftPct: leftPct,
      rightPct: rightPct,
      phase: _phase,
      cue: cue,
    );
  }

  FaceSessionSummary summary() {
    final symmetryAvg = _symmetries.isEmpty
        ? 0
        : (_symmetries.reduce((s, v) => s + v) / _symmetries.length).round();
    final avgQuality = _repQualities.isEmpty
        ? 0
        : (_repQualities.reduce((s, v) => s + v) / _repQualities.length).round();
    final gap = _leftMax - _rightMax;
    final weakerSide = gap.abs() <= 8
        ? 'even'
        : gap > 0
            ? 'right'
            : 'left';
    return FaceSessionSummary(
      reps: _reps,
      symmetryAvg: symmetryAvg,
      weakerSide: weakerSide,
      leftRangePct: _leftMax,
      rightRangePct: _rightMax,
      avgQuality: avgQuality,
      passed: _reps >= _target.repTarget && symmetryAvg >= 60,
    );
  }
}

FaceLandmark? _at(List<FaceLandmark> l, int i) {
  if (i < 0 || i >= l.length) return null;
  return l[i];
}
