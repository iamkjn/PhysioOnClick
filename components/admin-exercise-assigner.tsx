// components/admin-exercise-assigner.tsx
"use client";

import { useEffect, useState } from "react";
import {
  assignExercise,
  removeExercise,
  getAssignedExercises,
  setAssignedDosage,
  type AssignedExercise,
} from "@/lib/recovery";
import { exercises as allExercises } from "@/lib/site-data";
import { resolveDosage, formatDosage, validateDosage, type ExerciseDosage } from "@/lib/exercises";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DEFAULT_MOTION_TARGETS } from "@/lib/motion-targets";
import { ExerciseImage } from "@/components/exercise-image";
import type { Suggestion } from "@/lib/exercise-suggestions";

function MotionBadge({ exerciseId }: { exerciseId: string }) {
  if (!(exerciseId in DEFAULT_MOTION_TARGETS)) return null;
  return (
    <span className="motion-check-badge" title="Enables the patient's motion check">
      🎯 Motion check
    </span>
  );
}

interface Props {
  adminUid: string;
  patientUid: string;
  personId: string;
  // When true, the panel is a plain read-only list of what's currently
  // assigned — no add / remove / edit-dose. The patient detail screen uses
  // this: assigning is only editable there while an online assessment has
  // been submitted and a session summary is still pending.
  readOnly?: boolean;
  readOnlyReason?: string;
  suggestions?: Suggestion[];
  onAssignmentChange?: (exerciseId: string, action: "assigned" | "removed") => void | Promise<void>;
}

