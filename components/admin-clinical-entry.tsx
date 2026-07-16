// components/admin-clinical-entry.tsx
"use client";

import { useState } from "react";
import { addClinicalAssessment } from "@/lib/recovery";
import { useToast } from "@/components/toast-provider";

interface Props {
  patientUid: string;
  personId: string;
}

export function AdminClinicalEntry({ patientUid, personId }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [painScore, setPainScore] = useState(5);
  const [mobilityScore, setMobilityScore] = useState(5);
  const [physioNotes, setPhysioNotes] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await addClinicalAssessment(patientUid, personId, {
        date,
        painScore,
        mobilityScore,
        physioNotes,
        sessionId,
      });
      setSaved(true);
      setPhysioNotes("");
      toast.show("Assessment saved.", "success");
    } catch {
      setError("Could not save this assessment. Check that you're signed in with an admin account.");
      toast.show("Could not save this assessment.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel stack">
      {/* h2, not h3 — sits alongside AdminPatientSelector/AdminExerciseAssigner
          (also h2) under the recovery page's single h1; size pinned to the
          old h3 value so this reads the same. */}
      <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Add clinical assessment</h2>
      {saved && (
        <p role="status" aria-live="polite" style={{ color: "var(--color-success)", fontSize: 14 }}>Saved successfully.</p>
      )}
      {error && (
        <p role="alert" aria-live="assertive" style={{ color: "var(--color-error)", fontSize: 14 }}>{error}</p>
      )}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        aria-busy={saving}
        style={{ display: "grid", gap: "0.75rem" }}
      >
        <label style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
          Session date <span aria-hidden="true" style={{ color: "var(--color-error)" }}>*</span>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSaved(false);
            }}
            style={{ marginTop: 4 }}
            required
            aria-required="true"
          />
        </label>
        <label style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
          Pain score:{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>{painScore}/10</strong>
          <input
            type="range"
            min={0}
            max={10}
            value={painScore}
            onChange={(e) => setPainScore(Number(e.target.value))}
            aria-label="Pain score"
            aria-valuetext={`${painScore} out of 10`}
            style={{ width: "100%", marginTop: 4, accentColor: "var(--color-primary)" }}
          />
        </label>
        <label style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
          Mobility score:{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>{mobilityScore}/10</strong>
          <input
            type="range"
            min={0}
            max={10}
            value={mobilityScore}
            onChange={(e) => setMobilityScore(Number(e.target.value))}
            aria-label="Mobility score"
            aria-valuetext={`${mobilityScore} out of 10`}
            style={{ width: "100%", marginTop: 4, accentColor: "var(--color-primary)" }}
          />
        </label>
        <label style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
          Clinical notes (optional)
          <textarea
            className="input"
            value={physioNotes}
            onChange={(e) => {
              setPhysioNotes(e.target.value);
              setSaved(false);
            }}
            rows={3}
            placeholder="What was worked on, patient response, next steps…"
            style={{ marginTop: 4, resize: "vertical" }}
          />
        </label>
        <label style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
          Booking ID (optional)
          <input
            type="text"
            className="input"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="bookings/…"
            style={{ marginTop: 4 }}
          />
        </label>
        <button
          type="submit"
          className="button primary"
          disabled={saving}
          style={{ opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving…" : "Save assessment"}
        </button>
      </form>
    </div>
  );
}
