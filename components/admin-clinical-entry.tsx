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
      <h3>Add clinical assessment</h3>
      {saved && (
        <p style={{ color: "var(--color-success)", fontSize: 14 }}>Saved successfully.</p>
      )}
      {error && (
        <p style={{ color: "var(--color-error)", fontSize: 14 }}>{error}</p>
      )}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "grid", gap: "0.75rem" }}
      >
        <label style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Session date
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
          />
        </label>
        <label style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Pain score:{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>{painScore}/10</strong>
          <input
            type="range"
            min={0}
            max={10}
            value={painScore}
            onChange={(e) => setPainScore(Number(e.target.value))}
            style={{ width: "100%", marginTop: 4, accentColor: "var(--color-primary)" }}
          />
        </label>
        <label style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Mobility score:{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>{mobilityScore}/10</strong>
          <input
            type="range"
            min={0}
            max={10}
            value={mobilityScore}
            onChange={(e) => setMobilityScore(Number(e.target.value))}
            style={{ width: "100%", marginTop: 4, accentColor: "var(--color-primary)" }}
          />
        </label>
        <label style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Clinical notes
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
        <label style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
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
        <button type="submit" className="button primary" disabled={saving}>
          {saving ? "Saving…" : "Save assessment"}
        </button>
      </form>
    </div>
  );
}
