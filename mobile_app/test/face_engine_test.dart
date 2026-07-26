// Mirrors tests/lib/face-engine.test.ts (web) so the ported Dart facial engine
// is verified against the same cases and grades identically.

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/motion/face_engine.dart';
import 'package:mobile_app/src/features/motion/face_targets.dart';

// Build a face-landmark list where the smile signal (mouth-corner ↔ nose-tip,
// normalised by inter-ocular width) resolves to a chosen raw distance per side.
// Eyes are placed 1.0 apart so the normaliser is 1 and raw distance == signal.
List<FaceLandmark> smileFrame(double dLeft, double dRight) {
  final lm = List<FaceLandmark>.generate(468, (_) => const FaceLandmark(x: 0, y: 0));
  lm[FaceIndex.lEyeOuter] = const FaceLandmark(x: -0.5, y: 0);
  lm[FaceIndex.rEyeOuter] = const FaceLandmark(x: 0.5, y: 0); // interocular = 1
  lm[FaceIndex.noseTip] = const FaceLandmark(x: 0, y: 1);
  lm[FaceIndex.lMouthCorner] = FaceLandmark(x: 0, y: 1 + dLeft);
  lm[FaceIndex.rMouthCorner] = FaceLandmark(x: 0, y: 1 + dRight);
  return lm;
}

void main() {
  group('symmetryScore', () {
    test('is 100 when both sides match', () {
      expect(symmetryScore(70, 70), 100);
    });
    test('is 100 when both sides are zero', () {
      expect(symmetryScore(0, 0), 100);
    });
    test('drops as the sides diverge', () {
      expect(symmetryScore(90, 40), 62);
      expect(symmetryScore(100, 0), 0);
    });
  });

  group('normalisedSignal', () {
    test('is scale-invariant via inter-ocular normalisation', () {
      final f = smileFrame(0.9, 0.9);
      expect(
        normalisedSignal(f, [FaceIndex.lMouthCorner, FaceIndex.noseTip]),
        closeTo(0.9, 0.001),
      );
    });
  });

  group('FaceJudge (smile)', () {
    final target = defaultFaceTargets['face-smile']!; // rest 0.9, active 1.15

    test('counts a gentle rep on activate-then-relax and stays even', () {
      final j = FaceJudge(target);
      j.update(smileFrame(0.9, 0.9));
      final held = j.update(smileFrame(1.075, 1.075));
      expect(held.phase, 'hold');
      expect(held.symmetry, 100);
      final done = j.update(smileFrame(0.9, 0.9));
      expect(done.reps, 1);
      final s = j.summary();
      expect(s.reps, 1);
      expect(s.weakerSide, 'even');
      expect(s.symmetryAvg, greaterThanOrEqualTo(90));
    });

    test('flags the weaker side when one side lags', () {
      final j = FaceJudge(target);
      j.update(smileFrame(0.9, 0.9));
      j.update(smileFrame(1.125, 1.0)); // left ~90%, right ~40%
      j.update(smileFrame(0.9, 0.9));
      final s = j.summary();
      expect(s.reps, 1);
      expect(s.weakerSide, 'right');
      expect(s.symmetryAvg, lessThan(75));
    });

    test('does not count a rep that never relaxes', () {
      final j = FaceJudge(target);
      j.update(smileFrame(0.9, 0.9));
      j.update(smileFrame(1.075, 1.075));
      j.update(smileFrame(1.15, 1.15));
      expect(j.summary().reps, 0);
    });
  });
}
