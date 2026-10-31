// @vitest-environment node
import { gzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NO_REGION, writeChunk, type BodyModelManifest } from "@/lib/body-model-format";
import { loadAnatomyAddon, resetAnatomyAddonForTests } from "@/lib/exercise-anatomy/addon-loader";

const chunkBytes = writeChunk({
  positions: new Int16Array([0, 0, 0, 100, 0, 0, 0, 100, 0]),
  normals: new Int8Array([0, 0, 127, 0, 0, 127, 0, 0, 127]),
  regions: new Uint8Array([NO_REGION, NO_REGION, NO_REGION]),
  indices: new Uint16Array([0, 1, 2]),
});
const gz = gzipSync(chunkBytes);
const manifest: BodyModelManifest = {
  version: 1,
  source: "test",
  triangles: 1,
  regions: [],
  systems: ["skeletal", "muscular", "connective"],
  parts: [{ name: "Diaphragm", system: 1, chunk: 0, firstVertex: 0, vertexCount: 3, firstIndex: 0, indexCount: 3 }],
  chunks: [{ file: "chunk-0.bin.gz", bytes: chunkBytes.length, gzipBytes: gz.length, vertexCount: 3, indexCount: 3 }],
};

function mockFetch(fail = false) {
  return vi.fn(async (url: string) => {
    if (fail) return new Response("nope", { status: 500 });
    if (url === "/models/exercise-anatomy/manifest.json") return new Response(JSON.stringify(manifest));
    if (url === "/models/exercise-anatomy/chunk-0.bin.gz") return new Response(new Uint8Array(gz));
    return new Response("missing", { status: 404 });
  });
}

beforeEach(() => resetAnatomyAddonForTests());
afterEach(() => vi.unstubAllGlobals());

describe("loadAnatomyAddon", () => {
  it("downloads and decodes the add-on from its own folder", async () => {
    vi.stubGlobal("fetch", mockFetch());
    const addon = await loadAnatomyAddon();
    expect(addon.manifest.parts[0].name).toBe("Diaphragm");
    expect([...addon.chunks[0].indices]).toEqual([0, 1, 2]);
  });

  it("downloads once however many times it is asked", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all([loadAnatomyAddon(), loadAnatomyAddon()]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries after a failed download", async () => {
    vi.stubGlobal("fetch", mockFetch(true));
    await expect(loadAnatomyAddon()).rejects.toThrow();
    vi.stubGlobal("fetch", mockFetch());
    await expect(loadAnatomyAddon()).resolves.toBeTruthy();
  });
});
