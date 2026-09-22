/// Physios often type session notes quickly in lowercase with no closing
/// punctuation. This is a display polish, not a spelling/grammar fixer: it
/// only capitalizes the first letter and adds a trailing full stop when one
/// is missing, leaving the rest of the text exactly as typed. Mirrors web's
/// `lib/clinical-note.ts`.
String formatClinicalNote(String text) {
  final trimmed = text.trim();
  if (trimmed.isEmpty) return trimmed;
  final capitalized = trimmed[0].toUpperCase() + trimmed.substring(1);
  return RegExp(r'[.!?]$').hasMatch(capitalized) ? capitalized : '$capitalized.';
}
