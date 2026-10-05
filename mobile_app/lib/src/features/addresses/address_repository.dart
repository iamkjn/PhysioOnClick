import 'package:cloud_firestore/cloud_firestore.dart';
import '../booking/models/home_visit.dart';

const int kAddressLineMax = 120;
const int kAddressPostcodeMax = 10;
const int kAddressLabelMax = 40;

final _ukPostcode = RegExp(r'^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$');

class AddressValidationException implements Exception {
  final String message;
  const AddressValidationException(this.message);
  @override
  String toString() => message;
}

/// Personal data: never log.
class SavedAddress {
  final String id;
  final String ownerUid;
  final String label;
  final String line;
  final String postcode;
  const SavedAddress({
    required this.id,
    required this.ownerUid,
    required this.label,
    required this.line,
    required this.postcode,
  });

  factory SavedAddress.fromMap(String id, Map<String, dynamic> m) => SavedAddress(
        id: id,
        ownerUid: (m['ownerUid'] ?? '') as String,
        label: (m['label'] ?? '') as String,
        line: (m['line'] ?? '') as String,
        postcode: (m['postcode'] ?? '') as String,
      );

  String get display => '${label.isNotEmpty ? label : line}, $postcode';
}

/// Validate + normalise; mirrors validateHomeVisit/clean in lib/patient-addresses.ts.
Map<String, dynamic> cleanAddressInput(
    {String? label, required String line, required String postcode}) {
  final l = line.replaceAll(RegExp(r'\s+'), ' ').trim();
  if (l.isEmpty) throw const AddressValidationException('Enter the address.');
  if (l.length > kAddressLineMax) {
    throw const AddressValidationException(
        'Keep the address to $kAddressLineMax characters or fewer.');
  }
  final raw = postcode.trim();
  if (raw.isEmpty || raw.length > kAddressPostcodeMax) {
    throw const AddressValidationException("That postcode doesn't look right.");
  }
  final pc = normalisePostcode(raw);
  if (!_ukPostcode.hasMatch(pc)) {
    throw const AddressValidationException("That postcode doesn't look right.");
  }
  var lab = (label ?? '').trim();
  if (lab.length > kAddressLabelMax) lab = lab.substring(0, kAddressLabelMax);
  return {'label': lab, 'line': l, 'postcode': pc};
}

bool isOwnedBy(Map<String, dynamic>? data, String uid) =>
    data != null && data['ownerUid'] == uid;

class AddressRepository {
  AddressRepository({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;
  final FirebaseFirestore _db;

  CollectionReference<Map<String, dynamic>> get _col =>
      _db.collection('patientAddresses');

  Future<List<SavedAddress>> getAddresses(String uid) async {
    final snap = await _col
        .where('ownerUid', isEqualTo: uid)
        .orderBy('createdAt', descending: false)
        .get();
    return snap.docs.map((d) => SavedAddress.fromMap(d.id, d.data())).toList();
  }

  Future<String> addAddress(String uid,
      {String? label, required String line, required String postcode}) async {
    final ref = await _col.add({
      'ownerUid': uid,
      ...cleanAddressInput(label: label, line: line, postcode: postcode),
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    return ref.id;
  }

  Future<void> updateAddress(String id,
      {String? label, required String line, required String postcode}) {
    return _col.doc(id).update({
      ...cleanAddressInput(label: label, line: line, postcode: postcode),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Atomic: never leaves a usual-address pointer at a deleted address.
  Future<void> deleteAddress(String uid, String id) async {
    final userRef = _db.collection('users').doc(uid);
    final userSnap = await userRef.get();
    final deps = await _db
        .collection('dependents')
        .where('ownerId', isEqualTo: uid)
        .where('defaultAddressId', isEqualTo: id)
        .get();
    final batch = _db.batch();
    batch.delete(_col.doc(id));
    if (userSnap.exists && userSnap.data()?['defaultAddressId'] == id) {
      batch.update(userRef, {'defaultAddressId': FieldValue.delete()});
    }
    for (final d in deps.docs) {
      if (d.data()['defaultAddressId'] == id) {
        batch.update(d.reference, {'defaultAddressId': FieldValue.delete()});
      }
    }
    await batch.commit();
  }

  Future<void> setUsualAddress(String uid, String? personId, String? addressId) async {
    if (addressId != null) {
      final addr = await _col.doc(addressId).get();
      if (!addr.exists || !isOwnedBy(addr.data(), uid)) {
        throw const AddressValidationException('Address not found');
      }
    }
    final value = addressId ?? FieldValue.delete();
    if (personId == null) {
      await _db
          .collection('users')
          .doc(uid)
          .set({'defaultAddressId': value}, SetOptions(merge: true));
    } else {
      await _db.collection('dependents').doc(personId).update({'defaultAddressId': value});
    }
  }

  Future<String?> getUsualAddressId(String uid, String? personId) async {
    final snap = await _db
        .collection(personId == null ? 'users' : 'dependents')
        .doc(personId ?? uid)
        .get();
    if (!snap.exists) return null;
    final v = snap.data()?['defaultAddressId'];
    return v is String ? v : null;
  }
}
