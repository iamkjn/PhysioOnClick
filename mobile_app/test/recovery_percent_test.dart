import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/admin/recovery/recovery_service.dart';

void main() {
  group('RecoveryService.computeRecoveryPercent', () {
    test('returns null when there is no baseline', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: null,
        recentScores: [4, 4],
      );
      expect(result, isNull);
    });

    test('returns null when recent scores are empty', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: 8,
        recentScores: [],
      );
      expect(result, isNull);
    });

    test('returns null when baseline is zero', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: 0,
        recentScores: [2, 2],
      );
      expect(result, isNull);
    });

    test('computes 0 percent when current equals baseline', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: 6,
        recentScores: [6, 6, 6],
      );
      expect(result, 0);
    });

    test('computes positive improvement percent', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: 8,
        recentScores: [4, 4, 4],
      );
      expect(result, 50);
    });

    test('clamps to 0 when pain has gotten worse than baseline', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: 3,
        recentScores: [6, 6, 6],
      );
      expect(result, 0);
    });

    test('clamps to 100 when current pain is zero', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: 5,
        recentScores: [0, 0, 0],
      );
      expect(result, 100);
    });
  });
}
