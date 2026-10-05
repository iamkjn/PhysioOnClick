import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/addresses/address_repository.dart';

void main() {
  test('display uses label, falls back to line', () {
    const a = SavedAddress(
        id: '1', ownerUid: 'u', label: 'Home', line: '1 High St', postcode: 'G31 4HS');
    expect(a.display, 'Home, G31 4HS');
    const b = SavedAddress(
        id: '2', ownerUid: 'u', label: '', line: '1 High St', postcode: 'G31 4HS');
    expect(b.display, '1 High St, G31 4HS');
  });

  test('fromMap tolerates missing label', () {
    final a = SavedAddress.fromMap('x', {'ownerUid': 'u', 'line': 'L', 'postcode': 'G1 1AA'});
    expect(a.label, '');
    expect(a.id, 'x');
  });

  test('clean normalises and trims', () {
    final c = cleanAddressInput(
        label: '  ${'x' * 50} ', line: '  1   High  St ', postcode: 'g314hs');
    expect(c['line'], '1 High St');
    expect(c['postcode'], 'G31 4HS');
    expect((c['label'] as String).length, 40);
  });

  test('clean rejects bad input', () {
    expect(() => cleanAddressInput(line: '', postcode: 'G31 4HS'),
        throwsA(isA<AddressValidationException>()));
    expect(() => cleanAddressInput(line: 'x' * 121, postcode: 'G31 4HS'),
        throwsA(isA<AddressValidationException>()));
    expect(() => cleanAddressInput(line: 'a', postcode: 'nope'),
        throwsA(isA<AddressValidationException>()));
    expect(() => cleanAddressInput(line: 'a', postcode: 'G31 4HS' * 3),
        throwsA(isA<AddressValidationException>()));
  });

  test('ownedBy checks ownership', () {
    expect(isOwnedBy({'ownerUid': 'u'}, 'u'), true);
    expect(isOwnedBy({'ownerUid': 'v'}, 'u'), false);
    expect(isOwnedBy(null, 'u'), false);
  });
}
