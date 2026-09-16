import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/profile/dosage_format.dart';

void main() {
  test('formats sets/reps/hold', () {
    expect(
      formatDosage({'sets': 3, 'reps': 12, 'holdSeconds': 5}),
      '3 sets × 12 reps, hold 5s',
    );
  });

  test('formats minutes-based exercises', () {
    expect(formatDosage({'minutes': 10}), '10 minutes');
  });

  test('falls back to notes when no set/rep/minute fields present', () {
    expect(formatDosage({'notes': 'As tolerated'}), 'As tolerated');
  });

  test('returns empty string for null/empty dosage', () {
    expect(formatDosage(null), '');
    expect(formatDosage({}), '');
  });
}
