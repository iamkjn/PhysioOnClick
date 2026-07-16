// components/pain-check-in.tsx
"use client";

import { useEffect, useState } from "react";
import { getTodayPainLog, logPainScore, type PainLog } from "@/lib/recovery";
import { SkeletonStatGrid } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface Props {
  uid: string;
  personId: string;
}

// 3-bucket token approach, matching summary-form.tsx's getPainColor: low pain
// = success, moderate = warning, high = error.
function painColor(score: number): string {
  if (score <= 3) return "var(--color-success)";
  if (score <= 6) return "var(--color-warning)";
  return "var(--color-error)";
}

export function PainCheckIn({ uid, personId }: Props) {
  const [score, setScore] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayLog, setTodayLog] = useState<PainLog | null | undefined>(undefined);
  const toast = useToast();

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
      toast.show("Pain score logged.", "success");
    } catch {
      setError("Could not save, please try again.");
      toast.show("Could not save, please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (todayLog === undefined) {
    return (
      <div className="panel stack">
        <h3>Today&apos;s pain check-in</h3>
        <SkeletonStatGrid count={1} />
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
              color: painColor(todayLog.score),
            }}
          >
            {todayLog.score}
          </span>
          <span style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>/10</span>
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
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>No pain (0)</span>
            <span
              style={{ fontSize: 28, fontWeight: 800, color: painColor(score) }}
            >
              {score}
            </span>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Worst (10)</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            style={{ width: "100%", accentColor: painColor(score) }}
          />
        </div>
        <input
          type="text"
          className="input"
          placeholder="Optional note (e.g. sharp pain when walking)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <p style={{ color: "var(--color-error)", fontSize: 13, margin: 0 }}>{error}</p>}
        <button type="submit" className="button primary" disabled={saving}>
          {saving ? "Saving…" : "Log pain score"}
        </button>
      </form>
    </div>
  );
}
