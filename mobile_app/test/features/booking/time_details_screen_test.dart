import 'package:cloud_firestore/cloud_firestore.dart';
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

  group('resolvePendingDependentSelection', () {
    test('returns the dependent id/name for a fresh dependent selection', () {
      final now = DateTime(2026, 9, 16, 12, 0);
      final result = resolvePendingDependentSelection(
        {
          'patientType': 'dependent',
          'patientId': 'child-1',
          'patientName': 'Junior',
          'selectedAt': Timestamp.fromDate(now.subtract(const Duration(minutes: 5))),
        },
        now: now,
      );
      expect(result, ('child-1', 'Junior'));
    });

    test('returns null when the doc is missing', () {
      expect(resolvePendingDependentSelection(null), isNull);
    });

    test('returns null for a self selection', () {
      final result = resolvePendingDependentSelection({
        'patientType': 'self',
        'patientId': 'uid-1',
        'patientName': 'Pat',
      });
      expect(result, isNull);
    });

    test('returns null when patientId is missing/empty', () {
      expect(
        resolvePendingDependentSelection({'patientType': 'dependent', 'patientId': ''}),
        isNull,
      );
      expect(
        resolvePendingDependentSelection({'patientType': 'dependent'}),
        isNull,
      );
    });

    test('returns null for a stale selection older than the freshness window', () {
      final now = DateTime(2026, 9, 16, 12, 0);
      final result = resolvePendingDependentSelection(
        {
          'patientType': 'dependent',
          'patientId': 'child-1',
          'patientName': 'Junior',
          'selectedAt': Timestamp.fromDate(now.subtract(const Duration(hours: 2))),
        },
        now: now,
      );
      expect(result, isNull);
    });

    test('accepts a dependent selection with no selectedAt timestamp', () {
      final result = resolvePendingDependentSelection({
        'patientType': 'dependent',
        'patientId': 'child-1',
        'patientName': 'Junior',
      });
      expect(result, ('child-1', 'Junior'));
    });
  });

  testWidgets('builds without crashing when a pending dependent selection loader is supplied',
      (tester) async {
    final service = bookServiceFor(BookServiceId.followUp);
    var loaderCalled = false;
    await tester.pumpWidget(MaterialApp(
      home: TimeDetailsScreen(
        service: service,
        pendingSelectionLoader: (uid) async {
          loaderCalled = true;
          return {
            'patientType': 'dependent',
            'patientId': 'child-1',
            'patientName': 'Junior',
            'selectedAt': Timestamp.now(),
          };
        },
      ),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));
    expect(find.byType(TimeDetailsScreen), findsOneWidget);
    // Signed-out in this test environment, so `_loadPendingSelection` returns
    // early before calling the loader (see time_details_screen.dart) — the
    // real signed-in threading behaviour is covered by the pure
    // resolvePendingDependentSelection tests above.
    expect(loaderCalled, isFalse);
  });
}
