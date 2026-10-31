// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { NO_REGION, readChunk, type BodyModelManifest } from "@/lib/body-model-format";
import { ADDON_PART } from "@/lib/exercise-anatomy/addon-parts";
import { MUSCLES, type MuscleKey } from "@/lib/exercise-anatomy/muscles";

const ROOT = path.join(process.cwd(), "public", "models");
const read = (dir: string) => JSON.parse(fs.readFileSync(path.join(ROOT, dir, "manifest.json"), "utf8")) as BodyModelManifest;
const addon = read("exercise-anatomy");
const base = read("body-chart");

function sideProblem(names: readonly string[], patterns: readonly RegExp[]): string | null {
  const hits = names.filter((n) => patterns.some((r) => r.test(n)));
  if (!hits.length) return "matches no part";
  const sided = hits.filter((n) => /\b(right|left)\b/i.test(n));
  const both = sided.some((n) => /\bright\b/i.test(n)) && sided.some((n) => /\bleft\b/i.test(n));
  return sided.length && !both ? "matches one side only" : null;
}

describe("committed exercise-anatomy add-on model", () => {
  it("holds only add-on structures, with no booking areas", () => {
    expect(addon.regions).toEqual([]);
    expect(addon.parts.length).toBeGreaterThan(0);
    for (const p of addon.parts) expect(ADDON_PART.test(p.name), p.name).toBe(true);
  });

  it("stays a small download (at most 500 KB gzipped)", () => {
    const gz = addon.chunks.reduce((n, c) => n + fs.statSync(path.join(ROOT, "exercise-anatomy", c.file)).size, 0);
    expect(gz).toBe(addon.chunks.reduce((n, c) => n + c.gzipBytes, 0));
    expect(gz).toBeLessThanOrEqual(500_000);
  });

  it("tiles each chunk and keeps indices in range, with no areas baked in", () => {
    addon.chunks.forEach((c, i) => {
      const parts = addon.parts.filter((p) => p.chunk === i);
      expect(parts.reduce((n, p) => n + p.indexCount, 0)).toBe(c.indexCount);
      expect(parts.reduce((n, p) => n + p.vertexCount, 0)).toBe(c.vertexCount);
      const raw = gunzipSync(fs.readFileSync(path.join(ROOT, "exercise-anatomy", c.file)));
      const arrays = readChunk(c, raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length));
      expect(arrays.regions.every((r) => r === NO_REGION)).toBe(true);
      let maxIndex = 0;
      for (const i of arrays.indices) if (i > maxIndex) maxIndex = i; // no spread: tens of thousands of indices
      expect(maxIndex).toBeLessThan(c.vertexCount);
    });
  });

  it("lights add-on parts on both sides for every add-on muscle", () => {
    const names = addon.parts.map((p) => p.name);
    const keys = (Object.keys(MUSCLES) as MuscleKey[]).filter((k) => MUSCLES[k].source === "addon");
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) expect(sideProblem(names, MUSCLES[key].parts), key).toBeNull();
  });

  it("leaves the booking model untouched", () => {
    expect(base.parts).toHaveLength(569);
    expect(base.parts.filter((p) => ADDON_PART.test(p.name))).toEqual([]);
  });
});
