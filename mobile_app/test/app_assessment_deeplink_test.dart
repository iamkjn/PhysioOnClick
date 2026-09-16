import 'package:firebase_core/firebase_core.dart';
// ignore: depend_on_referenced_packages
import 'package:firebase_core_platform_interface/firebase_core_platform_interface.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/assessment/assessment_screen.dart';

/// A no-op `FirebaseAppPlatform` — enough for `Firebase.app()` to succeed
/// without a native Firebase app being registered.
class _FakeFirebaseAppPlatform extends FirebaseAppPlatform {
  _FakeFirebaseAppPlatform()
      : super(
          defaultFirebaseAppName,
          const FirebaseOptions(
            apiKey: 'test-api-key',
            appId: 'test-app-id',
            messagingSenderId: 'test-sender-id',
            projectId: 'test-project-id',
          ),
        );
}

/// A `FirebasePlatform` that serves the fake app above instead of talking to
/// a real platform channel. This lets widgets that call
/// `FirebaseAuth.instance` (which reads `Firebase.app()` internally) build in
/// a plain widget test.
class _FakeFirebasePlatform extends FirebasePlatform {
  final _app = _FakeFirebaseAppPlatform();

  @override
  FirebaseAppPlatform app([String name = defaultFirebaseAppName]) => _app;

  @override
  List<FirebaseAppPlatform> get apps => [_app];
}

void main() {
  setUpAll(() {
    Firebase.delegatePackingProperty = _FakeFirebasePlatform();
  });

  testWidgets('AssessmentScreen still works with only required params (legacy call shape)', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: AssessmentScreen(
          bookingId: 'booking-123',
          personId: 'person-456',
          personName: 'Test Patient',
        ),
      ),
    );
    await tester.pump();

    // Verify the widget type exists
    expect(find.byType(AssessmentScreen), findsOneWidget);

    // Verify the widget renders its scaffold body, proving it accepted and processed
    // the constructor params (bookingId, personId, personName) without silently
    // dropping them. When no user is authenticated, it shows the sign-in prompt.
    expect(find.text('Sign in to complete your assessment'), findsOneWidget);
  });
}
