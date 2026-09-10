import { describe, it, expect } from "vitest";
import {
  BODY_REGIONS,
  SOMEWHERE_ELSE,
  regionLabel,
  deriveClinicalArea,
  describeRegions,
  deriveSymptomStartDate,
  deriveOnsetPattern,
} from "@/lib/body-chart";
import { allBodyAreaKeys } from "@/lib/body-areas";

describe("body-chart taxonomy", () => {
  it("every region has a unique key and a label", () => {
    const keys = BODY_REGIONS.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const r of BODY_REGIONS) expect(r.label.length).toBeGreaterThan(1);
  });

  it("every region.areaKey (when set) is a real exercise-library body area", () => {
    const valid = new Set(allBodyAreaKeys());
    for (const r of BODY_REGIONS) {
      if (r.areaKey) expect(valid.has(r.areaKey)).toBe(true);
    }
  });

  it("regionLabel resolves known keys and is graceful otherwise", () => {
    expect(regionLabel("neck")).toMatch(/neck/i);
    expect(regionLabel("nonsense")).toBe("nonsense");
  });
});

describe("deriveClinicalArea", () => {
  it("spine keys win", () => {
    expect(deriveClinicalArea(["lower-back"])).toBe("spine");
    expect(deriveClinicalArea(["neck", "shoulder-right"])).toBe("spine");
  });
  it("upper limb", () => {
    expect(deriveClinicalArea(["shoulder-left"])).toBe("upper_limb");
    expect(deriveClinicalArea(["elbow-hand-right"])).toBe("upper_limb");
  });
  it("lower limb", () => {
    expect(deriveClinicalArea(["knee-left"])).toBe("lower_limb");
    expect(deriveClinicalArea(["hip-right", "ankle-foot-left"])).toBe("lower_limb");
  });
  it("mixed upper + lower, chest-only, empty, or somewhere-else -> general", () => {
    expect(deriveClinicalArea(["shoulder-left", "knee-left"])).toBe("general");
    expect(deriveClinicalArea(["chest"])).toBe("general");
    expect(deriveClinicalArea([])).toBe("general");
    expect(deriveClinicalArea([SOMEWHERE_ELSE])).toBe("general");
  });
});

describe("describeRegions", () => {
  it("joins human labels", () => {
    expect(describeRegions(["shoulder-right", "lower-back"]).toLowerCase()).toContain("shoulder");
    expect(describeRegions(["shoulder-right", "lower-back"]).toLowerCase()).toContain("lower back");
  });
  it("somewhere-else and empty", () => {
    expect(describeRegions([SOMEWHERE_ELSE]).toLowerCase()).toContain("somewhere else");
    expect(describeRegions([])).toBe("");
  });
  it("caps at 120 chars", () => {
    const many = BODY_REGIONS.map((r) => r.key);
    expect(describeRegions(many).length).toBeLessThanOrEqual(120);
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
