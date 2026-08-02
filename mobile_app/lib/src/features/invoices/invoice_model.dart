/// A paid invoice for the signed-in account holder or one of their members.
/// Mirrors the `PatientInvoice` shape returned by the Next.js
/// `GET /api/patient/invoices` route.
class Invoice {
  const Invoice({
    required this.invoiceNumber,
    required this.paidAt,
    required this.amountPence,
    required this.service,
    required this.serviceLabel,
    required this.patientName,
    required this.sessionDate,
    required this.hasPdf,
  });

  final String invoiceNumber;
  final String paidAt;
  final int amountPence;
  final String service;
  final String serviceLabel;

  /// The member (self or dependent) the session was booked for.
  final String patientName;
  final String? sessionDate;
  final bool hasPdf;

  String get amountLabel => '£${(amountPence / 100).toStringAsFixed(2)}';

  factory Invoice.fromJson(Map<String, dynamic> json) {
    return Invoice(
      invoiceNumber: (json['invoiceNumber'] ?? '') as String,
      paidAt: (json['paidAt'] ?? '') as String,
      amountPence: (json['amountPence'] ?? 0) as int,
      service: (json['service'] ?? '') as String,
      serviceLabel: (json['serviceLabel'] ?? '') as String,
      patientName: (json['patientName'] as String?)?.isNotEmpty == true
          ? json['patientName'] as String
          : 'You',
      sessionDate: json['sessionDate'] as String?,
      hasPdf: (json['hasPdf'] ?? false) as bool,
    );
  }
}
