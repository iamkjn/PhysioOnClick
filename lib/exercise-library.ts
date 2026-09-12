/**
 * Public exercise-library read helpers (Phase 1).
 *
 * The single import surface for every public exercise-library page. Pages read
 * from here and never touch `lib/exercises.ts` or `lib/conditions.ts` directly,
 * so the shape of those two static arrays can change without a page rewrite.
 *
 * Every function here is pure, side-effect free, and deterministic: given the
 * same static data it returns the same result in the same order, so
 * `generateStaticParams` output is stable across builds. No `"use client"`.
 */

import { conditions } from "@/lib/conditions";
import { exercises } from "@/lib/exercises";
import { selfTests } from "@/lib/self-tests";
import { getBodyArea, allBodyAreaKeys } from "@/lib/body-areas";
import { buildSearchItems, searchItems } from "@/lib/library-search";

export type { Condition, ConditionStage } from "@/lib/conditions";
export type { Exercise } from "@/lib/exercises";
export type { SelfTest, SelfTestStep } from "@/lib/self-tests";
export type { BodyArea, BodyAreaKey } from "@/lib/body-areas";

// Public pages import only from this barrel; re-export the curated body-area
// taxonomy so `lib/body-areas.ts` stays an internal detail. `app/sitemap.ts` is
// the one allowed direct importer (it already reaches past the barrel).
export { BODY_AREAS, getBodyArea, allBodyAreaKeys } from "@/lib/body-areas";

// Symptom-aware search lives in its own pure module (no import cycle: it reads
// the static arrays directly). Public pages and the client search box import the
// matcher + types from this barrel, never from `lib/library-search.ts`.
export {
  buildSearchItems,
  searchItems,
  SEARCH_SYNONYMS,
  type SearchItem,
} from "@/lib/library-search";

import type { Condition, ConditionStage } from "@/lib/conditions";
import type { Exercise } from "@/lib/exercises";
import type { SelfTest } from "@/lib/self-tests";

/**
 * Clinical review date shown on every public exercise page's by-line. Phase 1
 * has no per-exercise review date, so the library shares this one constant.
 *
 * Note: `lib/structured-data.ts` keeps a parallel private `REVIEW_DATE` for the
 * JSON-LD `lastReviewed` value - a deliberate near-duplicate that the
 * final-review wave will reconcile. Do not refactor it into this export now.
 */
export const EXERCISE_LIBRARY_REVIEWED_ON = "2026-09-08";

/** One stage of a condition programme with its `exerciseSlugs` resolved to
 * concrete `Exercise` records (in source order, unresolved slugs dropped). */
export type ProgramStage = {
  stage: ConditionStage;
  exercises: Exercise[];
};

// Slug -> Condition, built once. Same rationale as `exerciseIndex`: an O(n)
// scan here is fine standalone, but `programmesForExercise` calls it once per
// condition per exercise page - keep it O(1) so that stays cheap too.
let conditionBySlugIndex: Map<string, Condition> | null = null;
function conditionIndex(): Map<string, Condition> {
  if (!conditionBySlugIndex) {
    conditionBySlugIndex = new Map(conditions.map((condition) => [condition.slug, condition]));
  }
  return conditionBySlugIndex;
}

/** The condition hub for `slug`, or `null` if there is no such hub. */
export function getCondition(slug: string): Condition | null {
  return conditionIndex().get(slug) ?? null;
}

/** Every condition slug, in source order. */
export function allConditionSlugs(): string[] {
  return conditions.map((condition) => condition.slug);
}

// Slug -> Exercise, built once on first use. `getExerciseBySlug` is called
// deep inside `relatedExercises`' per-candidate loop (via
// `conditionsForExercise`), which itself runs once per catalogue exercise on
// the library index page - an O(n) linear scan there made the whole page
// O(n^3) across 174 exercises and blew the Cloudflare Worker's CPU budget in
// production (Error 1102). Keep this a plain Map lookup.
let exerciseBySlugIndex: Map<string, Exercise> | null = null;
function exerciseIndex(): Map<string, Exercise> {
  if (!exerciseBySlugIndex) {
    exerciseBySlugIndex = new Map(exercises.map((exercise) => [exercise.slug, exercise]));
  }
  return exerciseBySlugIndex;
}

