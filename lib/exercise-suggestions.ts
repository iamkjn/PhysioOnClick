import { exercises, type Exercise } from "@/lib/site-data";
import type { ClinicalArea } from "@/lib/assessment-forms";

export type SuggestionInput = {
  clinicalArea?: ClinicalArea;
  freeText?: string;
  alreadyAssignedIds: string[];
};

export type Suggestion = {
  exercise: Exercise;
  reason: string;
  score: number;
};

const STAGE_ORDER: Record<string, number> = {
  "Early rehab": 0,
  "Mobility phase": 1,
  "Strength phase": 2,
  "Return to function": 3,
  "Facial rehab": 1,
};

function stageRank(stage: string): number {
  return STAGE_ORDER[stage] ?? 4;
}

export function suggestExercises(input: SuggestionInput, limit = 6): Suggestion[] {
  const { clinicalArea, freeText, alreadyAssignedIds } = input;
  if (!clinicalArea && !freeText) return [];

  const assigned = new Set(alreadyAssignedIds);
  const text = (freeText ?? "").toLowerCase();

  const scored: Suggestion[] = [];

  for (const exercise of exercises) {
    if (assigned.has(exercise.id)) continue;

    let score = 0;
    const matchedReasons: string[] = [];

    if (clinicalArea && exercise.clinicalArea === clinicalArea) {
      score += 3;
      matchedReasons.push(`matches ${clinicalArea.replace("_", " ")}`);
    }

    if (text.length > 0) {
      for (const tag of exercise.tags) {
        const tagWords = tag.replace(/-/g, " ");
        if (text.includes(tagWords) || tagWords.split(" ").some((w) => w.length > 3 && text.includes(w))) {
          score += 2;
          matchedReasons.push(`'${tag}' in notes`);
        }
      }
      const conditionWords = exercise.condition.toLowerCase().split(/[\s/()]+/).filter((w) => w.length > 3);
      if (conditionWords.some((w) => text.includes(w))) {
        score += 1;
        matchedReasons.push(`condition '${exercise.condition}' referenced`);
      }
    }

    if (score === 0) continue;

    const reason = matchedReasons.length > 0
      ? `Suggested: ${matchedReasons.slice(0, 2).join(", ")}`
      : "Suggested";

    scored.push({ exercise, reason, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const stageDiff = stageRank(a.exercise.stage) - stageRank(b.exercise.stage);
    if (stageDiff !== 0) return stageDiff;
    return a.exercise.id.localeCompare(b.exercise.id);
  });

  return scored.slice(0, limit);
}
