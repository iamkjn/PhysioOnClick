import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/addresses/address_repository.dart';
import 'package:mobile_app/src/features/addresses/addresses_screen.dart';

import 'fakes.dart';

const _home = SavedAddress(
    id: 'h', ownerUid: 'u1', label: 'Home', line: '7 Springfield Gardens', postcode: 'G31 4HS');
const _away = SavedAddress(
    id: 'w', ownerUid: 'u1', label: 'Work', line: '1 Princes St', postcode: 'EH1 2AB');

Widget _app(FakeAddressRepository a, FakeHomeVisitRepository h) => MaterialApp(
    home: AddressesScreen(uid: 'u1', addressRepository: a, homeVisitRepository: h));

void main() {
  testWidgets('empty state', (t) async {
    await t.pumpWidget(_app(FakeAddressRepository(), FakeHomeVisitRepository()));
    await t.pumpAndSettle();
    expect(find.text('No saved addresses yet. Add one to book home visits faster.'),
        findsOneWidget);
  });

  testWidgets('lists addresses and badges only uncovered ones', (t) async {
    await t.pumpWidget(_app(FakeAddressRepository([_home, _away]),
        FakeHomeVisitRepository(covered: {'G31 4HS'})));
    await t.pumpAndSettle();
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Work'), findsOneWidget);
    expect(find.text('Outside our home-visit area'), findsOneWidget);
  });

  testWidgets('checks coverage once per outward code', (t) async {
    const home2 = SavedAddress(
        id: 'h2', ownerUid: 'u1', label: 'Mum', line: '9 Gallowgate', postcode: 'G31 2AA');
    final hv = FakeHomeVisitRepository(covered: {'G31 4HS'});
    await t.pumpWidget(_app(FakeAddressRepository([_home, home2, _away]), hv));
    await t.pumpAndSettle();
    expect(hv.checked.length, 2);
    expect(find.text('Outside our home-visit area'), findsOneWidget);
  });

  testWidgets('coverage failure shows no badge', (t) async {
    await t.pumpWidget(
        _app(FakeAddressRepository([_away]), FakeHomeVisitRepository(failCoverage: true)));
    await t.pumpAndSettle();
    expect(find.text('Outside our home-visit area'), findsNothing);
  });

  testWidgets('delete asks for confirmation', (t) async {
    final repo = FakeAddressRepository([_home]);
    await t.pumpWidget(_app(repo, FakeHomeVisitRepository(covered: {'G31 4HS'})));
    await t.pumpAndSettle();
    await t.tap(find.byTooltip('Delete address'));
    await t.pumpAndSettle();
    expect(find.text('Delete this address?'), findsOneWidget);
    await t.tap(find.text('Cancel'));
    await t.pumpAndSettle();
    expect(repo.deleted, isEmpty);
    await t.tap(find.byTooltip('Delete address'));
    await t.pumpAndSettle();
    await t.tap(find.text('Delete'));
    await t.pumpAndSettle();
    expect(repo.deleted, ['h']);
    expect(find.text('No saved addresses yet. Add one to book home visits faster.'),
        findsOneWidget);
  });

  testWidgets('add via postcode lookup dropdown', (t) async {
    final repo = FakeAddressRepository();
    await t.pumpWidget(_app(repo, FakeHomeVisitRepository(covered: {'G31 4HS'})));
    await t.pumpAndSettle();
    await t.tap(find.text('Add an address'));
    await t.pumpAndSettle();
    await t.enterText(find.byKey(const Key('address-postcode')), 'g314hs');
    await t.tap(find.text('Find address'));
    await t.pumpAndSettle();
    await t.tap(find.byKey(const Key('address-dropdown')));
    await t.pumpAndSettle();
    await t.tap(find.text('1 Test Street, Glasgow').last);
    await t.pumpAndSettle();
    await t.enterText(find.byKey(const Key('address-label')), 'Mum');
    await t.tap(find.text('Save address'));
    await t.pumpAndSettle();
    expect(repo.items.single.line, '1 Test Street, Glasgow');
    expect(repo.items.single.postcode, 'G31 4HS');
    expect(repo.items.single.label, 'Mum');
    expect(find.text('Mum'), findsOneWidget);
  });

  testWidgets('outside area: manual entry, saved with badge', (t) async {
    final repo = FakeAddressRepository();
    await t.pumpWidget(_app(repo, FakeHomeVisitRepository()));
    await t.pumpAndSettle();
    await t.tap(find.text('Add an address'));
    await t.pumpAndSettle();
    await t.enterText(find.byKey(const Key('address-postcode')), 'EH1 2AB');
    await t.tap(find.text('Find address'));
    await t.pumpAndSettle();
    expect(find.text('Outside our home-visit area'), findsOneWidget);
    await t.enterText(find.byKey(const Key('address-line')), '1 Princes St, Edinburgh');
    await t.tap(find.text('Save address'));
    await t.pumpAndSettle();
    expect(repo.items.single.postcode, 'EH1 2AB');
    expect(find.text('Outside our home-visit area'), findsOneWidget);
  });

  testWidgets('validation error shown, nothing saved', (t) async {
    final repo = FakeAddressRepository();
    await t.pumpWidget(_app(repo, FakeHomeVisitRepository(failCoverage: true)));
    await t.pumpAndSettle();
    await t.tap(find.text('Add an address'));
    await t.pumpAndSettle();
    await t.enterText(find.byKey(const Key('address-postcode')), 'nope');
    await t.enterText(find.byKey(const Key('address-line')), '1 Street');
    await t.tap(find.text('Save address'));
    await t.pumpAndSettle();
    expect(find.text("That postcode doesn't look right."), findsOneWidget);
    expect(repo.items, isEmpty);
  });

  testWidgets('edit updates address', (t) async {
    final repo = FakeAddressRepository([_home]);
    await t.pumpWidget(_app(repo, FakeHomeVisitRepository(covered: {'G31 4HS'})));
    await t.pumpAndSettle();
    await t.tap(find.byTooltip('Edit address'));
    await t.pumpAndSettle();
    await t.enterText(find.byKey(const Key('address-label')), 'Flat');
    await t.tap(find.text('Save address'));
    await t.pumpAndSettle();
    expect(repo.items.single.label, 'Flat');
    expect(repo.items.single.line, '7 Springfield Gardens');
  });

  testWidgets('load failure offers a Retry button that reloads', (t) async {
    final repo = FakeAddressRepository([_home])..failGet = true;
    await t.pumpWidget(_app(repo, FakeHomeVisitRepository(covered: {'G31 4HS'})));
    await t.pumpAndSettle();
    expect(find.textContaining('Pull to try again'), findsNothing);
    repo.failGet = false;
    await t.tap(find.widgetWithText(FilledButton, 'Retry'));
    await t.pumpAndSettle();
    expect(find.text('Home'), findsOneWidget);
  });

  testWidgets('deleting an address announces an address-book change', (t) async {
    final repo = FakeAddressRepository([_home]);
    final before = addressBookRevision.value;
    await t.pumpWidget(_app(repo, FakeHomeVisitRepository(covered: {'G31 4HS'})));
    await t.pumpAndSettle();
    await t.tap(find.byTooltip('Delete address'));
    await t.pumpAndSettle();
    await t.tap(find.text('Delete'));
    await t.pumpAndSettle();
    expect(addressBookRevision.value, greaterThan(before));
  });

  testWidgets('editing the postcode clears stale outside-area badge and suggestions', (t) async {
    await t.pumpWidget(MaterialApp(
        home: Scaffold(
            body: AddressForm(
                uid: 'u1',
                addressRepository: FakeAddressRepository(),
                homeVisitRepository: FakeHomeVisitRepository(covered: {'G31 4HS'})))));
    await t.enterText(find.byKey(const Key('address-postcode')), 'EH1 2AB');
    await t.tap(find.text('Find address'));
    await t.pumpAndSettle();
    expect(find.text('Outside our home-visit area'), findsOneWidget);
    await t.enterText(find.byKey(const Key('address-postcode')), 'G31 4HS');
    await t.pump();
    expect(find.text('Outside our home-visit area'), findsNothing);
    await t.tap(find.text('Find address'));
    await t.pumpAndSettle();
    expect(find.byKey(const Key('address-dropdown')), findsOneWidget);
    await t.enterText(find.byKey(const Key('address-postcode')), 'G1 1AA');
    await t.pump();
    expect(find.byKey(const Key('address-dropdown')), findsNothing);
  });
}
