import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { BODY_AREAS } from "@/lib/body-areas";
import { BODY_REGIONS } from "@/lib/body-chart";
import { REGION_AREA_KEYS, areasForRegion } from "@/lib/exercise-library-3d-areas";

const manifest = JSON.parse(
  readFileSync(join(process.cwd(), "public/models/body-chart/manifest.json"), "utf8"),
) as { regions: string[] };

describe("REGION_AREA_KEYS", () => {
  it("covers every region the 3D model can return, and nothing else", () => {
    expect(manifest.regions.length).toBe(31);
    expect(Object.keys(REGION_AREA_KEYS).sort()).toEqual([...manifest.regions].sort());
  });

  it("covers every body-chart region", () => {
    for (const region of BODY_REGIONS) expect(REGION_AREA_KEYS).toHaveProperty(region.key);
  });

  it("only links to areas that exist", () => {
    const keys = new Set(BODY_AREAS.map((a) => a.key));
    for (const [region, areas] of Object.entries(REGION_AREA_KEYS)) {
      for (const key of areas) expect(keys.has(key), `${region} -> ${key}`).toBe(true);
    }
  });

  it("matches the agreed table", () => {
    expect(REGION_AREA_KEYS).toEqual({
      "head-jaw": [],
      neck: ["neck"],
      "upper-back": ["upper-back"],
      "mid-back": ["upper-back"],
      "lower-back": ["lower-back"],
      chest: [],
      abdomen: [],
      "side-left": [],
      "side-right": [],
      "shoulder-left": ["shoulder"],
      "shoulder-right": ["shoulder"],
      "upper-arm-left": ["shoulder", "elbow-wrist-hand"],
      "upper-arm-right": ["shoulder", "elbow-wrist-hand"],
      "elbow-left": ["elbow-wrist-hand"],
      "elbow-right": ["elbow-wrist-hand"],
      "forearm-left": ["elbow-wrist-hand"],
      "forearm-right": ["elbow-wrist-hand"],
      "hand-left": ["elbow-wrist-hand"],
      "hand-right": ["elbow-wrist-hand"],
      "hip-left": ["hip"],
      "hip-right": ["hip"],
      "buttock-left": ["hip", "lower-back"],
      "buttock-right": ["hip", "lower-back"],
      "thigh-left": ["hip", "knee"],
      "thigh-right": ["hip", "knee"],
      "knee-left": ["knee"],
      "knee-right": ["knee"],
      "lower-leg-left": ["ankle-foot"],
      "lower-leg-right": ["ankle-foot"],
      "foot-left": ["ankle-foot"],
      "foot-right": ["ankle-foot"],
    });
  });
});

describe("areasForRegion", () => {
  it("returns the BODY_AREAS entries in link order", () => {
    expect(areasForRegion("thigh-left").map((a) => a.label)).toEqual(["Hip & groin", "Knee"]);
  });

  it("is empty for unmapped and unknown regions", () => {
    expect(areasForRegion("chest")).toEqual([]);
    expect(areasForRegion("nope")).toEqual([]);
  });
});
