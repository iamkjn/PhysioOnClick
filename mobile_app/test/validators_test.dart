import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/core/validators.dart';

void main() {
  group('email', () {
    test('accepts normal', () => expect(Validators.email('a@b.co'), isNull));
    test('trims', () => expect(Validators.email('  a@b.co '), isNull));
    test('rejects empty', () => expect(Validators.email(''), 'Enter a valid email address.'));
    for (final v in ['a@.', '@b.c', 'a@b.', 'nodot@com']) {
      test('rejects $v', () => expect(Validators.email(v), 'Enter a valid email address.'));
    }
  });

  group('password', () {
    test('accepts 6+', () => expect(Validators.password('secret1'), isNull));
    test('does NOT trim (spaces preserved)', () => expect(Validators.password('  abc  '), isNull));
    test('rejects empty', () => expect(Validators.password(''), 'Enter your password.'));
    test('rejects short', () => expect(Validators.password('abc'), 'Use at least 6 characters.'));
  });

  group('name', () {
    test('accepts 2+', () => expect(Validators.name('Jo'), isNull));
    test('rejects whitespace-only', () => expect(Validators.name('  '), 'Enter your full name.'));
    test('rejects over cap', () => expect(Validators.name('x' * 81), 'Name must be 80 characters or fewer.'));
  });

  group('notes', () {
    test('blank ok', () => expect(Validators.notes(''), isNull));
    test('rejects over cap', () => expect(Validators.notes('x' * 501), 'Keep notes under 500 characters.'));
  });

  group('dob', () {
    test('accepts past', () => expect(Validators.dob(DateTime(1990)), isNull));
    test('rejects null', () => expect(Validators.dob(null), 'Select a date of birth.'));
    test('rejects future', () => expect(Validators.dob(DateTime(3000)), 'Enter a date of birth in the past.'));
    test('rejects pre-1900', () => expect(Validators.dob(DateTime(1800)), 'Enter a date of birth after 1900.'));
  });
}
