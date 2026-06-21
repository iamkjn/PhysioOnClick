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
