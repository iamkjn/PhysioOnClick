"use client";
import { useState } from "react";
import { publishSummary, type PublishSummaryInput } from "@/app/admin/actions";

interface SummaryFormProps {
  booking: {
    id: string;
    patientId: string;
    patientType: string;
    patientName: string;
    service: string;
  };
  onPublished?: () => void;
}

export function SummaryForm({ booking, onPublished }: SummaryFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    workedOn: "",
    exercises: "",
    nextSteps: "",
    followUpWeeks: 2,
  });

  async function handlePublish() {
    if (!form.workedOn || !form.exercises || !form.nextSteps) return;
    setSaving(true);
    try {
      const input: PublishSummaryInput = {
        bookingId: booking.id,
        patientId: booking.patientId,
        patientType: booking.patientType,
        patientName: booking.patientName,
        service: booking.service,
        ...form,
      };
      await publishSummary(input);
      if (onPublished) {
        onPublished();
      } else {
        window.location.reload();
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "#D8F3F9",
          border: "1px solid #9ADCEE",
          borderRadius: 8,
          color: "#0E7490",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          padding: "4px 12px",
        }}
      >
        📋 Write summary
      </button>
    );
  }

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #D1E8EE",
    borderRadius: 10,
    padding: "0.5rem 0.75rem",
    fontSize: 14,
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "#5E7A84",
    display: "block",
    marginBottom: 4,
  };

  return (
    <div
      style={{
        border: "1px solid #D8F3F9",
        borderRadius: 14,
        padding: "1.25rem",
        marginTop: "0.75rem",
        background: "#FAFFFE",
      }}
    >
      <h4 style={{ margin: "0 0 1rem", color: "#0C2A38" }}>
        Session summary — {booking.patientName}
      </h4>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          <span style={labelStyle}>What we worked on today</span>
          <textarea
            rows={2}
            value={form.workedOn}
            onChange={(e) => setForm((f) => ({ ...f, workedOn: e.target.value }))}
            placeholder="e.g. Lower back mobility, hip flexor stretching and core activation exercises"
            style={textareaStyle}
          />
        </label>
        <label>
          <span style={labelStyle}>Exercises assigned</span>
          <textarea
            rows={2}
            value={form.exercises}
            onChange={(e) => setForm((f) => ({ ...f, exercises: e.target.value }))}
            placeholder="e.g. Cat-cow stretches x10, bird-dog x8 each side, glute bridges x12 — twice daily"
            style={textareaStyle}
          />
        </label>
        <label>
          <span style={labelStyle}>Next steps & advice</span>
          <textarea
            rows={2}
            value={form.nextSteps}
            onChange={(e) => setForm((f) => ({ ...f, nextSteps: e.target.value }))}
            placeholder="e.g. Avoid prolonged sitting, use heat pack before exercises, follow up if pain worsens"
            style={textareaStyle}
          />
        </label>
        <label>
          <span style={labelStyle}>Recommend follow-up in (weeks, 0 = none)</span>
          <input
            type="number"
            min={0}
            max={52}
            value={form.followUpWeeks}
            onChange={(e) =>
              setForm((f) => ({ ...f, followUpWeeks: parseInt(e.target.value) || 0 }))
            }
            style={{
              border: "1px solid #D1E8EE",
              borderRadius: 10,
              padding: "0.5rem 0.75rem",
              fontSize: 14,
              width: 80,
            }}
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button
          onClick={handlePublish}
          disabled={saving || !form.workedOn || !form.exercises || !form.nextSteps}
          style={{
            background: "#0891B2",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "0.5rem 1.25rem",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Publishing…" : "Publish summary"}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: "none",
            border: "1px solid #D1E8EE",
            borderRadius: 10,
            padding: "0.5rem 1rem",
            cursor: "pointer",
            fontSize: 14,
            color: "#5E7A84",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
