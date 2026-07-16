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
}
