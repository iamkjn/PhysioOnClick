import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/app.dart';

void main() {
  testWidgets('PhysioOnClick mobile app loads primary navigation', (WidgetTester tester) async {
    await tester.pumpWidget(const PhysioOnClickMobileApp());

    expect(find.text('PhysioOnClick'), findsWidgets);
    expect(find.text('Home'), findsWidgets);
    expect(find.text('Booking'), findsWidgets);
  });
}
