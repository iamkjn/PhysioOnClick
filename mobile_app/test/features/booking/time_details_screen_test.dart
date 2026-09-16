import 'package:firebase_core/firebase_core.dart';
// ignore: depend_on_referenced_packages
import 'package:firebase_core_platform_interface/firebase_core_platform_interface.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/booking/models/book_service.dart';
import 'package:mobile_app/src/features/booking/time_details_screen.dart';

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
/// to null (signed out) rather than crashing on a missing native init — see
/// assessment_step_screen_test.dart for the same pattern.
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

  testWidgets('shows the selected service name in the app bar', (tester) async {
    final service = bookServiceFor(BookServiceId.followUp);
    await tester.pumpWidget(MaterialApp(home: TimeDetailsScreen(service: service)));
    await tester.pump();
    expect(find.text('Online Follow-Up'), findsOneWidget);
  });

  testWidgets('shows empty state when slot loading fails (signed out)', (tester) async {
    final service = bookServiceFor(BookServiceId.followUp);
    await tester.pumpWidget(MaterialApp(home: TimeDetailsScreen(service: service)));
    // Let the async fetchSlots call resolve/reject.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));
    // Should not crash, and should stop showing the loading spinner.
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });
}
