// lib/body-model-pick.ts
// Ray picking for the 3D body chart without testing every triangle: one
// axis-aligned box per anatomical part, then Möller–Trumbore only on parts
// whose box the ray crosses. Front faces only (three.js's default FrontSide).
// Pure maths — deliberately no three.js import, so nothing here can pull
// three.js into a static bundle. Coordinates are the model's normalised units
// (Int16 / 32767), i.e. mesh-local space.

import type { ModelPart } from "@/lib/body-model-format";

export type Vec3 = [number, number, number];

export interface ChunkHit {
  part: number; // index into the parts array passed to pickChunk
  vertex: number; // chunk vertex index of the corner nearest the hit
  distance: number; // ray parameter t, in the units of `origin`
}

const unit = (v: number) => Math.max(v / 32767, -1);

export function computePartBoxes(positions: Int16Array, parts: readonly ModelPart[]): Float32Array {
  const boxes = new Float32Array(parts.length * 6);
  parts.forEach((part, p) => {
    const box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    for (let v = part.firstVertex; v < part.firstVertex + part.vertexCount; v++) {
      for (let k = 0; k < 3; k++) {
        const c = unit(positions[v * 3 + k]);
        if (c < box[k]) box[k] = c;
        if (c > box[k + 3]) box[k + 3] = c;
      }
    }
    boxes.set(box, p * 6);
  });
  return boxes;
}

function rayHitsBox(o: Vec3, d: Vec3, boxes: Float32Array, p: number, maxDistance: number): boolean {
  let tMin = 0;
  let tMax = maxDistance;
  for (let k = 0; k < 3; k++) {
    const lo = boxes[p * 6 + k];
    const hi = boxes[p * 6 + k + 3];
    if (Math.abs(d[k]) < 1e-12) {
      if (o[k] < lo || o[k] > hi) return false;
      continue;
    }
    let t1 = (lo - o[k]) / d[k];
    let t2 = (hi - o[k]) / d[k];
    if (t1 > t2) [t1, t2] = [t2, t1];
    if (t1 > tMin) tMin = t1;
    if (t2 < tMax) tMax = t2;
    if (tMin > tMax) return false;
  }
  return true;
}

export function pickChunk(
  origin: Vec3,
  direction: Vec3,
  positions: Int16Array,
  indices: Uint16Array,
  parts: readonly ModelPart[],
  boxes: Float32Array,
  maxDistance = Infinity
): ChunkHit | null {
  let best: ChunkHit | null = null;
  const [ox, oy, oz] = origin;
  const [dx, dy, dz] = direction;
  for (let p = 0; p < parts.length; p++) {
    if (!rayHitsBox(origin, direction, boxes, p, best ? best.distance : maxDistance)) continue;
    const part = parts[p];
    for (let i = part.firstIndex; i < part.firstIndex + part.indexCount; i += 3) {
      const a = indices[i];
      const b = indices[i + 1];
      const c = indices[i + 2];
      const ax = unit(positions[a * 3]), ay = unit(positions[a * 3 + 1]), az = unit(positions[a * 3 + 2]);
      const e1x = unit(positions[b * 3]) - ax, e1y = unit(positions[b * 3 + 1]) - ay, e1z = unit(positions[b * 3 + 2]) - az;
      const e2x = unit(positions[c * 3]) - ax, e2y = unit(positions[c * 3 + 1]) - ay, e2z = unit(positions[c * 3 + 2]) - az;
      // Face normal (unnormalised) and its alignment with the ray.
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      const dDotN = dx * nx + dy * ny + dz * nz;
      if (dDotN >= 0) continue; // back face or parallel
      const qx = ox - ax, qy = oy - ay, qz = oz - az;
      // u = weight of b, v = weight of c (signs flipped because dDotN < 0).
      const u = -(dx * (qy * e2z - qz * e2y) + dy * (qz * e2x - qx * e2z) + dz * (qx * e2y - qy * e2x));
      if (u < 0) continue;
      const v = -(dx * (e1y * qz - e1z * qy) + dy * (e1z * qx - e1x * qz) + dz * (e1x * qy - e1y * qx));
      if (v < 0 || u + v > -dDotN) continue;
      const t = (qx * nx + qy * ny + qz * nz) / -dDotN;
      if (t < 0 || t > (best ? best.distance : maxDistance)) continue;
      // The corner closest to the hit point (Euclidean), as the viewer did before.
      // Not the largest barycentric weight: on long thin triangles those differ.
      const hx = qx + dx * t, hy = qy + dy * t, hz = qz + dz * t; // hit point relative to corner a
      const da = hx * hx + hy * hy + hz * hz;
      const db = (hx - e1x) ** 2 + (hy - e1y) ** 2 + (hz - e1z) ** 2;
      const dc = (hx - e2x) ** 2 + (hy - e2y) ** 2 + (hz - e2z) ** 2;
      const vertex = db < da && db <= dc ? b : dc < da && dc < db ? c : a;
      best = { part: p, vertex, distance: t };
    }
  }
  return best;
}
