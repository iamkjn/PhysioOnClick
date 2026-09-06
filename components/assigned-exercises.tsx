// components/assigned-exercises.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAssignedExercises,
  getTodayExerciseLog,
  toggleExerciseCompletion,
  setExercisesCompletion,
  todayKey,
  type AssignedExercise,
  type ExerciseLog,
} from "@/lib/recovery";
import { getMotionSessions, type MotionSession } from "@/lib/motion";
import { track } from "@/lib/analytics";
import { exercises, resolveDosage, formatDosage } from "@/lib/exercises";
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

// "Your program" — the exercises the physio assigned, each with a short how-to,
// the physio's demo video where one exists, a "Check your motion" button where a
// motion target exists, the latest motion result, and a per-exercise "done
// today" toggle plus a "mark all as done" shortcut for the daily check-off.
export function AssignedExercises({ uid, personId }: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[]>([]);
  const [todayLog, setTodayLog] = useState<ExerciseLog | null>(null);
  const [motionByExercise, setMotionByExercise] = useState<Record<string, MotionSession>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [savingAll, setSavingAll] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
  const allDone = resolved.length > 0 && completedCount === resolved.length;
  const progressPct = resolved.length === 0 ? 0 : Math.round((completedCount / resolved.length) * 100);

  async function handleToggle(exerciseId: string, done: boolean) {
    setError(null);
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

  async function handleMarkAll() {
    const ids = resolved.map((r) => r.ae.exerciseId);
    if (ids.length === 0) return;
    const previous = todayLog;
    setError(null);
    setSavingAll(true);
    setTodayLog({
      date: todayKey(),
      completions: { ...(previous?.completions ?? {}), ...Object.fromEntries(ids.map((id) => [id, true])) },
      loggedAt: new Date(),
    });
    try {
      await setExercisesCompletion(uid, personId, ids, true);
      track("exercises_marked_all_done", { count: ids.length });
    } catch {
      setTodayLog(previous);
      setError("Could not save. Please try again.");
    } finally {
      setSavingAll(false);
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
      <div className="exercise-program-head">
        <div>
          <h3 style={{ margin: 0 }}>Your program</h3>
          <p className="muted" style={{ margin: "var(--space-1) 0 0" }}>
            {allDone
              ? `All ${resolved.length} done today — great work.`
              : `${completedCount} of ${resolved.length} done today. Tick each one off as you go.`}
          </p>
        </div>
        {!allDone && (
          <button
            type="button"
            className="button secondary exercise-mark-all"
            onClick={() => void handleMarkAll()}
            disabled={savingAll}
          >
            {savingAll ? "Saving…" : "Mark all as done"}
          </button>
        )}
      </div>

      <div
        className="exercise-progress-bar"
        role="progressbar"
        aria-label="Exercises completed today"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="exercise-progress-fill" style={{ width: `${progressPct}%` }} />
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
                  <span className="exercise-dose-line">{formatDosage(resolveDosage(ex, ae))}</span>
                  {ae.dosage?.notes && <span className="exercise-physio-note">Physio note: {ae.dosage.notes}</span>}
                  {motion && (
                    <span className="exercise-motion-result">
                      Last motion check: {motion.romMax}° range · {motion.avgQuality}% ({motion.reps} reps)
                    </span>
                  )}
                </div>
              </div>

              {ex.description && <p className="exercise-card-desc">{ex.description}</p>}

              <div className="exercise-card-actions">
                {[ex.setup, ex.steps?.length, ex.cues?.length, ex.mistakes?.length, ex.equipment?.length].some(Boolean) && (
                  <button
                    type="button"
                    className="exercise-howto-toggle"
                    aria-expanded={expanded.has(ae.exerciseId)}
                    onClick={() => toggleExpanded(ae.exerciseId)}
                  >
                    {expanded.has(ae.exerciseId) ? "Hide how-to ▴" : "How to do it ▾"}
                  </button>
                )}
                <button
                  type="button"
                  className={`exercise-done-toggle${done ? " done" : ""}`}
                  aria-pressed={done}
                  aria-label={done ? `${ex.title}: done today, tap to undo` : `${ex.title}: mark as done`}
                  onClick={() => void handleToggle(ae.exerciseId, !done)}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12l5 5 9-11" />
                  </svg>
                  {done ? "Done today" : "Mark done"}
                </button>
                <MotionCheckButton exerciseId={ex.id} exercise={ex} uid={uid} personId={personId} />
                {ex.videoUrl && (
                  <a
                    href={watchUrl(ex.videoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="exercise-video-watch"
                    onClick={() => track("exercise_video_play", { exercise_id: ex.id })}
                  >
                    ▶ Watch demo
                  </a>
                )}
              </div>

              {expanded.has(ae.exerciseId) && (
                <div className="exercise-howto">
                  {ex.equipment && ex.equipment.length > 0 && (
                    <p><strong>You&apos;ll need:</strong> {ex.equipment.join(", ")}</p>
                  )}
                  {ex.setup && <p><strong>Get set up:</strong> {ex.setup}</p>}
                  {ex.steps && ex.steps.length > 0 && (
                    <div><strong>The movement</strong><ol>{ex.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></div>
                  )}
                  {ex.cues && ex.cues.length > 0 && (
                    <div><strong>Good form</strong><ul className="exercise-howto-cues">{ex.cues.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
                  )}
                  {ex.mistakes && ex.mistakes.length > 0 && (
                    <div><strong>Ease off or stop if</strong><ul className="exercise-howto-mistakes">{ex.mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
                  )}
                  <p className="exercise-howto-foot muted">Your physio set this dose — tell her at your next session if it&apos;s too easy or too hard.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
