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

export type { Condition, ConditionStage } from "@/lib/conditions";
export type { Exercise } from "@/lib/exercises";

import type { Condition, ConditionStage } from "@/lib/conditions";
import type { Exercise } from "@/lib/exercises";

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

/** The condition hub for `slug`, or `null` if there is no such hub. */
export function getCondition(slug: string): Condition | null {
  return conditions.find((condition) => condition.slug === slug) ?? null;
}

/** Every condition slug, in source order. */
export function allConditionSlugs(): string[] {
  return conditions.map((condition) => condition.slug);
}

/** The exercise for `slug`, or `null` if there is no such exercise. */
export function getExerciseBySlug(slug: string): Exercise | null {
  return exercises.find((exercise) => exercise.slug === slug) ?? null;
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
export function conditionsForExercise(exerciseSlug: string): Condition[] {
  const exercise = getExerciseBySlug(exerciseSlug);
  if (!exercise) return [];

  const primaryName = exercise.condition.trim().toLowerCase();
  const nameMatches: Condition[] = [];
  const programMatches: Condition[] = [];

  for (const condition of conditions) {
    if (condition.name.trim().toLowerCase() === primaryName) {
      nameMatches.push(condition);
    } else if (
      condition.program.some((stage) => stage.exerciseSlugs.includes(exerciseSlug))
    ) {
      programMatches.push(condition);
    }
  }

  return [...nameMatches, ...programMatches];
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
 * The sorted, de-duplicated union of every `Exercise.bodyPart`, every
 * `Condition.bodyArea`, and the literal `"Sports & return to activity"` (kept
 * explicit so it survives even if the sports hubs are ever removed).
 */
export function bodyAreas(): string[] {
  const areas = new Set<string>();
  for (const exercise of exercises) areas.add(exercise.bodyPart);
  for (const condition of conditions) areas.add(condition.bodyArea);
  areas.add("Sports & return to activity");
  return [...areas].sort((a, b) => a.localeCompare(b));
}

/** Every exercise whose `bodyPart` matches `area` (case-insensitive). */
export function exercisesByBodyArea(area: string): Exercise[] {
  const target = area.trim().toLowerCase();
  return exercises.filter(
    (exercise) => exercise.bodyPart.trim().toLowerCase() === target,
  );
}

/** Every condition whose `bodyArea` matches `area` (case-insensitive). */
export function conditionsByBodyArea(area: string): Condition[] {
  const target = area.trim().toLowerCase();
  return conditions.filter(
    (condition) => condition.bodyArea.trim().toLowerCase() === target,
  );
}

/**
 * Free-text search across the library. Matches exercises on `title` and each
 * `aka` entry, and conditions on `name` and each `aka` entry, all as
 * case-insensitive substrings. An empty or whitespace-only query returns empty
 * lists. Each list is capped at 20 results, in source order.
 */
export function searchLibrary(query: string): {
  exercises: Exercise[];
  conditions: Condition[];
} {
  const needle = query.trim().toLowerCase();
  if (!needle) return { exercises: [], conditions: [] };

  const matchedExercises = exercises
    .filter((exercise) =>
      [exercise.title, ...(exercise.aka ?? [])].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    )
    .slice(0, 20);

  const matchedConditions = conditions
    .filter((condition) =>
      [condition.name, ...(condition.aka ?? [])].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    )
    .slice(0, 20);

  return { exercises: matchedExercises, conditions: matchedConditions };
}
