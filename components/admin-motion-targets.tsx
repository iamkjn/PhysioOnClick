// components/admin-motion-targets.tsx
"use client";

import { useEffect, useState } from "react";
import { getMotionTarget, saveMotionTarget } from "@/lib/motion";
import type { MotionTarget } from "@/lib/motion-targets";
import { exercises as allExercises } from "@/lib/site-data";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface Props {
  adminUid: string;
}

type EditableFields = Pick<
  MotionTarget,
  "targetRomMin" | "targetRomMax" | "repEnterAngle" | "repExitAngle" | "repTarget"
>;

type Row = { exerciseId: string; title: string; base: MotionTarget; fields: EditableFields };

const NUMBER_FIELDS: { key: keyof EditableFields; label: string }[] = [
  { key: "targetRomMin", label: "Target ROM min (°)" },
  { key: "targetRomMax", label: "Target ROM max (°)" },
  { key: "repEnterAngle", label: "Rep enter angle (°)" },
  { key: "repExitAngle", label: "Rep exit angle (°)" },
  { key: "repTarget", label: "Rep target (reps)" },
];

function fieldsFrom(target: MotionTarget): EditableFields {
  return {
    targetRomMin: target.targetRomMin,
    targetRomMax: target.targetRomMax,
    repEnterAngle: target.repEnterAngle,
    repExitAngle: target.repExitAngle,
    repTarget: target.repTarget,
  };
}

// Admin editor for the motion-capture thresholds ("Check your motion")
// judges each exercise against. Only exercises with a target — stored in
// Firestore or falling back to lib/motion-targets's DEFAULT_MOTION_TARGETS —
// get a form; exercises with no target (e.g. balance holds) are skipped
// entirely since there's nothing to tune.
export function AdminMotionTargets({ adminUid }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    Promise.all(
      allExercises.map((ex) =>
        getMotionTarget(ex.id).then((target) => ({ ex, target }))
      )
    ).then((results) => {
      if (cancelled) return;
      const next = results
        .filter((r): r is { ex: (typeof allExercises)[number]; target: MotionTarget } => r.target !== null)
        .map(({ ex, target }) => ({
          exerciseId: ex.id,
          title: ex.title,
          base: target,
          fields: fieldsFrom(target),
        }));
      setRows(next);
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
  }

  async function handleSave(exerciseId: string, e: React.FormEvent) {
    e.preventDefault();
    const row = rows.find((r) => r.exerciseId === exerciseId);
    if (!row) return;
    setSaving(exerciseId);
    try {
      await saveMotionTarget({ ...row.base, ...row.fields }, adminUid);
      setRows((prev) =>
        prev.map((r) => (r.exerciseId === exerciseId ? { ...r, base: { ...r.base, ...r.fields } } : r))
      );
      toast.show(`Saved motion target for ${row.title}.`, "success");
    } catch {
      toast.show(`Could not save motion target for ${row.title}. Try again.`, "error");
    } finally {
      setSaving(null);
    }
  }

  if (!loaded) {
    return (
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Motion targets</h2>
        <SkeletonRow count={2} />
      </div>
    );
  }

  return (
    <div className="panel stack">
      <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Motion targets</h2>
      {rows.length === 0 && <p className="muted">No exercises have a motion target yet.</p>}
      {rows.map((row) => (
        <form
          key={row.exerciseId}
          className="motion-target-row"
          onSubmit={(e) => void handleSave(row.exerciseId, e)}
          aria-busy={saving === row.exerciseId}
        >
          <div className="motion-target-row-head">
            <strong>{row.title}</strong>
          </div>
          <div className="motion-target-fields">
            {NUMBER_FIELDS.map(({ key, label }) => (
              <label key={key} className="motion-target-field">
                {label}
                <input
                  type="number"
                  className="input"
                  value={row.fields[key]}
                  onChange={(e) => updateField(row.exerciseId, key, Number(e.target.value))}
                />
              </label>
            ))}
            <button
              type="submit"
              className="button primary"
              disabled={saving === row.exerciseId}
              aria-label={`Save motion target for ${row.title}`}
            >
              {saving === row.exerciseId ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      ))}
    </div>
  );
}

export default AdminMotionTargets;
