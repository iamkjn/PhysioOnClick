import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class PatientAccountService {
  PatientAccountService._();

  static final FirebaseFirestore _db = FirebaseFirestore.instance;

  static DocumentReference<Map<String, dynamic>> patientDoc(String uid) {
    return _db.collection('patients').doc(uid);
  }

  static DocumentReference<Map<String, dynamic>> favouriteBlogDoc(
    String uid,
    String slug,
  ) {
    return patientDoc(uid).collection('favoriteBlogs').doc(slug);
  }

  static Future<void> ensurePatientRecord(
    User user, {
    String? preferredName,
    String? authProvider,
  }) async {
    final providerId = authProvider ??
        (user.providerData.isNotEmpty ? user.providerData.first.providerId : 'password');
    final displayName = (preferredName ?? user.displayName ?? '').trim();

    await patientDoc(user.uid).set({
      'uid': user.uid,
      'email': user.email ?? '',
      'displayName': displayName,
      'photoUrl': user.photoURL ?? '',
      'phoneNumber': user.phoneNumber ?? '',
      'authProvider': providerId,
      'lastSignInAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'createdAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }
}
