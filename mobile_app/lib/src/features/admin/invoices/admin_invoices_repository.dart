import 'dart:convert';
import 'dart:typed_data';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

import '../../../core/api_client.dart';
import 'admin_invoice_model.dart';

class AdminInvoicesRepository {
  Future<List<AdminInvoiceRow>> fetchInvoices() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return [];
    final token = await user.getIdToken();
    if (token == null) return [];

    final res = await http
        .get(Uri.parse('$kApiBase/api/admin/invoices'), headers: {'Authorization': 'Bearer $token'})
        .timeout(const Duration(seconds: 20));

    if (res.statusCode != 200) {
      throw Exception('Failed to load invoices (${res.statusCode})');
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final list = (body['invoices'] as List<dynamic>? ?? []);
    return list.map((e) => AdminInvoiceRow.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Uint8List> downloadPdf(String invoiceNumber) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('Not signed in');
    final token = await user.getIdToken();
    if (token == null) throw Exception('Not signed in');

    final res = await http
        .get(
          Uri.parse('$kApiBase/api/admin/invoice/$invoiceNumber'),
          headers: {'Authorization': 'Bearer $token'},
        )
        .timeout(const Duration(seconds: 30));

    if (res.statusCode != 200) {
      throw Exception('Download failed (${res.statusCode})');
    }
    return res.bodyBytes;
  }
}
