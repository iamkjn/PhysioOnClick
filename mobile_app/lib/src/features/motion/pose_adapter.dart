// Adapts ML Kit's `Pose` detection result into the pure-Dart `Landmark` list
// that `MotionJudge` (motion_engine.dart) consumes. Keeping this mapping in
// its own file means the camera/ML Kit dependency never leaks into the
// engine, which stays a plain Dart port shared conceptually with the web
// grading logic.

import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

import 'motion_engine.dart';

/// Number of landmarks in the MediaPipe/BlazePose pose model — see
/// [PoseIndex] in motion_engine.dart for the index meanings.
const int poseLandmarkCount = 33;

/// Maps every ML Kit [PoseLandmarkType] to its numeric [PoseIndex] slot in
/// the MediaPipe/BlazePose 33-point order used throughout this app (the same
/// order [MotionTarget] joint indices and the web engine use). Written out
/// explicitly rather than relying on `PoseLandmarkType.index` so this file
/// stays correct even if ML Kit ever reorders its enum.
const Map<PoseLandmarkType, int> _poseIndexByType = {
  PoseLandmarkType.nose: PoseIndex.nose,
  PoseLandmarkType.leftEyeInner: 1,
  PoseLandmarkType.leftEye: 2,
  PoseLandmarkType.leftEyeOuter: 3,
  PoseLandmarkType.rightEyeInner: 4,
  PoseLandmarkType.rightEye: 5,
  PoseLandmarkType.rightEyeOuter: 6,
  PoseLandmarkType.leftEar: 7,
  PoseLandmarkType.rightEar: 8,
  PoseLandmarkType.leftMouth: 9,
  PoseLandmarkType.rightMouth: 10,
  PoseLandmarkType.leftShoulder: PoseIndex.lShoulder,
  PoseLandmarkType.rightShoulder: PoseIndex.rShoulder,
  PoseLandmarkType.leftElbow: PoseIndex.lElbow,
  PoseLandmarkType.rightElbow: PoseIndex.rElbow,
  PoseLandmarkType.leftWrist: PoseIndex.lWrist,
  PoseLandmarkType.rightWrist: PoseIndex.rWrist,
  PoseLandmarkType.leftPinky: 17,
  PoseLandmarkType.rightPinky: 18,
  PoseLandmarkType.leftIndex: 19,
  PoseLandmarkType.rightIndex: 20,
  PoseLandmarkType.leftThumb: 21,
  PoseLandmarkType.rightThumb: 22,
  PoseLandmarkType.leftHip: PoseIndex.lHip,
  PoseLandmarkType.rightHip: PoseIndex.rHip,
  PoseLandmarkType.leftKnee: PoseIndex.lKnee,
  PoseLandmarkType.rightKnee: PoseIndex.rKnee,
  PoseLandmarkType.leftAnkle: PoseIndex.lAnkle,
  PoseLandmarkType.rightAnkle: PoseIndex.rAnkle,
  PoseLandmarkType.leftHeel: 29,
  PoseLandmarkType.rightHeel: 30,
  PoseLandmarkType.leftFootIndex: 31,
  PoseLandmarkType.rightFootIndex: 32,
};

/// Builds a fixed 33-length list of [Landmark]s, indexed in [PoseIndex]
/// order, from an ML Kit [pose]. `x`/`y` are normalized to 0-1 by dividing by
/// [imageWidth]/[imageHeight] — callers must pass the width/height of the
/// coordinate space the pose's landmark x/y values are actually expressed in
/// (see the rotation handling in motion_check_screen.dart, which swaps width
/// and height for 90°/270° camera rotations before calling this). Slots ML
/// Kit didn't report are filled with `Landmark(0, 0)` so [MotionJudge] can
/// always index safely.
List<Landmark> landmarksFromPose(
  Pose pose, {
  required double imageWidth,
  required double imageHeight,
}) {
  final landmarks = List<Landmark>.filled(
    poseLandmarkCount,
    const Landmark(x: 0, y: 0),
  );

  if (imageWidth <= 0 || imageHeight <= 0) return landmarks;

  for (final entry in pose.landmarks.entries) {
    final index = _poseIndexByType[entry.key];
    if (index == null) continue;

    final point = entry.value;
    landmarks[index] = Landmark(
      x: point.x / imageWidth,
      y: point.y / imageHeight,
      z: point.z,
      visibility: point.likelihood,
    );
  }

  return landmarks;
}
