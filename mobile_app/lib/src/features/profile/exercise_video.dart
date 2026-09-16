class ExerciseVideo {
  const ExerciseVideo({
    required this.id,
    required this.title,
    required this.bodyPart,
    required this.condition,
    required this.stage,
    required this.description,
    required this.videoUrl,
    this.defaultDosage,
  });

  final String id;
  final String title;
  final String bodyPart;
  final String condition;
  final String stage;
  final String description;
  final String videoUrl;

  /// The catalogue's default dosage for this exercise, mirroring web's
  /// `ex.defaultDosage` (`lib/exercises.ts`) — merged with a patient's
  /// per-assignment `dosage` override via `resolveDosage` semantics at the
  /// call site (see `profile_screen.dart`'s `_AssignedExercisesSection`).
  final Map<String, dynamic>? defaultDosage;

  factory ExerciseVideo.fromMap(Map<String, dynamic> data, String id) {
    return ExerciseVideo(
      id: id,
      title: '${data['title'] ?? 'Exercise'}',
      bodyPart: '${data['bodyPart'] ?? ''}',
      condition: '${data['condition'] ?? ''}',
      stage: '${data['stage'] ?? ''}',
      description: '${data['description'] ?? ''}',
      videoUrl: '${data['videoUrl'] ?? ''}',
      defaultDosage: (data['defaultDosage'] as Map<String, dynamic>?),
    );
  }
}
