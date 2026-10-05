import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
// ignore: depend_on_referenced_packages
import 'package:firebase_core_platform_interface/firebase_core_platform_interface.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/addresses/address_repository.dart';
import 'package:mobile_app/src/features/booking/home_visit_repository.dart';
import 'package:mobile_app/src/features/booking/models/book_service.dart';
import 'package:mobile_app/src/features/booking/models/home_visit.dart';
import 'package:mobile_app/src/features/booking/service_select_screen.dart';

class FakeHomeVisitRepo implements HomeVisitRepository {
  bool covered = true;
  bool coverageFails = false;
  bool lookupFails = false;
  int coverageCalls = 0;
  int lookupCalls = 0;
  Map<String, Completer<void>> gates = {};
  String resolvedPostcode = 'G31 4HS';
  final checked = <String>[];
  @override
  Future<CoverageResult> checkCoverage(String postcode) async {
    coverageCalls++;
    checked.add(normalisePostcode(postcode));
    final g = gates[normalisePostcode(postcode)];
    if (g != null) await g.future;
    if (coverageFails) throw const CoverageUnavailable();
    final pc = normalisePostcode(postcode);
    return CoverageResult(covered: covered, outwardCode: pc.split(' ').first, postcode: pc);
  }

  @override
  Future<List<AddressSuggestion>> lookupAddresses(String postcode) async {
    lookupCalls++;
    if (lookupFails) throw const LookupUnavailable();
    return const [AddressSuggestion(id: 'a1', label: '7 Springfield Gardens, Glasgow')];
  }

  @override
  Future<HomeVisitAddress> resolveAddress(String id) async =>
      HomeVisitAddress(line: '7 Springfield Gardens, Glasgow', postcode: resolvedPostcode);
}

class FakeAddressRepo implements AddressRepository {
  List<SavedAddress> saved = [];
  String? usual;
  final added = <String>[];
  @override
  Future<List<SavedAddress>> getAddresses(String uid) async => saved;
  @override
  Future<String?> getUsualAddressId(String uid, String? personId) async => usual;
  @override
  Future<String> addAddress(String uid,
      {String? label, required String line, required String postcode}) async {
    added.add('$line|$postcode');
    return 'new';
  }

  @override
  dynamic noSuchMethod(Invocation i) => super.noSuchMethod(i);
}

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

Finder addressDropdown() => find.byWidgetPredicate((w) =>
    w.key is ValueKey<String> && (w.key as ValueKey<String>).value.startsWith('addressDropdown'));

