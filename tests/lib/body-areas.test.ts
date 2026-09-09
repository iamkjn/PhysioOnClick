import { describe, it, expect } from "vitest";

import { exercises } from "@/lib/exercises";
import {
  BODY_AREAS,
  getBodyArea,
  allBodyAreaKeys,
  type BodyArea,
} from "@/lib/body-areas";
import {
  bodyAreas,
  exercisesByBodyArea,
  conditionsByBodyArea,
} from "@/lib/exercise-library";

// The curated public taxonomy: 13 body regions from the plan + a `general`
// bucket for the `General` bodyPart exercises = 14. Every internal
// `Exercise.bodyPart` clinical code must roll up into exactly one area.
const EXPECTED_AREA_COUNT = 14;

// Clinical shorthand that must never surface in a public label. `Balance` is a
// plain English word (kept in "Balance & falls" per the plan's verbatim map) so
// it is not on this list; the rest are jargon.
const JARGON = /\b(Neuro|Post-op|Cervical|Lumbar|Thoracic)\b/;

describe("lib/body-areas: BODY_AREAS shape", () => {
  it(`has exactly ${EXPECTED_AREA_COUNT} entries`, () => {
    expect(BODY_AREAS).toHaveLength(EXPECTED_AREA_COUNT);
  });

  it("has a unique, kebab-case key for every area", () => {
    const keys = BODY_AREAS.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(key, `key "${key}" is not kebab-case`).toMatch(/^[a-z][a-z-]*[a-z]$/);
    }
  });

  it("has an ascending, contiguous `order` matching display order", () => {
    const orders = BODY_AREAS.map((a) => a.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("has ASCII, jargon-free labels and a one-sentence blurb", () => {
    for (const area of BODY_AREAS) {
      expect(area.label, `"${area.label}" is not ASCII`).toMatch(/^[\x20-\x7E]+$/);
      expect(area.label, `"${area.label}" leaks jargon`).not.toMatch(JARGON);
      // The whole record is pure ASCII: no en/em dash, curly quote or ellipsis
      // (U+2013 U+2014 U+2018 U+2019 U+201C U+201D U+2026) anywhere in the copy.
      expect(`${area.label} ${area.blurb}`).toMatch(/^[\x20-\x7E]+$/);
      expect(area.blurb, `${area.key} blurb is empty`).not.toBe("");
      expect(area.blurb, `${area.key} blurb is not a sentence`).toMatch(/^[\x20-\x7E]+\.$/);
    }
  });
});

describe("lib/body-areas: bodyPart coverage", () => {
  const catalogueBodyParts = [...new Set(exercises.map((e) => e.bodyPart))];

  it("covers every distinct Exercise.bodyPart in the real catalogue", () => {
    const mapped = new Set(BODY_AREAS.flatMap((a) => a.bodyParts));
    for (const part of catalogueBodyParts) {
      expect(mapped.has(part), `bodyPart "${part}" is not mapped to any area`).toBe(
        true,
      );
    }
  });

  it("maps every bodyPart into exactly one area (no double-counting)", () => {
    const seen = new Map<string, string[]>();
    for (const area of BODY_AREAS) {
      for (const part of area.bodyParts) {
        seen.set(part, [...(seen.get(part) ?? []), area.key]);
      }
    }
    for (const [part, owners] of seen) {
      expect(owners, `bodyPart "${part}" is in >1 area: ${owners.join(", ")}`).toHaveLength(
        1,
      );
    }
  });

  it("lists no bodyPart that is absent from the catalogue", () => {
    const catalogue = new Set(catalogueBodyParts);
    for (const area of BODY_AREAS) {
      for (const part of area.bodyParts) {
        expect(catalogue.has(part), `"${part}" (in ${area.key}) is not a real bodyPart`).toBe(
          true,
        );
      }
    }
  });
});

describe("lib/body-areas: getBodyArea / allBodyAreaKeys", () => {
  it("returns the area on a hit", () => {
    const area = getBodyArea("shoulder") as BodyArea;
    expect(area).not.toBeNull();
    expect(area.key).toBe("shoulder");
    expect(area.label).toBe("Shoulder");
  });

  it("returns null on a miss", () => {
    expect(getBodyArea("nonsense")).toBeNull();
    expect(getBodyArea("Shoulder")).toBeNull();
    expect(getBodyArea("")).toBeNull();
  });

  it("allBodyAreaKeys() lists every key in display order", () => {
    expect(allBodyAreaKeys()).toEqual(BODY_AREAS.map((a) => a.key));
    expect(allBodyAreaKeys()).toHaveLength(EXPECTED_AREA_COUNT);
  });
});

describe("lib/exercise-library: curated *ByBodyArea helpers", () => {
  it("bodyAreas() returns the curated keys, no jargon, no sports page", () => {
    const keys = bodyAreas();
    expect(keys).toEqual(allBodyAreaKeys());
    expect(keys).toContain("shoulder");
    expect(keys).toContain("lower-back");
    expect(keys).not.toContain("Sports & return to activity");
    expect(keys).not.toContain("Neuro");
  });

  it("exercisesByBodyArea('shoulder') returns only shoulder-area exercises", () => {
    const found = exercisesByBodyArea("shoulder");
    const shoulderParts = getBodyArea("shoulder")!.bodyParts;
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((e) => shoulderParts.includes(e.bodyPart))).toBe(true);
  });

  it("exercisesByBodyArea rolls multiple bodyParts into one area", () => {
    const found = exercisesByBodyArea("elbow-wrist-hand").map((e) => e.bodyPart);
    expect(new Set(found).size).toBeGreaterThan(1);
    expect(exercisesByBodyArea("unknown-area")).toEqual([]);
  });

  it("conditionsByBodyArea('shoulder') returns the shoulder condition hubs", () => {
    const hubs = conditionsByBodyArea("shoulder").map((c) => c.slug);
    expect(hubs).toContain("rotator-cuff-tendinopathy");
    expect(hubs.every((s) => typeof s === "string")).toBe(true);
  });

  it("conditionsByBodyArea returns [] for an area with no conditionArea", () => {
    expect(getBodyArea("neuro")!.conditionArea).toBeUndefined();
    expect(conditionsByBodyArea("neuro")).toEqual([]);
    expect(conditionsByBodyArea("upper-back")).toEqual([]);
    expect(conditionsByBodyArea("unknown-area")).toEqual([]);
  });

  it("does not surface a sports body area (sports stays condition-led)", () => {
    expect(allBodyAreaKeys().some((k) => k.includes("sport"))).toBe(false);
  });
});
