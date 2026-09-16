import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';

import 'dependent_model.dart';

class PeopleRepository {
  final _col = FirebaseFirestore.instance.collection('dependents');
  final _storage = FirebaseStorage.instance;

  Stream<List<Dependent>> watchDependents(String userId) {
    return _col
        .where('ownerId', isEqualTo: userId)
        .orderBy('createdAt', descending: false)
        .snapshots()
        .map((s) => s.docs.map(Dependent.fromDoc).toList());
  }

  Future<String> addDependent(Dependent dep) async {
    final ref = await _col.add(dep.toMap());
    return ref.id;
  }

  Future<void> updateDependent(Dependent dep) async {
    await _col.doc(dep.id).update({
      'name': dep.name,
      'dob': dep.dob,
      'relationship': dep.relationship,
      'notes': dep.notes,
    });
  }

  Future<void> deleteDependent(String id) async {
    await _col.doc(id).delete();
  }

  Future<String> uploadAvatar(
      String ownerId, String dependentId, File imageFile) async {
    final ref = _storage.ref('avatars/dependents/$ownerId/$dependentId.jpg');
    await ref.putFile(imageFile, SettableMetadata(contentType: 'image/jpeg'));
    return ref.getDownloadURL();
  }

  Future<void> updateAvatarUrl(String dependentId, String url) async {
    await _col.doc(dependentId).update({'avatarUrl': url});
  }

  Future<String> uploadUserAvatar(String userId, File imageFile) async {
    final ref = _storage.ref('avatars/users/$userId.jpg');
    await ref.putFile(imageFile, SettableMetadata(contentType: 'image/jpeg'));
    return ref.getDownloadURL();
  }

  /// Writes the `pendingSelections/{uid}` doc that the server-side Cal.com
  /// webhook reads to stamp a booking with the right patient. Shared by
  /// [WhoIsThisForScreen] and the native booking flow's time/details step —
  /// keep the field names/shape identical everywhere this is called from.
  Future<void> writePendingSelection({
    required String uid,
    required String patientType,
    required String patientId,
    required String patientName,
    String? avatarUrl,
  }) async {
    await FirebaseFirestore.instance.doc('pendingSelections/$uid').set({
      'patientType': patientType,
      'patientId': patientId,
      'patientName': patientName,
      'patientAvatarUrl': avatarUrl ?? '',
      'selectedAt': FieldValue.serverTimestamp(),
    });
  }
}
