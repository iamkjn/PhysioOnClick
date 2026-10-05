import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import '../../core/api_client.dart';
import 'models/home_visit.dart';

class CoverageResult {
  final bool covered;
  final String outwardCode;
  final String postcode;
  const CoverageResult(
      {required this.covered, required this.outwardCode, required this.postcode});
}

class AddressSuggestion {
  final String id;
  final String label;
  const AddressSuggestion({required this.id, required this.label});
}

/// Coverage endpoint failed (bad postcode, rate limit, network...).
class CoverageUnavailable implements Exception {
  const CoverageUnavailable();
  @override
  String toString() => 'CoverageUnavailable';
}

/// Address lookup/resolve failed or found nothing (any non-200).
class LookupUnavailable implements Exception {
  const LookupUnavailable();
  @override
  String toString() => 'LookupUnavailable';
}

typedef HomeVisitTokenProvider = Future<String?> Function();

/// Postcodes and addresses are personal data: POST bodies only, never logged.
class HomeVisitRepository {
  HomeVisitRepository({http.Client? httpClient, HomeVisitTokenProvider? idTokenProvider})
      : _client = httpClient ?? http.Client(),
        _idTokenProvider = idTokenProvider ?? _defaultToken;

  final http.Client _client;
  final HomeVisitTokenProvider _idTokenProvider;

  static Future<String?> _defaultToken() async =>
      FirebaseAuth.instance.currentUser?.getIdToken();

  Future<Map<String, String>> _headers() async {
    final token = await _idTokenProvider();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<http.Response> _post(String path, Map<String, dynamic> body) async =>
      _client
          .post(Uri.parse('$kApiBase$path'),
              headers: await _headers(), body: jsonEncode(body))
          .timeout(const Duration(seconds: 10));

  Future<CoverageResult> checkCoverage(String postcode) async {
    try {
      final res = await _post(
          '/api/home-visit/coverage', {'postcode': normalisePostcode(postcode)});
      if (res.statusCode != 200) throw const CoverageUnavailable();
      final j = jsonDecode(res.body) as Map<String, dynamic>;
      return CoverageResult(
        covered: j['covered'] == true,
        outwardCode: (j['outwardCode'] ?? '') as String,
        postcode: (j['postcode'] ?? '') as String,
      );
    } on CoverageUnavailable {
      rethrow;
    } catch (_) {
      throw const CoverageUnavailable();
    }
  }

  Future<List<AddressSuggestion>> lookupAddresses(String postcode) async {
    try {
      final res =
          await _post('/api/address/lookup', {'postcode': normalisePostcode(postcode)});
      if (res.statusCode != 200) throw const LookupUnavailable();
      final j = jsonDecode(res.body) as Map<String, dynamic>;
      return (j['addresses'] as List? ?? [])
          .map((e) => AddressSuggestion(
              id: (e as Map)['id'] as String, label: e['label'] as String))
          .toList();
    } on LookupUnavailable {
      rethrow;
    } catch (_) {
      throw const LookupUnavailable();
    }
  }

  Future<HomeVisitAddress> resolveAddress(String id) async {
    try {
      final res = await _post('/api/address/resolve', {'id': id});
      if (res.statusCode != 200) throw const LookupUnavailable();
      final j = jsonDecode(res.body) as Map<String, dynamic>;
      return HomeVisitAddress(
          line: j['addressLine'] as String, postcode: j['postcode'] as String);
    } on LookupUnavailable {
      rethrow;
    } catch (_) {
      throw const LookupUnavailable();
    }
  }
}
