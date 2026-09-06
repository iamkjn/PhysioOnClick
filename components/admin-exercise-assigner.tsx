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
}

export function AdminExerciseAssigner({ adminUid, patientUid, personId }: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ exerciseId: string; title: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
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

  // Unassigned exercises, narrowed by the category filter + free-text search.
  const q = search.trim().toLowerCase();
  const unassigned = allExercises.filter(
    (e) =>
      !assignedIds.has(e.id) &&
      !e.retired &&
      (catFilter === "All" || e.bodyPart === catFilter) &&
      (q === "" || e.title.toLowerCase().includes(q) || e.bodyPart.toLowerCase().includes(q)),
  );

  // Group the (filtered) "Add exercise" list by bodyPart, alphabetical.
  const unassignedByCategory = new Map<string, typeof unassigned>();
  for (const ex of unassigned) {
    const bucket = unassignedByCategory.get(ex.bodyPart);
    if (bucket) bucket.push(ex);
    else unassignedByCategory.set(ex.bodyPart, [ex]);
  }
  const categories = Array.from(unassignedByCategory.keys()).sort((a, b) => a.localeCompare(b));

  if (!loaded) {
    return (
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Assigned exercises</h2>
        <SkeletonRow count={2} />
      </div>
    );
  }

  async function handleAssign(exerciseId: string) {
    setSaving(exerciseId);
    try {
      await assignExercise(patientUid, personId, exerciseId, adminUid);
      const updated = await getAssignedExercises(patientUid, personId);
      setAssigned(updated);
    } catch {
      toast.show("Could not assign exercise. Try again.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function handleRemove(exerciseId: string) {
    setSaving(exerciseId);
    try {
      await removeExercise(patientUid, personId, exerciseId);
      const updated = await getAssignedExercises(patientUid, personId);
      setAssigned(updated);
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
    try {
      await setAssignedDosage(patientUid, personId, exerciseId, dose);
      const updated = await getAssignedExercises(patientUid, personId);
      setAssigned(updated);
      setEditing(null);
    } catch {
      toast.show("Could not save the dose. Try again.", "error");
    }
  }

  return (
    <div className="panel stack">
      {/* h2, not h3 — sibling of AdminPatientSelector/AdminClinicalEntry
          (also h2) under the recovery page's single h1; size pinned to the
          old h3 value so this reads the same. "Add exercise" below is
          bumped h4 → h3 to stay sequential under it. */}
      <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Assigned exercises</h2>
      {assigned.length === 0 && <p className="muted">None assigned yet.</p>}
      {assigned.map((ae) => {
        const ex = exerciseMap.get(ae.exerciseId);
        const title = ex?.title ?? ae.exerciseId;
        const doseLabel = ex ? formatDosage(resolveDosage(ex, ae)) : null;
        const isEditing = editing === ae.exerciseId;
        return (
          <div key={ae.exerciseId}>
            <div className="assign-row">
              <span className="assign-row-label">
                {doseLabel ? `${title} · ${doseLabel}` : title} <MotionBadge exerciseId={ae.exerciseId} />
              </span>
              <span className="assign-row-actions">
                {ex && (
                  <button
                    type="button"
                    onClick={() => setEditing(isEditing ? null : ae.exerciseId)}
                    aria-expanded={isEditing}
                    className="assign-edit-dose"
                  >
                    {isEditing ? "Close" : "Edit dose"}
                  </button>
                )}
                <button
                  onClick={() => setRemoveTarget({ exerciseId: ae.exerciseId, title })}
                  disabled={saving === ae.exerciseId}
                  aria-label={`Remove ${title} from assigned exercises`}
                  className="assign-remove"
                >
                  {saving === ae.exerciseId ? "…" : "Remove"}
                </button>
              </span>
            </div>
            {ex && isEditing && (
              <DoseForm
                initial={resolveDosage(ex, ae)}
                onSave={(d) => handleSaveDose(ae.exerciseId, d)}
                onCancel={() => setEditing(null)}
              />
            )}
          </div>
        );
      })}
      <h3 style={{ marginBottom: 0, fontSize: "var(--text-md)", color: "var(--color-text-primary)" }}>Add exercise from library</h3>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search exercises…"
        aria-label="Search exercises"
        style={{
          width: "100%",
          border: "1.5px solid var(--color-border)",
          borderRadius: "var(--radius-input)",
          padding: "var(--space-2) var(--space-3)",
          fontSize: "var(--text-sm)",
          fontFamily: "var(--font-sans)",
          color: "var(--color-navy)",
          boxSizing: "border-box",
        }}
      />
      <div className="exercise-filter-row" role="tablist" aria-label="Filter exercises by category">
        {["All", ...allCategories].map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={catFilter === c}
            className={`exercise-filter-pill${catFilter === c ? " active" : ""}`}
            onClick={() => setCatFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>
      {categories.length === 0 ? (
        <p className="muted">No exercises match your search.</p>
      ) : (
        categories.map((category) => (
          <div key={category} className="assign-group">
            <p className="assign-group-label">{category}</p>
            {unassignedByCategory.get(category)!.map((ex) => (
              <div key={ex.id} className="assign-row">
                <span className="assign-row-sub">{ex.title} <MotionBadge exerciseId={ex.id} /></span>
                <button
                  onClick={() => void handleAssign(ex.id)}
                  disabled={saving === ex.id}
                  aria-label={`Assign ${ex.title}`}
                  className="assign-add-btn"
                >
                  {saving === ex.id ? "…" : "Assign"}
                </button>
              </div>
            ))}
          </div>
        ))
      )}

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
  initial, onSave, onCancel,
}: {
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
    setSaving(true);
    try { await onSave(d); } finally { setSaving(false); }
  }
  return (
    <form className="dose-form" onSubmit={(e) => void submit(e)}>
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
