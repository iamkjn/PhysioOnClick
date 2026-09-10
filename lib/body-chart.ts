// lib/body-chart.ts
// Region taxonomy for the assessment body chart + the pure derivations that
// turn a set of picked regions into the legacy assessment-form fields.
//
// Regions map to the anatomical muscle-group outlines in lib/body-chart-data.ts
// (rendered on the figure) plus a few joint zones the muscle map doesn't cover
// (wrist/hand, ankle/foot) offered as labelled chips.

import type { ClinicalArea, OnsetPattern } from "@/lib/assessment-forms";

export type ChartView = "front" | "back";

export type HowLong = "days" | "weeks" | "months" | "since-op" | "not-sure";

export interface BodyRegion {
  key: string;
  /** Plain-English label shown to the patient. */
  label: string;
  /** Clinical name, shown in the hover tooltip under the plain label. */
  clinical: string;
  /** Where this region can be picked: on the figure, or only as a chip. */
  chip?: boolean;
  clinicalArea: ClinicalArea;
  /** Matching lib/body-areas.ts key, when the anatomy lines up. */
  areaKey?: string;
}

export const SOMEWHERE_ELSE = "somewhere-else";

// Which muscle-data keys (lib/body-chart-data.ts) draw each figure region, per view.
export const REGION_MUSCLES: Record<string, { anterior?: string[]; posterior?: string[] }> = {
  neck: { anterior: ["neck"] },
  trapezius: { posterior: ["trapezius"] },
  deltoids: { anterior: ["front-deltoids"], posterior: ["back-deltoids"] },
  chest: { anterior: ["chest"] },
  "upper-back": { posterior: ["upper-back"] },
  "lower-back": { posterior: ["lower-back"] },
  biceps: { anterior: ["biceps"] },
  triceps: { anterior: ["triceps"], posterior: ["triceps"] },
  forearm: { anterior: ["forearm"], posterior: ["forearm"] },
  abs: { anterior: ["abs"] },
  obliques: { anterior: ["obliques"] },
  gluteal: { posterior: ["gluteal"] },
  "hip-abductors": { anterior: ["hip-abductors"], posterior: ["hip-abductors"] },
  quadriceps: { anterior: ["quadriceps"] },
  hamstring: { posterior: ["hamstring"] },
  knees: { anterior: ["knees"], posterior: ["knees"] },
  calves: { anterior: ["calves"], posterior: ["calves"] },
  soleus: { posterior: ["left-soleus", "right-soleus"] },
};

export const BODY_REGIONS: BodyRegion[] = [
  { key: "neck", label: "Neck", clinical: "Cervical spine", clinicalArea: "spine", areaKey: "neck" },
  { key: "trapezius", label: "Top of the shoulders", clinical: "Trapezius", clinicalArea: "spine", areaKey: "upper-back" },
  { key: "deltoids", label: "Shoulder", clinical: "Deltoid / rotator cuff", clinicalArea: "upper_limb", areaKey: "shoulder" },
  { key: "chest", label: "Chest", clinical: "Pectoral muscles", clinicalArea: "general" },
  { key: "upper-back", label: "Upper back", clinical: "Thoracic spine / rhomboids", clinicalArea: "spine", areaKey: "upper-back" },
  { key: "lower-back", label: "Lower back", clinical: "Lumbar spine", clinicalArea: "spine", areaKey: "lower-back" },
  { key: "biceps", label: "Front of the upper arm", clinical: "Biceps", clinicalArea: "upper_limb", areaKey: "shoulder" },
  { key: "triceps", label: "Back of the upper arm", clinical: "Triceps", clinicalArea: "upper_limb", areaKey: "shoulder" },
  { key: "forearm", label: "Forearm & elbow", clinical: "Forearm / elbow", clinicalArea: "upper_limb", areaKey: "elbow-wrist-hand" },
  { key: "abs", label: "Stomach", clinical: "Abdominal muscles", clinicalArea: "general" },
  { key: "obliques", label: "Side of the trunk", clinical: "Obliques", clinicalArea: "general" },
  { key: "gluteal", label: "Buttock & hip", clinical: "Gluteal muscles", clinicalArea: "lower_limb", areaKey: "hip" },
  { key: "hip-abductors", label: "Outer hip & groin", clinical: "Hip abductors / adductors", clinicalArea: "lower_limb", areaKey: "hip" },
  { key: "quadriceps", label: "Front of the thigh", clinical: "Quadriceps", clinicalArea: "lower_limb", areaKey: "knee" },
  { key: "hamstring", label: "Back of the thigh", clinical: "Hamstrings", clinicalArea: "lower_limb", areaKey: "knee" },
  { key: "knees", label: "Knee", clinical: "Knee joint", clinicalArea: "lower_limb", areaKey: "knee" },
  { key: "calves", label: "Calf", clinical: "Calf — gastrocnemius", clinicalArea: "lower_limb", areaKey: "ankle-foot" },
  { key: "soleus", label: "Lower calf & Achilles", clinical: "Soleus / Achilles tendon", clinicalArea: "lower_limb", areaKey: "ankle-foot" },
  // joint zones the muscle map doesn't cover — offered as chips
  { key: "wrist-hand", label: "Wrist or hand", clinical: "Wrist / hand", chip: true, clinicalArea: "upper_limb", areaKey: "elbow-wrist-hand" },
  { key: "ankle-foot", label: "Ankle or foot", clinical: "Ankle / foot", chip: true, clinicalArea: "lower_limb", areaKey: "ankle-foot" },
  { key: "head-jaw", label: "Head or jaw", clinical: "Head / jaw", chip: true, clinicalArea: "general" },
];

const REGION_BY_KEY = new Map(BODY_REGIONS.map((r) => [r.key, r]));
const SPINE_KEYS = new Set(["neck", "trapezius", "upper-back", "lower-back"]);

export function regionLabel(key: string): string {
  if (key === SOMEWHERE_ELSE) return "Somewhere else / not sure";
  return REGION_BY_KEY.get(key)?.label ?? key;
}

export function regionClinical(key: string): string {
  return REGION_BY_KEY.get(key)?.clinical ?? "";
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
  const labels = keys.filter((k) => k !== SOMEWHERE_ELSE).map((k) => regionLabel(k));
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
