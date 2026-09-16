/// Formats an assigned exercise's `dosage` map into the human-readable
/// summary shown to patients, mirroring `formatDosage()` on the web
/// (`lib/exercises.ts`) field-for-field and string-for-string:
/// `{ sets?, reps?, holdSeconds?, minutes?, perDay?, perWeek?, tempo?,
/// notes? }`.
///
/// `notes` is NOT used by this formatter — on web it is a separate field
/// (`physioNote`) rendered elsewhere, not folded into the dosage summary.
///
/// This does not itself merge in the exercise catalogue's `defaultDosage` —
/// callers should pass a map already merged via [resolveDosage], mirroring
/// web's `formatDosage(resolveDosage(exercise, assigned))` (`lib/exercises.ts`).
String formatDosage(Map<String, dynamic>? dosage) {
  if (dosage == null || dosage.isEmpty) return '';

  final sets = (dosage['sets'] as num?)?.toInt();
  final reps = (dosage['reps'] as num?)?.toInt();
  final hold = (dosage['holdSeconds'] as num?)?.toInt();
  final minutes = (dosage['minutes'] as num?)?.toInt();
  final perDay = (dosage['perDay'] as num?)?.toInt();
  final perWeek = (dosage['perWeek'] as num?)?.toInt();
  final tempo = dosage['tempo'] as String?;

  String? core;
  if (minutes != null) {
    core = _plural(minutes, 'minute');
  } else if (hold != null && reps != null) {
    final count = sets != null ? '${_plural(sets, 'set')} × ${_plural(reps, 'rep')}' : _plural(reps, 'rep');
    core = '$count, ${hold}s hold';
  } else if (hold != null) {
    core = sets != null ? 'Hold ${hold}s × $sets' : 'Hold ${hold}s';
  } else if (reps != null) {
    core = sets != null ? '${_plural(sets, 'set')} × ${_plural(reps, 'rep')}' : _plural(reps, 'rep');
  } else if (sets != null) {
    core = _plural(sets, 'set');
  }

  if (core == null) return 'As advised by your physio';

  final parts = <String>[core];
  final freq = _frequencyClause(perDay: perDay, perWeek: perWeek);
  if (freq != null) parts.add(freq);
  if (tempo != null && tempo.trim().isNotEmpty) parts.add(tempo.trim());
  return parts.join(' · ');
}

String? _frequencyClause({int? perDay, int? perWeek}) {
  String? daily;
  if (perDay != null && perDay >= 1) {
    daily = perDay == 1
        ? 'once a day'
        : perDay == 2
            ? 'twice a day'
            : '$perDay times a day';
  }
  String? weekly;
  if (perWeek != null && perWeek >= 1) {
    weekly = perWeek >= 7 ? 'every day' : '$perWeek days a week';
  }
  // Show both when they add information: "once a day, 5 days a week". A
  // daily count already implies "every day", so drop a redundant
  // perWeek: 7.
  if (daily != null && weekly != null) {
    return weekly == 'every day' ? daily : '$daily, $weekly';
  }
  return daily ?? weekly;
}

String _plural(int n, String word) => '$n $word${n == 1 ? '' : 's'}';

/// Merges a catalogue exercise's `defaultDosage` with a patient's
/// per-assignment `dosage` override, field by field, with the assigned
/// value winning whenever a field is present in both — mirroring web's
/// `resolveDosage(ex, assigned) = { ...ex.defaultDosage, ...assigned.dosage }`
/// (`lib/exercises.ts`).
Map<String, dynamic> resolveDosage(Map<String, dynamic>? defaultDosage, Map<String, dynamic>? assignedDosage) {
  return {
    ...?defaultDosage,
    ...?assignedDosage,
  };
}
