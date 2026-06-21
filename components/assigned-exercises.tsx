// components/assigned-exercises.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getAssignedExercises,
  getTodayExerciseLog,
  toggleExerciseCompletion,
  type AssignedExercise,
  type ExerciseLog,
} from "@/lib/recovery";
import { exercises } from "@/lib/site-data";

interface Props {
  uid: string;
  personId: string;
}

export function AssignedExercises({ uid, personId }: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[]>([]);
  const [todayLog, setTodayLog] = useState<ExerciseLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAssignedExercises(uid, personId),
      getTodayExerciseLog(uid, personId),
    ]).then(([a, log]) => {
      setAssigned(a);
      setTodayLog(log);
      setLoading(false);
    });
  }, [uid, personId]);

  async function handleToggle(exerciseId: string, done: boolean) {
    await toggleExerciseCompletion(uid, personId, exerciseId, done);
    setTodayLog((prev) => ({
      date: new Date().toISOString().slice(0, 10),
      completions: { ...(prev?.completions ?? {}), [exerciseId]: done },
      loggedAt: new Date(),
    }));
  }

  if (loading) return <p className="muted">Loading exercises…</p>;
  if (assigned.length === 0)
    return (
      <div className="panel stack">
        <h3>Your exercises</h3>
        <p className="muted">No exercises assigned yet — your physio will add them after your session.</p>
      </div>
    );

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  return (
    <div className="panel stack">
      <h3>Your exercises</h3>
      <p className="muted">Tick off each exercise as you complete it today.</p>
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
                background: done ? "#F0FDF4" : "#F8FBFD",
                border: `1px solid ${done ? "#86efac" : "#D1E8EE"}`,
                borderRadius: 12,
                padding: "0.85rem 1rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => void handleToggle(ae.exerciseId, e.target.checked)}
                style={{ marginTop: 3, accentColor: "#0891B2", width: 18, height: 18 }}
              />
              <div>
                <strong style={{ display: "block", color: "#0C2A38" }}>{ex.title}</strong>
                <span style={{ fontSize: 13, color: "#5E7A84" }}>
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
