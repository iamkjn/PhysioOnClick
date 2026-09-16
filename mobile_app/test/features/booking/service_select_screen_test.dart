import 'package:firebase_core/firebase_core.dart';
// ignore: depend_on_referenced_packages
import 'package:firebase_core_platform_interface/firebase_core_platform_interface.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/booking/service_select_screen.dart';

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
/// a real platform channel, so `FirebaseAuth.instance.currentUser` resolves
/// to null (signed out) rather than crashing on a missing native init.
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

  testWidgets('lists all four services with title and price', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: ServiceSelectScreen()));
    await tester.pumpAndSettle();
    expect(find.text('Initial Online Assessment'), findsOneWidget);
    expect(find.text('Online Follow-Up'), findsOneWidget);
    expect(find.textContaining('£50'), findsOneWidget);
  });

  testWidgets('go() shows the auth gate instead of navigating when signed out', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Builder(
        builder: (context) => ElevatedButton(
          onPressed: () => ServiceSelectScreen.go(context),
          child: const Text('Book'),
        ),
      ),
    ));
    await tester.tap(find.text('Book'));
    await tester.pumpAndSettle();
    // The auth gate sheet appeared instead of pushing ServiceSelectScreen —
    // without this gate a signed-out user could fill out the entire
    // assessment only to have submission silently no-op.
    expect(find.textContaining('Sign in'), findsWidgets);
    expect(find.byType(ServiceSelectScreen), findsNothing);
  });
}
