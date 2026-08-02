import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

import '../../core/api_client.dart';
import 'assessment_model.dart';

/// Writes patient assessment forms into the same Firestore shape the web app
/// uses (`submitPatientAssessmentForm` in lib/assessment-forms.ts), then
/// best-effort notifies the backend to stamp the booking so the admin review
/// UI can link the form back to its appointment.
class AssessmentRepository {
  Future<String> submit({
    required String uid,
    required String personId,
    required String bookingId,
    required AssessmentInput input,
  }) async {
    final ref = await FirebaseFirestore.instance
        .collection('patients')
        .doc(uid)
        .collection('people')
        .doc(personId)
        .collection('assessmentForms')
        .add(input.toFirestore(bookingId: bookingId));

    // Best-effort: the Firestore write above already succeeded and is the
    // source of truth for the assessment itself. This call lets the server
    // stamp/link the booking; if it fails we still return the new doc id.
    try {
      final user = FirebaseAuth.instance.currentUser;
      final token = await user?.getIdToken();
      if (token != null) {
        await http
            .post(
              Uri.parse('$kApiBase/api/patient/assessment/link'),
              headers: {
                'Authorization': 'Bearer $token',
                'Content-Type': 'application/json',
              },
              body: jsonEncode({
                'bookingId': bookingId,
                'assessmentFormId': ref.id,
              }),
            )
            .timeout(const Duration(seconds: 20));
      }
    } catch (_) {
      // Ignore — see comment above.
    }

    return ref.id;
  }
}
