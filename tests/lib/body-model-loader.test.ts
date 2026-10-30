// @vitest-environment node
import { gzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { writeChunk, type BodyModelManifest } from "@/lib/body-model-format";
import { loadBodyModel, onBodyModelProgress, resetBodyModelForTests } from "@/lib/body-model-loader";

const chunkBytes = writeChunk({
  positions: new Int16Array([0, 0, 0, 100, 0, 0, 0, 100, 0]),
  normals: new Int8Array([0, 0, 127, 0, 0, 127, 0, 0, 127]),
  regions: new Uint8Array([0, 1, 2]),
  indices: new Uint16Array([0, 1, 2]),
});
const gz = gzipSync(chunkBytes);
const manifest: BodyModelManifest = {
  version: 1,
  source: "test",
  triangles: 1,
  regions: ["head-jaw", "neck", "upper-back"],
  systems: ["skeletal", "muscular", "connective"],
  parts: [{ name: "Test", system: 0, chunk: 0, firstVertex: 0, vertexCount: 3, firstIndex: 0, indexCount: 3 }],
  chunks: [{ file: "chunk-0.bin.gz", bytes: chunkBytes.length, gzipBytes: gz.length, vertexCount: 3, indexCount: 3 }],
};

function mockFetch(fail = false) {
  return vi.fn(async (url: string) => {
    if (fail) return new Response("nope", { status: 500 });
    if (url.endsWith("/manifest.json")) return new Response(JSON.stringify(manifest));
    if (url.endsWith("/chunk-0.bin.gz")) return new Response(new Uint8Array(gz));
    return new Response("missing", { status: 404 });
  });
}

beforeEach(() => resetBodyModelForTests());
afterEach(() => vi.unstubAllGlobals());

describe("loadBodyModel", () => {
  it("downloads, gunzips and decodes the model", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const model = await loadBodyModel();
    expect(model.manifest.regions).toEqual(["head-jaw", "neck", "upper-back"]);
    expect([...model.chunks[0].regions]).toEqual([0, 1, 2]);
    expect([...model.chunks[0].indices]).toEqual([0, 1, 2]);
  });

  it("downloads once however many times it is asked", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all([loadBodyModel(), loadBodyModel()]);
    await loadBodyModel();
    expect(fetchMock).toHaveBeenCalledTimes(2); // manifest + one chunk
  });

  it("retries after a failed download", async () => {
    vi.stubGlobal("fetch", mockFetch(true));
    await expect(loadBodyModel()).rejects.toThrow();
    vi.stubGlobal("fetch", mockFetch());
    await expect(loadBodyModel()).resolves.toBeTruthy();
  });

  it("reports progress in compressed bytes", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const progress = vi.fn();
    const off = onBodyModelProgress(progress);
    await loadBodyModel();
    off();
    expect(progress).toHaveBeenLastCalledWith(gz.length, gz.length);
  });
});
