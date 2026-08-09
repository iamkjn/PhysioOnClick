// components/pain-checkin-card.tsx
"use client";

import { useEffect, useState } from "react";
import { getCurrentRun, getPainCheckinInterval } from "@/lib/goals";
import { getPainCheckins, findDueCheckin, logPainCheckinScore, type PainCheckin } from "@/lib/pain-checkins";
import { useToast } from "@/components/toast-provider";
import { validateOptionalText, LIMITS } from "@/lib/validation";

interface Props {
  uid: string;
  personId: string;
}

function painColor(score: number): string {
  if (score <= 3) return "var(--color-success)";
  if (score <= 6) return "var(--color-warning)";
  return "var(--color-error)";
}

// Renders nothing when the doctor hasn't enabled pain check-ins for this
// patient, or when there's no checkpoint due right now — this card is purely
// additive to the existing daily PainCheckIn and must never appear as a
// blocking or nagging element. Soft framing throughout: "Optional" in the
// copy, never "you missed it".
export function PainCheckinCard({ uid, personId }: Props) {
  const [due, setDue] = useState<PainCheckin | null | undefined>(undefined);
  const [score, setScore] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setDue(undefined);
    (async () => {
      const interval = await getPainCheckinInterval(uid, personId);
      if (interval === null) {
        if (!cancelled) setDue(null);
        return;
      }
      const [run, checkins] = await Promise.all([getCurrentRun(uid, personId), getPainCheckins(uid, personId)]);
      if (cancelled) return;
      setDue(findDueCheckin(checkins, run));
    })().catch(() => {
      if (!cancelled) setDue(null);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, personId]);

  if (!due) return null;

  if (justLogged) {
    return (
      <div className="panel stack">
        <h3>Day {due.streakDay} check-in</h3>
        <p className="muted">Thanks — logged. Your physio will see this ahead of your follow-up.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!due) return;
    setSaving(true);
    setError(null);
    const noteErr = validateOptionalText(note, LIMITS.note);
    if (noteErr) {
      setError(noteErr);
      toast.show("Please shorten your note before saving.", "error");
      setSaving(false);
      return;
    }
    try {
      await logPainCheckinScore(uid, personId, due.id, score, note);
      setJustLogged(true);
      toast.show("Check-in logged.", "success");
    } catch {
      setError("Could not save, please try again.");
      toast.show("Could not save, please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel stack">
      <h3>Day {due.streakDay} check-in</h3>
      <p className="muted">
        Optional: your physio likes a check-in every few days. How&apos;s your pain right now?
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "grid", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>No pain (0)</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: painColor(score) }}>{score}</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>Worst (10)</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            aria-label="Pain score, 0 to 10"
            aria-valuetext={`${score} out of 10`}
            style={{ width: "100%", accentColor: painColor(score) }}
          />
        </div>
        <input
          type="text"
          className="input"
          placeholder="Optional note"
          aria-label="Optional note about your pain"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={LIMITS.note}
        />
        {error && <p className="field-error">{error}</p>}
        <button type="submit" className="button primary" disabled={saving}>
          {saving ? "Saving…" : "Log check-in"}
        </button>
      </form>
    </div>
  );
}
