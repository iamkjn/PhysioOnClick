import 'package:cloud_firestore/cloud_firestore.dart';

/// Mobile counterpart of web's `lib/admin-notifications.ts`: the
/// `adminNotifications` docs written by the notifyAdminUpcomingSessions Cloud
/// Function (functions/src/index.ts) shortly before each session.
class AdminNotification {
  const AdminNotification({
    required this.id,
    required this.bookingId,
    required this.patientName,
    required this.sessionDate,
    required this.read,
  });

  final String id;
  final String bookingId;
  final String patientName;
  final DateTime? sessionDate;
  final bool read;

  bool isPast(DateTime now) =>
      sessionDate != null && sessionDate!.isBefore(now);

  factory AdminNotification.fromMap(String id, Map<String, dynamic> data) {
    final session = data['sessionDate'];
    final name = (data['patientName'] as String?)?.trim();
    return AdminNotification(
      id: id,
      bookingId: data['bookingId'] as String? ?? '',
      patientName: (name == null || name.isEmpty) ? 'Patient' : name,
      sessionDate: session is Timestamp ? session.toDate() : null,
      read: data['read'] == true,
    );
  }
}

/// Newest first, capped at 50 like the web bell.
Stream<List<AdminNotification>> watchAdminNotifications() {
  return FirebaseFirestore.instance
      .collection('adminNotifications')
      .orderBy('createdAt', descending: true)
      .limit(50)
      .snapshots()
      .map(
        (snap) =>
            snap.docs
                .map((d) => AdminNotification.fromMap(d.id, d.data()))
                .toList(),
      );
}

/// firestore.rules only lets the admin change the `read` flag.
Future<void> markAdminNotificationRead(String id) {
  return FirebaseFirestore.instance
      .collection('adminNotifications')
      .doc(id)
      .update({'read': true});
}