export function AdminExerciseAssigner({
  adminUid,
  patientUid,
  personId,
  readOnly = false,
  readOnlyReason,
  suggestions = [],
  onAssignmentChange,
}: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ exerciseId: string; title: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    getAssignedExercises(patientUid, personId).then((a) => {
      if (cancelled) return;
      setAssigned(a);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [patientUid, personId]);

  const assignedIds = new Set(assigned.map((a) => a.exerciseId));
  const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));
  const allCategories = Array.from(new Set(allExercises.map((e) => e.bodyPart))).sort((a, b) => a.localeCompare(b));

  const activeSuggestions = suggestions.filter(
    ({ exercise }) => !assignedIds.has(exercise.id) && !dismissedSuggestions.includes(exercise.id),
  );
  const activeSuggestionIds = new Set(activeSuggestions.map(({ exercise }) => exercise.id));

  // The full gallery excludes exercises already shown in the selected or
  // suggested sections, so every assignable exercise appears exactly once.
  const q = search.trim().toLowerCase();
  const galleryExercises = allExercises.filter(
    (e) =>
      !assignedIds.has(e.id) &&
      !activeSuggestionIds.has(e.id) &&
      !e.retired &&
      (catFilter === "All" || e.bodyPart === catFilter) &&
      (q === "" ||
        e.title.toLowerCase().includes(q) ||
        e.bodyPart.toLowerCase().includes(q) ||
        e.condition.toLowerCase().includes(q) ||
        e.tags.some((tag) => tag.toLowerCase().includes(q))),
  );
  const visibleGalleryExercises = galleryExercises.slice(0, visibleLimit);

  if (!loaded) {
    return (
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Assigned exercises</h2>
        <SkeletonRow count={2} />
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Assigned exercises</h2>
        {readOnlyReason && (
          <p className="muted" style={{ margin: 0, fontSize: "var(--text-xs)" }}>{readOnlyReason}</p>
        )}
        {assigned.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>None assigned yet.</p>
        ) : (
          assigned.map((ae) => {
            const ex = exerciseMap.get(ae.exerciseId);
            const title = ex?.title ?? ae.exerciseId;
            const doseLabel = ex ? formatDosage(resolveDosage(ex, ae)) : null;
            return (
              <div key={ae.exerciseId} className="assign-row">
                <span className="assign-row-label">
                  {doseLabel ? `${title} · ${doseLabel}` : title} <MotionBadge exerciseId={ae.exerciseId} />
                </span>
              </div>
            );
          })
        )}
      </div>
    );
  }

  async function handleAssign(exerciseId: string) {
    setSaving(exerciseId);
    try {
      await assignExercise(patientUid, personId, exerciseId, adminUid);
      const updated = await getAssignedExercises(patientUid, personId);
      setAssigned(updated);
      await onAssignmentChange?.(exerciseId, "assigned");
    } catch {
      toast.show("Could not assign exercise. Try again.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function handleRemove(exerciseId: string) {
    setSaving(exerciseId);
    setEditing((cur) => (cur === exerciseId ? null : cur));
    try {
      await removeExercise(patientUid, personId, exerciseId);
      const updated = await getAssignedExercises(patientUid, personId);
      setAssigned(updated);
      await onAssignmentChange?.(exerciseId, "removed");
    } catch {
      toast.show("Could not remove exercise. Try again.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveDose(exerciseId: string, dose: ExerciseDosage) {
    // Only ever runs for a row already in `assigned` — the Edit-dose control
    // lives on assigned rows, never on the "Add exercise from library" picker.
    // A bare `{merge:true}` write on an unassigned id would create a partial doc.
    //
    // Persist ONLY the fields that differ from the catalogue default. Saving the
    // full effective dose would freeze this patient's dose against future
    // `defaultDosage` revisions (Plan 2). "Reset to default" passes `{}` →
    // `override` stays `{}` → resolves back to the catalogue default.
    const ex = exerciseMap.get(exerciseId);
    const baseline = ex ? resolveDosage(ex, {}) : ({} as ExerciseDosage);
    const override: ExerciseDosage = {};
    for (const [k, v] of Object.entries(dose)) {
      if (v !== undefined && v !== (baseline as Record<string, unknown>)[k]) {
        (override as Record<string, unknown>)[k] = v;
      }
    }
    try {
      await setAssignedDosage(patientUid, personId, exerciseId, override);
      const updated = await getAssignedExercises(patientUid, personId);
      setAssigned(updated);
      setEditing(null);
    } catch {
      toast.show("Could not save the dose. Try again.", "error");
    }
  }

  return (
    <div className="exercise-plan-builder">
      <section className="clinical-picker__section" aria-labelledby="assigned-exercises-title">
        <div className="clinical-picker__heading">
          <div>
            <span className="clinical-picker__eyebrow">Selected for this patient</span>
            <h2 id="assigned-exercises-title">Exercise plan</h2>
            <p>{assigned.length} exercise{assigned.length === 1 ? "" : "s"} assigned. Adjust the dose or remove an exercise at any time.</p>
          </div>
        </div>

        {assigned.length === 0 ? (
          <div className="clinical-picker__empty">
            <strong>No exercises selected</strong>
            <span>Assign a suggested exercise or choose one from the full gallery below.</span>
          </div>
        ) : (
          <div className="clinical-picker__grid">
            {assigned.map((ae) => {
              const ex = exerciseMap.get(ae.exerciseId);
              const title = ex?.title ?? ae.exerciseId;
              const doseLabel = ex ? formatDosage(resolveDosage(ex, ae)) : null;
              const isEditing = editing === ae.exerciseId;
              return (
                <article key={ae.exerciseId} className="clinical-picker-card is-selected">
                  {ex && <ExerciseImage exerciseId={ex.id} name={ex.title} pose={ex.pose} size={112} />}
                  <div className="clinical-picker-card__body">
                    <div className="clinical-picker-card__badges">
                      <span>{ex?.bodyPart ?? "Assigned"}</span>
                      <span className="is-selected">In plan</span>
                    </div>
                    <h4>{title}</h4>
                    {doseLabel && <p className="clinical-picker-card__dose">{doseLabel}</p>}
                    {ex && <p>{ex.description}</p>}
                    <MotionBadge exerciseId={ae.exerciseId} />
                  </div>
                  <div className="clinical-picker-card__actions">
                    {ex && (
                      <button
                        type="button"
                        onClick={() => setEditing(isEditing ? null : ae.exerciseId)}
                        aria-expanded={isEditing}
                        aria-controls={`dose-${ae.exerciseId}`}
                        className="session-text-button"
                      >
                        {isEditing ? "Close dose" : "Edit dose"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setRemoveTarget({ exerciseId: ae.exerciseId, title })}
                      disabled={saving === ae.exerciseId}
                      aria-label={`Remove ${title} from assigned exercises`}
                      className="session-text-button session-text-button--danger"
                    >
                      {saving === ae.exerciseId ? "Removing..." : "Remove"}
                    </button>
                  </div>
                  {ex && isEditing && (
                    <DoseForm
                      id={`dose-${ae.exerciseId}`}
                      initial={resolveDosage(ex, ae)}
                      onSave={(dose) => handleSaveDose(ae.exerciseId, dose)}
                      onCancel={() => setEditing(null)}
                    />
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {activeSuggestions.length > 0 && (
        <section className="clinical-picker__section clinical-picker__section--suggested" aria-labelledby="suggested-exercises-title">
          <div className="clinical-picker__heading">
            <div>
              <span className="clinical-picker__eyebrow">Matched to assessment and clinical impression</span>
              <h3 id="suggested-exercises-title">Suggested exercises</h3>
              <p>Assign a match or cancel the suggestion. Cancelled exercises remain available in the full gallery.</p>
            </div>
          </div>
          <div className="clinical-picker__grid clinical-picker__grid--compact">
            {activeSuggestions.map(({ exercise, reason }) => (
              <article key={exercise.id} className="clinical-picker-card is-suggested">
                <button
                  type="button"
                  className="clinical-picker-card__dismiss"
                  aria-label={`Cancel ${exercise.title} suggestion`}
                  title="Cancel suggestion"
                  onClick={() => setDismissedSuggestions((current) => [...current, exercise.id])}
                >
                  ×
                </button>
                <ExerciseImage exerciseId={exercise.id} name={exercise.title} pose={exercise.pose} size={112} />
                <div className="clinical-picker-card__body">
                  <div className="clinical-picker-card__badges"><span>{exercise.bodyPart}</span><span className="is-suggested">Suggested</span></div>
                  <h4>{exercise.title}</h4>
                  <p>{reason.replace(/^Suggested:\s*/i, "")}</p>
                </div>
                <button
                  type="button"
                  className="button small primary"
                  disabled={saving === exercise.id}
                  onClick={() => void handleAssign(exercise.id)}
                >
                  {saving === exercise.id ? "Assigning..." : "Assign exercise"}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="clinical-picker__section" aria-labelledby="exercise-gallery-title">
        <div className="clinical-picker__heading">
          <div>
            <span className="clinical-picker__eyebrow">Complete catalogue</span>
            <h3 id="exercise-gallery-title">All assignable exercises</h3>
            <p>Everything available to assign is shown here. Search or filter by body area.</p>
          </div>
          <label className="clinical-picker__search">
            <span className="sr-only">Search exercises</span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setVisibleLimit(24);
              }}
              placeholder="Search exercise, body area or condition"
            />
          </label>
        </div>
        <div className="exercise-filter-row" role="tablist" aria-label="Filter exercises by category">
          {["All", ...allCategories].map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={catFilter === category}
              className={`exercise-filter-pill${catFilter === category ? " active" : ""}`}
              onClick={() => {
                setCatFilter(category);
                setVisibleLimit(24);
              }}
            >
              {category}
            </button>
          ))}
        </div>
        {galleryExercises.length === 0 ? (
          <div className="clinical-picker__empty"><strong>No exercises match this search</strong></div>
        ) : (
          <div className="clinical-picker__grid clinical-picker__grid--compact">
            {visibleGalleryExercises.map((exercise) => (
              <article key={exercise.id} className="clinical-picker-card">
                <ExerciseImage exerciseId={exercise.id} name={exercise.title} pose={exercise.pose} size={112} />
                <div className="clinical-picker-card__body">
                  <div className="clinical-picker-card__badges"><span>{exercise.bodyPart}</span><span>{exercise.stage}</span></div>
                  <h4>{exercise.title}</h4>
                  <p>{exercise.description}</p>
                  <MotionBadge exerciseId={exercise.id} />
                </div>
                <button
                  type="button"
                  className="button small secondary"
                  disabled={saving === exercise.id}
                  aria-label={`Assign ${exercise.title}`}
                  onClick={() => void handleAssign(exercise.id)}
                >
                  {saving === exercise.id ? "Assigning..." : "Assign exercise"}
                </button>
              </article>
            ))}
          </div>
        )}
        {galleryExercises.length > visibleLimit && (
          <button
            type="button"
            className="button secondary clinical-picker__show-more"
            onClick={() => setVisibleLimit((current) => current + 24)}
          >
            Show more exercises ({galleryExercises.length - visibleLimit} remaining)
          </button>
        )}
      </section>

      <ConfirmDialog
        isOpen={removeTarget !== null}
        title="Remove this exercise?"
        body={removeTarget ? `This removes "${removeTarget.title}" from the patient's assigned exercises.` : ""}
        confirmLabel="Remove"
        confirmVariant="destructive"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          const target = removeTarget;
          setRemoveTarget(null);
          if (!target) return;
          void handleRemove(target.exerciseId);
        }}
      />
    </div>
  );
}

function DoseForm({
  id, initial, onSave, onCancel,
}: {
  id: string;
  initial: ExerciseDosage;
  onSave: (d: ExerciseDosage) => Promise<void>;
  onCancel: () => void;
}) {
  const [d, setD] = useState<ExerciseDosage>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const num = (k: keyof ExerciseDosage) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setD((p) => ({ ...p, [k]: v === "" ? undefined : Number(v) }));
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateDosage(d);
    if (v) { setErr(v); return; }
    setErr(null);
    setSaving(true);
    try { await onSave(d); } finally { setSaving(false); }
  }
  return (
    <form className="dose-form" id={id} onSubmit={(e) => void submit(e)}>
      <label>Sets <input type="number" min={0} value={d.sets ?? ""} onChange={num("sets")} /></label>
      <label>Reps <input type="number" min={0} value={d.reps ?? ""} onChange={num("reps")} /></label>
      <label>Hold (s) <input type="number" min={0} value={d.holdSeconds ?? ""} onChange={num("holdSeconds")} /></label>
      <label>Times/day <input type="number" min={0} value={d.perDay ?? ""} onChange={num("perDay")} /></label>
      <label>Days/week <input type="number" min={1} max={7} value={d.perWeek ?? ""} onChange={num("perWeek")} /></label>
      <label>Tempo <input type="text" value={d.tempo ?? ""} onChange={(e) => setD((p) => ({ ...p, tempo: e.target.value || undefined }))} /></label>
      <label className="dose-form-note">Note to patient
        <textarea rows={2} maxLength={300} value={d.notes ?? ""} onChange={(e) => setD((p) => ({ ...p, notes: e.target.value || undefined }))} />
      </label>
      {err && <p className="field-error">{err}</p>}
      <div className="dose-form-actions">
        <button type="submit" className="button primary" disabled={saving}>{saving ? "Saving…" : "Save dose"}</button>
        <button type="button" className="text-button" onClick={() => onSave({})}>Reset to default</button>
        <button type="button" className="text-button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
