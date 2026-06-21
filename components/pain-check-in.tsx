// components/pain-check-in.tsx
"use client";

import { useEffect, useState } from "react";
import { getTodayPainLog, logPainScore, type PainLog } from "@/lib/recovery";

interface Props {
  uid: string;
  personId: string;
}

const COLOURS = ["#16a34a","#22c55e","#4ade80","#86efac","#fbbf24","#fb923c","#f97316","#ef4444","#dc2626","#b91c1c","#7f1d1d"];

export function PainCheckIn({ uid, personId }: Props) {
  const [score, setScore] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayLog, setTodayLog] = useState<PainLog | null | undefined>(undefined);

  useEffect(() => {
    setTodayLog(undefined);
    getTodayPainLog(uid, personId).then(setTodayLog);
  }, [uid, personId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await logPainScore(uid, personId, score, note);
      const d = new Date();
      const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      setTodayLog({ date: localDate, score, note, loggedAt: new Date() });
    } catch {
      setError("Could not save, please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (todayLog === undefined) {
    return (
      <div className="panel stack">
        <h3>Today&apos;s pain check-in</h3>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (todayLog !== null) {
    return (
      <div className="panel stack">
        <h3>Today&apos;s pain check-in</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: COLOURS[todayLog.score],
            }}
          >
            {todayLog.score}
          </span>
          <span style={{ color: "#5E7A84", fontSize: 14 }}>/10</span>
        </div>
        {todayLog.note && <p className="muted">{todayLog.note}</p>}
        <p className="muted" style={{ fontSize: 12 }}>
          Logged today — come back tomorrow to log again.
        </p>
      </div>
    );
  }

  return (
    <div className="panel stack">
      <h3>Today&apos;s pain check-in</h3>
      <p className="muted">How is your pain right now? 0 = no pain, 10 = worst possible.</p>
      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#5E7A84" }}>No pain (0)</span>
            <span
              style={{ fontSize: 28, fontWeight: 800, color: COLOURS[score] }}
            >
              {score}
            </span>
            <span style={{ fontSize: 13, color: "#5E7A84" }}>Worst (10)</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            style={{ width: "100%", accentColor: COLOURS[score] }}
          />
        </div>
        <input
          type="text"
          placeholder="Optional note (e.g. sharp pain when walking)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            padding: "0.6rem 0.85rem",
            border: "1px solid #D1E8EE",
            borderRadius: 10,
            fontSize: 14,
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        {error && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={saving}
          style={{
            background: "#0891B2",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "0.65rem 1.5rem",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: 15,
          }}
        >
          {saving ? "Saving…" : "Log pain score"}
        </button>
      </form>
    </div>
  );
}
