// components/admin-face-targets.tsx
"use client";

import { useEffect, useState } from "react";
import { getFaceMotionTarget, saveFaceMotionTarget } from "@/lib/motion";
import type { FaceTarget } from "@/lib/face-targets";
import { exercises as allExercises } from "@/lib/site-data";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface Props {
  adminUid: string;
}

// The tunable thresholds for a facial symmetry/rep check. The landmark pairs
// and invert flag are structural (which points define the movement) and stay
// fixed per exercise; only these numbers get tuned against real patients.
type EditableFields = Pick<
  FaceTarget,
  "restSignal" | "activeSignal" | "repEnterPct" | "repExitPct" | "repTarget"
>;

type Row = { exerciseId: string; title: string; base: FaceTarget; fields: EditableFields };

const NUMBER_FIELDS: { key: keyof EditableFields; label: string; min: number; step: number }[] = [
  { key: "restSignal", label: "Rest signal (ratio)", min: 0, step: 0.01 },
  { key: "activeSignal", label: "Active signal (ratio)", min: 0, step: 0.01 },
  { key: "repEnterPct", label: "Rep enter (%)", min: 1, step: 1 },
  { key: "repExitPct", label: "Rep exit (%)", min: 0, step: 1 },
  { key: "repTarget", label: "Rep target (reps)", min: 1, step: 1 },
];

// A rep is counted when activation crosses up past repEnterPct then back below
// repExitPct, so enter must stay above exit. And rest/active must differ or the
// activation mapping divides by a zero span and every frame reads 0%.
function validationError(f: EditableFields): string | null {
  if (f.restSignal === f.activeSignal) return "Rest signal and active signal must differ.";
  if (f.repEnterPct <= f.repExitPct) return "Rep enter % must be greater than rep exit %.";
  if (f.repEnterPct > 100) return "Rep enter % cannot exceed 100.";
  return null;
}

function fieldsFrom(t: FaceTarget): EditableFields {
  return {
    restSignal: t.restSignal,
    activeSignal: t.activeSignal,
    repEnterPct: t.repEnterPct,
    repExitPct: t.repExitPct,
    repTarget: t.repTarget,
  };
}

// Admin editor for facial motion-check thresholds (palsy/stroke/older-patient
// symmetry checks), the facial counterpart of AdminMotionTargets. Only face-*
// exercises with a target — from Firestore faceMotionTargets or the code
// defaults in lib/face-targets — get a form.
export function AdminFaceTargets({ adminUid }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setLoadError(null);
    const faceExercises = allExercises.filter((ex) => ex.id.startsWith("face-"));
    Promise.all(faceExercises.map((ex) => getFaceMotionTarget(ex.id).then((target) => ({ ex, target }))))
      .then((results) => {
        if (cancelled) return;
        const next = results
          .filter((r): r is { ex: (typeof allExercises)[number]; target: FaceTarget } => r.target !== null)
          .map(({ ex, target }) => ({
            exerciseId: ex.id,
            title: ex.title,
            base: target,
            fields: fieldsFrom(target),
          }))
          .sort((a, b) => a.title.localeCompare(b.title));
        setRows(next);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError("Couldn't load — try again.");
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(exerciseId: string, key: keyof EditableFields, value: number) {
    setRows((prev) =>
      prev.map((r) => (r.exerciseId === exerciseId ? { ...r, fields: { ...r.fields, [key]: value } } : r))
    );
    setFieldErrors((prev) => {
      if (!(exerciseId in prev)) return prev;
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
  }

  async function handleSave(exerciseId: string, e: React.FormEvent) {
    e.preventDefault();
    const row = rows.find((r) => r.exerciseId === exerciseId);
    if (!row) return;
    const error = validationError(row.fields);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [exerciseId]: error }));
      return;
    }
    setFieldErrors((prev) => {
      if (!(exerciseId in prev)) return prev;
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
    setSaving(exerciseId);
    try {
      await saveFaceMotionTarget({ ...row.base, ...row.fields }, adminUid);
      setRows((prev) =>
        prev.map((r) => (r.exerciseId === exerciseId ? { ...r, base: { ...r.base, ...r.fields } } : r))
      );
      toast.show(`Saved facial target for ${row.title}.`, "success");
    } catch {
      toast.show(`Could not save facial target for ${row.title}. Try again.`, "error");
    } finally {
      setSaving(null);
    }
  }

  if (!loaded) {
    return (
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Facial motion targets</h2>
        <SkeletonRow count={2} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Facial motion targets</h2>
        <p className="field-error">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="panel stack">
      <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Facial motion targets</h2>
      <p className="muted" style={{ margin: 0 }}>
        Symmetry &amp; rep thresholds for facial-rehab checks. Signals are distances normalised by
        eye width; a rep counts when activation rises past &ldquo;enter&rdquo; then drops below &ldquo;exit&rdquo;.
      </p>
      {rows.length === 0 && <p className="muted">No facial exercises have a target yet.</p>}
      {rows.map((row) => (
        <form
          key={row.exerciseId}
          className="motion-target-row"
          onSubmit={(e) => void handleSave(row.exerciseId, e)}
          aria-busy={saving === row.exerciseId}
        >
          <div className="motion-target-row-head">
            <span className="motion-target-bodypart">Face</span>
            <strong>{row.title}</strong>
            {row.base.invert && <span className="motion-target-direction">closing movement (inverted)</span>}
          </div>
          <div className="motion-target-fields">
            {NUMBER_FIELDS.map(({ key, label, min, step }) => (
              <label key={key} className="motion-target-field">
                {label}
                <input
                  type="number"
                  className="input"
                  min={min}
                  step={step}
                  value={row.fields[key]}
                  onChange={(e) => updateField(row.exerciseId, key, Number(e.target.value))}
                />
              </label>
            ))}
            <button
              type="submit"
              className="button primary"
              disabled={saving === row.exerciseId}
              aria-label={`Save facial target for ${row.title}`}
            >
              {saving === row.exerciseId ? "Saving…" : "Save"}
            </button>
          </div>
          {fieldErrors[row.exerciseId] && <p className="field-error">{fieldErrors[row.exerciseId]}</p>}
        </form>
      ))}
    </div>
  );
}

export default AdminFaceTargets;
