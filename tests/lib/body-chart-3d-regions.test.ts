import { describe, it, expect } from "vitest";
import { BODY_REGIONS } from "@/lib/body-chart";
import {
  regionKeyForVertex,
  ruleForPart,
  segmentBase,
  sideOf,
  type KeptRule,
  type Segment,
} from "@/lib/body-chart-3d-regions";

const KEYS = new Set(BODY_REGIONS.map((r) => r.key));
const arm = { kind: "segment", segment: "arm" };
const leg = { kind: "segment", segment: "leg" };
const trunk = { kind: "segment", segment: "trunk" };
const back = { kind: "segment", segment: "back" };

describe("sideOf", () => {
  it("reads the side from the part name", () => {
    expect(sideOf("Left femur")).toBe("left");
    expect(sideOf("Proximal phalanx of right index finger")).toBe("right");
    expect(sideOf("Sacrum")).toBeNull();
  });
});

describe("ruleForPart", () => {
  it.each([
    "Upper central secondary incisor tooth",
    "Gingiva of lower jaw",
    "Diaphragm",
    "Intervertebral disk of fifth lumbar vertebra",
    "Left superior rectus",
    "Thyroid cartilage",
    "Left genioglossus",
    "Anterior papillary muscle of ventricle",
    "Left internal intercostal muscle",
    "Left longus capitis",
  ])("drops %s", (name) => {
    expect(ruleForPart(name)).toEqual({ kind: "exclude" });
  });

  it.each([
    ["Frontal bone", { kind: "fixed", base: "head-jaw" }],
    ["Mandible", { kind: "fixed", base: "head-jaw" }],
    ["Left zygomatic bone", { kind: "fixed", base: "head-jaw" }],
    ["Hyoid bone", { kind: "fixed", base: "neck" }],
    ["Left supraspinatus", { kind: "fixed", base: "shoulder" }],
    ["Right teres major", { kind: "fixed", base: "shoulder" }],
    ["Left humerus", arm],
    ["Left extensor digitorum", arm],
    ["Oblique head of left adductor pollicis", arm],
    ["Left scaphoid", arm],
    ["Left clavicle", arm],
    ["Left femur", leg],
    ["Left extensor digitorum longus", leg],
    ["Long head of left biceps femoris", leg],
    ["Left rectus femoris", leg],
    ["Left calcaneal tendon", leg],
    ["Left iliacus", leg],
    ["Left hip bone", leg],
    ["Fifth lumbar vertebra", back],
    ["First lumbar vertebra", back],
    ["Twelfth thoracic vertebra", back],
    ["Sacrum", back],
    ["Atlas", back],
    ["Left lumbar rotator", back],
    ["Medial lumbar intertransversarius", back],
    ["Left longissimus thoracis", back],
    ["Left rhomboid major", back],
    ["Left splenius capitis", back],
    ["Left psoas major", trunk],
    ["Left scapula", back],
    ["Sternocostal part of left pectoralis major", trunk],
    ["Left external oblique", trunk],
  ])("classifies %s", (name, rule) => {
    expect(ruleForPart(name)).toEqual(rule);
  });
});

describe("segmentBase", () => {
  it.each([
    ["arm", 0.2, 1.35, 0, "shoulder"],
    ["arm", 0.2, 1.2, 0, "upper-arm"],
    ["arm", 0.25, 1.1, 0, "elbow"],
    ["arm", 0.25, 1.0, 0, "forearm"],
    ["arm", 0.28, 0.8, 0, "hand"],
    ["leg", 0.08, 0.9, -0.09, "buttock"],
    ["leg", 0.12, 0.9, 0.02, "hip"],
    ["leg", 0.09, 0.7, 0, "thigh"],
    ["leg", 0.08, 0.45, 0, "knee"],
    ["leg", 0.09, 0.2, 0, "lower-leg"],
    ["leg", 0.07, 0.05, 0, "foot"],
    ["trunk", 0, 1.5, 0, "neck"],
    ["trunk", 0.05, 1.35, -0.08, "upper-back"],
    ["trunk", 0.05, 1.2, -0.08, "mid-back"],
    ["trunk", 0.05, 1.05, -0.08, "lower-back"],
    ["trunk", 0.12, 1.1, 0.02, "side"],
    ["trunk", 0.05, 1.25, 0.08, "chest"],
    ["trunk", 0.05, 1.05, 0.08, "abdomen"],
    ["back", 0, 1.5, 0.02, "neck"],
    ["back", 0.05, 1.35, 0.0, "upper-back"],
    ["back", 0, 1.2, -0.02, "mid-back"],
    ["back", 0, 1.05, -0.02, "lower-back"],
  ] as const)("%s at (%s, %s, %s) is %s", (segment, x, y, z, base) => {
    expect(segmentBase(segment, x, y, z)).toBe(base);
  });
});

describe("regionKeyForVertex", () => {
  it("appends the part's side to sided areas, even across the midline", () => {
    expect(regionKeyForVertex({ kind: "segment", segment: "leg" }, "right", 0.01, 0.45, 0)).toBe("knee-right");
    expect(regionKeyForVertex({ kind: "fixed", base: "shoulder" }, "left", 0.2, 1.4, 0)).toBe("shoulder-left");
  });

  it("uses the vertex x sign when the part has no side (+x is the patient's left)", () => {
    expect(regionKeyForVertex({ kind: "segment", segment: "trunk" }, null, 0.12, 1.1, 0.02)).toBe("side-left");
    expect(regionKeyForVertex({ kind: "segment", segment: "trunk" }, null, -0.12, 1.1, 0.02)).toBe("side-right");
  });

  it("leaves midline areas unsided", () => {
    expect(regionKeyForVertex({ kind: "segment", segment: "trunk" }, "left", 0.1, 1.25, 0.08)).toBe("chest");
    expect(regionKeyForVertex({ kind: "fixed", base: "head-jaw" }, null, 0, 1.6, 0)).toBe("head-jaw");
  });

  it("only ever returns BODY_REGIONS keys, and can reach all of them", () => {
    const seen = new Set<string>();
    const unknown = new Set<string>();
    const rules: KeptRule[] = [
      ...(["arm", "leg", "trunk", "back"] as Segment[]).map((segment) => ({ kind: "segment" as const, segment })),
      { kind: "fixed", base: "head-jaw" },
    ];
    for (const rule of rules) {
      for (let x = -0.3; x <= 0.3; x += 0.03) {
        for (let y = 0; y <= 1.75; y += 0.025) {
          for (let z = -0.15; z <= 0.15; z += 0.03) {
            for (const side of ["left", "right", null] as const) {
              const key = regionKeyForVertex(rule, side, x, y, z);
              if (!KEYS.has(key)) unknown.add(key);
              seen.add(key);
            }
          }
        }
      }
    }
    expect([...unknown]).toEqual([]);
    expect([...KEYS].filter((k) => !seen.has(k))).toEqual([]);
  });
});
