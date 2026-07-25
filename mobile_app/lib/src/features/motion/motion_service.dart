// Pure Dart port of `lib/motion.ts` (web). Mirrors the same Firestore shapes
// so motion-check results are shared between the web and mobile apps — no
// camera/widget dependencies belong here.

import 'package:cloud_firestore/cloud_firestore.dart';

import 'motion_engine.dart';
import 'motion_targets.dart';

class MotionService {
  MotionService._();

  static final _db = FirebaseFirestore.instance;

  static DocumentReference<Map<String, dynamic>> _personBase(
      String uid, String personId) {
    return _db
        .collection('patients')
        .doc(uid)
        .collection('people')
        .doc(personId);
  }

  /// Reads `exerciseMotionTargets/{exerciseId}` (top-level collection, admin
  /// editable). Falls back to the code default, then to `null` if there is
  /// neither a Firestore override nor a known default for [exerciseId].
  static Future<MotionTarget?> getMotionTarget(String exerciseId) async {
    final ref = _db.collection('exerciseMotionTargets').doc(exerciseId);
    final snap = await ref.get();
    final data = snap.data();
    if (snap.exists && data != null) {
      return _targetFromMap(data);
    }
    return defaultMotionTargets[exerciseId];
  }

  static MotionTarget _targetFromMap(Map<String, dynamic> data) {
    final joint = data['joint'] as Map<String, dynamic>;
    return MotionTarget(
      exerciseId: data['exerciseId'] as String,
      bodyPart: data['bodyPart'] as String,
      joint: MotionJoint(
        a: (joint['a'] as num).toInt(),
        vertex: (joint['vertex'] as num).toInt(),
        b: (joint['b'] as num).toInt(),
      ),
      targetRomMin: (data['targetRomMin'] as num).toInt(),
      targetRomMax: (data['targetRomMax'] as num).toInt(),
      repEnterAngle: (data['repEnterAngle'] as num).toInt(),
      repExitAngle: (data['repExitAngle'] as num).toInt(),
      repTarget: (data['repTarget'] as num).toInt(),
    );
  }

  /// Writes a completed motion-check session, mirroring web `saveMotionSession`:
  ///
  /// 1. Adds a doc to `patients/{uid}/people/{personId}/motionSessions`.
  /// 2. Merges `patients/{uid}/people/{personId}/exerciseLogs/{date}` with a
  ///    `completions.{exerciseId}: true` entry — the same shape the web
  ///    streak logic (`lib/recovery.ts` toggleExerciseCompletion / `lib/motion.ts`)
  ///    reads, so a mobile motion session counts toward the shared streak.
  ///
  /// Both writes go in a single batch so a session is never recorded without
  /// the day's exercise being marked complete.
  static Future<void> saveMotionSession(
    String uid,
    String personId, {
    required MotionTarget target,
    required SessionSummary summary,
    required String date,
    required int durationSec,
  }) async {
    final base = _personBase(uid, personId);
    final batch = _db.batch();

    final sessionRef = base.collection('motionSessions').doc();
    batch.set(sessionRef, {
      'exerciseId': target.exerciseId,
      'bodyPart': target.bodyPart,
      'date': date,
      'reps': summary.reps,
      'repTarget': target.repTarget,
      'romMin': summary.romMin,
      'romMax': summary.romMax,
      'targetRomMin': target.targetRomMin,
      'targetRomMax': target.targetRomMax,
      'avgQuality': summary.avgQuality,
      'passed': summary.passed,
      'durationSec': durationSec,
      'source': 'mobile',
      'createdAt': FieldValue.serverTimestamp(),
    });

    final logRef = base.collection('exerciseLogs').doc(date);
    batch.set(
      logRef,
      {
        'completions': {target.exerciseId: true},
        'loggedAt': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );

    await batch.commit();
  }

  /// Most-recent-first stream of past motion-check sessions for a person —
  /// for a future session-review view.
  static Stream<QuerySnapshot<Map<String, dynamic>>> watchMotionSessions(
      String uid, String personId) {
    return _personBase(uid, personId)
        .collection('motionSessions')
        .orderBy('createdAt', descending: true)
        .snapshots();
  }
}
