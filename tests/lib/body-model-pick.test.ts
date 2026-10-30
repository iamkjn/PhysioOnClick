// @vitest-environment node
import { describe, it, expect } from "vitest";
import type { ModelPart } from "@/lib/body-model-format";
import { computePartBoxes, pickChunk, type Vec3 } from "@/lib/body-model-pick";

const q = (v: number) => Math.round(v * 32767); // metres-ish → normalised Int16

// Two parts, each one triangle facing +Z (counter-clockwise seen from +Z):
// part 0 at z = 0.1 spanning x,y in [0, 0.2]; part 1 at z = -0.1 spanning x,y in [0.5, 0.7].
const positions = new Int16Array([
  q(0), q(0), q(0.1), q(0.2), q(0), q(0.1), q(0), q(0.2), q(0.1),
  q(0.5), q(0.5), q(-0.1), q(0.7), q(0.5), q(-0.1), q(0.5), q(0.7), q(-0.1),
]);
const indices = new Uint16Array([0, 1, 2, 3, 4, 5]);
const parts: ModelPart[] = [
  { name: "A", system: 0, chunk: 0, firstVertex: 0, vertexCount: 3, firstIndex: 0, indexCount: 3 },
  { name: "B", system: 1, chunk: 0, firstVertex: 3, vertexCount: 3, firstIndex: 3, indexCount: 3 },
];
const boxes = computePartBoxes(positions, parts);
const towardMinusZ: Vec3 = [0, 0, -1];

describe("computePartBoxes", () => {
  it("bounds each part's own vertices", () => {
    expect(boxes.length).toBe(12);
    expect(boxes[0]).toBeCloseTo(0, 3);
    expect(boxes[2]).toBeCloseTo(0.1, 3);
    expect(boxes[3]).toBeCloseTo(0.2, 3);
    expect(boxes[6]).toBeCloseTo(0.5, 3);
    expect(boxes[11]).toBeCloseTo(-0.1, 3);
  });
});

describe("pickChunk", () => {
  it("hits the triangle under the ray and reports its part and distance", () => {
    const hit = pickChunk([0.05, 0.05, 1], towardMinusZ, positions, indices, parts, boxes);
    expect(hit?.part).toBe(0);
    expect(hit?.distance).toBeCloseTo(0.9, 3);
  });

  it("picks the corner nearest the hit point", () => {
    expect(pickChunk([0.01, 0.01, 1], towardMinusZ, positions, indices, parts, boxes)?.vertex).toBe(0);
    expect(pickChunk([0.17, 0.01, 1], towardMinusZ, positions, indices, parts, boxes)?.vertex).toBe(1);
    expect(pickChunk([0.01, 0.17, 1], towardMinusZ, positions, indices, parts, boxes)?.vertex).toBe(2);
  });

  it("finds a part whose box the ray crosses, and misses empty space", () => {
    expect(pickChunk([0.55, 0.55, 1], towardMinusZ, positions, indices, parts, boxes)?.part).toBe(1);
    expect(pickChunk([0.35, 0.35, 1], towardMinusZ, positions, indices, parts, boxes)).toBeNull();
  });

  it("returns the nearest hit when parts overlap along the ray", () => {
    // Shift part B under part A by querying a ray that crosses both boxes: build a copy with B moved.
    const stacked = new Int16Array(positions);
    for (const v of [3, 4, 5]) {
      stacked[v * 3] -= q(0.5);
      stacked[v * 3 + 1] -= q(0.5);
    }
    const stackedBoxes = computePartBoxes(stacked, parts);
    const hit = pickChunk([0.05, 0.05, 1], towardMinusZ, stacked, indices, parts, stackedBoxes);
    expect(hit?.part).toBe(0); // z = 0.1 is nearer to the camera at z = 1 than z = -0.1
  });

  it("picks the Euclidean-nearest corner on a long thin triangle, as the viewer did before", () => {
    // A (0,0), B (0.9,0), C (0,0.1). At (0.4, 0.04) corner B has the largest barycentric
    // weight, but A is the closest corner.
    const thin = new Int16Array([q(0), q(0), q(0.1), q(0.9), q(0), q(0.1), q(0), q(0.1), q(0.1)]);
    const thinParts: ModelPart[] = [
      { name: "T", system: 0, chunk: 0, firstVertex: 0, vertexCount: 3, firstIndex: 0, indexCount: 3 },
    ];
    const hit = pickChunk([0.4, 0.04, 1], towardMinusZ, thin, new Uint16Array([0, 1, 2]), thinParts, computePartBoxes(thin, thinParts));
    expect(hit?.vertex).toBe(0);
  });

  it("ignores back faces (rays from behind)", () => {
    expect(pickChunk([0.05, 0.05, -1], [0, 0, 1], positions, indices, parts, boxes)).toBeNull();
  });

  it("ignores hits beyond maxDistance", () => {
    expect(pickChunk([0.05, 0.05, 1], towardMinusZ, positions, indices, parts, boxes, 0.5)).toBeNull();
  });
});
