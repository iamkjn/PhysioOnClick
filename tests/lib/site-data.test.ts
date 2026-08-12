import { describe, it, expect } from "vitest";
import { exercises } from "@/lib/site-data";

const VALID_AREAS = new Set([
  "spine", "upper_limb", "lower_limb", "balance_walking",
  "neuro", "post_op", "pelvic_health", "paediatric", "general",
]);

describe("exercises library", () => {
  it("every exercise has a valid clinicalArea and non-empty tags", () => {
    for (const ex of exercises) {
      expect(VALID_AREAS.has(ex.clinicalArea)).toBe(true);
      expect(Array.isArray(ex.tags)).toBe(true);
      expect(ex.tags.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate ids", () => {
    const ids = exercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps existing exercise ids unchanged", () => {
    const ids = new Set(exercises.map((e) => e.id));
    for (let i = 1; i <= 16; i++) expect(ids.has(`ex-${i}`)).toBe(true);
    for (const id of [
      "face-smile", "face-brow-raise", "face-eye-close", "face-cheek-puff",
      "face-frown", "face-big-smile", "face-eye-wide", "face-pucker",
    ]) expect(ids.has(id)).toBe(true);
  });

  it("has grown the library to 150 or more exercises", () => {
    expect(exercises.length).toBeGreaterThanOrEqual(150);
  });

  it("has non-empty required fields and well-formed videoUrl for every exercise", () => {
    const EMBED_URL_PATTERN = /^https:\/\/www\.youtube\.com\/embed\//;
    for (const ex of exercises) {
      expect(ex.title?.trim()).toBeTruthy();
      expect(ex.bodyPart?.trim()).toBeTruthy();
      expect(ex.condition?.trim()).toBeTruthy();
      expect(ex.stage?.trim()).toBeTruthy();
      expect(ex.description?.trim()).toBeTruthy();
      if (ex.videoUrl) {
        expect(ex.videoUrl).toMatch(EMBED_URL_PATTERN);
      }
    }
  });
});
