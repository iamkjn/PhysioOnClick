// Adapts ML Kit's FaceMesh detection result into the pure-Dart `FaceLandmark`
// list that `FaceJudge` (face_engine.dart) consumes — the facial counterpart of
// pose_adapter.dart. Keeping this mapping in its own file means the ML Kit
// dependency never leaks into the engine.
//
// ML Kit Face Mesh is Android-only; callers must gate iOS before reaching here.

import 'package:google_mlkit_face_mesh_detection/google_mlkit_face_mesh_detection.dart';

import 'face_engine.dart';

/// Number of points in the MediaPipe/ML Kit face mesh. The FACE index
/// constants in face_engine.dart address into this canonical order.
const int faceMeshPointCount = 468;

/// Builds a fixed 468-length list of [FaceLandmark]s, indexed in FaceMesh
/// canonical order, from an ML Kit [mesh]. `x`/`y` are normalised to 0-1 by
/// dividing by [imageWidth]/[imageHeight] — callers pass the width/height of
/// the (upright) coordinate space the mesh points are expressed in, mirroring
/// the rotation handling in the pose adapter. Points ML Kit didn't report are
/// left at `FaceLandmark(0, 0)` so [FaceJudge] can always index safely.
List<FaceLandmark> faceLandmarksFromMesh(
  FaceMesh mesh, {
  required double imageWidth,
  required double imageHeight,
}) {
  final landmarks = List<FaceLandmark>.filled(
    faceMeshPointCount,
    const FaceLandmark(x: 0, y: 0),
  );

  if (imageWidth <= 0 || imageHeight <= 0) return landmarks;

  final points = mesh.points;
  for (var i = 0; i < points.length && i < faceMeshPointCount; i++) {
    final p = points[i];
    landmarks[i] = FaceLandmark(
      x: p.x / imageWidth,
      y: p.y / imageHeight,
      z: p.z,
    );
  }

  return landmarks;
}
