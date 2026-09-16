import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/page_transitions.dart';
import '../assessment/assessment_screen.dart';
import 'checkout_repository.dart';
import 'models/book_service.dart';
import 'payment_screen.dart';

/// Step 3 of the native booking flow (service -> time -> assessment ->
/// payment -> confirmation). Wraps the existing [AssessmentScreen] so it can
/// be used pre-payment: no booking exists yet, so `bookingId` is empty, and
/// on successful submit this starts a Stripe checkout session (carrying the
/// assessment ids so the payment webhook can link them) instead of the
/// standalone "assessment submitted" behavior.
class AssessmentStepScreen extends StatelessWidget {
  final ResolvedService service;
  final DateTime start;
  final String name;
  final String email;
  final String? personId;
  final String personName;

  const AssessmentStepScreen({
    required this.service,
    required this.start,
    required this.name,
    required this.email,
    required this.personId,
    required this.personName,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
    final resolvedPersonId = personId ?? uid;
    return AssessmentScreen(
      bookingId: '', // no booking exists yet — pay-first flow
      personId: resolvedPersonId,
      personName: personName,
      onSubmitted: (formId) async {
        final repo = CheckoutRepository();
        try {
          final url = await repo.createCheckoutSession(
            service: service.apiId,
            start: start,
            name: name,
            email: email,
            assessmentUid: uid,
            assessmentPersonId: resolvedPersonId,
            assessmentFormId: formId,
          );
          if (!context.mounted) return;
          Navigator.pushReplacement(
            context,
            PhysioPageRoute(builder: (_) => PaymentScreen(checkoutUrl: url)),
          );
        } catch (e) {
          if (!context.mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not start payment: $e')),
          );
        }
      },
    );
  }
}
