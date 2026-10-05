import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/src/features/booking/home_visit_repository.dart';

HomeVisitRepository repo(MockClient c) =>
    HomeVisitRepository(httpClient: c, idTokenProvider: () async => null);

void main() {
  test('coverage: POST body only, parses result', () async {
    late http.Request seen;
    final r = repo(MockClient((req) async {
      seen = req;
      return http.Response(
          jsonEncode({'covered': true, 'outwardCode': 'G31', 'postcode': 'G31 4HS'}),
          200);
    }));
    final res = await r.checkCoverage('g314hs');
    expect(res.covered, true);
    expect(res.outwardCode, 'G31');
    expect(seen.method, 'POST');
    expect(seen.url.path, '/api/home-visit/coverage');
    expect(seen.url.query, isEmpty);
    expect(seen.url.toString().toLowerCase(), isNot(contains('g31')));
    expect(jsonDecode(seen.body), {'postcode': 'G31 4HS'});
  });

  test('coverage: 400/429/500/network throw CoverageUnavailable', () async {
    for (final code in [400, 429, 500]) {
      final r = repo(MockClient((_) async => http.Response('{}', code)));
      expect(r.checkCoverage('G31 4HS'), throwsA(isA<CoverageUnavailable>()));
    }
    final r = repo(MockClient((_) async => throw http.ClientException('x')));
    expect(r.checkCoverage('G31 4HS'), throwsA(isA<CoverageUnavailable>()));
  });

  test('lookup: parses suggestions, POST body', () async {
    late http.Request seen;
    final r = repo(MockClient((req) async {
      seen = req;
      return http.Response(
          jsonEncode({'addresses': [{'id': 'a1', 'label': '1 High St'}]}), 200);
    }));
    final out = await r.lookupAddresses('G31 4HS');
    expect(out.single.id, 'a1');
    expect(out.single.label, '1 High St');
    expect(seen.url.path, '/api/address/lookup');
    expect(seen.url.query, isEmpty);
  });

  test('lookup: non-200 throws LookupUnavailable', () async {
    final r = repo(MockClient((_) async => http.Response('{}', 404)));
    expect(r.lookupAddresses('G31 4HS'), throwsA(isA<LookupUnavailable>()));
  });

  test('resolve: returns HomeVisitAddress; non-200 throws', () async {
    final ok = repo(MockClient((req) async {
      expect(req.url.path, '/api/address/resolve');
      expect(jsonDecode(req.body), {'id': 'a1'});
      return http.Response(
          jsonEncode({'addressLine': '1 High St', 'postcode': 'G31 4HS'}), 200);
    }));
    final a = await ok.resolveAddress('a1');
    expect(a.line, '1 High St');
    expect(a.postcode, 'G31 4HS');
    final bad = repo(MockClient((_) async => http.Response('{}', 404)));
    expect(bad.resolveAddress('a1'), throwsA(isA<LookupUnavailable>()));
  });
}
