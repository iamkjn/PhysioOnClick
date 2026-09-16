import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/profile/dosage_format.dart';

void main() {
  test('formats hold+reps (a repeated hold) with sets', () {
    expect(
      formatDosage({'sets': 3, 'reps': 12, 'holdSeconds': 5}),
      '3 sets × 12 reps, 5s hold',
    );
  });

  test('formats hold+reps without sets', () {
    expect(formatDosage({'reps': 12, 'holdSeconds': 5}), '12 reps, 5s hold');
  });

  test('formats hold-only with sets', () {
    expect(formatDosage({'holdSeconds': 30, 'sets': 3}), 'Hold 30s × 3');
  });

  test('formats hold-only without sets', () {
    expect(formatDosage({'holdSeconds': 30}), 'Hold 30s');
  });

  test('formats sets+reps (no hold)', () {
    expect(formatDosage({'sets': 3, 'reps': 12}), '3 sets × 12 reps');
  });

  test('formats reps-only', () {
    expect(formatDosage({'reps': 12}), '12 reps');
  });

  test('formats sets-only', () {
    expect(formatDosage({'sets': 3}), '3 sets');
  });

  test('formats minutes-based exercises', () {
    expect(formatDosage({'minutes': 10}), '10 minutes');
  });

  test('falls back to the fixed placeholder when no quantifiable field is present', () {
    expect(formatDosage({'notes': 'As tolerated'}), 'As advised by your physio');
  });

  test('returns empty string for null/empty dosage', () {
    expect(formatDosage(null), '');
    expect(formatDosage({}), '');
  });

  test('appends frequency clause: once a day', () {
    expect(formatDosage({'reps': 12, 'perDay': 1}), '12 reps · once a day');
  });

  test('appends frequency clause: twice a day', () {
    expect(formatDosage({'reps': 12, 'perDay': 2}), '12 reps · twice a day');
  });

  test('appends frequency clause: N times a day', () {
    expect(formatDosage({'reps': 12, 'perDay': 4}), '12 reps · 4 times a day');
  });

  test('appends frequency clause: N days a week', () {
    expect(formatDosage({'reps': 12, 'perWeek': 3}), '12 reps · 3 days a week');
  });

  test('appends frequency clause: every day when perWeek >= 7', () {
    expect(formatDosage({'reps': 12, 'perWeek': 7}), '12 reps · every day');
  });

  test('combines daily + weekly, dropping redundant perWeek: 7', () {
    expect(
      formatDosage({'reps': 12, 'perDay': 1, 'perWeek': 7}),
      '12 reps · once a day',
    );
  });

  test('combines daily + weekly when weekly adds information', () {
    expect(
      formatDosage({'reps': 12, 'perDay': 1, 'perWeek': 5}),
      '12 reps · once a day, 5 days a week',
    );
  });

  test('appends tempo after core and frequency', () {
    expect(
      formatDosage({'sets': 3, 'reps': 6, 'perDay': 1, 'perWeek': 3, 'tempo': '3 to 4 seconds to lower'}),
      '3 sets × 6 reps · once a day, 3 days a week · 3 to 4 seconds to lower',
    );
  });

  test('tempo alone with sets-only core', () {
    expect(formatDosage({'sets': 3, 'tempo': 'slow and controlled'}), '3 sets · slow and controlled');
  });
}
