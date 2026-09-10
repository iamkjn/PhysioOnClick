// lib/body-chart.ts
// Body-region taxonomy for the patient assessment wizard's clickable body
// chart, plus the pure derivations that turn a set of picked regions into the
// legacy assessment-form fields (bodyArea string, clinicalArea, onset).
//
// Region keys align to the exercise-library body areas (lib/body-areas.ts)
// wherever the anatomy matches, so a later "exercises for your shoulder" link
// is free.

import type { ClinicalArea, OnsetPattern } from "@/lib/assessment-forms";

export type ChartView = "front" | "back";

export type HowLong = "days" | "weeks" | "months" | "since-op" | "not-sure";

export interface BodyRegion {
  key: string;
  label: string;
  view: ChartView | "both";
  side?: "left" | "right";
  clinicalArea: ClinicalArea;
  /** Matching lib/body-areas.ts key, when the anatomy lines up. */
  areaKey?: string;
}

export const SOMEWHERE_ELSE = "somewhere-else";

export const BODY_REGIONS: BodyRegion[] = [
  { key: "neck", label: "Neck", view: "both", clinicalArea: "spine", areaKey: "neck" },
  { key: "upper-back", label: "Upper back & shoulder blades", view: "back", clinicalArea: "spine", areaKey: "upper-back" },
  { key: "lower-back", label: "Lower back", view: "back", clinicalArea: "spine", areaKey: "lower-back" },
  { key: "chest", label: "Chest", view: "front", clinicalArea: "general" },

  { key: "shoulder-left", label: "Left shoulder", view: "both", side: "left", clinicalArea: "upper_limb", areaKey: "shoulder" },
  { key: "shoulder-right", label: "Right shoulder", view: "both", side: "right", clinicalArea: "upper_limb", areaKey: "shoulder" },
  { key: "upper-arm-left", label: "Left upper arm", view: "both", side: "left", clinicalArea: "upper_limb", areaKey: "shoulder" },
  { key: "upper-arm-right", label: "Right upper arm", view: "both", side: "right", clinicalArea: "upper_limb", areaKey: "shoulder" },
  { key: "elbow-hand-left", label: "Left elbow, wrist or hand", view: "both", side: "left", clinicalArea: "upper_limb", areaKey: "elbow-wrist-hand" },
  { key: "elbow-hand-right", label: "Right elbow, wrist or hand", view: "both", side: "right", clinicalArea: "upper_limb", areaKey: "elbow-wrist-hand" },

  { key: "hip-left", label: "Left hip or groin", view: "both", side: "left", clinicalArea: "lower_limb", areaKey: "hip" },
  { key: "hip-right", label: "Right hip or groin", view: "both", side: "right", clinicalArea: "lower_limb", areaKey: "hip" },
  { key: "thigh-left", label: "Left thigh", view: "both", side: "left", clinicalArea: "lower_limb", areaKey: "knee" },
  { key: "thigh-right", label: "Right thigh", view: "both", side: "right", clinicalArea: "lower_limb", areaKey: "knee" },
  { key: "knee-left", label: "Left knee", view: "both", side: "left", clinicalArea: "lower_limb", areaKey: "knee" },
  { key: "knee-right", label: "Right knee", view: "both", side: "right", clinicalArea: "lower_limb", areaKey: "knee" },
  { key: "lower-leg-left", label: "Left lower leg", view: "both", side: "left", clinicalArea: "lower_limb", areaKey: "ankle-foot" },
  { key: "lower-leg-right", label: "Right lower leg", view: "both", side: "right", clinicalArea: "lower_limb", areaKey: "ankle-foot" },
  { key: "ankle-foot-left", label: "Left ankle or foot", view: "both", side: "left", clinicalArea: "lower_limb", areaKey: "ankle-foot" },
  { key: "ankle-foot-right", label: "Right ankle or foot", view: "both", side: "right", clinicalArea: "lower_limb", areaKey: "ankle-foot" },
];

const REGION_BY_KEY = new Map(BODY_REGIONS.map((r) => [r.key, r]));

const SPINE_KEYS = new Set(["neck", "upper-back", "lower-back"]);

export function regionLabel(key: string): string {
  if (key === SOMEWHERE_ELSE) return "Somewhere else / not sure";
  return REGION_BY_KEY.get(key)?.label ?? key;
}

export function deriveClinicalArea(keys: string[]): ClinicalArea {
  const real = keys.filter((k) => REGION_BY_KEY.has(k));
  if (real.length === 0) return "general";
  if (real.some((k) => SPINE_KEYS.has(k))) return "spine";
  const areas = new Set(real.map((k) => REGION_BY_KEY.get(k)!.clinicalArea));
  areas.delete("general");
  if (areas.size === 1) return [...areas][0];
  return "general";
}

export function describeRegions(keys: string[]): string {
  if (keys.length === 0) return "";
  if (keys.length === 1 && keys[0] === SOMEWHERE_ELSE) return "Somewhere else / not sure";
  const labels = keys
    .filter((k) => k !== SOMEWHERE_ELSE)
    .map((k) => regionLabel(k));
  if (keys.includes(SOMEWHERE_ELSE)) labels.push("somewhere else");
  const joined = labels.join(", ");
  return joined.length > 120 ? `${joined.slice(0, 117)}…` : joined;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function deriveSymptomStartDate(howLong: HowLong): string {
  switch (howLong) {
    case "days":
      return isoDaysAgo(7);
    case "weeks":
      return isoDaysAgo(21);
    case "months":
      return isoDaysAgo(90);
    default:
      return "";
  }
}

export function deriveOnsetPattern(howLong: HowLong): OnsetPattern {
  switch (howLong) {
    case "days":
      return "sudden";
    case "weeks":
    case "months":
      return "gradual";
    case "since-op":
      return "post_surgery";
    default:
      return "not_sure";
  }
}
