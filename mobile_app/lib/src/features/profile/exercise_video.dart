import '../../core/api_client.dart';

/// Mirrors web's `exerciseImageUrl` (`lib/exercise-images.ts`) — the
/// illustration isn't a Firestore field, it's served by the Next.js route
/// `/exercise-images/{id}` keyed off the exercise's own id, which mobile
/// already has via [ExerciseVideo.id]. `thumb` (320px) for list tiles,
/// `full` (960px) for an enlarged view; bump `_imageLibraryVersion` if that
/// ever drifts from the web-side `IMAGE_LIBRARY_VERSION` constant.
const _imageLibraryVersion = 2;

String exerciseImageUrl(String id, {String variant = 'thumb'}) {
  return '$kApiBase/exercise-images/${Uri.encodeComponent(id)}?size=$variant&v=$_imageLibraryVersion';
}

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
