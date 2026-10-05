import 'package:mobile_app/src/features/addresses/address_repository.dart';
import 'package:mobile_app/src/features/booking/home_visit_repository.dart';
import 'package:mobile_app/src/features/booking/models/home_visit.dart';

class FakeAddressRepository implements AddressRepository {
  FakeAddressRepository([List<SavedAddress>? initial]) : items = [...?initial];
  final List<SavedAddress> items;
  final Map<String?, String?> usual = {};
  final List<String> deleted = [];
  int _n = 0;
  bool failGet = false;
  bool failSetUsual = false;

  @override
  Future<List<SavedAddress>> getAddresses(String uid) async {
    if (failGet) throw Exception('offline');
    return [...items];
  }

  @override
  Future<String> addAddress(String uid,
      {String? label, required String line, required String postcode}) async {
    final c = cleanAddressInput(label: label, line: line, postcode: postcode);
    final id = 'new${_n++}';
    items.add(SavedAddress(
        id: id, ownerUid: uid, label: c['label'], line: c['line'], postcode: c['postcode']));
    return id;
  }

  @override
  Future<void> updateAddress(String id,
      {String? label, required String line, required String postcode}) async {
    final c = cleanAddressInput(label: label, line: line, postcode: postcode);
    final i = items.indexWhere((a) => a.id == id);
    items[i] = SavedAddress(
        id: id, ownerUid: items[i].ownerUid, label: c['label'], line: c['line'], postcode: c['postcode']);
  }

  @override
  Future<void> deleteAddress(String uid, String id) async {
    deleted.add(id);
    items.removeWhere((a) => a.id == id);
  }

  @override
  Future<void> setUsualAddress(String uid, String? personId, String? addressId) async {
    if (failSetUsual) throw Exception('offline');
    usual[personId] = addressId;
  }

  @override
  Future<String?> getUsualAddressId(String uid, String? personId) async => usual[personId];
}

class FakeHomeVisitRepository implements HomeVisitRepository {
  FakeHomeVisitRepository({this.covered = const {}, this.failCoverage = false});
  final Set<String> covered; // postcodes that are covered
  final bool failCoverage;

  @override
  Future<CoverageResult> checkCoverage(String postcode) async {
    if (failCoverage) throw const CoverageUnavailable();
    final pc = normalisePostcode(postcode);
    return CoverageResult(
        covered: covered.contains(pc), outwardCode: pc.split(' ').first, postcode: pc);
  }

  @override
  Future<List<AddressSuggestion>> lookupAddresses(String postcode) async =>
      const [AddressSuggestion(id: 'a1', label: '1 Test Street, Glasgow')];

  @override
  Future<HomeVisitAddress> resolveAddress(String id) async =>
      const HomeVisitAddress(line: '1 Test Street, Glasgow', postcode: 'G31 4HS');
}
