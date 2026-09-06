import { describe, it, expect, vi } from "vitest";

// Inject one retired exercise into the catalogue the picker reads. The live
// catalogue has none, so retired-filtering can only be exercised with a fixture.
const { RETIRED_EX } = vi.hoisted(() => ({
  RETIRED_EX: {
    id: "ex-retired-fixture", title: "Retired Move", bodyPart: "Knee",
    clinicalArea: "lower_limb", tags: ["knee", "quad-strength"],
    condition: "Test condition", stage: "Early rehab",
    description: "A retired fixture exercise.", retired: true,
  },
}));
vi.mock("@/lib/site-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/site-data")>();
  return { ...actual, exercises: [...actual.exercises, RETIRED_EX] };
});

import { suggestExercises } from "@/lib/exercise-suggestions";

describe("suggestExercises", () => {
  it("scores an exact clinicalArea match higher than no match", () => {
    const results = suggestExercises({ clinicalArea: "lower_limb", alreadyAssignedIds: [] });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].exercise.clinicalArea).toBe("lower_limb");
  });

  it("boosts score when freeText contains a matching tag keyword", () => {
    const results = suggestExercises({
      clinicalArea: "lower_limb",
      freeText: "patient reports knee pain after replacement surgery",
      alreadyAssignedIds: [],
    });
    const top = results[0];
    expect(top.exercise.tags.some((t) => "knee pain after replacement surgery".includes(t) || t.includes("knee"))).toBe(true);
  });

  it("excludes already-assigned exercise ids", () => {
    const results = suggestExercises({ clinicalArea: "lower_limb", alreadyAssignedIds: ["ex-1", "ex-5", "ex-6", "ex-7", "ex-16"] });
    const ids = results.map((r) => r.exercise.id);
    expect(ids).not.toContain("ex-1");
    expect(ids).not.toContain("ex-5");
  });

  it("prefers earlier-stage exercises when scores tie", () => {
    const results = suggestExercises({ clinicalArea: "spine", alreadyAssignedIds: [] }, 20);
    const stages = results.map((r) => r.exercise.stage);
    const firstEarly = stages.indexOf("Early rehab");
    const firstReturn = stages.indexOf("Return to function");
    if (firstEarly !== -1 && firstReturn !== -1) {
      expect(firstEarly).toBeLessThan(firstReturn);
    }
  });

  it("returns at most `limit` results", () => {
    const results = suggestExercises({ clinicalArea: "general", alreadyAssignedIds: [] }, 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("gives every result a non-empty, deterministic reason string", () => {
    const a = suggestExercises({ clinicalArea: "upper_limb", freeText: "shoulder pain", alreadyAssignedIds: [] });
    const b = suggestExercises({ clinicalArea: "upper_limb", freeText: "shoulder pain", alreadyAssignedIds: [] });
    expect(a.map((r) => r.reason)).toEqual(b.map((r) => r.reason));
    expect(a.every((r) => r.reason.length > 0)).toBe(true);
  });

  it("returns an empty array when clinicalArea and freeText are both absent", () => {
    const results = suggestExercises({ alreadyAssignedIds: [] });
    expect(results).toEqual([]);
  });

  it("never suggests a retired exercise even when its area and tags match strongly", () => {
    const results = suggestExercises(
      { clinicalArea: "lower_limb", freeText: "knee quad-strength", alreadyAssignedIds: [] },
      200,
    );
    expect(results.map((r) => r.exercise.id)).not.toContain("ex-retired-fixture");
  });
});
