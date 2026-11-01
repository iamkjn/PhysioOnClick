// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ANATOMY_BATCHES, EXERCISE_ANATOMY, canShow3D, entryProblems } from "@/lib/exercise-anatomy";
import { exercises } from "@/lib/exercises";

const slugs = new Set(exercises.map((e) => e.slug));

describe("exercise anatomy entries", () => {
  it("keys every entry by a real exercise slug", () => {
    for (const slug of Object.keys(EXERCISE_ANATOMY)) expect(slugs.has(slug), slug).toBe(true);
  });

  it("never lists one exercise in two batches", () => {
    const total = ANATOMY_BATCHES.reduce((n, batch) => n + Object.keys(batch).length, 0);
    expect(Object.keys(EXERCISE_ANATOMY)).toHaveLength(total);
  });

  it("follows the writing rules", () => {
    for (const [slug, entry] of Object.entries(EXERCISE_ANATOMY)) expect(entryProblems(entry), slug).toEqual([]);
  });

  it("has an entry for every exercise in the library", () => {
    const missing = exercises.filter((e) => !e.retired && !EXERCISE_ANATOMY[e.slug]).map((e) => e.slug);
    expect(missing).toEqual([]);
  });

  it("keeps exercises whose main muscles are all unmodelled text-only", () => {
    for (const slug of [
      "median-nerve-glide",
      "sciatic-nerve-glide",
      "diastasis-safe-curl-up",
      "core-bracing-post-abdominal-surgery",
      "sensory-motor-circuit-multi-station",
    ]) {
      expect(canShow3D(EXERCISE_ANATOMY[slug]), slug).toBe(false);
    }
  });

  it("keeps face exercises out of 3D", () => {
    for (const e of exercises.filter((x) => x.bodyPart === "Face")) {
      const entry = EXERCISE_ANATOMY[e.slug];
      if (entry) expect(canShow3D(entry), e.slug).toBe(false);
    }
  });
});
