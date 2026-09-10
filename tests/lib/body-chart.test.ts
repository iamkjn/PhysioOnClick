import { describe, it, expect } from "vitest";
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
import { ANTERIOR_MUSCLES, POSTERIOR_MUSCLES } from "@/lib/body-chart-data";
import { allBodyAreaKeys } from "@/lib/body-areas";

describe("body-chart taxonomy", () => {
  it("every region has a unique key, a label and a clinical name", () => {
    const keys = BODY_REGIONS.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const r of BODY_REGIONS) {
      expect(r.label.length).toBeGreaterThan(1);
      expect(r.clinical.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("every region.areaKey (when set) is a real exercise-library body area", () => {
    const valid = new Set(allBodyAreaKeys());
    for (const r of BODY_REGIONS) {
      if (r.areaKey) expect(valid.has(r.areaKey)).toBe(true);
    }
  });

  it("every figure region resolves to real muscle polygons in at least one view", () => {
    for (const r of BODY_REGIONS) {
      if (r.chip) continue;
      const map = REGION_MUSCLES[r.key];
      expect(map).toBeTruthy();
      const anteriorOk = (map.anterior ?? []).every((k) => ANTERIOR_MUSCLES[k]?.length);
      const posteriorOk = (map.posterior ?? []).every((k) => POSTERIOR_MUSCLES[k]?.length);
      expect(anteriorOk && posteriorOk).toBe(true);
      expect((map.anterior?.length ?? 0) + (map.posterior?.length ?? 0)).toBeGreaterThan(0);
    }
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
    expect(deriveClinicalArea(["neck", "deltoids"])).toBe("spine");
  });
  it("upper limb", () => {
    expect(deriveClinicalArea(["deltoids"])).toBe("upper_limb");
    expect(deriveClinicalArea(["forearm"])).toBe("upper_limb");
    expect(deriveClinicalArea(["wrist-hand"])).toBe("upper_limb");
  });
  it("lower limb", () => {
    expect(deriveClinicalArea(["knees"])).toBe("lower_limb");
    expect(deriveClinicalArea(["gluteal", "calves"])).toBe("lower_limb");
  });
  it("mixed upper + lower, chest-only, empty, or somewhere-else -> general", () => {
    expect(deriveClinicalArea(["deltoids", "knees"])).toBe("general");
    expect(deriveClinicalArea(["chest"])).toBe("general");
    expect(deriveClinicalArea([])).toBe("general");
    expect(deriveClinicalArea([SOMEWHERE_ELSE])).toBe("general");
  });
});

describe("describeRegions", () => {
  it("joins human labels", () => {
    const s = describeRegions(["deltoids", "lower-back"]).toLowerCase();
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
