import 'package:firebase_core/firebase_core.dart';
// ignore: depend_on_referenced_packages
import 'package:firebase_core_platform_interface/firebase_core_platform_interface.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/booking/assessment_step_screen.dart';
import 'package:mobile_app/src/features/booking/models/book_service.dart';

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
/// a plain widget test — `FirebaseAuthPlatform`'s default plugin constants
/// are empty for an app it never saw a native init for, so
/// `FirebaseAuth.instance.currentUser` resolves to null (signed out), which
/// is exactly the state this smoke test wants.
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

  testWidgets('renders without crashing for a signed-out-style call', (tester) async {
    final service = bookServiceFor(BookServiceId.initialAssessment);
    await tester.pumpWidget(MaterialApp(
      home: AssessmentStepScreen(
        service: service,
        start: DateTime.utc(2026, 9, 20, 9),
        name: 'Pat Patient',
        email: 'pat@example.com',
        personId: null,
        personName: 'Pat Patient',
      ),
    ));
    await tester.pump();
    expect(find.byType(AssessmentStepScreen), findsOneWidget);
  });
}
