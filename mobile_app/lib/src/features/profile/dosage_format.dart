/// Formats an assigned exercise's `dosage` map into the human-readable
/// summary shown to patients, mirroring the web app's rendering of
/// `ExerciseDosage` (`lib/exercises.ts`): `{ sets?, reps?, holdSeconds?,
/// minutes?, perDay?, perWeek?, tempo?, notes? }`.
///
/// Set/rep/hold/minute/tempo/frequency fields are joined into a summary
/// string; `notes` is used only as a fallback when none of those fields are
/// present (matching `resolveDosage()` on the web).
String formatDosage(Map<String, dynamic>? dosage) {
  if (dosage == null || dosage.isEmpty) return '';

  final parts = <String>[];
  final sets = dosage['sets'] as num?;
  final reps = dosage['reps'] as num?;
  final hold = dosage['holdSeconds'] as num?;
  final minutes = dosage['minutes'] as num?;
  final perDay = dosage['perDay'] as num?;
  final perWeek = dosage['perWeek'] as num?;
  final tempo = dosage['tempo'] as String?;

  if (sets != null && reps != null) {
    parts.add('${sets.toInt()} sets × ${reps.toInt()} reps');
  } else if (reps != null) {
    parts.add('${reps.toInt()} reps');
  }
  if (hold != null) parts.add('hold ${hold.toInt()}s');
  if (minutes != null) parts.add('${minutes.toInt()} minutes');
  if (tempo != null && tempo.isNotEmpty) parts.add(tempo);
  if (perDay != null) parts.add('${perDay.toInt()}x/day');
  if (perWeek != null) parts.add('${perWeek.toInt()}x/week');

  if (parts.isNotEmpty) return parts.join(', ');

  final notes = dosage['notes'] as String?;
  return notes ?? '';
}
