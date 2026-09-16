import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import '../../core/api_client.dart';

class CheckoutStatus {
  final String status;
  final String? service;
  final String? calBookingUid;
  final String? invoiceNumber;
  final String? paidAt;

  const CheckoutStatus({
    required this.status,
    this.service,
    this.calBookingUid,
    this.invoiceNumber,
    this.paidAt,
  });

  factory CheckoutStatus.fromJson(Map<String, dynamic> json) => CheckoutStatus(
        status: json['status'] as String,
        service: json['service'] as String?,
        calBookingUid: json['calBookingUid'] as String?,
        invoiceNumber: json['invoiceNumber'] as String?,
        paidAt: json['paidAt'] as String?,
      );
}

typedef IdTokenProvider = Future<String?> Function();

class CheckoutRepository {
  CheckoutRepository({
    http.Client? httpClient,
    IdTokenProvider? idTokenProvider,
  })  : _client = httpClient ?? http.Client(),
        _idTokenProvider = idTokenProvider ?? _defaultIdTokenProvider;

  final http.Client _client;
  final IdTokenProvider _idTokenProvider;

  Future<Map<String, String>> _authHeaders() async {
    final token = await _idTokenProvider();
    if (token == null) throw Exception('Not signed in');
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  static Future<String?> _defaultIdTokenProvider() async {
    return FirebaseAuth.instance.currentUser?.getIdToken();
  }

  Future<Map<String, List<String>>> fetchSlots({
    required String service,
    required DateTime start,
    required DateTime end,
  }) async {
    String fmt(DateTime d) =>
        '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    final uri = Uri.parse('$kApiBase/api/cal/slots').replace(queryParameters: {
      'service': service,
      'start': fmt(start),
      'end': fmt(end),
    });
    final res = await _client
        .get(uri, headers: await _authHeaders())
        .timeout(const Duration(seconds: 20));
    if (res.statusCode != 200) {
      throw Exception('Failed to load slots (${res.statusCode})');
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final slots = (body['slots'] as Map<String, dynamic>? ?? {});
    return slots.map((k, v) => MapEntry(k, (v as List).cast<String>()));
  }

  Future<String> createCheckoutSession({
    required String service,
    required DateTime start,
    required String name,
    required String email,
    String timeZone = 'Europe/London',
    List<String> focusAreas = const [],
    String? assessmentUid,
    String? assessmentPersonId,
    String? assessmentFormId,
  }) async {
    final uri = Uri.parse('$kApiBase/api/checkout/create');
    final res = await _client
        .post(
          uri,
          headers: await _authHeaders(),
          body: jsonEncode({
            'service': service,
            'start': start.toUtc().toIso8601String(),
            'name': name,
            'email': email,
            'timeZone': timeZone,
            if (focusAreas.isNotEmpty) 'focusAreas': focusAreas,
            if (assessmentUid != null) 'assessmentUid': assessmentUid,
            if (assessmentPersonId != null) 'assessmentPersonId': assessmentPersonId,
            if (assessmentFormId != null) 'assessmentFormId': assessmentFormId,
          }),
        )
        .timeout(const Duration(seconds: 20));

    Map<String, dynamic>? body;
    try {
      body = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      body = null;
    }

    if (res.statusCode != 200 || body?['ok'] != true) {
      final error = body?['error'] as String?;
      throw Exception(error ?? 'Failed to start checkout (${res.statusCode})');
    }
    return body!['url'] as String;
  }

  Future<CheckoutStatus> pollCheckoutStatus(String sessionId) async {
    final uri = Uri.parse('$kApiBase/api/checkout/status')
        .replace(queryParameters: {'session_id': sessionId});
    final res = await _client
        .get(uri, headers: await _authHeaders())
        .timeout(const Duration(seconds: 20));
    if (res.statusCode != 200) {
      throw Exception('Failed to check payment status (${res.statusCode})');
    }
    return CheckoutStatus.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }
}
