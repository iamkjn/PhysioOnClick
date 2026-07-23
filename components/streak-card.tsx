"use client";

import { useEffect, useState } from "react";
import { getExerciseLogs, dateKeyDaysAgo } from "@/lib/recovery";
import { Skeleton, SkeletonText } from "@/components/skeleton";

interface Props {
  uid: string;
  personId: string;
}

// Current daily streak = the run of consecutive days, counting back from today,
// on which at least one assigned exercise was completed. Mirrors the streak the
// mobile app and the seed script (demoDailyCompletions) show. Today not yet
// logged doesn't break the streak — we allow the run to start at "yesterday" so
// an untouched today reads as "keep it going", not "streak lost".
function computeStreak(completedDates: Set<string>): number {
  let streak = 0;
  const startOffset = completedDates.has(dateKeyDaysAgo(0)) ? 0 : 1;
  for (let i = startOffset; i < 400; i += 1) {
    if (completedDates.has(dateKeyDaysAgo(i))) streak += 1;
    else break;
  }
  return streak;
}

export function StreakCard({ uid, personId }: Props) {
  const [streak, setStreak] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStreak(null);
    setError(null);
    // 60 days back is plenty to bound any realistic single-practice streak
    // while keeping the read small.
    getExerciseLogs(uid, personId, 60)
      .then((logs) => {
        if (cancelled) return;
        const done = new Set(
          logs.filter((log) => Object.values(log.completions).some(Boolean)).map((log) => log.date)
        );
        setStreak(computeStreak(done));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your streak.");
      });
    return () => {
      cancelled = true;
    };
  }, [uid, personId]);

  if (error)
    return (
      <div className="panel stack">
        <h3>Daily streak</h3>
        <p className="field-error">{error}</p>
      </div>
    );

  if (streak === null)
    return (
      <div className="panel stack">
        <h3>Daily streak</h3>
        <SkeletonText lines={1} lastLineWidth="50%" />
        <Skeleton height="44px" width="80px" />
      </div>
    );

  return (
    <div className="panel stack">
      <h3>Daily streak</h3>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
        <span aria-hidden="true" style={{ fontSize: 32 }}>🔥</span>
        <span style={{ fontSize: 40, fontWeight: 800, color: "var(--color-navy)", fontFamily: "var(--font-serif)", lineHeight: 1 }}>
          {streak}
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          {streak === 1 ? "day" : "days"}
        </span>
      </div>
      <p className="muted" style={{ margin: 0 }}>
        {streak === 0
          ? "Complete today's exercises to start a streak."
          : "Consecutive days with exercises completed. Keep it going!"}
      </p>
    </div>
  );
}
