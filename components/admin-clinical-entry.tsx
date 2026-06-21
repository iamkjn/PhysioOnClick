// components/admin-clinical-entry.tsx
"use client";

import { useState } from "react";
import { addClinicalAssessment } from "@/lib/recovery";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await addClinicalAssessment(patientUid, personId, {
      date,
      painScore,
      mobilityScore,
      physioNotes,
      sessionId,
    });
    setSaved(true);
    setSaving(false);
    setPhysioNotes("");
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.6rem 0.85rem",
    border: "1px solid #D1E8EE",
    borderRadius: 10,
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div className="panel stack">
      <h3>Add clinical assessment</h3>
      {saved && (
        <p style={{ color: "#16a34a", fontSize: 14 }}>Saved successfully.</p>
      )}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "grid", gap: "0.75rem" }}
      >
        <label style={{ fontSize: 13, color: "#5E7A84" }}>
          Session date
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSaved(false);
            }}
            style={{ ...inputStyle, marginTop: 4 }}
            required
          />
        </label>
        <label style={{ fontSize: 13, color: "#5E7A84" }}>
          Pain score:{" "}
          <strong style={{ color: "#0C2A38" }}>{painScore}/10</strong>
          <input
            type="range"
            min={0}
            max={10}
            value={painScore}
            onChange={(e) => setPainScore(Number(e.target.value))}
            style={{ width: "100%", marginTop: 4, accentColor: "#0891B2" }}
          />
        </label>
        <label style={{ fontSize: 13, color: "#5E7A84" }}>
          Mobility score:{" "}
          <strong style={{ color: "#0C2A38" }}>{mobilityScore}/10</strong>
          <input
            type="range"
            min={0}
            max={10}
            value={mobilityScore}
            onChange={(e) => setMobilityScore(Number(e.target.value))}
            style={{ width: "100%", marginTop: 4, accentColor: "#0891B2" }}
          />
        </label>
        <label style={{ fontSize: 13, color: "#5E7A84" }}>
          Clinical notes
          <textarea
            value={physioNotes}
            onChange={(e) => {
              setPhysioNotes(e.target.value);
              setSaved(false);
            }}
            rows={3}
            placeholder="What was worked on, patient response, next steps…"
            style={{ ...inputStyle, marginTop: 4, resize: "vertical" }}
          />
        </label>
        <label style={{ fontSize: 13, color: "#5E7A84" }}>
          Booking ID (optional)
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="bookings/…"
            style={{ ...inputStyle, marginTop: 4 }}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          style={{
            background: "#0C2A38",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "0.65rem 1.5rem",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: 15,
          }}
        >
          {saving ? "Saving…" : "Save assessment"}
        </button>
      </form>
    </div>
  );
}
