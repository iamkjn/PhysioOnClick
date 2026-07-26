// lib/face-detector.ts
// Client-only. Never import this from a server-reachable module top level.
//
// Mirror of `lib/pose-detector.ts` but for the FACE: loads MediaPipe's
// FaceLandmarker (468/478 points) from the same tasks-vision package, so no new
// dependency is added. Used by the facial-motion check for palsy/stroke/elderly
// rehab. No image or video ever leaves the device.
import type { FaceLandmark } from '@/lib/face-engine';

export type FaceDetector = {
  detect(video: HTMLVideoElement, timestampMs: number): FaceLandmark[];
  close(): void;
};

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export async function createFaceDetector(): Promise<FaceDetector> {
  const vision = await import('@mediapipe/tasks-vision');
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM);
  const landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numFaces: 1,
  });
  return {
    detect(video, ts) {
      const res = landmarker.detectForVideo(video, ts);
      return res.faceLandmarks?.[0] ?? [];
    },
    close() {
      landmarker.close();
    },
  };
}
