import 'package:cloud_firestore/cloud_firestore.dart';

import 'booking_model.dart';

class AppointmentsRepository {
  final _db = FirebaseFirestore.instance;

  Stream<List<BookingRecord>> watchBookings(String userId) {
    return _db
        .collection('bookings')
        .where('bookedBy', isEqualTo: userId)
        .orderBy('sessionDate', descending: true)
        .limit(50)
        .snapshots()
        .map((s) => s.docs.map(BookingRecord.fromDoc).toList());
  }

  Future<BookingRecord?> getBooking(String bookingId) async {
    final doc = await _db.doc('bookings/$bookingId').get();
    if (!doc.exists) return null;
    return BookingRecord.fromDoc(doc);
  }

  /// Whether the signed-in account has ever booked this person (self or a
  /// dependent) — used to gate the getting-started checklist's first step.
  /// `bookedBy` must be included in the query itself (not just checked
  /// against the fetched result) because firestore.rules' read rule for
  /// `bookings` requires `resource.data.bookedBy == request.auth.uid`, and
  /// Firestore rejects list queries it can't statically prove satisfy the
  /// rule for every possible match.
  Future<bool> hasBookingFor(String uid, String personId) async {
    final snap = await _db
        .collection('bookings')
        .where('bookedBy', isEqualTo: uid)
        .where('patientId', isEqualTo: personId)
        .limit(1)
        .get();
    return snap.docs.isNotEmpty;
  }

  Future<SessionSummary?> getSummary(String bookingId) async {
    final snap = await _db
        .collection('sessionSummaries')
        .where('bookingId', isEqualTo: bookingId)
        .limit(1)
        .get();
    if (snap.docs.isEmpty) return null;
    return SessionSummary.fromDoc(snap.docs.first);
  }
}
