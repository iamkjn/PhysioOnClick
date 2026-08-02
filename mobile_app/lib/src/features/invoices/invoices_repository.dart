import 'dart:convert';
import 'dart:typed_data';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

import '../../core/api_client.dart';
import 'invoice_model.dart';

/// Fetches invoices from the Next.js backend. The `payments` collection is
/// admin-only in Firestore rules, so both the list and the PDF are served by
/// server routes that verify the caller's Firebase ID token and scope results
/// to the caller's own email (covering self + dependents).
class InvoicesRepository {
  Future<List<Invoice>> fetchInvoices() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return [];
    final token = await user.getIdToken();
    if (token == null) return [];

    final res = await http
        .get(
          Uri.parse('$kApiBase/api/patient/invoices'),
          headers: {'Authorization': 'Bearer $token'},
        )
        .timeout(const Duration(seconds: 20));

    if (res.statusCode != 200) {
      throw Exception('Failed to load invoices (${res.statusCode})');
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final list = (body['invoices'] as List<dynamic>? ?? []);
    return list
        .map((e) => Invoice.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Downloads the invoice PDF bytes (auth-gated to the owning patient).
  Future<Uint8List> downloadPdf(String invoiceNumber) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('Not signed in');
    final token = await user.getIdToken();
    if (token == null) throw Exception('Not signed in');

    final res = await http
        .get(
          Uri.parse('$kApiBase/api/patient/invoice/$invoiceNumber'),
          headers: {'Authorization': 'Bearer $token'},
        )
        .timeout(const Duration(seconds: 30));

    if (res.statusCode != 200) {
      throw Exception('Download failed (${res.statusCode})');
    }
    return res.bodyBytes;
  }
}
