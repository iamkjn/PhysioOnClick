// components/admin-recovery-summary.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getExerciseLogs,
  getAssignedExercises,
  getPainLogs,
  computeStreakDays,
  dateKeyDaysAgo,
  type PainLog,
} from "@/lib/recovery";
import { getStreakGoal } from "@/lib/goals";
import { RecoveryPercentCard } from "@/components/recovery-percent-card";
import { SkeletonRow } from "@/components/skeleton";

interface Props {
  patientUid: string;
  personId: string;
}

const WEEK_DAYS = 7;

interface DayCell {
  date: string;
  label: string; // weekday initial
  done: boolean;
  isToday: boolean;
}

interface Loaded {
  streak: number;
  goal: number | null;
  assignedCount: number;
  // oldest → newest, exactly the last 7 calendar days
  week: DayCell[];
  weekCount: number;
  latestPain: PainLog | null;
}

export function AdminRecoverySummary({ patientUid, personId }: Props) {
  const [data, setData] = useState<Loaded | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setData(undefined);
    Promise.all([
      // A little more than 7 log docs in case recent days have no log at all;
      // computeStreakDays still needs enough history to count a long run.
      getExerciseLogs(patientUid, personId, 60),
      getAssignedExercises(patientUid, personId),
      getPainLogs(patientUid, personId, 1),
      getStreakGoal(patientUid, personId).catch(() => null),
    ])
      .then(([logs, assigned, pain, goal]) => {
        if (cancelled) return;
        const doneDates = new Set(
          logs
            .filter((l) => Object.values(l.completions).some(Boolean))
            .map((l) => l.date)
        );
        const week: DayCell[] = [];
        for (let i = WEEK_DAYS - 1; i >= 0; i -= 1) {
          const date = dateKeyDaysAgo(i);
          week.push({
            date,
            label: new Date(date).toLocaleDateString("en-GB", { weekday: "narrow" }),
            done: doneDates.has(date),
            isToday: i === 0,
          });
        }
        setData({
          streak: computeStreakDays(doneDates),
          goal,
          assignedCount: assigned.length,
          week,
          weekCount: week.filter((d) => d.done).length,
          latestPain: pain[0] ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [patientUid, personId]);

  return (
    <section className="dashboard-grid">
      <RecoveryPercentCard uid={patientUid} personId={personId} adminView />

      <div className="panel stack">
        <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Daily streak &amp; adherence</h3>

        {data === undefined ? (
          <SkeletonRow count={3} />
        ) : data === null ? (
          <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
            Couldn&apos;t load recovery activity for this patient.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
              <span aria-hidden="true" style={{ fontSize: 28 }}>
                🔥
              </span>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: "var(--color-navy)",
                  fontFamily: "var(--font-serif)",
                  lineHeight: 1,
                }}
              >
                {data.streak}
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                {data.streak === 1 ? "day" : "days"} in a row
                {data.goal !== null ? ` · ${data.goal}-day goal` : ""}
              </span>
            </div>

            {data.assignedCount === 0 ? (
              <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
                No exercises assigned yet — assign some below to start tracking adherence.
              </p>
            ) : (
              <>
                <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
                  Last 7 days:{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    {data.weekCount} of 7 days
                  </strong>{" "}
                  with exercises done ({Math.round((data.weekCount / WEEK_DAYS) * 100)}%).
                </p>
                <div
                  role="img"
                  aria-label={`Exercises completed on ${data.weekCount} of the last 7 days`}
                  style={{ display: "flex", gap: 6, marginTop: 2 }}
                >
                  {data.week.map((d) => (
                    <div key={d.date} style={{ display: "grid", gap: 3, justifyItems: "center" }}>
                      <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{d.label}</span>
                      <span
                        title={`${d.date}${d.done ? " — done" : " — not done"}`}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          background: d.done ? "var(--color-primary)" : "var(--color-border)",
                          outline: d.isToday ? "2px solid var(--color-primary-dark)" : "none",
                          outlineOffset: 1,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-2)" }}>
              <p className="muted" style={{ margin: 0, fontSize: "var(--text-xs)" }}>
                Latest self-reported pain
              </p>
              {data.latestPain === null ? (
                <p className="muted" style={{ margin: "2px 0 0", fontSize: "var(--text-sm)" }}>
                  No pain check-ins logged yet.
                </p>
              ) : (
                <p style={{ margin: "2px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                  <strong>{data.latestPain.score}/10</strong> · {data.latestPain.date}
                  {data.latestPain.note ? ` · “${data.latestPain.note}”` : ""}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
