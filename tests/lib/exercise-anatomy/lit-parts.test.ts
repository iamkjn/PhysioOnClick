// @vitest-environment node
// lit-parts.json is the clinically reviewed list of the exact model parts each
// muscle group lights (the practice owner requires every lit structure to be
// exactly the structure named). Change it, or the patterns in
// lib/exercise-anatomy/muscles.ts that feed it, only with clinical sign-off.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { BodyModelManifest } from "@/lib/body-model-format";
import { MUSCLES, type MuscleKey } from "@/lib/exercise-anatomy/muscles";
import { patternsFor } from "@/lib/exercise-anatomy/scene";
import locked from "./lit-parts.json";

const partNames = (dir: string) =>
  (JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "models", dir, "manifest.json"), "utf8")) as BodyModelManifest).parts.map((p) => p.name);
const base = partNames("body-chart");
const addon = partNames("exercise-anatomy");

/** Sorted, de-duplicated part names a group lights, read from the manifest its source names. */
function lit(key: MuscleKey): string[] {
  const { source } = MUSCLES[key];
  const names = source === "base" ? base : source === "addon" ? addon : [];
  return [...new Set(names.filter((n) => patternsFor(key).some((r) => r.test(n))))].sort();
}

describe("lit parts per muscle group", () => {
  it("matches the clinically reviewed list exactly", () => {
    const actual = Object.fromEntries((Object.keys(MUSCLES) as MuscleKey[]).sort().map((key) => [key, lit(key)]));
    expect(actual).toEqual(locked);
  });

  it("has a reviewed list for every muscle group and no strays", () => {
    expect(Object.keys(locked).sort()).toEqual(Object.keys(MUSCLES).sort());
  });

  it("lights nothing for a group that is not in any model", () => {
    for (const key of Object.keys(MUSCLES) as MuscleKey[]) {
      if (MUSCLES[key].source === "none") expect(locked[key as keyof typeof locked], key).toEqual([]);
    }
  });

  it("keeps the groups the owner tightened to their own structures", () => {
    expect(locked.triceps).toHaveLength(6);
    expect(locked.triceps.some((n) => /anconeus/i.test(n))).toBe(false);
    expect(locked["finger-extensors"].some((n) => /abductor pollicis/i.test(n))).toBe(false);
    expect(locked["deep-neck-flexors"].some((n) => /lateralis/i.test(n))).toBe(false);
    expect(locked["shoulder-joint"]).toEqual(["Left humerus", "Left scapula", "Right humerus", "Right scapula"]);
    expect(locked["erector-spinae"]).toEqual([
      "Left iliocostalis lumborum",
      "Left iliocostalis thoracis",
      "Left longissimus thoracis",
      "Left spinalis thoracis",
      "Right iliocostalis lumborum",
      "Right iliocostalis thoracis",
      "Right longissimus thoracis",
      "Right spinalis thoracis",
    ]);
  });
});
