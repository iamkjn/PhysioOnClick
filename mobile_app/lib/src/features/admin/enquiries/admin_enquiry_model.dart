import 'package:cloud_firestore/cloud_firestore.dart';

/// Mirrors web's `EnquiryRecord` (`components/admin-enquiries-table.tsx`).
class AdminEnquiry {
  const AdminEnquiry({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.service,
    required this.message,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String email;
  final String phone;
  final String service;
  final String message;
  final String status;
  final DateTime? createdAt;

  factory AdminEnquiry.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? {};
    final ts = d['createdAt'];
    return AdminEnquiry(
      id: doc.id,
      name: (d['name'] as String?) ?? '',
      email: (d['email'] as String?) ?? '',
      phone: (d['phone'] as String?)?.isNotEmpty == true ? d['phone'] as String : 'Not provided',
      service: (d['service'] as String?) ?? '',
      message: (d['message'] as String?) ?? '',
      status: (d['status'] as String?) ?? 'new',
      createdAt: ts is Timestamp ? ts.toDate() : null,
    );
  }
}
