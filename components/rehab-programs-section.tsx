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
          background: "#fff",
          borderRadius: 14,
          padding: "1rem 1.25rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <p style={{ margin: 0, color: "#5E7A84" }}>No rehab programme assigned yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {programs.map((p) => (
        <div
          key={p.id}
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "1.25rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <strong style={{ display: "block", color: "#0C2A38", fontSize: 16, marginBottom: 4 }}>
            {p.title}
          </strong>
          {p.stage && (
            <span style={{ fontSize: 13, color: "#5E7A84", display: "block", marginBottom: 8 }}>
              {p.stage}
            </span>
          )}
          {p.notes && (
            <p style={{ margin: "0 0 0.75rem", fontSize: 14 }}>{p.notes}</p>
          )}
          {p.goals.length > 0 && (
            <>
              <span style={{ fontWeight: 700, fontSize: 13, display: "block", marginBottom: 6 }}>
                Goals
              </span>
              <ul style={{ margin: "0 0 0.75rem", paddingLeft: "1.25rem" }}>
                {p.goals.map((g, i) => (
                  <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>
                    {g}
                  </li>
                ))}
              </ul>
            </>
          )}
          {p.exerciseIds.length > 0 && (
            <span style={{ fontSize: 12, color: "#5E7A84" }}>
              {p.exerciseIds.length} exercise{p.exerciseIds.length !== 1 ? "s" : ""} assigned
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
