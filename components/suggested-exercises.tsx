"use client";

import type { Suggestion } from "@/lib/exercise-suggestions";

interface Props {
  suggestions: Suggestion[];
  onAssign: (exerciseId: string) => Promise<void>;
  assigning: string | null;
}

export function SuggestedExercises({ suggestions, onAssign, assigning }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <div className="suggested-exercises panel stack">
      <h4 className="summary-section-title">Suggested exercises</h4>
      <ul className="suggested-exercises-list">
        {suggestions.map(({ exercise, reason }) => (
          <li key={exercise.id} className="suggested-exercise-row">
            <div className="suggested-exercise-info">
              <span className="suggested-exercise-title">{exercise.title}</span>
              <span className="suggested-exercise-badge">{exercise.clinicalArea.replace("_", " ")}</span>
              <span className="suggested-exercise-reason">{reason}</span>
            </div>
            <button
              type="button"
              className="suggested-exercise-assign"
              disabled={assigning === exercise.id}
              onClick={() => onAssign(exercise.id)}
            >
              {assigning === exercise.id ? "Assigning…" : "Assign"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
