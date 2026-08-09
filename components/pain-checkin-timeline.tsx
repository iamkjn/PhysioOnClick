// components/pain-checkin-timeline.tsx
"use client";

import { useEffect, useState } from "react";
import { getCurrentRun, getPainCheckinInterval } from "@/lib/goals";
import { getPainCheckins, currentRunCheckins, type PainCheckin } from "@/lib/pain-checkins";

interface Props {
  uid: string;
  personId: string;
  // Doctor view: no interactivity, just status. Both variants render the
  // same markers — only the surrounding copy differs.
  readOnly?: boolean;
}

function statusIcon(status: PainCheckin["status"]): { symbol: string; label: string; color: string } {
  if (status === "logged") return { symbol: "✓", label: "Logged", color: "var(--color-success)" };
  if (status === "missed") return { symbol: "—", label: "Missed", color: "var(--color-text-secondary)" };
  return { symbol: "⏳", label: "Pending", color: "var(--color-warning)" };
}

// Renders nothing when the doctor hasn't enabled pain check-ins for this
// patient — same "invisible unless relevant" rule as PainCheckinCard.
export function PainCheckinTimeline({ uid, personId, readOnly = false }: Props) {
  const [checkins, setCheckins] = useState<PainCheckin[] | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCheckins(null);
    setEnabled(null);
    (async () => {
      const interval = await getPainCheckinInterval(uid, personId);
      if (cancelled) return;
      if (interval === null) {
        setEnabled(false);
        return;
      }
      setEnabled(true);
      const [run, all] = await Promise.all([getCurrentRun(uid, personId), getPainCheckins(uid, personId)]);
      if (cancelled) return;
      setCheckins(currentRunCheckins(all, run));
    })().catch(() => {
      if (!cancelled) setEnabled(false);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, personId]);

  if (enabled === false) return null;
  if (enabled === null || checkins === null) return null;
  if (checkins.length === 0) {
    return (
      <div className="panel stack">
        <h3>Pain check-ins</h3>
        <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
          {readOnly
            ? "No check-in has come due yet for this streak."
            : "Your first check-in will appear here once it's due."}
        </p>
      </div>
    );
  }

  return (
    <div className="panel stack">
      <h3>Pain check-ins</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
        {checkins.map((c) => {
          const { symbol, label, color } = statusIcon(c.status);
          return (
            <div
              key={c.id}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)" }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 20,
                  color,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  border: `1px solid ${color}`,
                }}
              >
                {symbol}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Day {c.streakDay}
              </span>
              <span className="sr-only">{label}</span>
              {c.status === "logged" && c.score !== null && (
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color }}>{c.score}/10</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
