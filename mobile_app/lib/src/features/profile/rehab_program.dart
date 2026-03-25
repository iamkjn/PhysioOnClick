class RehabProgram {
  const RehabProgram({
    required this.id,
    required this.title,
    required this.stage,
    required this.patientEmail,
    required this.exerciseIds,
    required this.goals,
    required this.notes,
  });

  final String id;
  final String title;
  final String stage;
  final String patientEmail;
  final List<String> exerciseIds;
  final List<String> goals;
  final String notes;

  factory RehabProgram.fromMap(Map<String, dynamic> data, String id) {
    return RehabProgram(
      id: id,
      title: '${data['title'] ?? 'Rehab programme'}',
      stage: '${data['stage'] ?? ''}',
      patientEmail: '${data['patientEmail'] ?? ''}',
      exerciseIds: List<String>.from(data['exerciseIds'] ?? const []),
      goals: List<String>.from(data['goals'] ?? const []),
      notes: '${data['notes'] ?? ''}',
    );
  }
}
