import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/addresses/address_repository.dart';
import 'package:mobile_app/src/features/people/usual_address_picker.dart';

import '../addresses/fakes.dart';

const _home = SavedAddress(
    id: 'h', ownerUid: 'u1', label: 'Home', line: '7 Springfield Gardens', postcode: 'G31 4HS');
const _mum = SavedAddress(
    id: 'm', ownerUid: 'u1', label: 'Mum', line: '2 Other Rd', postcode: 'G12 8QQ');

Widget _wrap(Widget w) => MaterialApp(home: Scaffold(body: w));

void main() {
  testWidgets('no addresses shows Add an address link', (t) async {
    var opened = false;
    await t.pumpWidget(_wrap(UsualAddressPicker(
        uid: 'u1',
        personId: null,
        addressRepository: FakeAddressRepository(),
        onAddAddress: () async => opened = true)));
    await t.pumpAndSettle();
    expect(find.text('Usual address for home visits'), findsOneWidget);
    await t.tap(find.text('Add an address'));
    expect(opened, isTrue);
  });

  testWidgets('shows current usual address and sets a new one for a dependent', (t) async {
    final repo = FakeAddressRepository([_home, _mum]);
    repo.usual['dep1'] = 'h';
    await t.pumpWidget(_wrap(UsualAddressPicker(
        uid: 'u1', personId: 'dep1', addressRepository: repo, onAddAddress: () async {})));
    await t.pumpAndSettle();
    expect(find.text('Home, G31 4HS'), findsOneWidget);
    await t.tap(find.byKey(const Key('usual-address-dep1')));
    await t.pumpAndSettle();
    await t.tap(find.text('Mum, G12 8QQ').last);
    await t.pumpAndSettle();
    expect(repo.usual['dep1'], 'm');
  });

  testWidgets('account holder can clear usual address', (t) async {
    final repo = FakeAddressRepository([_home]);
    repo.usual[null] = 'h';
    await t.pumpWidget(_wrap(UsualAddressPicker(
        uid: 'u1', personId: null, addressRepository: repo, onAddAddress: () async {})));
    await t.pumpAndSettle();
    await t.tap(find.byKey(const Key('usual-address-me')));
    await t.pumpAndSettle();
    await t.tap(find.text('No usual address').last);
    await t.pumpAndSettle();
    expect(repo.usual.containsKey(null), isTrue);
    expect(repo.usual[null], isNull);
  });
}
