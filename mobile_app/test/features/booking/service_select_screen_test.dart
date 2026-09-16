import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/booking/service_select_screen.dart';

void main() {
  testWidgets('lists all four services with title and price', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: ServiceSelectScreen()));
    await tester.pumpAndSettle();
    expect(find.text('Initial Online Assessment'), findsOneWidget);
    expect(find.text('Online Follow-Up'), findsOneWidget);
    expect(find.textContaining('£50'), findsOneWidget);
  });
}
