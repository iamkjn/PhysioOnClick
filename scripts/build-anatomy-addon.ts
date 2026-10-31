// scripts/build-anatomy-addon.ts
// Builds the exercise-page add-on model in public/models/exercise-anatomy/: the
// deep structures the booking model leaves out (ADDON_PART: pelvic floor,
// diaphragm, deep neck flexors, intervertebral discs). Same source, pinned
// commit and binary format as scripts/build-body-model.ts, so the viewer draws
// both with one transform. Vertices carry NO_REGION: none of this is part of
// the booking chart, and the booking model files are not touched.
//
// Run from the repo root: npm run build:anatomy-addon
// (reuses .cache/human-atlas/ from build:body-model, or downloads it once)

import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { MeshoptSimplifier } from "meshoptimizer";
import { ADDON_PART } from "../lib/exercise-anatomy/addon-parts";
import {
  MAX_CHUNK_VERTICES,
  MODEL_SYSTEMS,
  NO_REGION,
  POSITION_SCALE,
  writeChunk,
  type BodyModelManifest,
  type ModelChunk,
  type ModelPart,
  type ModelSystem,
} from "../lib/body-model-format";

const COMMIT = "1c38bf35c254a891200d3cedecfd57abebe83d8d"; // same pin as build-body-model.ts
const RAW = `https://raw.githubusercontent.com/ashemag/human-atlas/${COMMIT}/public/models`;
const ROOT = process.cwd();
const CACHE = path.join(ROOT, ".cache", "human-atlas", COMMIT.slice(0, 12));
const OUT = path.join(ROOT, "public", "models", "exercise-anatomy");

const TRIANGLE_BUDGET = 30_000;
const MAX_ERROR = 0.02;
const MIN_TRIANGLES = 48;
const MAX_GZIP_BYTES = 500_000;
const KEEP_SYSTEMS: readonly ModelSystem[] = ["skeletal", "muscular"];

interface SourcePart {
  name: string;
  system: string;
  chunk: number;
  positions: number;
  normals: number;
  indices: number;
  vertexCount: number;
  indexCount: number;
}
interface SourceAtlas {
  parts: SourcePart[];
  chunks: { url: string; bytes: number; gzip: string; gzipBytes: number }[];
}

