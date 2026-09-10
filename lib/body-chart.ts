// lib/body-chart.ts
// Region taxonomy for the assessment body chart + pure derivations that turn a
// set of picked regions into the legacy assessment-form fields.
//
// Regions group the anatomical muscle segments from the `body-muscles` package
// (Apache-2.0) into ~26 patient-facing zones, each with a plain-English label
// and a clinical name for the hover tooltip. A stylised skeleton is drawn
// behind the muscles (see SKELETON_FRONT / SKELETON_BACK).

import type { ClinicalArea, OnsetPattern } from "@/lib/assessment-forms";

export type ChartView = "front" | "back";
export type HowLong = "days" | "weeks" | "months" | "since-op" | "not-sure";

export interface BodyRegion {
  key: string;
  label: string;
  clinical: string;
  clinicalArea: ClinicalArea;
  areaKey?: string;
}

export const SOMEWHERE_ELSE = "somewhere-else";

// region key -> body-muscles ids that draw it, per view
export const REGION_MUSCLES: Record<string, { front?: string[]; back?: string[] }> = {
  "head-jaw": { front: ["head", "face"], back: ["head-back", "nape"] },
  neck: { front: ["neck-left", "neck-right"], back: ["nape"] },
  "upper-back": { back: ["traps-upper-left", "traps-upper-right", "traps-mid-left", "traps-mid-right"] },
  "mid-back": {
    back: ["lats-upper-left", "lats-upper-right", "lats-mid-left", "lats-mid-right", "lats-lower-left", "lats-lower-right", "traps-lower-left", "traps-lower-right"],
  },
  "lower-back": { back: ["spine", "lower-back-erectors-left", "lower-back-erectors-right", "lower-back-ql-left", "lower-back-ql-right"] },
  chest: { front: ["chest-upper-left", "chest-upper-right", "chest-lower-left", "chest-lower-right"] },
  abdomen: { front: ["abs-upper-left", "abs-upper-right", "abs-lower-left", "abs-lower-right", "serratus-anterior-left", "serratus-anterior-right"] },
  "side-left": { front: ["obliques-left"] },
  "side-right": { front: ["obliques-right"] },

  "shoulder-left": { front: ["shoulder-front-left", "shoulder-side-left"], back: ["deltoid-rear-left"] },
  "shoulder-right": { front: ["shoulder-front-right", "shoulder-side-right"], back: ["deltoid-rear-right"] },
  "upper-arm-left": { front: ["biceps-left"], back: ["triceps-long-left", "triceps-lateral-left"] },
  "upper-arm-right": { front: ["biceps-right"], back: ["triceps-long-right", "triceps-lateral-right"] },
  "elbow-left": { front: ["elbow-left"] },
  "elbow-right": { front: ["elbow-right"] },
  "forearm-left": { front: ["forearm-left"], back: ["forearm-flexors-left", "forearm-extensors-left"] },
  "forearm-right": { front: ["forearm-right"], back: ["forearm-flexors-right", "forearm-extensors-right"] },
  "hand-left": { front: ["hand-left"], back: ["hand-back-left"] },
  "hand-right": { front: ["hand-right"], back: ["hand-back-right"] },

  "hip-left": { front: ["hip-flexor-left", "adductors-left"], back: ["gluteus-medius-left"] },
  "hip-right": { front: ["hip-flexor-right", "adductors-right"], back: ["gluteus-medius-right"] },
  "buttock-left": { back: ["gluteus-maximus-left"] },
  "buttock-right": { back: ["gluteus-maximus-right"] },
  "thigh-left": { front: ["quads-left"], back: ["hamstrings-medial-left", "hamstrings-lateral-left"] },
  "thigh-right": { front: ["quads-right"], back: ["hamstrings-medial-right", "hamstrings-lateral-right"] },
  "knee-left": { front: ["knee-left"], back: ["knee-back-left"] },
  "knee-right": { front: ["knee-right"], back: ["knee-back-right"] },
  "lower-leg-left": {
    front: ["tibialis-anterior-left"],
    back: ["calves-gastroc-medial-left", "calves-gastroc-lateral-left", "calves-soleus-left"],
  },
  "lower-leg-right": {
    front: ["tibialis-anterior-right"],
    back: ["calves-gastroc-medial-right", "calves-gastroc-lateral-right", "calves-soleus-right"],
  },
  "foot-left": { front: ["foot-left"], back: ["foot-back-left"] },
  "foot-right": { front: ["foot-right"], back: ["foot-back-right"] },
};

