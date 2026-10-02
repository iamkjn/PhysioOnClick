import { describe, it, expect } from "vitest";
import {
  BODY_AREAS,
  allExerciseSlugs,
  bodyAreaForExercise,
  exercisesByBodyArea,
  moreExercisesInArea,
} from "@/lib/exercise-library";

describe("bodyAreaForExercise", () => {
  it("maps every exercise to exactly one curated area", () => {
    for (const slug of allExerciseSlugs()) {
      expect(bodyAreaForExercise(slug), slug).not.toBeNull();
    }
    expect(bodyAreaForExercise("not-an-exercise")).toBeNull();
  });
});

describe("moreExercisesInArea", () => {
  it("returns siblings from the same area, never itself or excluded slugs", () => {
    const slug = "clam-shell";
    const area = bodyAreaForExercise(slug)!;
    const exclude = new Set([exercisesByBodyArea(area.key)[0]!.slug]);
    const more = moreExercisesInArea(slug, 12, exclude);
    expect(more.length).toBeGreaterThan(0);
    expect(more.length).toBeLessThanOrEqual(12);
    for (const ex of more) {
      expect(ex.slug).not.toBe(slug);
      expect(exclude.has(ex.slug)).toBe(false);
      expect(bodyAreaForExercise(ex.slug)?.key).toBe(area.key);
    }
  });

  it("spreads links evenly: every exercise in a multi-exercise area is linked from a sibling", () => {
    for (const area of BODY_AREAS) {
      const siblings = exercisesByBodyArea(area.key);
      if (siblings.length < 2) continue;
      const linked = new Set(siblings.flatMap((ex) => moreExercisesInArea(ex.slug, 12).map((m) => m.slug)));
      for (const ex of siblings) expect(linked.has(ex.slug), `${area.key}: ${ex.slug}`).toBe(true);
    }
  });
});

describe("library index coverage", () => {
  it("the body-area grouping covers every exercise exactly once", () => {
    const grouped = BODY_AREAS.flatMap((area) => exercisesByBodyArea(area.key).map((ex) => ex.slug));
    expect(new Set(grouped).size).toBe(grouped.length);
    expect(new Set(grouped)).toEqual(new Set(allExerciseSlugs()));
  });
});