async function download(file: string): Promise<Buffer> {
  const local = path.join(CACHE, file);
  if (fs.existsSync(local)) return fs.readFileSync(local);
  const res = await fetch(`${RAW}/${file}`);
  if (!res.ok) throw new Error(`Download failed: ${file} (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(local, buf);
  return buf;
}

function concat<T extends Int16Array | Int8Array | Uint8Array | Uint16Array>(list: T[], make: (n: number) => T): T {
  const out = make(list.reduce((n, a) => n + a.length, 0));
  let offset = 0;
  for (const a of list) {
    out.set(a as unknown as ArrayLike<number>, offset);
    offset += a.length;
  }
  return out;
}

const ATTRIBUTION = `# Exercise anatomy add-on attribution

## Anatomy data

BodyParts3D, © The Database Center for Life Science, licensed under Creative Commons
Attribution 4.0 International (CC BY 4.0).

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical
  concepts. https://doi.org/10.1093/nar/gkn613

Adaptations by PhysioOnClick: kept only the pelvic floor muscles, diaphragm, deep neck
flexors and intervertebral disks; simplified with meshoptimizer; quantised positions and
normals; merged into chunks.

## Packaging

Converted geometry taken from Human Atlas (https://github.com/ashemag/human-atlas) at commit
${COMMIT}, MIT License, Copyright (c) 2026 ashemag. The full MIT notice is in
/models/body-chart/ATTRIBUTION.md.
`;

async function main() {
  await MeshoptSimplifier.ready;
  const atlas = JSON.parse((await download("atlas.json")).toString("utf8")) as SourceAtlas;
  const sources = await Promise.all(
    atlas.chunks.map(async (c) => {
      const raw = gunzipSync(await download(path.basename(c.gzip)));
      if (raw.length !== c.bytes) throw new Error(`${c.gzip} unpacked to ${raw.length} bytes, expected ${c.bytes}`);
      return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length);
    })
  );

  const systems: ModelSystem[] = [...MODEL_SYSTEMS];
  const kept = atlas.parts.filter((p) => KEEP_SYSTEMS.includes(p.system as ModelSystem) && ADDON_PART.test(p.name));
  if (!kept.length) throw new Error("No atlas parts matched ADDON_PART");
  const sourceTriangles = kept.reduce((n, p) => n + p.indexCount / 3, 0);
  const ratio = Math.min(1, TRIANGLE_BUDGET / sourceTriangles);

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const parts: ModelPart[] = [];
  const chunks: ModelChunk[] = [];
  type Pending = { positions: Int16Array[]; normals: Int8Array[]; regions: Uint8Array[]; indices: Uint16Array[]; vertexCount: number; indexCount: number };
  const empty = (): Pending => ({ positions: [], normals: [], regions: [], indices: [], vertexCount: 0, indexCount: 0 });
  let pending = empty();

  const flush = () => {
    if (!pending.vertexCount) return;
    const bytes = writeChunk({
      positions: concat(pending.positions, (n) => new Int16Array(n)),
      normals: concat(pending.normals, (n) => new Int8Array(n)),
      regions: concat(pending.regions, (n) => new Uint8Array(n)),
      indices: concat(pending.indices, (n) => new Uint16Array(n)),
    });
    const file = `chunk-${chunks.length}.bin.gz`;
    const gz = gzipSync(bytes, { level: 9 });
    fs.writeFileSync(path.join(OUT, file), gz);
    chunks.push({ file, bytes: bytes.length, gzipBytes: gz.length, vertexCount: pending.vertexCount, indexCount: pending.indexCount });
    pending = empty();
  };

  for (const p of kept) {
    const src = sources[p.chunk];
    const pos = new Float32Array(src, p.positions, p.vertexCount * 3);
    const nrm = new Int16Array(src, p.normals, p.vertexCount * 3);
    const idx = new Uint32Array(src, p.indices, p.indexCount);
    const target = Math.min(p.indexCount, Math.max(MIN_TRIANGLES * 3, Math.floor((p.indexCount * ratio) / 3) * 3));
    const [simplified] = MeshoptSimplifier.simplify(idx, pos, 3, target, MAX_ERROR);
    const [remap, vertexCount] = MeshoptSimplifier.compactMesh(simplified); // rewrites `simplified` in place
    if (vertexCount > MAX_CHUNK_VERTICES) throw new Error(`${p.name} has ${vertexCount} vertices after simplification`);
    if (pending.vertexCount + vertexCount > MAX_CHUNK_VERTICES) flush();

    const positions = new Int16Array(vertexCount * 3);
    const normals = new Int8Array(vertexCount * 3);
    const regions = new Uint8Array(vertexCount).fill(NO_REGION);
    for (let old = 0; old < remap.length; old++) {
      const v = remap[old];
      if (v === 0xffffffff) continue;
      for (let k = 0; k < 3; k++) {
        positions[v * 3 + k] = Math.round((pos[old * 3 + k] / POSITION_SCALE) * 32767);
        normals[v * 3 + k] = Math.round((nrm[old * 3 + k] / 32767) * 127);
      }
    }
    const indices = new Uint16Array(simplified.length);
    for (let i = 0; i < simplified.length; i++) indices[i] = simplified[i] + pending.vertexCount;

    parts.push({
      name: p.name,
      system: systems.indexOf(p.system as ModelSystem),
      chunk: chunks.length,
      firstVertex: pending.vertexCount,
      vertexCount,
      firstIndex: pending.indexCount,
      indexCount: indices.length,
    });
    pending.positions.push(positions);
    pending.normals.push(normals);
    pending.regions.push(regions);
    pending.indices.push(indices);
    pending.vertexCount += vertexCount;
    pending.indexCount += indices.length;
  }
  flush();

  const triangles = parts.reduce((n, p) => n + p.indexCount / 3, 0);
  const manifest: BodyModelManifest = {
    version: 1,
    source: `BodyParts3D 4.0 via Human Atlas ${COMMIT.slice(0, 12)} (exercise add-on)`,
    triangles,
    regions: [],
    systems,
    parts,
    chunks,
  };
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
  fs.writeFileSync(path.join(OUT, "ATTRIBUTION.md"), ATTRIBUTION);

  const gzipTotal = chunks.reduce((n, c) => n + c.gzipBytes, 0);
  console.log(`add-on parts ${parts.length}, triangles ${triangles}, chunks ${chunks.length}, download ${(gzipTotal / 1e3).toFixed(0)} KB`);
  if (gzipTotal > MAX_GZIP_BYTES) {
    throw new Error(`Add-on is ${(gzipTotal / 1e3).toFixed(0)} KB; the cap is ${MAX_GZIP_BYTES / 1e3} KB. Lower TRIANGLE_BUDGET.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
