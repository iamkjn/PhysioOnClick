import 'package:cloud_firestore/cloud_firestore.dart';

class RecoveryService {
  RecoveryService._();

  static final _db = FirebaseFirestore.instance;

  static DocumentReference<Map<String, dynamic>> _personBase(
      String uid, String personId) {
    return _db
        .collection('patients')
        .doc(uid)
        .collection('people')
        .doc(personId);
  }

  static Future<void> addClinicalAssessment(
    String uid,
    String personId, {
    required String date,
    required int painScore,
    required int mobilityScore,
    required String physioNotes,
    String sessionId = '',
  }) async {
    await _personBase(uid, personId)
        .collection('clinicalAssessments')
        .doc(date)
        .set({
      'painScore': painScore,
      'mobilityScore': mobilityScore,
      'physioNotes': physioNotes,
      'sessionId': sessionId,
      'recordedAt': FieldValue.serverTimestamp(),
    });
  }

  static Future<void> assignExercise(
    String uid,
    String personId,
    String exerciseId,
    String physioUid,
  ) async {
    await _personBase(uid, personId)
        .collection('assignedExercises')
        .doc(exerciseId)
        .set({
      'exerciseId': exerciseId,
      'assignedAt': FieldValue.serverTimestamp(),
      'assignedBy': physioUid,
      'active': true,
    });
  }

  static Future<void> removeExercise(
      String uid, String personId, String exerciseId) async {
    await _personBase(uid, personId)
        .collection('assignedExercises')
        .doc(exerciseId)
        .update({'active': false});
  }

  static Stream<QuerySnapshot<Map<String, dynamic>>> watchPainLogs(
      String uid, String personId, int days) {
    return _personBase(uid, personId)
        .collection('painLogs')
        .orderBy(FieldPath.documentId, descending: true)
        .limit(days)
        .snapshots();
  }

  static Stream<QuerySnapshot<Map<String, dynamic>>> watchEarliestPainLog(
      String uid, String personId) {
    return _personBase(uid, personId)
        .collection('painLogs')
        .orderBy(FieldPath.documentId, descending: false)
        .limit(1)
        .snapshots();
  }

  static Stream<List<Map<String, dynamic>>> watchPainCheckins(
      String uid, String personId) {
    return _personBase(uid, personId)
        .collection('painCheckins')
        .orderBy('streakDay')
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => {
                  'id': d.id,
                  'runNumber': d.data()['runNumber'] ?? 0,
                  'streakDay': d.data()['streakDay'] ?? 0,
                  'status': d.data()['status'] ?? 'pending',
                  'score': d.data()['score'],
                  'note': d.data()['note'] ?? '',
                })
            .toList());
  }

  static Future<int> getCurrentRun(String uid, String personId) async {
    final snap = await _personBase(uid, personId).collection('goals').doc('current').get();
    final run = snap.data()?['currentRun'];
    return run is int ? run : 0;
  }

  static Future<int?> getPainCheckinInterval(String uid, String personId) async {
    final snap = await _personBase(uid, personId).collection('goals').doc('current').get();
    final interval = snap.data()?['painCheckinInterval'];
    return interval is int ? interval : null;
  }

  static Future<void> logPainCheckinScore(
    String uid,
    String personId,
    String checkinId,
    int score, {
    String note = '',
  }) async {
    if (score < 0 || score > 10) {
      throw ArgumentError('Pain score must be between 0 and 10.');
    }
    await _personBase(uid, personId)
        .collection('painCheckins')
        .doc(checkinId)
        .update({
      'status': 'logged',
      'score': score,
      'note': note,
      'loggedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Computes the recovery improvement percentage relative to [baselineScore].
  ///
  /// **Windowing responsibility:** callers must pass the correct window of
  /// recent entries via `watchPainLogs(uid, personId, 3)` — this function
  /// operates on whatever [recentScores] it receives and cannot enforce the
  /// 3-entry window constraint itself. Passing more or fewer entries will
  /// silently produce a different (incorrect) average.
  ///
  /// Returns `null` when there is insufficient data (no baseline, baseline of
  /// zero, or no recent scores), which the UI interprets as "Log first check-in".
  static int? computeRecoveryPercent({
    required int? baselineScore,
    required List<int> recentScores,
  }) {
    if (baselineScore == null || baselineScore == 0 || recentScores.isEmpty) {
      return null;
    }
    final current =
        recentScores.reduce((a, b) => a + b) / recentScores.length;
    final pct = ((baselineScore - current) / baselineScore * 100).round();
    return pct.clamp(0, 100);
  }

  /// `YYYY-MM-DD` local-calendar-date key `n` days before today, matching
  /// the document-id scheme `painLogs`/`exerciseLogs` already use. Mirrors
  /// web's `dateKeyDaysAgo` (`lib/recovery.ts`).
  static String dateKeyDaysAgo(int n) {
    final d = DateTime.now().subtract(Duration(days: n));
    final y = d.year.toString().padLeft(4, '0');
    final m = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '$y-$m-$day';
  }

  /// Current daily streak = the run of consecutive days, counting back from
  /// today, on which at least one assigned exercise was completed. Today not
  /// yet logged doesn't break the streak — the run is allowed to start at
  /// "yesterday" so an untouched today reads as "keep it going", not "streak
  /// lost". Mirrors web's `computeStreakDays` (`lib/recovery.ts`) exactly, so
  /// the two platforms report the same number for the same underlying data.
  static int computeStreakDays(Set<String> completedDates) {
    var streak = 0;
    final startOffset = completedDates.contains(dateKeyDaysAgo(0)) ? 0 : 1;
    for (var i = startOffset; i < 400; i++) {
      if (completedDates.contains(dateKeyDaysAgo(i))) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /// The set of `exerciseLogs` date keys (last [days] days) with at least
  /// one exercise marked complete — the input `computeStreakDays` expects.
  /// Mirrors web's `getExerciseLogs` + the `completedDates` filter in
  /// `streak-card.tsx`.
  static Future<Set<String>> getCompletedExerciseDates(
      String uid, String personId, int days) async {
    final snap = await _personBase(uid, personId)
        .collection('exerciseLogs')
        .orderBy(FieldPath.documentId, descending: true)
        .limit(days)
        .get();
    return snap.docs
        .where((doc) {
          final completions = doc.data()['completions'] as Map<String, dynamic>?;
          return completions?.values.any((v) => v == true) ?? false;
        })
        .map((doc) => doc.id)
        .toSet();
  }

  static Stream<QuerySnapshot<Map<String, dynamic>>> watchClinicalAssessments(
      String uid, String personId, int days) {
    return _personBase(uid, personId)
        .collection('clinicalAssessments')
        .orderBy(FieldPath.documentId, descending: true)
        .limit(days)
        .snapshots();
  }

  static Stream<QuerySnapshot<Map<String, dynamic>>> watchAssignedExercises(
      String uid, String personId) {
    return _personBase(uid, personId)
        .collection('assignedExercises')
        .where('active', isEqualTo: true)
        .snapshots();
  }

}
