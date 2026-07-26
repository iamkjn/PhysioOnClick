import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/app.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('PhysioOnClick mobile app loads first-run onboarding', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const PhysioOnClickMobileApp());
    await tester.pumpAndSettle();

    expect(find.text('Expert physio,\none tap away'), findsOneWidget);
    expect(find.text('Next'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);
  });

  testWidgets('PhysioOnClick mobile app shows welcome after onboarding', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({'onboarding_done': true});

    await tester.pumpWidget(const PhysioOnClickMobileApp());
    await tester.pumpAndSettle();

    expect(find.text('PhysioOnClick'), findsOneWidget);
    expect(find.text('Create account'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
  });
}
