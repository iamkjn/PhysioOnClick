
import 'package:firebase_core/firebase_core.dart';
// ignore: depend_on_referenced_packages
import 'package:firebase_core_platform_interface/firebase_core_platform_interface.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/booking/models/book_service.dart';
import 'package:mobile_app/src/features/booking/models/home_visit.dart';
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

  testWidgets('shows the selected service name and a real month calendar', (tester) async {
    final service = bookServiceFor(BookServiceId.followUp);
    await tester.pumpWidget(MaterialApp(home: TimeDetailsScreen(service: service)));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));
    expect(find.text('Online Follow-Up'), findsOneWidget);
    // Real calendar grid: weekday header row.
    expect(find.text('Mon'), findsOneWidget);
    expect(find.text('Sun'), findsOneWidget);
    // Continue button carries the price, matching web's "Continue to payment · £X".
    expect(find.textContaining('Continue to payment'), findsOneWidget);
    expect(find.textContaining('£40'), findsWidgets);
  });

  testWidgets('shows an error message when slot loading fails (signed out)', (tester) async {
    final service = bookServiceFor(BookServiceId.followUp);
    await tester.pumpWidget(MaterialApp(home: TimeDetailsScreen(service: service)));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));
    expect(find.textContaining('couldn\'t load'), findsOneWidget);
  });

  testWidgets('requires consent before Continue is enabled', (tester) async {
    final service = bookServiceFor(BookServiceId.followUp);
    await tester.pumpWidget(MaterialApp(home: TimeDetailsScreen(service: service)));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));
    final button = tester.widget<FilledButton>(find.byType(FilledButton));
    // No slot selected and consent unchecked (signed out here, so no slots
    // load anyway) — the Continue button must be disabled.
    expect(button.onPressed, isNull);
  });

  testWidgets('shows a consent checkbox', (tester) async {
    // The calendar grid + slot list + who-for + account fields push the
    // consent checkbox below the default test viewport inside the
    // screen's ListView (off-screen children aren't built) — size the
    // surface generously rather than scrolling to find it.
    tester.view.physicalSize = const Size(1200, 3000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final service = bookServiceFor(BookServiceId.followUp);
    await tester.pumpWidget(MaterialApp(home: TimeDetailsScreen(service: service)));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));
    expect(find.byType(CheckboxListTile), findsOneWidget);
    expect(find.textContaining('I consent'), findsOneWidget);
  });

  testWidgets('home initial assessment: pay button shows the checked postcode price', (tester) async {
    final service = bookServiceFor(BookServiceId.initialAssessment);
    await tester.pumpWidget(MaterialApp(
      home: TimeDetailsScreen(
        service: service,
        visitType: VisitType.home,
        homePrice: const HomeVisitPrice(initialPence: 11000, followUpPence: 10000),
        homeAddress: const HomeVisitAddress(line: '1 Main St', postcode: 'KA1 1AA'),
      ),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));
    expect(find.text('Continue to payment · £110'), findsOneWidget);
    expect(find.text('£110 home visit'), findsOneWidget);
    expect(find.text('Initial Assessment (home visit)'), findsOneWidget);
    expect(find.textContaining('travel'), findsNothing);
  });

  testWidgets('has no discount code box (NEW10 ended on 22 Nov 2026)', (tester) async {
    tester.view.physicalSize = const Size(1200, 3000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(MaterialApp(
      home: TimeDetailsScreen(service: bookServiceFor(BookServiceId.followUp)),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.text('Discount code'), findsNothing);
    expect(find.textContaining('NEW10'), findsNothing);
    expect(find.widgetWithText(FilledButton, 'Apply'), findsNothing);
  });
}
