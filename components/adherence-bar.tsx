// components/adherence-bar.tsx
"use client";

import { useEffect, useState } from "react";
import { getExerciseLogs, dateKeyDaysAgo } from "@/lib/recovery";
import { Skeleton, SkeletonText } from "@/components/skeleton";

interface Props {
  uid: string;
  personId: string;
}

export function AdherenceBar({ uid, personId }: Props) {
  const [daysCompleted, setDaysCompleted] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    // Fetch a bit more than 7 log documents in case some of the last 7
    // calendar days have no log — we still only count within the window.
    getExerciseLogs(uid, personId, 14).then((logs) => {
      const last7Days = new Set(Array.from({ length: 7 }, (_, i) => dateKeyDaysAgo(i)));
      const completed = logs.filter(
        (log) => last7Days.has(log.date) && Object.values(log.completions).some(Boolean)
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
  if (daysCompleted === null)
    return (
      <div className="panel stack">
        <h3>This week&apos;s adherence</h3>
        <SkeletonText lines={1} lastLineWidth="60%" />
        <Skeleton height="12px" width="100%" className="skeleton-bar" />
      </div>
    );

  const pct = Math.round((daysCompleted / 7) * 100);

  return (
    <div className="panel stack">
      <h3>This week&apos;s adherence</h3>
      <p className="muted">{daysCompleted} of 7 days with exercises completed.</p>
      <div
        style={{
          background: "var(--color-primary-light)",
          borderRadius: 999,
          height: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: pct >= 70 ? "var(--color-primary)" : pct >= 40 ? "var(--color-warning)" : "var(--color-error)",
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{pct}% this week</span>
    </div>
  );
}
