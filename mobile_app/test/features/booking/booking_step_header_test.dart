import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/booking/booking_step_header.dart';

void main() {
  testWidgets('renders the step count and title', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: BookingStepHeader(step: 2, totalSteps: 3, title: 'Time & your details'),
    ));
    expect(find.text('Step 2 of 3'), findsOneWidget);
    expect(find.text('Time & your details'), findsOneWidget);
  });

  testWidgets('progress bar value matches step/totalSteps', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: BookingStepHeader(step: 1, totalSteps: 3, title: 'Choose your service'),
    ));
    final bar = tester.widget<LinearProgressIndicator>(find.byType(LinearProgressIndicator));
    expect(bar.value, closeTo(1 / 3, 0.001));
  });
}
