// lib/exercise-anatomy/index.ts
// What each exercise works and how it helps, keyed by exercise slug, plus the
// rules for when it shows. The exercise page reads this at build time and
// hands plain muscle keys to client components, so the entries never reach a
// client bundle. Entries are drafted per body area in entries/*.ts.

import { draftsVisible } from "@/lib/exercise-anatomy/drafts";
import { MUSCLES } from "@/lib/exercise-anatomy/muscles";
import type { BodyView, ExerciseAnatomy } from "@/lib/exercise-anatomy/types";
import { LOWER_LIMB } from "@/lib/exercise-anatomy/entries/lower-limb";
import { UPPER_LIMB } from "@/lib/exercise-anatomy/entries/upper-limb";
import { SPINE } from "@/lib/exercise-anatomy/entries/spine";
import { PELVIC_FACE_PAEDIATRIC } from "@/lib/exercise-anatomy/entries/pelvic-face-paediatric";
import { POST_OP_GENERAL } from "@/lib/exercise-anatomy/entries/post-op-general";
import { BALANCE_NEURO } from "@/lib/exercise-anatomy/entries/balance-neuro";

/** One record per drafting batch (entries/*.ts). */
export const ANATOMY_BATCHES: readonly Readonly<Record<string, ExerciseAnatomy>>[] = [LOWER_LIMB, UPPER_LIMB, SPINE, PELVIC_FACE_PAEDIATRIC, POST_OP_GENERAL, BALANCE_NEURO];

export const EXERCISE_ANATOMY: Readonly<Record<string, ExerciseAnatomy>> = Object.assign({}, ...ANATOMY_BATCHES);

/** Approved entries show everywhere; drafts only where the drafts flag is on (dev). */
export function isVisible(entry: ExerciseAnatomy): boolean {
  return entry.status === "approved" || draftsVisible();
}

export function visibleAnatomy(slug: string): ExerciseAnatomy | null {
  const entry = Object.hasOwn(EXERCISE_ANATOMY, slug) ? EXERCISE_ANATOMY[slug] : undefined;
  return entry && isVisible(entry) ? entry : null;
}

/** Every main muscle must be drawable: in a model, or lit by a stand-in. */
export function canShow3D(entry: ExerciseAnatomy): boolean {
  if (entry.hide3D) return false;
  return entry.main.every((key) => MUSCLES[key].source !== "none" || MUSCLES[key].standIn !== undefined);
}

export function startView(entry: ExerciseAnatomy): BodyView {
  return entry.view ?? MUSCLES[entry.main[0]].view;
}

const PROMISE = /\b(cure[sd]?|guarantee[sd]?|will heal|will fix)\b/i;

/** Writing-rule breaches for one entry; empty when it is fine. */
export function entryProblems(entry: ExerciseAnatomy): string[] {
  const problems: string[] = [];
  if (entry.main.length < 1 || entry.main.length > 3) problems.push("main needs 1-3 muscles");
  if (entry.helpers.length > 4) problems.push("helpers allows at most 4");
  const all = [...entry.main, ...entry.helpers];
  for (const key of all) if (!(key in MUSCLES)) problems.push(`unknown muscle "${key}"`);
  if (new Set(all).size !== all.length) problems.push("a muscle is listed twice");
  const words = entry.howItHelps.trim().split(/\s+/).length;
  if (words > 60) problems.push(`howItHelps has ${words} words (max 60)`);
  const sentences = entry.howItHelps.split(/[.!?](?:\s|$)/).filter((s) => s.trim()).length;
  if (sentences < 2 || sentences > 3) problems.push(`howItHelps has ${sentences} sentences (2-3)`);
  if (PROMISE.test(entry.howItHelps)) problems.push("howItHelps makes a promise");
  return problems;
}
