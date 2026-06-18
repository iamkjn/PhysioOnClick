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
