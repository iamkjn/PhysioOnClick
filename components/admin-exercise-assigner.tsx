// components/admin-exercise-assigner.tsx
"use client";

import { useEffect, useState } from "react";
import {
  assignExercise,
  removeExercise,
  getAssignedExercises,
  type AssignedExercise,
} from "@/lib/recovery";
import { exercises as allExercises } from "@/lib/site-data";
import { SkeletonRow } from "@/components/skeleton";

interface Props {
  adminUid: string;
  patientUid: string;
  personId: string;
}

export function AdminExerciseAssigner({ adminUid, patientUid, personId }: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setLoaded(false);
    getAssignedExercises(patientUid, personId).then((a) => {
      setAssigned(a);
      setLoaded(true);
    });
  }, [patientUid, personId]);

  const assignedIds = new Set(assigned.map((a) => a.exerciseId));
  const unassigned = allExercises.filter((e) => !assignedIds.has(e.id));
  const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));

  if (!loaded) {
    return (
      <div className="panel stack">
        <h3>Assigned exercises</h3>
        <SkeletonRow count={2} />
      </div>
    );
  }

  async function handleAssign(exerciseId: string) {
    setSaving(exerciseId);
    await assignExercise(patientUid, personId, exerciseId, adminUid);
    const updated = await getAssignedExercises(patientUid, personId);
    setAssigned(updated);
    setSaving(null);
  }

  async function handleRemove(exerciseId: string) {
    setSaving(exerciseId);
    await removeExercise(patientUid, personId, exerciseId);
    const updated = await getAssignedExercises(patientUid, personId);
    setAssigned(updated);
    setSaving(null);
  }

  return (
    <div className="panel stack">
      <h3>Assigned exercises</h3>
      {assigned.length === 0 && <p className="muted">None assigned yet.</p>}
      {assigned.map((ae) => {
        const ex = exerciseMap.get(ae.exerciseId);
        return (
          <div
            key={ae.exerciseId}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.5rem 0",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: 14, color: "var(--color-text-primary)" }}>
              {ex?.title ?? ae.exerciseId}
            </span>
            <button
              onClick={() => void handleRemove(ae.exerciseId)}
              disabled={saving === ae.exerciseId}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-error)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {saving === ae.exerciseId ? "…" : "Remove"}
            </button>
          </div>
        );
      })}
      {unassigned.length > 0 && (
        <>
          <h4 style={{ marginBottom: 0, color: "var(--color-text-primary)" }}>Add exercise</h4>
          {unassigned.map((ex) => (
            <div
              key={ex.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.4rem 0",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                {ex.title} · {ex.bodyPart}
              </span>
              <button
                onClick={() => void handleAssign(ex.id)}
                disabled={saving === ex.id}
                style={{
                  background: "var(--color-primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "0.3rem 0.75rem",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {saving === ex.id ? "…" : "Assign"}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
