import 'package:cloud_firestore/cloud_firestore.dart';

class BookingRecord {
  const BookingRecord({
    required this.id,
    required this.patientName,
    required this.patientAvatarUrl,
    required this.service,
    required this.sessionDate,
    required this.status,
    this.summaryId,
  });

  final String id;
  final String patientName;
  final String? patientAvatarUrl;
  final String service;
  final DateTime sessionDate;
  final String status; // "upcoming"|"completed"|"cancelled"
  final String? summaryId;

  bool get isUpcoming => status == 'upcoming';
  bool get hasSummary => summaryId != null;

  factory BookingRecord.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    final ts = d['sessionDate'];
    final date = ts is Timestamp ? ts.toDate() : DateTime.now();
    return BookingRecord(
      id: doc.id,
      patientName: (d['patientName'] as String?) ?? 'Patient',
      patientAvatarUrl: d['patientAvatarUrl'] as String?,
      service: (d['service'] as String?) ?? 'Session',
      sessionDate: date,
      status: (d['status'] as String?) ?? 'upcoming',
      summaryId: d['summaryId'] as String?,
    );
  }
}

class SessionSummary {
  const SessionSummary({
    required this.id,
    required this.patientName,
    required this.workedOn,
    required this.exercises,
    required this.nextSteps,
    required this.followUpWeeks,
    required this.publishedAt,
  });

  final String id;
  final String patientName;
  final String workedOn;
  final String exercises;
  final String nextSteps;
  final int followUpWeeks;
  final DateTime publishedAt;

  factory SessionSummary.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    final ts = d['publishedAt'];
    final date = ts is Timestamp ? ts.toDate() : DateTime.now();
    return SessionSummary(
      id: doc.id,
      patientName: (d['patientName'] as String?) ?? '',
      workedOn: (d['workedOn'] as String?) ?? '',
      exercises: (d['exercises'] as String?) ?? '',
      nextSteps: (d['nextSteps'] as String?) ?? '',
      followUpWeeks: (d['followUpWeeks'] as int?) ?? 0,
      publishedAt: date,
    );
  }
}
