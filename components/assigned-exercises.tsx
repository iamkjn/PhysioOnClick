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
import {
  getExerciseVideos,
  setExerciseVideo,
  removeExerciseVideo,
  isYouTubeUrl,
} from "@/lib/exercise-videos";
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

  // Patient-added YouTube reference links, keyed by exerciseId — an isolated
  // subcollection (lib/exercise-videos.ts) the patient owns, separate from the
  // admin-owned assignment above. editingVideoId tracks which single card (if
  // any) currently has its inline editor open.
  const [videos, setVideos] = useState<Record<string, string>>({});
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const [videoErrors, setVideoErrors] = useState<Record<string, string>>({});
  const [savingVideoId, setSavingVideoId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getAssignedExercises(uid, personId),
      getTodayExerciseLog(uid, personId),
      // Video links are a nice-to-have add-on — a failure here shouldn't stop
      // the assigned-exercise list itself from rendering.
      getExerciseVideos(uid, personId).catch(() => ({})),
    ]).then(([a, log, v]) => {
      if (cancelled) return;
      setAssigned(a);
      setTodayLog(log);
      setVideos(v);
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

  function startVideoEdit(exerciseId: string) {
    setEditingVideoId(exerciseId);
    setDraftUrl(videos[exerciseId] ?? "");
    setVideoErrors((prev) => {
      if (!(exerciseId in prev)) return prev;
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
  }

  function cancelVideoEdit() {
    setEditingVideoId(null);
    setDraftUrl("");
  }

  async function handleSaveVideo(exerciseId: string) {
    setSavingVideoId(exerciseId);
    try {
      await setExerciseVideo(uid, personId, exerciseId, draftUrl.trim());
      // Update local state immediately so the "Watch" link appears without a refetch.
      setVideos((prev) => ({ ...prev, [exerciseId]: draftUrl.trim() }));
      setVideoErrors((prev) => {
        if (!(exerciseId in prev)) return prev;
        const next = { ...prev };
        delete next[exerciseId];
        return next;
      });
      setEditingVideoId(null);
      setDraftUrl("");
    } catch (err) {
      setVideoErrors((prev) => ({
        ...prev,
        [exerciseId]: err instanceof Error ? err.message : "Please enter a valid YouTube link.",
      }));
    } finally {
      setSavingVideoId(null);
    }
  }

  async function handleRemoveVideo(exerciseId: string) {
    const previousUrl = videos[exerciseId];
    // Optimistic removal, same pattern as handleToggle above.
    setVideos((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
    try {
      await removeExerciseVideo(uid, personId, exerciseId);
    } catch {
      setVideos((prev) => ({ ...prev, [exerciseId]: previousUrl }));
      setVideoErrors((prev) => ({ ...prev, [exerciseId]: "Could not remove link. Please try again." }));
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
          // Defense in depth: re-validate on render, even though setExerciseVideo
          // already validates on write. A stored value could still end up
          // malformed (a manual Firestore edit, a future writer that forgets to
          // validate, etc.), so never trust it as an href without checking again
          // here. Fail closed — an invalid stored url renders as "no link" so
          // the "Add video link" affordance shows instead.
          const rawVideoUrl = videos[ae.exerciseId];
          const videoUrl = rawVideoUrl && isYouTubeUrl(rawVideoUrl) ? rawVideoUrl : undefined;
          const isEditingVideo = editingVideoId === ae.exerciseId;
          const videoError = videoErrors[ae.exerciseId];
          return (
            <div key={ae.exerciseId} className={`exercise-card${done ? " done" : ""}`}>
              <ExerciseFigure name={ex.title} size={56} />
              <div className="exercise-card-body">
                <strong>{ex.title}</strong>
                <span>{ex.bodyPart} · {ex.stage}</span>

                {isEditingVideo ? (
                  <div className="exercise-video-edit-row">
                    <input
                      type="url"
                      inputMode="url"
                      placeholder="Paste a YouTube link"
                      value={draftUrl}
                      aria-label={`YouTube link for ${ex.title}`}
                      onChange={(e) => setDraftUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSaveVideo(ae.exerciseId);
                        if (e.key === "Escape") cancelVideoEdit();
                      }}
                    />
                    <div className="exercise-video-edit-actions">
                      <button
                        type="button"
                        className="exercise-video-save"
                        disabled={savingVideoId === ae.exerciseId}
                        onClick={() => void handleSaveVideo(ae.exerciseId)}
                      >
                        {savingVideoId === ae.exerciseId ? "Saving…" : "Save"}
                      </button>
                      <button type="button" className="exercise-video-cancel" onClick={cancelVideoEdit}>
                        Cancel
                      </button>
                    </div>
                    {videoError && <span className="field-error">{videoError}</span>}
                  </div>
                ) : videoUrl ? (
                  <div className="exercise-video-row">
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="exercise-video-watch">
                      ▶ Watch my video
                    </a>
                    <button
                      type="button"
                      className="exercise-video-edit-btn"
                      aria-label={`Edit video link for ${ex.title}`}
                      onClick={() => startVideoEdit(ae.exerciseId)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="exercise-video-remove-btn"
                      aria-label={`Remove video link for ${ex.title}`}
                      onClick={() => void handleRemoveVideo(ae.exerciseId)}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="exercise-video-row">
                    <button
                      type="button"
                      className="exercise-video-add-btn"
                      onClick={() => startVideoEdit(ae.exerciseId)}
                    >
                      + Add video link
                    </button>
                  </div>
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
          );
        })}
      </div>
    </div>
  );
}
