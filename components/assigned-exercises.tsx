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
import { getMotionSessions, type MotionSession } from "@/lib/motion";
import { exercises } from "@/lib/site-data";
import { SkeletonRow } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ExerciseFigure } from "@/components/exercise-figure";
import { MotionCheckButton } from "@/components/motion-check-button";

interface Props {
  uid: string;
  personId: string;
}

// Convert a catalogue embed URL (…/embed/ID) to a watchable link (…/watch?v=ID).
function watchUrl(embed: string): string {
  return embed.replace("/embed/", "/watch?v=");
}

// "Your program" — the exercises the physio assigned, each with the physio's
// demo video (read-only for the patient), a "Check your motion" button where a
// motion target exists, the latest motion result, and a completion tick.
export function AssignedExercises({ uid, personId }: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[]>([]);
  const [todayLog, setTodayLog] = useState<ExerciseLog | null>(null);
  const [motionByExercise, setMotionByExercise] = useState<Record<string, MotionSession>>({});
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
      // Motion history is a nice-to-have — a failure here shouldn't block the list.
      getMotionSessions(uid, personId).catch(() => [] as MotionSession[]),
    ]).then(([a, log, sessions]) => {
      if (cancelled) return;
      setAssigned(a);
      setTodayLog(log);
      // Keep the most recent session per exercise (sessions come newest-first).
      const latest: Record<string, MotionSession> = {};
      for (const s of sessions) if (!(s.exerciseId in latest)) latest[s.exerciseId] = s;
      setMotionByExercise(latest);
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

  const resolved = useMemo(
    () => assigned.map((ae) => ({ ae, ex: exerciseMap.get(ae.exerciseId) })).filter((r): r is { ae: AssignedExercise; ex: NonNullable<ReturnType<typeof exerciseMap.get>> } => Boolean(r.ex)),
    [assigned, exerciseMap]
  );

  const categories = useMemo(() => {
    const set = new Set(resolved.map((r) => r.ex.bodyPart));
    return ["All", ...Array.from(set)];
  }, [resolved]);

  const visible = filter === "All" ? resolved : resolved.filter((r) => r.ex.bodyPart === filter);
  const completedCount = resolved.filter((r) => todayLog?.completions?.[r.ae.exerciseId]).length;

  async function handleToggle(exerciseId: string, done: boolean) {
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
          const motion = motionByExercise[ae.exerciseId];
          return (
            <div key={ae.exerciseId} className={`exercise-card${done ? " done" : ""}`}>
              <div className="exercise-card-head">
                <ExerciseFigure name={ex.title} size={52} />
                <div className="exercise-card-body">
                  <strong>{ex.title}</strong>
                  <span>{ex.bodyPart} · {ex.stage}</span>
                  {motion && (
                    <span className="exercise-motion-result">
                      Last motion check: {motion.romMax}° range · {motion.avgQuality}% ({motion.reps} reps)
                    </span>
                  )}
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

              <div className="exercise-card-actions">
                <MotionCheckButton exerciseId={ex.id} exercise={ex} uid={uid} personId={personId} />
                {ex.videoUrl && (
                  <a
                    href={watchUrl(ex.videoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="exercise-video-watch"
                  >
                    ▶ Watch demo
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
