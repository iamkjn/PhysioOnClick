// components/adherence-bar.tsx
"use client";

import { useEffect, useState } from "react";
import { getExerciseLogs } from "@/lib/recovery";

interface Props {
  uid: string;
  personId: string;
}

export function AdherenceBar({ uid, personId }: Props) {
  const [daysCompleted, setDaysCompleted] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    getExerciseLogs(uid, personId, 7).then((logs) => {
      const completed = logs.filter((log) =>
        Object.values(log.completions).some(Boolean)
      ).length;
      setDaysCompleted(completed);
    }).catch(() => {
      setError("Could not load adherence data.");
    });
  }, [uid, personId]);

  if (error)
    return (
      <div className="panel stack">
        <h3>This week&apos;s adherence</h3>
        <p className="muted">{error}</p>
      </div>
    );
  if (daysCompleted === null) return null;

  const pct = Math.round((daysCompleted / 7) * 100);

  return (
    <div className="panel stack">
      <h3>This week&apos;s adherence</h3>
      <p className="muted">{daysCompleted} of 7 days with exercises completed.</p>
      <div
        style={{
          background: "#E0F2FE",
          borderRadius: 999,
          height: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: pct >= 70 ? "#0891B2" : pct >= 40 ? "#f59e0b" : "#ef4444",
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: "#5E7A84" }}>{pct}% this week</span>
    </div>
  );
}
