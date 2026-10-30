import { describe, it, expect } from "vitest";
import {
  NO_REGION,
  baseColors,
  chunkLayout,
  linearBytes,
  paintColors,
  partForFace,
  readChunk,
  writeChunk,
  type ChunkArrays,
  type ModelPart,
} from "@/lib/body-model-format";

function sample(): ChunkArrays {
  return {
    positions: new Int16Array([0, 1, 2, -3, -4, -5, 32767, -32767, 7]),
    normals: new Int8Array([127, 0, 0, 0, -127, 0, 0, 0, 1]),
    regions: new Uint8Array([3, 4, NO_REGION]),
    indices: new Uint16Array([0, 1, 2, 2, 1, 0]),
  };
}

describe("chunk layout", () => {
  it("4-byte aligns every block", () => {
    const l = chunkLayout(3, 6);
    expect(l).toEqual({ positions: 0, normals: 20, regions: 32, indices: 36, bytes: 48 });
  });

  it("round-trips through writeChunk/readChunk", () => {
    const a = sample();
    const bytes = writeChunk(a);
    const b = readChunk(
      { file: "chunk-0.bin.gz", bytes: bytes.length, gzipBytes: 1, vertexCount: 3, indexCount: 6 },
      bytes.slice().buffer
    );
    expect([...b.positions]).toEqual([...a.positions]);
    expect([...b.normals]).toEqual([...a.normals]);
    expect([...b.regions]).toEqual([...a.regions]);
    expect([...b.indices]).toEqual([...a.indices]);
  });

  it("rejects a buffer of the wrong size", () => {
    expect(() =>
      readChunk({ file: "chunk-0.bin.gz", bytes: 48, gzipBytes: 1, vertexCount: 3, indexCount: 6 }, new ArrayBuffer(40))
    ).toThrow(/expected 48/);
  });
});

describe("partForFace", () => {
  const parts: ModelPart[] = [
    { name: "A", system: 0, chunk: 0, firstVertex: 0, vertexCount: 3, firstIndex: 0, indexCount: 6 },
    { name: "B", system: 1, chunk: 0, firstVertex: 3, vertexCount: 3, firstIndex: 6, indexCount: 3 },
  ];
  it("finds the part that owns a triangle", () => {
    expect(partForFace(parts, 0)?.name).toBe("A");
    expect(partForFace(parts, 1)?.name).toBe("A");
    expect(partForFace(parts, 2)?.name).toBe("B");
    expect(partForFace(parts, 3)).toBeUndefined();
  });
});

describe("colours", () => {
  it("converts sRGB hex to linear bytes", () => {
    expect(linearBytes("#FFFFFF")).toEqual([255, 255, 255]);
    expect(linearBytes("#000000")).toEqual([0, 0, 0]);
    expect(linearBytes("#0EA5E9")).toEqual([1, 96, 208]);
  });

  it("paints selected areas in the accent, the hovered area part-way, the rest in the base colour", () => {
    const parts: ModelPart[] = [
      { name: "bone", system: 0, chunk: 0, firstVertex: 0, vertexCount: 2, firstIndex: 0, indexCount: 3 },
      { name: "muscle", system: 1, chunk: 0, firstVertex: 2, vertexCount: 1, firstIndex: 3, indexCount: 3 },
    ];
    const base = baseColors(parts, ["skeletal", "muscular", "connective"], 3);
    expect([...base.slice(0, 3)]).toEqual(linearBytes("#E8DFC6"));
    expect([...base.slice(6, 9)]).toEqual(linearBytes("#C48C7C"));

    const out = new Uint8Array(9);
    paintColors(out, base, new Uint8Array([5, 6, 7]), new Set([5]), 6);
    expect([...out.slice(0, 3)]).toEqual([1, 96, 208]);
    const hovered = [...out.slice(3, 6)];
    expect(hovered).not.toEqual([...base.slice(3, 6)]);
    expect(hovered).not.toEqual([1, 96, 208]);
    expect([...out.slice(6, 9)]).toEqual([...base.slice(6, 9)]);
  });
});
