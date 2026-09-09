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

const ADHERENCE_DAYS = 28;

interface Loaded {
  streak: number;
  goal: number | null;
  assignedCount: number;
  // newest last — one bool per calendar day over the last ADHERENCE_DAYS
  completedByDay: boolean[];
  completedCount: number;
  latestPain: PainLog | null;
}

export function AdminRecoverySummary({ patientUid, personId }: Props) {
  const [data, setData] = useState<Loaded | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setData(undefined);
    Promise.all([
      getExerciseLogs(patientUid, personId, ADHERENCE_DAYS),
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
        const completedByDay: boolean[] = [];
        for (let i = ADHERENCE_DAYS - 1; i >= 0; i -= 1) {
          completedByDay.push(doneDates.has(dateKeyDaysAgo(i)));
        }
        setData({
          streak: computeStreakDays(doneDates),
          goal,
          assignedCount: assigned.length,
          completedByDay,
          completedCount: completedByDay.filter(Boolean).length,
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
                  Exercises done on{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    {data.completedCount} of the last {ADHERENCE_DAYS} days
                  </strong>{" "}
                  ({Math.round((data.completedCount / ADHERENCE_DAYS) * 100)}%).
                </p>
                <div
                  role="img"
                  aria-label={`Exercise completed on ${data.completedCount} of the last ${ADHERENCE_DAYS} days`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(14, 1fr)",
                    gap: 4,
                    maxWidth: 320,
                  }}
                >
                  {data.completedByDay.map((done, i) => (
                    <span
                      key={i}
                      title={dateKeyDaysAgo(ADHERENCE_DAYS - 1 - i)}
                      style={{
                        aspectRatio: "1",
                        borderRadius: 3,
                        background: done ? "var(--color-primary)" : "var(--color-border)",
                      }}
                    />
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
