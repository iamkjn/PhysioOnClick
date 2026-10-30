// lib/body-model-loader.ts
// Downloads and decodes the 3D body-chart model once per page load and shares
// it. The booking flow prefetches it once the patient reaches the time step, so the assessment's
// 3D chart usually opens instantly. Also decides whether this browser should
// get the 3D chart at all.

import { BODY_MODEL_DIR, readChunk, type BodyModelManifest, type ChunkArrays } from "@/lib/body-model-format";

export interface BodyModel {
  manifest: BodyModelManifest;
  chunks: ChunkArrays[];
}
type ProgressListener = (loadedBytes: number, totalBytes: number) => void;

let pending: Promise<BodyModel> | null = null;
let loadedBytes = 0;
let totalBytes = 0;
const listeners = new Set<ProgressListener>();
let support: boolean | null = null;

// Static hosts may serve .gz with or without Content-Encoding; fetch already
// decodes the former, so check the gzip magic bytes rather than decode twice.
async function readFile(response: Response, expectedBytes: number): Promise<ArrayBuffer> {
  if (!response.ok) throw new Error(`Body model request failed (${response.status})`);
  const payload = await response.arrayBuffer();
  const head = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
  const gzipped = head[0] === 0x1f && head[1] === 0x8b;
  const buffer = gzipped
    ? await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()
    : payload;
  if (buffer.byteLength !== expectedBytes) throw new Error("Body model file was incomplete");
  return buffer;
}

export function loadBodyModel(): Promise<BodyModel> {
  pending ??= (async () => {
    const res = await fetch(`${BODY_MODEL_DIR}/manifest.json`);
    if (!res.ok) throw new Error(`Body model manifest failed (${res.status})`);
    const manifest = (await res.json()) as BodyModelManifest;
    totalBytes = manifest.chunks.reduce((n, c) => n + c.gzipBytes, 0);
    const chunks = await Promise.all(
      manifest.chunks.map(async (chunk) => {
        const buffer = await readFile(await fetch(`${BODY_MODEL_DIR}/${chunk.file}`), chunk.bytes);
        loadedBytes += chunk.gzipBytes;
        listeners.forEach((listener) => listener(loadedBytes, totalBytes));
        return readChunk(chunk, buffer);
      })
    );
    return { manifest, chunks };
  })().catch((error: unknown) => {
    pending = null;
    loadedBytes = 0;
    totalBytes = 0;
    throw error;
  });
  return pending;
}

export function onBodyModelProgress(listener: ProgressListener): () => void {
  listeners.add(listener);
  if (totalBytes) listener(loadedBytes, totalBytes);
  return () => {
    listeners.delete(listener);
  };
}

function detect(): boolean {
  if (typeof window === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return false;
  if (typeof DecompressionStream === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension?.("WEBGL_lose_context")?.loseContext(); // free the probe context straight away
    return true;
  } catch {
    return false;
  }
}

/** Whether this browser should get the 3D chart. Cached; stable for useSyncExternalStore. */
export function canUse3D(): boolean {
  support ??= detect();
  return support;
}

/** Start downloading the model at idle time, if this browser will use it. */
export function prefetchBodyModel(): void {
  if (typeof window === "undefined") return;
  const start = () => {
    if (canUse3D()) loadBodyModel().catch(() => {});
  };
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(start, { timeout: 4000 });
  else window.setTimeout(start, 1500);
}

/** Test-only: forget the cached model, listeners and support check. */
export function resetBodyModelForTests(): void {
  pending = null;
  loadedBytes = 0;
  totalBytes = 0;
  listeners.clear();
  support = null;
}
