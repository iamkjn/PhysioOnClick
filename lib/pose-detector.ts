// lib/pose-detector.ts
// Client-only. Never import this from a server-reachable module top level.
export type PoseDetector = {
  detect(video: HTMLVideoElement, timestampMs: number): { x: number; y: number; z?: number; visibility?: number }[];
  close(): void;
};

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export async function createPoseDetector(): Promise<PoseDetector> {
  const vision = await import('@mediapipe/tasks-vision');
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM);
  const landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numPoses: 1,
  });
  return {
    detect(video, ts) {
      const res = landmarker.detectForVideo(video, ts);
      return res.landmarks?.[0] ?? [];
    },
    close() { landmarker.close(); },
  };
}