/** The exercise for `slug`, or `null` if there is no such exercise. */
export function getExerciseBySlug(slug: string): Exercise | null {
  return exerciseIndex().get(slug) ?? null;
}

/** Every exercise slug, in source order. */
export function allExerciseSlugs(): string[] {
  return exercises.map((exercise) => exercise.slug);
}

/**
 * The staged programme for a condition, with each stage's `exerciseSlugs`
 * resolved to concrete `Exercise` records in the order they are listed. Slugs
 * that do not resolve are silently dropped. Returns `[]` for an unknown
 * condition slug.
 */
export function programForCondition(slug: string): ProgramStage[] {
  const condition = getCondition(slug);
  if (!condition) return [];
  return condition.program.map((stage) => ({
    stage,
    exercises: stage.exerciseSlugs
      .map((exerciseSlug) => getExerciseBySlug(exerciseSlug))
      .filter((exercise): exercise is Exercise => exercise !== null),
  }));
}

/**
 * Every condition relevant to an exercise: those whose `name` matches the
 * exercise's own primary `condition` string (case-insensitive), followed by
 * those whose staged programme lists this exercise slug. Deduped by condition
 * slug, name matches first. Returns `[]` for an unknown exercise slug.
 */
// exerciseSlug -> Condition[], built once. Same rationale as `exerciseIndex`
// above: this used to re-scan every condition's every stage on every call,
// and `relatedExercises` calls it once per candidate exercise (174x per
// exercise, 174 exercises on the index page) - O(n^3) overall.
let conditionsForExerciseIndex: Map<string, Condition[]> | null = null;
function conditionsForExerciseCache(): Map<string, Condition[]> {
  if (conditionsForExerciseIndex) return conditionsForExerciseIndex;

  const byExercise = new Map<string, { nameMatches: Condition[]; programMatches: Condition[] }>();
  const entry = (slug: string) => {
    let e = byExercise.get(slug);
    if (!e) {
      e = { nameMatches: [], programMatches: [] };
      byExercise.set(slug, e);
    }
    return e;
  };

  const conditionNameByExercise = new Map(
    exercises.map((exercise) => [exercise.slug, exercise.condition.trim().toLowerCase()]),
  );

  for (const condition of conditions) {
    const conditionName = condition.name.trim().toLowerCase();
    const inProgram = new Set<string>();
    for (const stage of condition.program) {
      for (const slug of stage.exerciseSlugs) inProgram.add(slug);
    }
    for (const [exerciseSlug, name] of conditionNameByExercise) {
      if (name === conditionName) {
        entry(exerciseSlug).nameMatches.push(condition);
      } else if (inProgram.has(exerciseSlug)) {
        entry(exerciseSlug).programMatches.push(condition);
      }
    }
  }

  conditionsForExerciseIndex = new Map(
    [...byExercise.entries()].map(([slug, { nameMatches, programMatches }]) => [
      slug,
      [...nameMatches, ...programMatches],
    ]),
  );
  return conditionsForExerciseIndex;
}

export function conditionsForExercise(exerciseSlug: string): Condition[] {
  if (!getExerciseBySlug(exerciseSlug)) return [];
  return conditionsForExerciseCache().get(exerciseSlug) ?? [];
}

/**
 * Which condition programmes an exercise appears in, and at which stage.
 *
 * Iterates the condition hubs in source order (`allConditionSlugs()`); for each
 * one whose staged programme lists this exercise slug, returns a single row with
 * the `Condition` and the name of the first stage it shows up in. One row per
 * condition - an exercise used in several stages of the same programme still
 * lists that programme once, tagged with its earliest stage. Returns `[]` for an
 * exercise that is in no programme (including an unknown slug).
 *
 * Reads `condition.program` directly (the same way `conditionsForExercise`
 * does) rather than going through `programForCondition`, which resolves every
 * stage slug to a concrete `Exercise` and silently drops any that do not
 * resolve - work this function never uses, since it only compares the slug.
 */
