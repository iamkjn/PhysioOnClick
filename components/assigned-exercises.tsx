// components/assigned-exercises.tsx
"use client";

import { useEffect, useState } from "react";
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

interface Props {
  uid: string;
  personId: string;
}

export function AssignedExercises({ uid, personId }: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[]>([]);
  const [todayLog, setTodayLog] = useState<ExerciseLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  async function handleToggle(exerciseId: string, done: boolean) {
    try {
      await toggleExerciseCompletion(uid, personId, exerciseId, done);
      setTodayLog((prev) => ({
        date: todayKey(),
        completions: { ...(prev?.completions ?? {}), [exerciseId]: done },
        loggedAt: new Date(),
      }));
    } catch {
      setError("Could not save. Please try again.");
    }
  }

  if (loading)
    return (
      <div className="panel stack">
        <h3>Your exercises</h3>
        <SkeletonRow count={3} />
      </div>
    );
  if (error && assigned.length === 0)
    return (
      <div className="panel stack">
        <h3>Your exercises</h3>
        <p className="field-error">{error}</p>
      </div>
    );
  if (assigned.length === 0)
    return (
      <div className="panel stack">
        <h3>Your exercises</h3>
        <EmptyState
          illustration="chart"
          title="No exercises yet"
          body="Your physio will add exercises after your session."
        />
      </div>
    );

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  return (
    <div className="panel stack">
      <h3>Your exercises</h3>
      <p className="muted">Tick off each exercise as you complete it today.</p>
      {error && <p className="field-error">{error}</p>}
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {assigned.map((ae) => {
          const ex = exerciseMap.get(ae.exerciseId);
          if (!ex) return null;
          const done = todayLog?.completions?.[ae.exerciseId] ?? false;
          return (
            <label
              key={ae.exerciseId}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                background: done ? "var(--color-success-light)" : "var(--color-bg)",
                border: `1px solid ${done ? "var(--color-success)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-card)",
                padding: "0.85rem 1rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => void handleToggle(ae.exerciseId, e.target.checked)}
                style={{ marginTop: 3, accentColor: "var(--color-primary)", width: 18, height: 18 }}
              />
              <div>
                <strong style={{ display: "block", color: "var(--color-text-primary)" }}>{ex.title}</strong>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  {ex.bodyPart} · {ex.description}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
