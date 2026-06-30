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

  static Future<List<Map<String, dynamic>>> getPatients() async {
    final snap = await _db.collection('patients').get();
    return snap.docs
        .map((d) => {'uid': d.id, ...d.data()})
        .toList();
  }
}
