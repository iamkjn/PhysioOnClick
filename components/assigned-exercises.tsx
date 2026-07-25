// components/assigned-exercises.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAssignedExercises,
  getTodayExerciseLog,
  toggleExerciseCompletion,
  todayKey,
  type AssignedExercise,
  type ExerciseLog,
} from "@/lib/recovery";
import { exercises } from "@/lib/site-data";
import { SkeletonRow } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ExerciseFigure } from "@/components/exercise-figure";

interface Props {
  uid: string;
  personId: string;
}

// "Your Program" — the assigned rehab plan, ported from the mobile exercises
// screen: a completed-today count, category filter pills, and figure cards with
// a completion box. Reads from lib/recovery + the site-data catalogue.
export function AssignedExercises({ uid, personId }: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[]>([]);
  const [todayLog, setTodayLog] = useState<ExerciseLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getAssignedExercises(uid, personId),
      getTodayExerciseLog(uid, personId),
    ]).then(([a, log]) => {
      if (cancelled) return;
      setAssigned(a);
      setTodayLog(log);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setError("Could not load exercises.");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, personId]);

  const exerciseMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), []);

  // Resolve assigned ids against the catalogue, dropping any unknown ids.
  const resolved = useMemo(
    () => assigned.map((ae) => ({ ae, ex: exerciseMap.get(ae.exerciseId) })).filter((r): r is { ae: AssignedExercise; ex: NonNullable<ReturnType<typeof exerciseMap.get>> } => Boolean(r.ex)),
    [assigned, exerciseMap]
  );

  // Category pills from the catalogue's bodyPart, mirroring the mobile filter row.
  const categories = useMemo(() => {
    const set = new Set(resolved.map((r) => r.ex.bodyPart));
    return ["All", ...Array.from(set)];
  }, [resolved]);

  const visible = filter === "All" ? resolved : resolved.filter((r) => r.ex.bodyPart === filter);
  const completedCount = resolved.filter((r) => todayLog?.completions?.[r.ae.exerciseId]).length;

  async function handleToggle(exerciseId: string, done: boolean) {
    // Optimistic — reflect the tick immediately, roll back on failure.
    setTodayLog((prev) => ({
      date: todayKey(),
      completions: { ...(prev?.completions ?? {}), [exerciseId]: done },
      loggedAt: new Date(),
    }));
    try {
      await toggleExerciseCompletion(uid, personId, exerciseId, done);
    } catch {
      setTodayLog((prev) => ({
        date: todayKey(),
        completions: { ...(prev?.completions ?? {}), [exerciseId]: !done },
        loggedAt: new Date(),
      }));
      setError("Could not save. Please try again.");
    }
  }

  if (loading)
    return (
      <div className="panel stack">
        <h3>Your program</h3>
        <SkeletonRow count={3} />
      </div>
    );

  if (error && assigned.length === 0)
    return (
      <div className="panel stack">
        <h3>Your program</h3>
        <p className="field-error">{error}</p>
      </div>
    );

  if (resolved.length === 0)
    return (
      <div className="panel stack">
        <h3>Your program</h3>
        <EmptyState
          illustration="chart"
          title="No exercises yet"
          body="Your physio will add exercises after your session. They'll appear here once your program is set up."
        />
      </div>
    );

  return (
    <div className="panel stack">
      <div>
        <h3 style={{ margin: 0 }}>Your program</h3>
        <p className="muted" style={{ margin: "var(--space-1) 0 0" }}>
          {completedCount} of {resolved.length} completed today
        </p>
      </div>

      {categories.length > 2 && (
        <div className="exercise-filter-row" role="tablist" aria-label="Filter exercises by area">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={filter === c}
              className={`exercise-filter-pill${filter === c ? " active" : ""}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {error && <p className="field-error">{error}</p>}

      <div className="exercise-card-list">
        {visible.map(({ ae, ex }) => {
          const done = todayLog?.completions?.[ae.exerciseId] ?? false;
          return (
            <div key={ae.exerciseId} className={`exercise-card${done ? " done" : ""}`}>
              <ExerciseFigure name={ex.title} size={56} />
              <div className="exercise-card-body">
                <strong>{ex.title}</strong>
                <span>{ex.bodyPart} · {ex.stage}</span>
              </div>
              <button
                type="button"
                className={`exercise-check${done ? " done" : ""}`}
                aria-pressed={done}
                aria-label={`Mark ${ex.title} ${done ? "not done" : "done"}`}
                onClick={() => void handleToggle(ae.exerciseId, !done)}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5 9-11" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
