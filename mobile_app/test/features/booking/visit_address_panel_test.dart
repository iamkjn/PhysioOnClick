import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/addresses/address_repository.dart';
import 'package:mobile_app/src/features/booking/models/home_visit.dart';
import 'package:mobile_app/src/features/booking/visit_address_panel.dart';

import '../addresses/fakes.dart';

const _mine = SavedAddress(
    id: 'm', ownerUid: 'u1', label: 'Home', line: '1 Main St', postcode: 'G31 4HS');
const _mums = SavedAddress(
    id: 'k', ownerUid: 'u1', label: "Mum's", line: '9 Gallowgate', postcode: 'G40 2AA');
const _chosen = HomeVisitAddress(line: '1 Main St', postcode: 'G31 4HS');

class _Host extends StatefulWidget {
  const _Host({required this.ar, required this.hv, required this.onChange});
  final FakeAddressRepository ar;
  final FakeHomeVisitRepository hv;
  final VoidCallback onChange;
  @override
  State<_Host> createState() => _HostState();
}

class _HostState extends State<_Host> {
  HomeVisitAddress address = _chosen;
  String? personId;
  String? personName;
  @override
  Widget build(BuildContext context) => Scaffold(
        body: Column(children: [
          VisitAddressPanel(
            address: address,
            step1PersonId: null,
            selectedPersonId: personId,
            selectedPersonName: personName,
            uid: 'u1',
            addressRepository: widget.ar,
            homeVisitRepository: widget.hv,
            onChange: widget.onChange,
            onAddressChanged: (a) => setState(() => address = a),
          ),
          Text('current: ${address.formatted}'),
          TextButton(
              onPressed: () => setState(() {
                    personId = 'dep1';
                    personName = 'Kate';
                  }),
              child: const Text('pick Kate')),
          TextButton(
              onPressed: () => setState(() {
                    personId = null;
                    personName = null;
                  }),
              child: const Text('pick me')),
        ]),
      );
}

void main() {
  late FakeAddressRepository ar;
  late int changes;
  setUp(() {
    ar = FakeAddressRepository([_mine, _mums]);
    ar.usual[null] = 'm';
    ar.usual['dep1'] = 'k';
    changes = 0;
  });

  Future<void> pump(WidgetTester t, FakeHomeVisitRepository hv) async {
    await t.pumpWidget(MaterialApp(home: _Host(ar: ar, hv: hv, onChange: () => changes++)));
    await t.pumpAndSettle();
  }

  testWidgets('shows the chosen address with a Change action', (t) async {
    await pump(t, FakeHomeVisitRepository(covered: {'G31 4HS', 'G40 2AA'}));
    expect(find.text('Home visit at 1 Main St, G31 4HS'), findsOneWidget);
    await t.tap(find.text('Change'));
    expect(changes, 1);
    expect(find.textContaining('usual address is'), findsNothing);
  });

  testWidgets('different person with a different usual address gets a note, never auto-switched',
      (t) async {
    final hv = FakeHomeVisitRepository(covered: {'G31 4HS', 'G40 2AA'});
    await pump(t, hv);
    await t.tap(find.text('pick Kate'));
    await t.pumpAndSettle();
    expect(find.text("Kate's usual address is Mum's, G40 2AA."), findsOneWidget);
    expect(find.text('current: 1 Main St, G31 4HS'), findsOneWidget);
    await t.tap(find.text('Use this address'));
    await t.pumpAndSettle();
    expect(hv.checked, contains('G40 2AA'));
    expect(find.text('current: 9 Gallowgate, G40 2AA'), findsOneWidget);
    expect(find.text('Home visit at 9 Gallowgate, G40 2AA'), findsOneWidget);
    expect(find.textContaining('usual address is'), findsNothing);
  });

  testWidgets('coverage failure keeps the current address and shows the couldnt-check copy',
      (t) async {
    await pump(t, FakeHomeVisitRepository(failCoverage: true));
    await t.tap(find.text('pick Kate'));
    await t.pumpAndSettle();
    await t.tap(find.text('Use this address'));
    await t.pumpAndSettle();
    expect(find.text("We couldn't check your postcode. Please try again."), findsOneWidget);
    expect(find.text('current: 1 Main St, G31 4HS'), findsOneWidget);
  });

  testWidgets('uncovered usual address is not switched to', (t) async {
    await pump(t, FakeHomeVisitRepository(covered: {'G31 4HS'}));
    await t.tap(find.text('pick Kate'));
    await t.pumpAndSettle();
    await t.tap(find.text('Use this address'));
    await t.pumpAndSettle();
    expect(find.text('Outside our home-visit area'), findsOneWidget);
    expect(find.text('current: 1 Main St, G31 4HS'), findsOneWidget);
  });

  testWidgets('no note when the person has no usual address or the same one', (t) async {
    ar.usual['dep1'] = 'm';
    await pump(t, FakeHomeVisitRepository(covered: {'G31 4HS'}));
    await t.tap(find.text('pick Kate'));
    await t.pumpAndSettle();
    expect(find.textContaining('usual address is'), findsNothing);
    ar.usual['dep1'] = null;
    await t.tap(find.text('pick me'));
    await t.pumpAndSettle();
    await t.tap(find.text('pick Kate'));
    await t.pumpAndSettle();
    expect(find.textContaining('usual address is'), findsNothing);
  });
}
