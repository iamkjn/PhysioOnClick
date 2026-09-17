import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/profile/exercise_video.dart';

void main() {
  test('exerciseImageUrl defaults to the thumb variant', () {
    final url = exerciseImageUrl('bridge-hold');
    expect(url, contains('/exercise-images/bridge-hold'));
    expect(url, contains('size=thumb'));
  });

  test('exerciseImageUrl accepts a full variant', () {
    final url = exerciseImageUrl('bridge-hold', variant: 'full');
    expect(url, contains('size=full'));
  });

  test('exerciseImageUrl URL-encodes the id', () {
    final url = exerciseImageUrl('some id/with slash');
    expect(url, contains(Uri.encodeComponent('some id/with slash')));
  });

  test('ExerciseVideo.fromMap parses defaultDosage', () {
    final video = ExerciseVideo.fromMap({
      'title': 'Bridge hold',
      'bodyPart': 'Core',
      'defaultDosage': {'sets': 3, 'reps': 12},
    }, 'bridge-hold');
    expect(video.id, 'bridge-hold');
    expect(video.title, 'Bridge hold');
    expect(video.defaultDosage, {'sets': 3, 'reps': 12});
  });
}
