// lib/exercise-anatomy/scene.ts
// Pure helpers behind the exercise 3D view: which model parts an exercise
// lights, how a chunk splits into draw groups, how to frame the lit muscles,
// and what a tapped part is called. No three.js import, so it stays cheap to
// test and can never pull three.js into a static bundle.

import type { ModelPart } from "@/lib/body-model-format";
import { MUSCLES, type MuscleKey } from "@/lib/exercise-anatomy/muscles";

export const ROLE = { other: 0, main: 1, helper: 2 } as const;
/** Material slots, in the order components/exercise-library/exercise-body-3d-stage.ts builds them. */
export const MATERIAL = { main: 0, helper: 1, muscle: 2, bone: 3 } as const;
/** Keep main/helper in step with .exercise-body-3d__swatch--* in app/globals.css. */
export const ANATOMY_COLOURS = { main: "#0EA5E9", helper: "#7DD3FC", muscle: "#C48C7C", bone: "#E8DFC6" } as const;

/** Axis-aligned box in model units: [minX, minY, minZ, maxX, maxY, maxZ]. */
export type Box = [number, number, number, number, number, number];

export interface DrawGroup {
  start: number;
  count: number;
  materialIndex: number;
}

/** The patterns to light for one muscle: its own parts only. A muscle that is not in any model lights nothing. */
export function patternsFor(key: MuscleKey): readonly RegExp[] {
  return MUSCLES[key].source === "none" ? [] : MUSCLES[key].parts;
}

/** Role of each part (same order as `parts`). Main wins over helper. */
export function partRoles(parts: readonly ModelPart[], main: readonly MuscleKey[], helpers: readonly MuscleKey[]): Uint8Array {
  const mainPatterns = main.flatMap(patternsFor);
  const helperPatterns = helpers.flatMap(patternsFor);
  const roles = new Uint8Array(parts.length);
  parts.forEach((part, i) => {
    if (mainPatterns.some((r) => r.test(part.name))) roles[i] = ROLE.main;
    else if (helperPatterns.some((r) => r.test(part.name))) roles[i] = ROLE.helper;
  });
  return roles;
}

/** Geometry groups for one chunk; `parts` are that chunk's parts in index order. */
export function drawGroups(parts: readonly ModelPart[], roles: ArrayLike<number>, systems: readonly string[]): DrawGroup[] {
  const groups: DrawGroup[] = [];
  parts.forEach((part, i) => {
    const materialIndex =
      roles[i] === ROLE.main
        ? MATERIAL.main
        : roles[i] === ROLE.helper
          ? MATERIAL.helper
          : systems[part.system] === "skeletal"
            ? MATERIAL.bone
            : MATERIAL.muscle;
    const last = groups[groups.length - 1];
    if (last && last.materialIndex === materialIndex && last.start + last.count === part.firstIndex) last.count += part.indexCount;
    else groups.push({ start: part.firstIndex, count: part.indexCount, materialIndex });
  });
  return groups;
}

/** The boxes of the chosen parts, packed in the order given (for pickChunk on a subset). */
export function subsetBoxes(boxes: Float32Array, picks: readonly number[]): Float32Array {
  const out = new Float32Array(picks.length * 6);
  picks.forEach((p, i) => out.set(boxes.subarray(p * 6, p * 6 + 6), i * 6));
  return out;
}

/** One box around every [boxes, partIndex] pair (boxes from computePartBoxes), or null. */
export function unionBox(entries: readonly (readonly [Float32Array, number])[]): Box | null {
  if (!entries.length) return null;
  const box: Box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (const [boxes, p] of entries) {
    for (let k = 0; k < 3; k++) {
      box[k] = Math.min(box[k], boxes[p * 6 + k]);
      box[k + 3] = Math.max(box[k + 3], boxes[p * 6 + k + 3]);
    }
  }
  return box;
}

/** Camera distance that fits `size` (metres) plus `margin` (0.25 = 25% each side). */
export function fitDistance(size: { height: number; width: number }, fovDegrees: number, aspect: number, margin: number): number {
  const tanHalf = Math.tan((fovDegrees * Math.PI) / 360);
  const height = size.height * (1 + 2 * margin);
  const width = size.width * (1 + 2 * margin);
  return Math.max(height / 2 / tanHalf, width / 2 / (tanHalf * aspect));
}

export function displayPartName(name: string): string {
  const n = name.replace(/\b(left|right)\b ?/gi, "").replace(/\s+/g, " ").trim();
  return n.charAt(0).toUpperCase() + n.slice(1);
}

/** What a tapped part is called, in this exercise's terms. */
export function partLabel(partName: string, main: readonly MuscleKey[], helpers: readonly MuscleKey[]): string {
  const roles: [readonly MuscleKey[], string][] = [
    [main, "main focus"],
    [helpers, "helper"],
  ];
  for (const [keys, role] of roles) {
    for (const key of keys) {
      const m = MUSCLES[key];
      if (patternsFor(key).some((r) => r.test(partName))) return `${m.label}: ${m.plain} (${role})`;
    }
  }
  return displayPartName(partName);
}

export function needsAddon(keys: readonly MuscleKey[]): boolean {
  return keys.some((k) => MUSCLES[k].source === "addon");
}

/** Labels (deduped, in the order given) of the muscles that are not in any model, so nothing is lit for them. */
export function unlitMuscles(keys: readonly MuscleKey[]): string[] {
  return [...new Set(keys.filter((k) => MUSCLES[k].source === "none").map((k) => MUSCLES[k].label))];
}

/** The 3D view's note naming the muscles it cannot light, or null when every muscle is in a model. */
export function unlitNote(keys: readonly MuscleKey[]): string | null {
  const labels = unlitMuscles(keys);
  if (!labels.length) return null;
  return `Not in the 3D model, so not lit: ${labels.map((l) => l.charAt(0).toLowerCase() + l.slice(1)).join(", ")}.`;
}
