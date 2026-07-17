/// Shared input validators for all data-entry forms.
/// Every method returns an error string, or null when valid.
class Validators {
  Validators._();

  static final RegExp _emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  static const int emailMax = 254;
  static const int nameMax = 80;
  static const int notesMax = 500;
  static const int passwordMax = 128;

  static String? email(String? value) {
    final v = (value ?? '').trim();
    if (v.isEmpty || v.length > emailMax || !_emailRe.hasMatch(v)) {
      return 'Enter a valid email address.';
    }
    return null;
  }

  /// Passwords are never trimmed — validate the raw value.
  static String? password(String? value, {int min = 6}) {
    final v = value ?? '';
    if (v.isEmpty) return 'Enter your password.';
    if (v.length < min) return 'Use at least $min characters.';
    if (v.length > passwordMax) return 'Password must be $passwordMax characters or fewer.';
    return null;
  }

  static String? name(String? value, {int min = 2, int max = nameMax}) {
    final v = (value ?? '').trim();
    if (v.length < min) return 'Enter your full name.';
    if (v.length > max) return 'Name must be $max characters or fewer.';
    return null;
  }

  static String? notes(String? value, {int max = notesMax}) {
    if ((value ?? '').trim().length > max) return 'Keep notes under $max characters.';
    return null;
  }

  static String? dob(DateTime? d) {
    if (d == null) return 'Select a date of birth.';
    if (d.isAfter(DateTime.now())) return 'Enter a date of birth in the past.';
    if (d.year < 1900) return 'Enter a date of birth after 1900.';
    return null;
  }
}
