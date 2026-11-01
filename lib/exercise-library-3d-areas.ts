/**
 * Which exercise-library areas a tap on the 3D body leads to.
 *
 * The 3D model tags every triangle with one of 31 body-chart regions
 * (`lib/body-chart.ts`). The public library groups exercises into the curated
 * `BODY_AREAS` (`lib/body-areas.ts`). This table joins the two for the "Where
 * does it hurt?" 3D picker on `/exercises`.
 *
 * Honesty rule: a region only links to an area whose exercises actually cover
 * it. Regions the library has no set for (head/jaw, chest, stomach, sides of
 * the trunk) map to an empty list, and the picker says so instead of guessing.
 * Every model region must appear here and every key must exist in
 * `BODY_AREAS` (enforced by `tests/lib/exercise-library-3d-areas.test.ts`).
 */

import { getBodyArea, type BodyArea } from "@/lib/body-areas";

const SIDED = (base: string, areas: string[]): [string, string[]][] => [
  [`${base}-left`, areas],
  [`${base}-right`, areas],
];

export const REGION_AREA_KEYS: Readonly<Record<string, readonly string[]>> = Object.fromEntries([
  ["head-jaw", []],
  ["neck", ["neck"]],
  ["upper-back", ["upper-back"]],
  ["mid-back", ["upper-back"]],
  ["lower-back", ["lower-back"]],
  ["chest", []],
  ["abdomen", []],
  ...SIDED("side", []),
  ...SIDED("shoulder", ["shoulder"]),
  ...SIDED("upper-arm", ["shoulder", "elbow-wrist-hand"]),
  ...SIDED("elbow", ["elbow-wrist-hand"]),
  ...SIDED("forearm", ["elbow-wrist-hand"]),
  ...SIDED("hand", ["elbow-wrist-hand"]),
  ...SIDED("hip", ["hip"]),
  ...SIDED("buttock", ["hip", "lower-back"]),
  ...SIDED("thigh", ["hip", "knee"]),
  ...SIDED("knee", ["knee"]),
  ...SIDED("lower-leg", ["ankle-foot"]),
  ...SIDED("foot", ["ankle-foot"]),
]);

/** The library areas for a tapped region, in link order. Empty when none fits. */
export function areasForRegion(region: string): BodyArea[] {
  return (REGION_AREA_KEYS[region] ?? [])
    .map((key) => getBodyArea(key))
    .filter((area): area is BodyArea => area !== null);
}
