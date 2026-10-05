import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/people/people_screen.dart';

void main() {
  testWidgets('no dependents still shows the account holder card with its picker',
      (t) async {
    var added = 0;
    await t.pumpWidget(MaterialApp(
      home: Scaffold(
        body: PeopleCardList(
          accountName: 'Krunal',
          accountSubtitle: 'Your account · k@example.com',
          people: const [],
          pickerFor: (id) => Text('picker-${id ?? 'me'}'),
          onAddPerson: () => added++,
          onEdit: (_) {},
          onDelete: (_) {},
        ),
      ),
    ));
    expect(find.text('Krunal'), findsOneWidget);
    expect(find.text('You'), findsOneWidget);
    expect(find.text('picker-me'), findsOneWidget);
    expect(find.text('Just you for now'), findsOneWidget);
    await t.tap(find.text('Add a Person'));
    expect(added, 1);
  });
}
