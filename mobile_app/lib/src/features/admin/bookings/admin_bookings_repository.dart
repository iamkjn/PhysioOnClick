import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

import '../../../core/api_client.dart';
import 'admin_booking_model.dart';

class AdminBookingsRepository {
  /// Mirrors web's live query: latest 200 bookings, filtered/sorted client
  /// side (`components/admin-bookings-table.tsx`).
  Stream<List<AdminBooking>> watchBookings() {
    return FirebaseFirestore.instance
        .collection('bookings')
        .orderBy('createdAt', descending: true)
        .limit(200)
        .snapshots()
        .map((snap) => snap.docs.map(AdminBooking.fromDoc).toList());
  }

  /// Cancels via Cal.com through the admin-only REST wrapper — Firestore's
  /// own `status` field is updated by the cal-webhook once Cal.com fires the
  /// BOOKING_CANCELLED event, not by this call directly.
  Future<void> cancelBooking(String calBookingUid) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('Not signed in');
    final token = await user.getIdToken();
    if (token == null) throw Exception('Not signed in');

    final res = await http
        .post(
          Uri.parse('$kApiBase/api/admin/cancel-booking'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({'calBookingUid': calBookingUid}),
        )
        .timeout(const Duration(seconds: 20));

    if (res.statusCode != 200) {
      throw Exception('Cancel failed (${res.statusCode})');
    }
  }

  /// Mirrors web's inline assessment expand — a direct Firestore doc read,
  /// same path `getPatientAssessmentFormById` uses (`lib/assessment-forms.ts`).
  Future<Map<String, dynamic>?> fetchAssessment({
    required String uid,
    required String personId,
    required String formId,
  }) async {
    final snap = await FirebaseFirestore.instance
        .collection('patients')
        .doc(uid)
        .collection('people')
        .doc(personId)
        .collection('assessmentForms')
        .doc(formId)
        .get();
    return snap.data();
  }
}
