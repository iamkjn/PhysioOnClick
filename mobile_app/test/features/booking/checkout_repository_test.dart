import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile_app/src/features/booking/checkout_repository.dart';

void main() {
  test('fetchSlots parses the slots map from the API response', () async {
    final client = MockClient((request) async {
      expect(request.url.path, '/api/cal/slots');
      expect(request.url.queryParameters['service'], 'initial-assessment');
      return http.Response(
        jsonEncode({'slots': {'2026-09-20': ['2026-09-20T09:00:00.000Z']}}),
        200,
      );
    });
    final repo = CheckoutRepository(httpClient: client, idTokenProvider: () async => 'test-token');
    final slots = await repo.fetchSlots(
      service: 'initial-assessment',
      start: DateTime(2026, 9, 20),
      end: DateTime(2026, 9, 25),
    );
    expect(slots['2026-09-20'], ['2026-09-20T09:00:00.000Z']);
  });

  test('createCheckoutSession returns the Stripe URL on success', () async {
    final client = MockClient((request) async {
      expect(request.url.path, '/api/checkout/create');
      final body = jsonDecode(request.body) as Map<String, dynamic>;
      expect(body['service'], 'follow-up');
      expect(body['email'], 'patient@example.com');
      return http.Response(jsonEncode({'ok': true, 'url': 'https://checkout.stripe.com/session123'}), 200);
    });
    final repo = CheckoutRepository(httpClient: client, idTokenProvider: () async => 'test-token');
    final url = await repo.createCheckoutSession(
      service: 'follow-up',
      start: DateTime.utc(2026, 9, 20, 9),
      name: 'Pat Patient',
      email: 'patient@example.com',
    );
    expect(url, 'https://checkout.stripe.com/session123');
  });

  test('createCheckoutSession throws on ok:false response', () async {
    final client = MockClient((request) async =>
        http.Response(jsonEncode({'ok': false, 'error': 'Slot no longer available'}), 400));
    final repo = CheckoutRepository(httpClient: client, idTokenProvider: () async => 'test-token');
    expect(
      () => repo.createCheckoutSession(
        service: 'follow-up', start: DateTime.now(), name: 'A', email: 'a@b.com',
      ),
      throwsException,
    );
  });

  test('pollCheckoutStatus parses a paid status', () async {
    final client = MockClient((request) async {
      expect(request.url.path, '/api/checkout/status');
      expect(request.url.queryParameters['session_id'], 'session123');
      return http.Response(
        jsonEncode({'status': 'paid', 'calBookingUid': 'abc', 'invoiceNumber': 'INV-1'}),
        200,
      );
    });
    final repo = CheckoutRepository(httpClient: client, idTokenProvider: () async => 'test-token');
    final status = await repo.pollCheckoutStatus('session123');
    expect(status.status, 'paid');
    expect(status.calBookingUid, 'abc');
  });
}
