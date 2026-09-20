/// Mirrors web's `InvoiceRow` (`app/admin/actions.ts` `listInvoices`).
class AdminInvoiceRow {
  const AdminInvoiceRow({
    required this.invoiceNumber,
    required this.email,
    required this.service,
    required this.amountPence,
    required this.paidAt,
    required this.hasPdf,
  });

  final String invoiceNumber;
  final String email;
  final String service;
  final int amountPence;
  final String paidAt;
  final bool hasPdf;

  String get amountLabel => '£${(amountPence / 100).toStringAsFixed(2)}';

  factory AdminInvoiceRow.fromJson(Map<String, dynamic> json) {
    return AdminInvoiceRow(
      invoiceNumber: (json['invoiceNumber'] ?? '') as String,
      email: (json['email'] ?? '') as String,
      service: (json['service'] ?? '') as String,
      amountPence: (json['amountPence'] ?? 0) as int,
      paidAt: (json['paidAt'] ?? '') as String,
      hasPdf: (json['hasPdf'] ?? false) as bool,
    );
  }
}
