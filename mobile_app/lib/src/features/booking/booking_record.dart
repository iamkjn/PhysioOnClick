class BookingRecord {
  const BookingRecord({
    required this.id,
    required this.service,
    required this.appointmentLabel,
    required this.status,
    required this.notes,
  });

  final String id;
  final String service;
  final String appointmentLabel;
  final String status;
  final String notes;

  factory BookingRecord.fromMap(Map<String, dynamic> data, String id) {
    return BookingRecord(
      id: id,
      service: '${data['service'] ?? 'Assessment'}',
      appointmentLabel: '${data['appointmentLabel'] ?? 'Awaiting confirmation'}',
      status: '${data['status'] ?? 'pending'}',
      notes: '${data['notes'] ?? ''}',
    );
  }
}
