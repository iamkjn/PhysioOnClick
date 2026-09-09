/**
 * Curated public body-area taxonomy for the exercise library.
 *
 * The library's raw data tags every exercise with an internal clinical
 * `bodyPart` code (`Neuro`, `Post-op`, `Lumbar spine`, `Cervical spine`,
 * `Pelvic health`, ...) and every condition with a `bodyArea` string. Surfacing
 * that union directly gave the public "browse by body area" row ~28 chips,
 * jargon-titled near-empty pages, and a `/exercises/area/Sports & return to
 * activity` page with zero exercises.
 *
 * This module is the single source of truth for the *public* grouping: a small,
 * hand-curated set of plain-language regions. Every internal `Exercise.bodyPart`
 * value in the catalogue rolls up into exactly one area (enforced by
 * `tests/lib/body-areas.test.ts`). Sports is deliberately NOT an area - it is
 * condition-led only and reachable from the condition grid and search.
 *
 * Imported by the `@/lib/exercise-library` barrel (which public pages read) and
 * by `app/sitemap.ts`. Pure data + pure lookups; no side effects.
 */

/** Kebab-case area key, used verbatim in the URL: `shoulder`, `lower-back`. */
export type BodyAreaKey = string;

export type BodyArea = {
  /** Stable kebab-case key. The `/exercises/area/<key>` route param. */
  key: BodyAreaKey;
  /** Plain-language display name. No clinical shorthand. ASCII only. */
  label: string;
  /** One plain sentence for the chip and the area-page standfirst. */
  blurb: string;
  /** Exact `Exercise.bodyPart` values that roll up into this area. */
  bodyParts: string[];
  /** Exact `Condition.bodyArea` value for this area, when one corresponds. */
  conditionArea?: string;
  /** Display order (ascending). */
  order: number;
};

/**
 * The curated areas, in display order.
 *
 * `Back & neck` is the condition area for both the neck and the lower back. To
 * keep each condition hub on a single area page it is attached to `lower-back`
 * only; `neck` has no `conditionArea` (its exercises still list, and the
 * `neck-pain` hub stays reachable from the condition grid and search).
 *
 * `Hamstring` (2 leg-strength exercises) folds into `knee`. `General` (8
 * whole-body pacing / conditioning exercises) gets its own `general` area
 * rather than being scattered. `Paediatric` becomes `children`.
 */
export const BODY_AREAS: BodyArea[] = [
  {
    key: "neck",
    label: "Neck",
    blurb: "Exercises and stretches for a stiff or painful neck.",
    bodyParts: ["Cervical spine", "Neck"],
    order: 1,
  },
  {
    key: "upper-back",
    label: "Upper back & shoulder blades",
    blurb: "Movements to ease tension between the shoulder blades and mid back.",
    bodyParts: ["Thoracic spine"],
    order: 2,
  },
  {
    key: "lower-back",
    label: "Lower back",
    blurb: "Staged programmes and exercises for low back pain and core control.",
    bodyParts: ["Lumbar spine", "Core"],
    conditionArea: "Back & neck",
    order: 3,
  },
  {
    key: "shoulder",
    label: "Shoulder",
    blurb: "Rehab for shoulder pain, stiffness and rotator-cuff problems.",
    bodyParts: ["Shoulder"],
    conditionArea: "Shoulder",
    order: 4,
  },
  {
    key: "elbow-wrist-hand",
    label: "Elbow, wrist & hand",
    blurb: "Loading and mobility work for the elbow, wrist and hand.",
    bodyParts: ["Elbow", "Wrist", "Hand"],
    conditionArea: "Elbow & wrist",
    order: 5,
  },
  {
    key: "hip",
    label: "Hip & groin",
    blurb: "Strength and mobility exercises for hip and groin pain.",
    bodyParts: ["Hip"],
    conditionArea: "Hip",
    order: 6,
  },
  {
    key: "knee",
    label: "Knee",
    blurb: "Programmes for knee pain, plus quad, hamstring and glute strength.",
    bodyParts: ["Knee", "Hamstring"],
    conditionArea: "Knee",
    order: 7,
  },
  {
    key: "ankle-foot",
    label: "Ankle & foot",
    blurb: "Rehab for ankle sprains, Achilles pain and foot problems.",
    bodyParts: ["Ankle", "Lower limb"],
    conditionArea: "Ankle & foot",
    order: 8,
  },
  {
    key: "balance",
    label: "Balance & falls",
    blurb: "Steady-on-your-feet exercises to build confidence and cut falls risk.",
    bodyParts: ["Balance"],
    conditionArea: "Older adults",
    order: 9,
  },
  {
    key: "after-surgery",
    label: "After surgery",
    blurb: "Gentle staged programmes to rebuild movement after an operation.",
    bodyParts: ["Post-op"],
    conditionArea: "Post-surgical",
    order: 10,
  },
  {
    key: "pregnancy-pelvic",
    label: "Pregnancy & pelvic health",
    blurb: "Pelvic floor and core exercises for pregnancy and afterwards.",
    bodyParts: ["Pelvic health"],
    conditionArea: "Women's health",
    order: 11,
  },
  {
    key: "neuro",
    label: "Neurological rehab",
    blurb: "Movement practice after a stroke or other neurological condition.",
    bodyParts: ["Neuro", "Face"],
    order: 12,
  },
  {
    key: "children",
    label: "Children's physiotherapy",
    blurb: "Play-based exercises for children's movement and development.",
    bodyParts: ["Paediatric"],
    order: 13,
  },
  {
    key: "general",
    label: "General fitness & pain",
    blurb: "Whole-body conditioning and pacing for long-term or widespread pain.",
    bodyParts: ["General"],
    order: 14,
  },
];

const BY_KEY = new Map(BODY_AREAS.map((area) => [area.key, area]));

/** The curated area for `key`, or `null` if there is no such area. */
export function getBodyArea(key: string): BodyArea | null {
  return BY_KEY.get(key) ?? null;
}

/** Every area key, in display order. */
export function allBodyAreaKeys(): string[] {
  return BODY_AREAS.map((area) => area.key);
}
