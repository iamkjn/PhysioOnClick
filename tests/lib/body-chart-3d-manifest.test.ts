// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, it, expect } from "vitest";
import { BODY_REGIONS } from "@/lib/body-chart";
import { NO_REGION, readChunk, type BodyModelManifest } from "@/lib/body-model-format";

const DIR = path.join(process.cwd(), "public", "models", "body-chart");
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8")) as BodyModelManifest;

describe("committed 3D body model", () => {
  it("uses exactly the BODY_REGIONS keys, in order", () => {
    expect(manifest.regions).toEqual(BODY_REGIONS.map((r) => r.key));
  });

  it("stays within the 6 MB download cap", () => {
    const gz = manifest.chunks.reduce((n, c) => n + fs.statSync(path.join(DIR, c.file)).size, 0);
    expect(gz).toBe(manifest.chunks.reduce((n, c) => n + c.gzipBytes, 0));
    expect(gz).toBeLessThanOrEqual(6_000_000);
  });

  it("gives every vertex an area, and covers all 31 areas", () => {
    const seen = new Set<number>();
    let unassigned = 0;
    for (const c of manifest.chunks) {
      const raw = gunzipSync(fs.readFileSync(path.join(DIR, c.file)));
      const arrays = readChunk(c, raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length));
      for (const r of arrays.regions) {
        if (r === NO_REGION) unassigned++;
        else seen.add(r);
      }
      let maxIndex = 0;
      for (const i of arrays.indices) if (i > maxIndex) maxIndex = i;
      expect(maxIndex).toBeLessThan(c.vertexCount);
    }
    expect(unassigned).toBe(0);
    expect(seen.size).toBe(BODY_REGIONS.length);
  });

  it("lists parts that tile each chunk's index range", () => {
    manifest.chunks.forEach((c, i) => {
      const parts = manifest.parts.filter((p) => p.chunk === i);
      expect(parts.reduce((n, p) => n + p.indexCount, 0)).toBe(c.indexCount);
      expect(parts.reduce((n, p) => n + p.vertexCount, 0)).toBe(c.vertexCount);
    });
  });

  it("keeps every part's triangles inside its own vertex range", () => {
    let outOfRange = 0;
    manifest.chunks.forEach((c, i) => {
      const raw = gunzipSync(fs.readFileSync(path.join(DIR, c.file)));
      const { indices } = readChunk(c, raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length));
      for (const p of manifest.parts.filter((part) => part.chunk === i)) {
        for (let k = p.firstIndex; k < p.firstIndex + p.indexCount; k++) {
          const v = indices[k];
          if (v < p.firstVertex || v >= p.firstVertex + p.vertexCount) outOfRange++;
        }
      }
    });
    expect(outOfRange).toBe(0);
  });

  it("ships the CC BY 4.0 and MIT attribution", () => {
    const text = fs.readFileSync(path.join(DIR, "ATTRIBUTION.md"), "utf8");
    expect(text).toMatch(/BodyParts3D/);
    expect(text).toMatch(/CC BY 4\.0|Creative Commons Attribution 4\.0/);
    expect(text).toMatch(/MIT License/);
  });
});
