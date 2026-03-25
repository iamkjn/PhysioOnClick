class ExerciseVideo {
  const ExerciseVideo({
    required this.id,
    required this.title,
    required this.bodyPart,
    required this.condition,
    required this.stage,
    required this.description,
    required this.videoUrl,
  });

  final String id;
  final String title;
  final String bodyPart;
  final String condition;
  final String stage;
  final String description;
  final String videoUrl;

  factory ExerciseVideo.fromMap(Map<String, dynamic> data, String id) {
    return ExerciseVideo(
      id: id,
      title: '${data['title'] ?? 'Exercise'}',
      bodyPart: '${data['bodyPart'] ?? ''}',
      condition: '${data['condition'] ?? ''}',
      stage: '${data['stage'] ?? ''}',
      description: '${data['description'] ?? ''}',
      videoUrl: '${data['videoUrl'] ?? ''}',
    );
  }
}