export function programmesForExercise(
  exerciseSlug: string,
): { condition: Condition; stageName: string }[] {
  const rows: { condition: Condition; stageName: string }[] = [];

  for (const condition of conditions) {
    const firstStage = condition.program.find((stage) =>
      stage.exerciseSlugs.includes(exerciseSlug),
    );
    if (firstStage) {
      rows.push({ condition, stageName: firstStage.stage });
    }
  }

  return rows;
}

/**
 * Up to `limit` other exercises related to `exerciseSlug`, ranked by: shares a
 * condition hub (weight 2), then same `bodyPart` (weight 1). Exercises related
 * on neither count are excluded. The exercise itself is never returned. Returns
 * `[]` for an unknown exercise slug or a non-positive `limit`.
 */
export function relatedExercises(exerciseSlug: string, limit: number): Exercise[] {
  const target = getExerciseBySlug(exerciseSlug);
  if (!target || limit <= 0) return [];

  const targetHubs = new Set(
    conditionsForExercise(exerciseSlug).map((condition) => condition.slug),
  );

  return exercises
    .map((exercise, index) => ({ exercise, index }))
    .filter(({ exercise }) => exercise.slug !== exerciseSlug)
    .map(({ exercise, index }) => {
      const sharesHub = conditionsForExercise(exercise.slug).some((condition) =>
        targetHubs.has(condition.slug),
      );
      const sameBodyPart = exercise.bodyPart === target.bodyPart;
      return {
        exercise,
        index,
        score: (sharesHub ? 2 : 0) + (sameBodyPart ? 1 : 0),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.exercise);
}

/**
 * Every curated public body-area key, in display order (`"shoulder"`,
 * `"lower-back"`, ...) - a thin alias of `allBodyAreaKeys()` from
 * `lib/body-areas.ts`. The full `BodyArea` objects (label, blurb, ...) are the
 * re-exported `BODY_AREAS`.
 *
 * The area page's `generateStaticParams` and `app/sitemap.ts` enumerate
 * `allBodyAreaKeys()` directly; this barrel export now only backs the library
 * tests. It returns the curated kebab keys, deliberately not the old raw union
 * of `Exercise.bodyPart` + `Condition.bodyArea` - that leaked internal clinical
 * codes as public chips and emitted a zero-exercise
 * `/exercises/area/Sports & return to activity` page.
 */
export function bodyAreas(): string[] {
  return allBodyAreaKeys();
}

/**
 * Every exercise that rolls up into the curated area `key`: those whose
 * `bodyPart` is one of the area's `bodyParts`, in source order. Returns `[]`
 * for an unknown key.
 */
export function exercisesByBodyArea(key: string): Exercise[] {
  const area = getBodyArea(key);
  if (!area) return [];
  return exercises.filter((exercise) => area.bodyParts.includes(exercise.bodyPart));
}

/**
 * Every condition hub for the curated area `key`: those whose `bodyArea`
 * equals the area's `conditionArea`, in source order. Returns `[]` when the
 * area has no `conditionArea` (e.g. `neuro`, `upper-back`) or the key is
 * unknown. Sports hubs (`bodyArea: "Sports & return to activity"`) map to no
 * area and are surfaced on the condition grid instead.
 */
export function conditionsByBodyArea(key: string): Condition[] {
  const conditionArea = getBodyArea(key)?.conditionArea;
  if (!conditionArea) return [];
  return conditions.filter((condition) => condition.bodyArea === conditionArea);
}

/**
 * Symptom-aware free-text search across the library. Delegates to the ranking +
 * synonym logic in `lib/library-search.ts` (so "kneecap pain", "sore shoulder at
 * night", "trapped nerve" resolve to the right hub), then maps the ranked hits
 * back to concrete `Exercise` / `Condition` records, preserving rank order and
 * keeping the split shape. An empty / whitespace-only / all-stopword query
 * returns empty lists. Each list is capped at 20 (the ranked matcher already
 * caps the combined list at 12).
 */
export function searchLibrary(query: string): {
  exercises: Exercise[];
  conditions: Condition[];
} {
  const matchedExercises: Exercise[] = [];
  const matchedConditions: Condition[] = [];

  for (const hit of searchItems(buildSearchItems(), query)) {
    if (hit.kind === "exercise") {
      const exercise = getExerciseBySlug(hit.slug);
      if (exercise) matchedExercises.push(exercise);
    } else {
      const condition = getCondition(hit.slug);
      if (condition) matchedConditions.push(condition);
    }
  }

  return {
    exercises: matchedExercises.slice(0, 20),
    conditions: matchedConditions.slice(0, 20),
  };
}

/**
 * The flat `SearchItem[]` the `<LibrarySearch>` client component filters in
 * memory - built once at build time on the (force-static) index page and handed
 * over as a prop, no runtime fetch. Named to read like the other `library*`
 * helpers; a thin pass-through to `buildSearchItems()`.
 */
export function librarySearchItems() {
  return buildSearchItems();
}

/**
 * The slim, serialisable search index the `<LibrarySearch>` client component
 * filters in memory: every catalogue exercise as `{slug, title, aka?}` and
 * every condition as `{slug, name, aka?}`, with `aka` omitted entirely when it
 * is absent or empty. The library index page (a server component) builds this
 * once at build time and hands it to the client component as a prop - there is
 * no runtime fetch.
 */
export function librarySearchIndex(): {
  exercises: { slug: string; title: string; aka?: string[] }[];
  conditions: { slug: string; name: string; aka?: string[] }[];
} {
  return {
    exercises: exercises.map((exercise) => ({
      slug: exercise.slug,
      title: exercise.title,
      ...(exercise.aka && exercise.aka.length > 0 ? { aka: exercise.aka } : {}),
    })),
    conditions: conditions.map((condition) => ({
      slug: condition.slug,
      name: condition.name,
      ...(condition.aka && condition.aka.length > 0 ? { aka: condition.aka } : {}),
    })),
  };
}

/** The shape returned by `librarySearchIndex()`, for prop typing at call sites. */
export type LibrarySearchIndex = ReturnType<typeof librarySearchIndex>;

/* -------------------------------------------------------------------------- */
/* Self-check tests (Phase 1 - Part B)                                        */
/* -------------------------------------------------------------------------- */

/** The self-check test for `slug`, or `null` if there is no such test. */
export function getSelfTest(slug: string): SelfTest | null {
  return selfTests.find((test) => test.slug === slug) ?? null;
}

/** Every self-check test slug, in source order. */
export function allSelfTestSlugs(): string[] {
  return selfTests.map((test) => test.slug);
}

/**
 * Every self-check test whose `conditionSlugs` includes `conditionSlug`, in
 * source order. Returns `[]` when nothing maps to that hub (including an unknown
 * slug).
 */
export function selfTestsForCondition(conditionSlug: string): SelfTest[] {
  return selfTests.filter((test) => test.conditionSlugs.includes(conditionSlug));
}

/** Every self-check test whose `bodyArea` matches `area` (case-insensitive). */
export function selfTestsByBodyArea(area: string): SelfTest[] {
  const target = area.trim().toLowerCase();
  return selfTests.filter(
    (test) => test.bodyArea.trim().toLowerCase() === target,
  );
}

/**
 * Self-check tests relevant to a set of exercise slugs: every `SelfTest` whose
 * `conditionSlugs` intersects the condition hubs those exercises appear in
 * (via `conditionsForExercise`), in `selfTests` source order. Returns `[]`
 * when no exercise resolves to a condition hub with a matching self-test
 * (including an empty or all-unknown `exerciseSlugs` list). Used to derive a
 * signed-in patient's relevant self-tests straight from their assigned
 * exercises, with no new data to maintain.
 */
export function selfTestsForExercises(exerciseSlugs: string[]): SelfTest[] {
  const conditionSlugs = new Set<string>();
  for (const slug of exerciseSlugs) {
    for (const condition of conditionsForExercise(slug)) {
      conditionSlugs.add(condition.slug);
    }
  }
  if (conditionSlugs.size === 0) return [];
  return selfTests.filter((test) =>
    test.conditionSlugs.some((cs) => conditionSlugs.has(cs)),
  );
}