void main() {
  setUpAll(() {
    Firebase.delegatePackingProperty = _FakeFirebasePlatform();
  });

  testWidgets('lists all four services with title and price', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: ServiceSelectScreen()));
    await tester.pumpAndSettle();
    expect(find.text('Initial Online Assessment'), findsOneWidget);
    expect(find.text('Online Follow-Up'), findsOneWidget);
    expect(find.textContaining('£40'), findsOneWidget);
  });

  testWidgets('shows a step progress header and a Continue button', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: ServiceSelectScreen()));
    await tester.pumpAndSettle();
    expect(find.text('Step 1 of 3'), findsOneWidget);
    expect(find.text('Continue to times'), findsOneWidget);
  });

  testWidgets('selecting a service does not navigate away — it stays selected', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: ServiceSelectScreen()));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Online Follow-Up'));
    await tester.pump();
    // Still on ServiceSelectScreen — tapping a card selects it, it doesn't
    // push the next screen (that's what the Continue button is for).
    expect(find.byType(ServiceSelectScreen), findsOneWidget);
    expect(find.text('Continue to times'), findsOneWidget);
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

  group('visit-first step', () {
    late FakeHomeVisitRepo hv;
    late FakeAddressRepo ar;
    ServiceSelection? continued;

    Widget app() => MaterialApp(
          home: ServiceSelectScreen(
            homeVisitRepository: hv,
            addressRepository: ar,
            uid: 'u1',
            onContinue: (c) => continued = c,
          ),
        );

    setUp(() {
      hv = FakeHomeVisitRepo();
      ar = FakeAddressRepo();
      continued = null;
    });

    Future<void> big(WidgetTester tester) async {
      tester.view.physicalSize = const Size(1200, 4000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
    }

    Future<void> enterPostcode(WidgetTester tester, String pc) async {
      await tester.enterText(find.byKey(const Key('postcodeField')), pc);
      await tester.pump(const Duration(milliseconds: 450));
      await tester.pumpAndSettle();
    }

    testWidgets('defaults to video with no focus chips', (tester) async {
      await big(tester);
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      expect(find.text('Book your appointment'), findsOneWidget);
      expect(find.text('How would you like to be seen?'), findsOneWidget);
      expect(find.text('Initial Online Assessment'), findsOneWidget);
      expect(find.text('Focus area (optional)'), findsNothing);
      expect(find.byKey(const Key('postcodeField')), findsNothing);
      await tester.tap(find.text('Continue to times'));
      await tester.pump();
      expect(continued!.visitType, VisitType.video);
      expect(continued!.homeAddress, isNull);
    });

    testWidgets('home + covered postcode shows dropdown and £55', (tester) async {
      await big(tester);
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pumpAndSettle();
      await enterPostcode(tester, 'g31 4hs');
      expect(hv.coverageCalls, 1);
      expect(find.text('We visit G31.'), findsOneWidget);
      expect(addressDropdown(), findsOneWidget);
      expect(find.text('Initial Assessment (home visit)'), findsOneWidget);
      expect(find.textContaining('£55'), findsOneWidget);
      expect(find.textContaining('incl. £15 travel'), findsWidgets);
    });

    testWidgets('uncovered shows message and switching to video works', (tester) async {
      await big(tester);
      hv.covered = false;
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pumpAndSettle();
      await enterPostcode(tester, 'EH1 1AA');
      expect(find.textContaining("We don't offer home visits in EH1 yet"), findsOneWidget);
      expect(find.text('Continue to times'), findsNothing);
      await tester.tap(find.text('Book a video consultation instead'));
      await tester.pumpAndSettle();
      expect(find.text('Initial Online Assessment'), findsOneWidget);
      expect(find.text('Continue to times'), findsOneWidget);
    });

    testWidgets('coverage failure shows retry', (tester) async {
      await big(tester);
      hv.coverageFails = true;
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pumpAndSettle();
      await enterPostcode(tester, 'G31 4HS');
      expect(find.text("We couldn't check your postcode. Please try again."), findsOneWidget);
      hv.coverageFails = false;
      await tester.tap(find.text('Retry'));
      await tester.pumpAndSettle();
      expect(find.text('We visit G31.'), findsOneWidget);
    });

    testWidgets('preselects the usual saved address and continues with it', (tester) async {
      await big(tester);
      ar.saved = const [
        SavedAddress(id: 'x', ownerUid: 'u1', label: 'Home', line: '1 Main St', postcode: 'G31 4HS'),
        SavedAddress(id: 'y', ownerUid: 'u1', label: 'Work', line: '2 High St', postcode: 'EH1 1AA'),
      ];
      ar.usual = 'x';
      hv.covered = true;
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pumpAndSettle();
      expect(find.text('Home, G31 4HS'), findsOneWidget);
      expect(find.text('Use a different address'), findsOneWidget);
      await tester.tap(find.text('Continue to times'));
      await tester.pump();
      expect(continued!.visitType, VisitType.home);
      expect(continued!.homeAddress!.line, '1 Main St');
      expect(ar.added, isEmpty);
    });

    testWidgets('manual fallback when lookup fails; Continue passes and saves', (tester) async {
      await big(tester);
      hv.lookupFails = true;
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pumpAndSettle();
      await enterPostcode(tester, 'G31 4HS');
      expect(find.byKey(const Key('manualLineField')), findsOneWidget);
      await tester.enterText(find.byKey(const Key('manualLineField')), '9 Test Road');
      await tester.pump();
      await tester.tap(find.text('Continue to times'));
      await tester.pump();
      expect(continued!.visitType, VisitType.home);
      expect(continued!.homeAddress!.formatted, '9 Test Road, G31 4HS');
      expect(continued!.service.id, BookServiceId.initialAssessment);
      expect(ar.added, ['9 Test Road|G31 4HS']);
    });

    testWidgets('Back then Continue again does not save the new address twice',
        (tester) async {
      await big(tester);
      hv.lookupFails = true;
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pumpAndSettle();
      await enterPostcode(tester, 'G31 4HS');
      await tester.enterText(find.byKey(const Key('manualLineField')), '9 Test Road');
      await tester.pump();
      await tester.tap(find.text('Continue to times'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Continue to times'));
      await tester.pumpAndSettle();
      expect(ar.added, ['9 Test Road|G31 4HS']);
    });

    testWidgets('picking a looked-up address resolves it', (tester) async {
      await big(tester);
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pumpAndSettle();
      await enterPostcode(tester, 'G31 4HS');
      await tester.tap(addressDropdown());
      await tester.pumpAndSettle();
      await tester.tap(find.text('7 Springfield Gardens, Glasgow').last);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Continue to times'));
      await tester.pump();
      expect(continued!.homeAddress!.line, '7 Springfield Gardens, Glasgow');
    });
  
    Finder continueBtn() => find.widgetWithText(FilledButton, 'Continue to times');
    bool enabled(WidgetTester t) => t.widget<FilledButton>(continueBtn()).onPressed != null;

    testWidgets('saved address whose coverage fails shows Retry and no enabled Continue',
        (tester) async {
      await big(tester);
      ar.saved = const [
        SavedAddress(id: 'x', ownerUid: 'u1', label: 'Home', line: '1 Main St', postcode: 'G31 4HS'),
      ];
      ar.usual = 'x';
      hv.coverageFails = true;
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pumpAndSettle();
      expect(find.text("We couldn't check your postcode. Please try again."), findsOneWidget);
      expect(continueBtn(), findsNothing);
      hv.coverageFails = false;
      await tester.tap(find.text('Retry'));
      await tester.pumpAndSettle();
      expect(enabled(tester), isTrue);
    });

    testWidgets('preselected usual address keeps Continue disabled until coverage returns',
        (tester) async {
      await big(tester);
      ar.saved = const [
        SavedAddress(id: 'x', ownerUid: 'u1', label: 'Home', line: '1 Main St', postcode: 'G31 4HS'),
        SavedAddress(id: 'y', ownerUid: 'u1', label: 'Work', line: '2 High St', postcode: 'G1 1AA'),
      ];
      ar.usual = 'x';
      final gate = Completer<void>();
      hv.gates['G31 4HS'] = gate;
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pump();
      await tester.pump();
      expect(enabled(tester), isFalse);
      expect(hv.checked, ['G31 4HS']); // only the chosen address is checked
      gate.complete();
      await tester.pumpAndSettle();
      expect(enabled(tester), isTrue);
    });

    testWidgets('changing postcode clears the old address line', (tester) async {
      await big(tester);
      hv.lookupFails = true;
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pumpAndSettle();
      await enterPostcode(tester, 'G31 4HS');
      await tester.enterText(find.byKey(const Key('manualLineField')), '9 Test Road');
      await tester.pump();
      expect(enabled(tester), isTrue);
      hv.lookupFails = false;
      await enterPostcode(tester, 'G1 1AA');
      expect(enabled(tester), isFalse);
    });

    testWidgets('resolved postcode that differs re-runs coverage', (tester) async {
      await big(tester);
      hv.resolvedPostcode = 'G40 1AB';
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pumpAndSettle();
      await enterPostcode(tester, 'G31 4HS');
      final gate = Completer<void>();
      hv.gates['G40 1AB'] = gate;
      await tester.tap(addressDropdown());
      await tester.pumpAndSettle();
      await tester.tap(find.text('7 Springfield Gardens, Glasgow').last);
      await tester.pump();
      await tester.pump();
      expect(hv.checked.last, 'G40 1AB');
      expect(enabled(tester), isFalse);
      gate.complete();
      await tester.pumpAndSettle();
      expect(enabled(tester), isTrue);
      await tester.tap(continueBtn());
      await tester.pump();
      expect(continued!.homeAddress!.postcode, 'G40 1AB');
    });

    testWidgets('stale out-of-order coverage response is ignored', (tester) async {
      await big(tester);
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pumpAndSettle();
      final slow = Completer<void>();
      hv.gates['G31 4HS'] = slow;
      await tester.enterText(find.byKey(const Key('postcodeField')), 'G31 4HS');
      await tester.pump(const Duration(milliseconds: 450));
      await enterPostcode(tester, 'G1 1AA');
      expect(find.text('We visit G1.'), findsOneWidget);
      slow.complete();
      await tester.pumpAndSettle();
      expect(find.text('We visit G1.'), findsOneWidget);
      expect(find.text('We visit G31.'), findsNothing);
    });
  
    testWidgets('Retry after a failed post-resolve re-check keeps the picked address',
        (tester) async {
      await big(tester);
      hv.resolvedPostcode = 'G40 1AB';
      await tester.pumpWidget(app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Home visit in Glasgow'));
      await tester.pumpAndSettle();
      await enterPostcode(tester, 'G31 4HS');
      expect(hv.lookupCalls, 1);
      await tester.tap(addressDropdown());
      await tester.pumpAndSettle();
      hv.coverageFails = true;
      await tester.tap(find.text('7 Springfield Gardens, Glasgow').last);
      await tester.pumpAndSettle();
      expect(find.text("We couldn't check your postcode. Please try again."), findsOneWidget);
      hv.coverageFails = false;
      await tester.tap(find.text('Retry'));
      await tester.pumpAndSettle();
      expect(hv.lookupCalls, 1); // no fresh lookup that would drop the pick
      expect(enabled(tester), isTrue);
      await tester.tap(continueBtn());
      await tester.pump();
      expect(continued!.homeAddress!.postcode, 'G40 1AB');
    });
  });
}
