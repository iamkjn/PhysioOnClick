import { describe, it, expect } from "vitest";
import { FRONT_MUSCLES, BACK_MUSCLES } from "body-muscles";
import {
  BODY_REGIONS,
  REGION_MUSCLES,
  SOMEWHERE_ELSE,
  regionLabel,
  regionClinical,
  deriveClinicalArea,
  describeRegions,
  deriveSymptomStartDate,
  deriveOnsetPattern,
} from "@/lib/body-chart";
import { allBodyAreaKeys } from "@/lib/body-areas";

const MUSCLE_IDS = new Set([...FRONT_MUSCLES, ...BACK_MUSCLES].map((m) => m.id));

describe("body-chart taxonomy", () => {
  it("every region has a unique key, label and clinical name", () => {
    const keys = BODY_REGIONS.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const r of BODY_REGIONS) {
      expect(r.label.length).toBeGreaterThan(1);
      expect(r.clinical.length).toBeGreaterThan(1);
    }
  });

  it("every region.areaKey (when set) is a real exercise-library body area", () => {
    const valid = new Set(allBodyAreaKeys());
    for (const r of BODY_REGIONS) {
      if (r.areaKey) expect(valid.has(r.areaKey)).toBe(true);
    }
  });

  it("every region maps to real body-muscles ids in at least one view", () => {
    for (const r of BODY_REGIONS) {
      const map = REGION_MUSCLES[r.key];
      expect(map, r.key).toBeTruthy();
      const all = [...(map.front ?? []), ...(map.back ?? [])];
      expect(all.length, r.key).toBeGreaterThan(0);
      for (const id of all) expect(MUSCLE_IDS.has(id), `${r.key} -> ${id}`).toBe(true);
    }
  });

  it("covers hands, feet, elbow and face", () => {
    const keys = BODY_REGIONS.map((r) => r.key);
    expect(keys).toEqual(expect.arrayContaining(["hand-left", "hand-right", "foot-left", "foot-right", "elbow-left", "head-jaw"]));
  });

  it("regionLabel / regionClinical resolve known keys and are graceful otherwise", () => {
    expect(regionLabel("neck")).toMatch(/neck/i);
    expect(regionClinical("neck")).toMatch(/cervical/i);
    expect(regionLabel("nonsense")).toBe("nonsense");
    expect(regionClinical("nonsense")).toBe("");
  });
});

describe("deriveClinicalArea", () => {
  it("spine keys win", () => {
    expect(deriveClinicalArea(["lower-back"])).toBe("spine");
    expect(deriveClinicalArea(["neck", "shoulder-left"])).toBe("spine");
  });
  it("upper limb", () => {
    expect(deriveClinicalArea(["shoulder-left"])).toBe("upper_limb");
    expect(deriveClinicalArea(["hand-right"])).toBe("upper_limb");
  });
  it("lower limb", () => {
    expect(deriveClinicalArea(["knee-left"])).toBe("lower_limb");
    expect(deriveClinicalArea(["buttock-left", "foot-right"])).toBe("lower_limb");
  });
  it("mixed, chest-only, empty, or somewhere-else -> general", () => {
    expect(deriveClinicalArea(["shoulder-left", "knee-left"])).toBe("general");
    expect(deriveClinicalArea(["chest"])).toBe("general");
    expect(deriveClinicalArea([])).toBe("general");
    expect(deriveClinicalArea([SOMEWHERE_ELSE])).toBe("general");
  });
});

describe("describeRegions", () => {
  it("joins human labels", () => {
    const s = describeRegions(["shoulder-right", "lower-back"]).toLowerCase();
    expect(s).toContain("shoulder");
    expect(s).toContain("lower back");
  });
  it("somewhere-else and empty", () => {
    expect(describeRegions([SOMEWHERE_ELSE]).toLowerCase()).toContain("somewhere else");
    expect(describeRegions([])).toBe("");
  });
  it("caps at 120 chars", () => {
    expect(describeRegions(BODY_REGIONS.map((r) => r.key)).length).toBeLessThanOrEqual(120);
  });
});

describe("deriveSymptomStartDate / deriveOnsetPattern", () => {
  const isPastIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s) < new Date();
  it("maps how-long to a past ISO date or empty", () => {
    expect(isPastIso(deriveSymptomStartDate("days"))).toBe(true);
    expect(isPastIso(deriveSymptomStartDate("weeks"))).toBe(true);
    expect(isPastIso(deriveSymptomStartDate("months"))).toBe(true);
    expect(deriveSymptomStartDate("since-op")).toBe("");
    expect(deriveSymptomStartDate("not-sure")).toBe("");
  });
  it("maps how-long to an onset pattern", () => {
    expect(deriveOnsetPattern("days")).toBe("sudden");
    expect(deriveOnsetPattern("weeks")).toBe("gradual");
    expect(deriveOnsetPattern("months")).toBe("gradual");
    expect(deriveOnsetPattern("since-op")).toBe("post_surgery");
    expect(deriveOnsetPattern("not-sure")).toBe("not_sure");
  });
});
