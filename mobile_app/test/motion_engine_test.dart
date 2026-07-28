// Mirrors tests/lib/motion-engine.test.ts (web) so the ported Dart engine is
// verified against the same cases.

import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/motion/motion_engine.dart';
import 'package:mobile_app/src/features/motion/motion_targets.dart';

Landmark p(double x, double y) => Landmark(x: x, y: y);

// Build a 33-length landmark list where the knee angle (hip 24, knee 26,
// ankle 28) resolves to `deg`, everything else zeroed. Hip above knee, ankle
// below — same construction as the web test.
List<Landmark> kneeFrame(double deg) {
  final lm = List<Landmark>.generate(33, (_) => const Landmark(x: 0, y: 0));
  final rad = (deg * math.pi) / 180;
  lm[26] = const Landmark(x: 0, y: 0); // knee (vertex)
  lm[24] = const Landmark(x: 0, y: -1); // hip straight up from knee
  lm[28] = Landmark(
    x: math.sin(rad),
    y: -math.cos(rad),
  ); // ankle at `deg` from the hip arm
  return lm;
}

void main() {
  group('computeAngle', () {
    test('is 90 degrees for a right angle', () {
      // vertex at origin, one arm along +x, one along +y
      expect(computeAngle(p(1, 0), p(0, 0), p(0, 1)), closeTo(90, 0.1));
    });
    test('is 180 degrees for a straight line', () {
      expect(computeAngle(p(-1, 0), p(0, 0), p(1, 0)), closeTo(180, 0.1));
    });
    test('is ~0 degrees when arms overlap', () {
      expect(computeAngle(p(1, 0), p(0, 0), p(1, 0)), closeTo(0, 0.1));
    });
  });

  group('MotionJudge (sit-to-stand knee)', () {
    test('counts a rep on an extend-then-return cycle and tracks ROM', () {
      final j = MotionJudge(defaultMotionTargets['ex-1']!);
      j.update(kneeFrame(85)); // seated (below exit)
      j.update(kneeFrame(170)); // stood (above enter) -> phase up
      final r = j.update(kneeFrame(85)); // sat back (below exit) -> +1 rep
      expect(r.reps, 1);
      expect(r.romMax, greaterThanOrEqualTo(169));
      expect(r.romMin, lessThanOrEqualTo(86));
    });

    test('does not double-count while staying extended', () {
      final j = MotionJudge(defaultMotionTargets['ex-1']!);
      j.update(kneeFrame(85));
      j.update(kneeFrame(170));
      j.update(kneeFrame(175));
      expect(j.summary().reps, 0); // never returned below exit
    });
  });

  group('MotionJudge (flex direction — straight leg raise ex-5)', () {
    // Hip angle (shoulder 12, hip 24, knee 26) drops during the lift.
    List<Landmark> hipFlexFrame(double deg) {
      final lm = List<Landmark>.generate(33, (_) => const Landmark(x: 0, y: 0));
      final rad = (deg * math.pi) / 180;
      lm[24] = const Landmark(x: 0, y: 0); // hip (vertex)
      lm[12] = const Landmark(x: 0, y: -1); // shoulder up
      lm[26] = Landmark(x: math.sin(rad), y: -math.cos(rad)); // knee at `deg`
      return lm;
    }

    test('counts a rep on a bend-then-return cycle', () {
      final j = MotionJudge(defaultMotionTargets['ex-5']!); // flex, enter 150, exit 165
      j.update(hipFlexFrame(175));
      j.update(hipFlexFrame(110));
      final r = j.update(hipFlexFrame(175));
      expect(r.reps, 1);
      expect(r.romMin, lessThanOrEqualTo(111));
    });

    test('does not count while the leg stays lifted', () {
      final j = MotionJudge(defaultMotionTargets['ex-5']!);
      j.update(hipFlexFrame(175));
      j.update(hipFlexFrame(110));
      j.update(hipFlexFrame(115));
      expect(j.summary().reps, 0);
    });
  });
}