export const BODY_REGIONS: BodyRegion[] = [
  { key: "head-jaw", label: "Head, face or jaw", clinical: "Head / temporomandibular joint", clinicalArea: "general" },
  { key: "neck", label: "Neck", clinical: "Cervical spine", clinicalArea: "spine", areaKey: "neck" },
  { key: "upper-back", label: "Upper back & shoulder blades", clinical: "Trapezius / thoracic spine", clinicalArea: "spine", areaKey: "upper-back" },
  { key: "mid-back", label: "Mid back", clinical: "Thoracic spine / latissimus dorsi", clinicalArea: "spine", areaKey: "upper-back" },
  { key: "lower-back", label: "Lower back", clinical: "Lumbar spine / erector spinae", clinicalArea: "spine", areaKey: "lower-back" },
  { key: "chest", label: "Chest", clinical: "Pectorals / sternum / ribs", clinicalArea: "general" },
  { key: "abdomen", label: "Stomach", clinical: "Abdominal wall", clinicalArea: "general" },
  { key: "side-left", label: "Left side of the trunk", clinical: "Left obliques / ribs", clinicalArea: "general" },
  { key: "side-right", label: "Right side of the trunk", clinical: "Right obliques / ribs", clinicalArea: "general" },

  { key: "shoulder-left", label: "Left shoulder", clinical: "Left deltoid / rotator cuff", clinicalArea: "upper_limb", areaKey: "shoulder" },
  { key: "shoulder-right", label: "Right shoulder", clinical: "Right deltoid / rotator cuff", clinicalArea: "upper_limb", areaKey: "shoulder" },
  { key: "upper-arm-left", label: "Left upper arm", clinical: "Left biceps / triceps / humerus", clinicalArea: "upper_limb", areaKey: "shoulder" },
  { key: "upper-arm-right", label: "Right upper arm", clinical: "Right biceps / triceps / humerus", clinicalArea: "upper_limb", areaKey: "shoulder" },
  { key: "elbow-left", label: "Left elbow", clinical: "Left elbow joint", clinicalArea: "upper_limb", areaKey: "elbow-wrist-hand" },
  { key: "elbow-right", label: "Right elbow", clinical: "Right elbow joint", clinicalArea: "upper_limb", areaKey: "elbow-wrist-hand" },
  { key: "forearm-left", label: "Left forearm", clinical: "Left radius / ulna / forearm muscles", clinicalArea: "upper_limb", areaKey: "elbow-wrist-hand" },
  { key: "forearm-right", label: "Right forearm", clinical: "Right radius / ulna / forearm muscles", clinicalArea: "upper_limb", areaKey: "elbow-wrist-hand" },
  { key: "hand-left", label: "Left wrist or hand", clinical: "Left wrist / carpals / fingers", clinicalArea: "upper_limb", areaKey: "elbow-wrist-hand" },
  { key: "hand-right", label: "Right wrist or hand", clinical: "Right wrist / carpals / fingers", clinicalArea: "upper_limb", areaKey: "elbow-wrist-hand" },

  { key: "hip-left", label: "Left hip or groin", clinical: "Left hip joint / adductors", clinicalArea: "lower_limb", areaKey: "hip" },
  { key: "hip-right", label: "Right hip or groin", clinical: "Right hip joint / adductors", clinicalArea: "lower_limb", areaKey: "hip" },
  { key: "buttock-left", label: "Left buttock", clinical: "Left gluteal muscles", clinicalArea: "lower_limb", areaKey: "hip" },
  { key: "buttock-right", label: "Right buttock", clinical: "Right gluteal muscles", clinicalArea: "lower_limb", areaKey: "hip" },
  { key: "thigh-left", label: "Left thigh", clinical: "Left quadriceps / hamstrings / femur", clinicalArea: "lower_limb", areaKey: "knee" },
  { key: "thigh-right", label: "Right thigh", clinical: "Right quadriceps / hamstrings / femur", clinicalArea: "lower_limb", areaKey: "knee" },
  { key: "knee-left", label: "Left knee", clinical: "Left knee joint", clinicalArea: "lower_limb", areaKey: "knee" },
  { key: "knee-right", label: "Right knee", clinical: "Right knee joint", clinicalArea: "lower_limb", areaKey: "knee" },
  { key: "lower-leg-left", label: "Left shin or calf", clinical: "Left tibia / calf muscles", clinicalArea: "lower_limb", areaKey: "ankle-foot" },
  { key: "lower-leg-right", label: "Right shin or calf", clinical: "Right tibia / calf muscles", clinicalArea: "lower_limb", areaKey: "ankle-foot" },
  { key: "foot-left", label: "Left ankle or foot", clinical: "Left ankle / tarsals / toes", clinicalArea: "lower_limb", areaKey: "ankle-foot" },
  { key: "foot-right", label: "Right ankle or foot", clinical: "Right ankle / tarsals / toes", clinicalArea: "lower_limb", areaKey: "ankle-foot" },
];

const REGION_BY_KEY = new Map(BODY_REGIONS.map((r) => [r.key, r]));
const SPINE_KEYS = new Set(["neck", "upper-back", "mid-back", "lower-back"]);

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
