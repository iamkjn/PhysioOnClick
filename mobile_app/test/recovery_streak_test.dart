import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/admin/recovery/recovery_service.dart';

void main() {
  group('RecoveryService.computeStreakDays', () {
    test('returns 0 when there are no completed dates', () {
      expect(RecoveryService.computeStreakDays({}), 0);
    });

    test('counts today plus consecutive prior days', () {
      final dates = {
        RecoveryService.dateKeyDaysAgo(0),
        RecoveryService.dateKeyDaysAgo(1),
        RecoveryService.dateKeyDaysAgo(2),
      };
      expect(RecoveryService.computeStreakDays(dates), 3);
    });

    test('today not yet logged does not break the streak', () {
      final dates = {
        RecoveryService.dateKeyDaysAgo(1),
        RecoveryService.dateKeyDaysAgo(2),
      };
      expect(RecoveryService.computeStreakDays(dates), 2);
    });

    test('a gap stops the count', () {
      final dates = {
        RecoveryService.dateKeyDaysAgo(0),
        RecoveryService.dateKeyDaysAgo(1),
        // gap at 2 days ago
        RecoveryService.dateKeyDaysAgo(3),
      };
      expect(RecoveryService.computeStreakDays(dates), 2);
    });

    test('yesterday missing (with today untouched) resets the streak to 0', () {
      final dates = {RecoveryService.dateKeyDaysAgo(2)};
      expect(RecoveryService.computeStreakDays(dates), 0);
    });
  });
}
