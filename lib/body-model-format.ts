// lib/body-model-format.ts
// Binary layout of the 3D body-chart model in public/models/body-chart/,
// shared by scripts/build-body-model.ts (writer) and lib/body-model-loader.ts
// (reader), plus the pure colouring helpers the viewer uses.
//
// One chunk = one merged mesh of at most 65,535 vertices, so indices fit in
// Uint16. Layout of a chunk (each block 4-byte aligned):
//   positions  Int16 x3  normalised; x POSITION_SCALE = metres
//   normals    Int8  x3  normalised
//   regions    Uint8 x1  index into manifest.regions (NO_REGION if none)
//   indices    Uint16

export const BODY_MODEL_DIR = "/models/body-chart";
export const POSITION_SCALE = 2;
export const NO_REGION = 255;
export const MAX_CHUNK_VERTICES = 65_535;
export const MODEL_SYSTEMS = ["skeletal", "muscular", "connective"] as const;
export type ModelSystem = (typeof MODEL_SYSTEMS)[number];

export interface ModelPart {
  name: string;
  system: number; // index into manifest.systems
  chunk: number;
  firstVertex: number; // within the chunk
  vertexCount: number;
  firstIndex: number; // within the chunk's index array
  indexCount: number;
}

export interface ModelChunk {
  file: string;
  bytes: number; // uncompressed
  gzipBytes: number;
  vertexCount: number;
  indexCount: number;
}

export interface BodyModelManifest {
  version: 1;
  source: string;
  triangles: number;
  regions: string[]; // BODY_REGIONS keys, in order
  systems: ModelSystem[];
  parts: ModelPart[];
  chunks: ModelChunk[];
}

export interface ChunkArrays {
  positions: Int16Array;
  normals: Int8Array;
  regions: Uint8Array;
  indices: Uint16Array;
}

const align4 = (n: number) => (n + 3) & ~3;

export function chunkLayout(vertexCount: number, indexCount: number) {
  const positions = 0;
  const normals = align4(positions + vertexCount * 6);
  const regions = align4(normals + vertexCount * 3);
  const indices = align4(regions + vertexCount);
  return { positions, normals, regions, indices, bytes: indices + indexCount * 2 };
}

export function readChunk(chunk: ModelChunk, buffer: ArrayBuffer): ChunkArrays {
  const l = chunkLayout(chunk.vertexCount, chunk.indexCount);
  if (buffer.byteLength !== l.bytes) {
    throw new Error(`Body model chunk ${chunk.file} has ${buffer.byteLength} bytes, expected ${l.bytes}`);
  }
  return {
    positions: new Int16Array(buffer, l.positions, chunk.vertexCount * 3),
    normals: new Int8Array(buffer, l.normals, chunk.vertexCount * 3),
    regions: new Uint8Array(buffer, l.regions, chunk.vertexCount),
    indices: new Uint16Array(buffer, l.indices, chunk.indexCount),
  };
}

export function writeChunk(a: ChunkArrays): Uint8Array {
  const l = chunkLayout(a.regions.length, a.indices.length);
  const out = new Uint8Array(l.bytes);
  out.set(new Uint8Array(a.positions.buffer, a.positions.byteOffset, a.positions.byteLength), l.positions);
  out.set(new Uint8Array(a.normals.buffer, a.normals.byteOffset, a.normals.byteLength), l.normals);
  out.set(a.regions, l.regions);
  out.set(new Uint8Array(a.indices.buffer, a.indices.byteOffset, a.indices.byteLength), l.indices);
  return out;
}

/** The part that owns triangle `faceIndex`; `parts` are one chunk's parts in index order. */
export function partForFace(parts: readonly ModelPart[], faceIndex: number): ModelPart | undefined {
  const index = faceIndex * 3;
  let lo = 0;
  let hi = parts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const part = parts[mid];
    if (index < part.firstIndex) hi = mid - 1;
    else if (index >= part.firstIndex + part.indexCount) lo = mid + 1;
    else return part;
  }
  return undefined;
}

export const PALETTE: Record<ModelSystem | "selected", string> = {
  skeletal: "#E8DFC6",
  muscular: "#C48C7C",
  connective: "#CDD6CE",
  selected: "#0EA5E9", // --book-accent
};

/** sRGB hex -> linear RGB bytes (three.js treats vertex colours as linear). */
export function linearBytes(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const s = c / 255;
    const l = s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    return Math.round(l * 255);
  };
  return [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
}

export function baseColors(parts: readonly ModelPart[], systems: readonly ModelSystem[], vertexCount: number): Uint8Array {
  const out = new Uint8Array(vertexCount * 3);
  for (const part of parts) {
    const rgb = linearBytes(PALETTE[systems[part.system]]);
    for (let v = part.firstVertex; v < part.firstVertex + part.vertexCount; v++) out.set(rgb, v * 3);
  }
  return out;
}

export const HOVER_MIX = 0.45;

export function paintColors(
  out: Uint8Array,
  base: Uint8Array,
  regions: Uint8Array,
  selected: ReadonlySet<number>,
  hover: number | null
): void {
  const accent = linearBytes(PALETTE.selected);
  for (let v = 0; v < regions.length; v++) {
    const region = regions[v];
    const o = v * 3;
    if (selected.has(region)) {
      out[o] = accent[0];
      out[o + 1] = accent[1];
      out[o + 2] = accent[2];
    } else if (region === hover) {
      for (let k = 0; k < 3; k++) out[o + k] = Math.round(base[o + k] + (accent[k] - base[o + k]) * HOVER_MIX);
    } else {
      out[o] = base[o];
      out[o + 1] = base[o + 1];
      out[o + 2] = base[o + 2];
    }
  }
}
