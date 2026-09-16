import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/booking/booking_confirmation_screen.dart';
import 'package:mobile_app/src/features/booking/checkout_repository.dart';

void main() {
  testWidgets('shows a success message for a paid status', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: BookingConfirmationScreen(
        status: CheckoutStatus(status: 'paid', invoiceNumber: 'INV-1'),
      ),
    ));
    expect(find.textContaining('confirmed'), findsOneWidget);
  });

  testWidgets('shows a still-processing message for processing status', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: BookingConfirmationScreen(status: CheckoutStatus(status: 'processing')),
    ));
    expect(find.textContaining('finishing up'), findsOneWidget);
  });

  testWidgets('shows a contact-us message for booking_failed status', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: BookingConfirmationScreen(status: CheckoutStatus(status: 'booking_failed')),
    ));
    expect(find.textContaining('contact you'), findsOneWidget);
  });
}
