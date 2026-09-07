import { exercises, resolveDosage, formatDosage, type ExerciseDosage } from "@/lib/exercises";
import type { ExercisePlanCard } from "@/lib/exercise-plan-pdf";

/**
 * Turn a patient's assigned exercises into the render-ready cards the PDF
 * builder consumes. Ids absent from the catalogue are skipped, so `index` is
 * 1-based over the *kept* cards, not the input array.
 */
export function buildPlanCards(
  assigned: { exerciseId: string; dosage?: ExerciseDosage }[],
  imageByExerciseId: Record<string, Uint8Array | null>,
): ExercisePlanCard[] {
  const cards: ExercisePlanCard[] = [];

  for (const a of assigned) {
    const ex = exercises.find((e) => e.id === a.exerciseId);
    if (!ex) continue;

    const safetyLine =
      (ex.mistakes ?? []).find((m) => m.startsWith("Stop") || m.includes("physio")) ?? null;

    cards.push({
      index: cards.length + 1,
      title: ex.title,
      imageBytes: imageByExerciseId[a.exerciseId] ?? null,
      setup: ex.setup ?? ex.description ?? null,
      steps: ex.steps ?? [],
      cues: (ex.cues ?? []).slice(0, 3),
      safetyLine,
      doseText: formatDosage(resolveDosage(ex, a)),
      physioNote: a.dosage?.notes ?? ex.defaultDosage?.notes ?? null,
    });
  }

  return cards;
}
