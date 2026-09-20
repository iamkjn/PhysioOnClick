import 'package:cloud_firestore/cloud_firestore.dart';

/// Mirrors web's `BookingRecord` (`components/admin-bookings-table.tsx`).
class AdminBooking {
  const AdminBooking({
    required this.id,
    required this.fullName,
    required this.email,
    required this.service,
    required this.appointmentLabel,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.status,
    required this.calBookingUid,
    required this.patientName,
    required this.patientId,
    required this.bookedBy,
    this.summaryId,
    this.assessmentFormId,
  });

  final String id;
  final String fullName;
  final String email;
  final String service;
  final String appointmentLabel;
  final String appointmentDate;
  final String appointmentTime;
  final String status;
  final String calBookingUid;
  final String patientName;
  final String patientId;
  final String bookedBy;
  final String? summaryId;
  final String? assessmentFormId;

  factory AdminBooking.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? {};
    String s(String key, [String fallback = '']) => (d[key] as String?) ?? fallback;
    final appointmentDate = s('appointmentDate');
    final appointmentTime = s('appointmentTime');
    return AdminBooking(
      id: doc.id,
      fullName: s('fullName', s('name')),
      email: s('email'),
      service: s('service'),
      appointmentLabel: s(
        'appointmentLabel',
        appointmentDate.isNotEmpty && appointmentTime.isNotEmpty ? '$appointmentDate $appointmentTime' : 'TBC',
      ),
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      status: s('status', 'pending'),
      calBookingUid: s('calBookingUid'),
      patientName: s('patientName', s('fullName', s('name', 'Patient'))),
      patientId: s('patientId', s('bookedBy')),
      bookedBy: s('bookedBy', s('patientId')),
      summaryId: d['summaryId'] as String?,
      assessmentFormId: d['assessmentFormId'] as String?,
    );
  }

  /// Mirrors web's `resolveStatus`: cancelled stays cancelled; otherwise
  /// split into upcoming/completed by comparing the appointment's London
  /// wall-clock date+time against now — a simple UTC comparison is close
  /// enough for the admin app's own device, avoiding a timezone library.
  String get displayStatus {
    if (status == 'cancelled') return 'cancelled';
    if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(appointmentDate)) return status;
    final time = appointmentTime.isEmpty ? '00:00' : appointmentTime;
    final apptKey = '${appointmentDate}T$time';
    final now = DateTime.now();
    final nowKey =
        '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}T${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    return apptKey.compareTo(nowKey) < 0 ? 'completed' : 'upcoming';
  }
}
