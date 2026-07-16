"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SkeletonRow } from "@/components/skeleton";

interface RehabProgram {
  id: string;
  title: string;
  stage: string;
  notes: string;
  goals: string[];
  exerciseIds: string[];
}

export function RehabProgramsSection({ email }: { email: string }) {
  const [programs, setPrograms] = useState<RehabProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !email) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    const q = query(
      collection(db, "rehabPrograms"),
      where("patientEmail", "==", email)
    );
    getDocs(q)
      .then((snap) => {
        setPrograms(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title ?? "",
              stage: data.stage ?? "",
              notes: data.notes ?? "",
              goals: (data.goals ?? []) as string[],
              exerciseIds: (data.exerciseIds ?? []) as string[],
            } as RehabProgram;
          })
        );
      })
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) return <SkeletonRow count={2} />;

  if (programs.length === 0) {
    return (
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-card)",
          padding: "1rem 1.25rem",
          boxShadow: "var(--shadow)",
        }}
      >
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>No rehab programme assigned yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {programs.map((p) => (
        <div
          key={p.id}
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-card)",
            padding: "1.25rem",
            boxShadow: "var(--shadow)",
          }}
        >
          <strong style={{ display: "block", color: "var(--color-text-primary)", fontSize: "var(--text-base)", marginBottom: 4 }}>
            {p.title}
          </strong>
          {p.stage && (
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", display: "block", marginBottom: 8 }}>
              {p.stage}
            </span>
          )}
          {p.notes && (
            <p style={{ margin: "0 0 0.75rem", fontSize: "var(--text-sm)" }}>{p.notes}</p>
          )}
          {p.goals.length > 0 && (
            <>
              <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", display: "block", marginBottom: 6 }}>
                Goals
              </span>
              <ul style={{ margin: "0 0 0.75rem", paddingLeft: "1.25rem" }}>
                {p.goals.map((g, i) => (
                  <li key={i} style={{ marginBottom: 4, fontSize: "var(--text-sm)" }}>
                    {g}
                  </li>
                ))}
              </ul>
            </>
          )}
          {p.exerciseIds.length > 0 && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              {p.exerciseIds.length} exercise{p.exerciseIds.length !== 1 ? "s" : ""} assigned
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
