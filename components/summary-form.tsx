"use client";
import { useEffect, useState } from "react";
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

type Outcome = "improving" | "stable" | "setback";
const FOLLOW_UP_OPTIONS = [0, 1, 2, 4, 6, 8] as const;

function getPainColor(score: number): string {
  if (score <= 3) return "#059669";
  if (score <= 6) return "var(--color-warning, #D97706)";
  return "var(--color-error)";
}

function RecoveryRing({ percent }: { percent: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, percent)) / 100) * circ;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 32 32)" style={{ transition: "stroke-dashoffset 0.2s" }} />
      <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-navy)" fontFamily="var(--font-sans)">{percent}%</text>
    </svg>
  );
}

export function SummaryForm({ booking, onPublished }: SummaryFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    painScore: 5,
    recoveryPercent: 50,
    sessionOutcome: null as Outcome | null,
    workedOn: "",
    exercises: "",
    nextSteps: "",
    followUpWeeks: 2,
  });

  // Lock scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Escape key closes drawer
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  async function handlePublish() {
    if (!form.workedOn || !form.exercises || !form.nextSteps || form.sessionOutcome === null) return;
    setSaving(true);
    try {
      const input: PublishSummaryInput = {
        bookingId: booking.id,
        patientId: booking.patientId,
        patientType: booking.patientType,
        patientName: booking.patientName,
        service: booking.service,
        painScore: form.painScore,
        recoveryPercent: form.recoveryPercent,
        sessionOutcome: form.sessionOutcome as Outcome,
        workedOn: form.workedOn,
        exercises: form.exercises,
        nextSteps: form.nextSteps,
        followUpWeeks: form.followUpWeeks,
      };
      await publishSummary(input);
      if (onPublished) onPublished();
      else window.location.reload();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const canPublish = !!form.workedOn && !!form.exercises && !!form.nextSteps && form.sessionOutcome !== null;

  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.06em" };
  const textareaStyle: React.CSSProperties = { width: "100%", border: "1.5px solid var(--color-border)", borderRadius: 10, padding: "0.5rem 0.75rem", fontSize: 14, resize: "vertical" as const, boxSizing: "border-box" as const, fontFamily: "var(--font-sans)", color: "var(--color-navy)" };

  const OUTCOMES: { key: Outcome; label: string; color: string }[] = [
    { key: "improving", label: "Improving ↑", color: "#059669" },
    { key: "stable",    label: "Stable →",    color: "var(--color-warning, #D97706)" },
    { key: "setback",   label: "Setback ↓",   color: "var(--color-error)" },
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ background: "var(--color-primary-light)", border: "1px solid var(--color-primary)", borderRadius: 8, color: "var(--color-primary)", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "4px 12px", fontFamily: "var(--font-sans)" }}
      >
        📋 Write summary
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(13,27,42,0.5)", zIndex: 200 }}
      />

      {/* Drawer */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)", background: "var(--color-surface)", zIndex: 201, overflowY: "auto", boxShadow: "-4px 0 32px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" as const }}>

        {/* Drawer header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", position: "sticky", top: 0, background: "var(--color-surface)", zIndex: 1 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Session Summary</h3>
            <p style={{ margin: "0.25rem 0 0", fontSize: 13, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>{booking.patientName} · {booking.service}</p>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text-secondary)", lineHeight: 1, padding: "0.25rem" }} aria-label="Close">×</button>
        </div>

        <div style={{ padding: "1.5rem", display: "grid", gap: "1.5rem", flex: 1 }}>

          {/* ── Assessment Scores ── */}
          <section>
            <h4 style={{ margin: "0 0 1rem", fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--color-navy)" }}>Assessment Scores</h4>
            <div style={{ display: "grid", gap: "1rem" }}>

              {/* Pain score */}
              <div>
                <label style={labelStyle}>Pain level today (0 = none · 10 = worst)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <input
                    type="range" min={0} max={10} step={1}
                    value={form.painScore}
                    onChange={(e) => setForm((f) => ({ ...f, painScore: Number(e.target.value) }))}
                    style={{ flex: 1, accentColor: getPainColor(form.painScore) }}
                  />
                  <span style={{ background: getPainColor(form.painScore), color: "#fff", borderRadius: 999, padding: "3px 12px", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-sans)", minWidth: 36, textAlign: "center" as const }}>
                    {form.painScore}
                  </span>
                </div>
              </div>

              {/* Recovery % */}
              <div>
                <label style={labelStyle}>Estimated recovery progress</label>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <RecoveryRing percent={form.recoveryPercent} />
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="number" min={0} max={100}
                      value={form.recoveryPercent}
                      onChange={(e) => setForm((f) => ({ ...f, recoveryPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                      style={{ border: "1.5px solid var(--color-border)", borderRadius: 10, padding: "0.5rem 0.75rem", fontSize: 16, fontWeight: 700, width: 72, fontFamily: "var(--font-sans)", color: "var(--color-navy)" }}
                    />
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-navy)", fontFamily: "var(--font-sans)" }}>%</span>
                  </div>
                </div>
              </div>

              {/* Session outcome */}
              <div>
                <label style={labelStyle}>Session outcome</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
                  {OUTCOMES.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, sessionOutcome: o.key }))}
                      style={{
                        background: form.sessionOutcome === o.key ? o.color : "var(--color-surface)",
                        color: form.sessionOutcome === o.key ? "#fff" : "var(--color-text-secondary)",
                        border: `1.5px solid ${form.sessionOutcome === o.key ? o.color : "var(--color-border)"}`,
                        borderRadius: 999,
                        padding: "6px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        transition: "all 0.15s",
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Session Notes ── */}
          <section>
            <h4 style={{ margin: "0 0 1rem", fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--color-navy)" }}>Session Notes</h4>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <label>
                <span style={labelStyle}>What we worked on today *</span>
                <textarea rows={3} value={form.workedOn} onChange={(e) => setForm((f) => ({ ...f, workedOn: e.target.value }))} placeholder="e.g. Lower back mobility, hip flexor stretching and core activation exercises" style={textareaStyle} />
              </label>
              <label>
                <span style={labelStyle}>Exercises assigned *</span>
                <textarea rows={3} value={form.exercises} onChange={(e) => setForm((f) => ({ ...f, exercises: e.target.value }))} placeholder="e.g. Cat-cow stretches ×10, bird-dog ×8 each side, glute bridges ×12 — twice daily" style={textareaStyle} />
              </label>
              <label>
                <span style={labelStyle}>Next steps & advice *</span>
                <textarea rows={3} value={form.nextSteps} onChange={(e) => setForm((f) => ({ ...f, nextSteps: e.target.value }))} placeholder="e.g. Avoid prolonged sitting, use heat pack before exercises, follow up if pain worsens" style={textareaStyle} />
              </label>
            </div>
          </section>

          {/* ── Follow-up ── */}
          <section>
            <h4 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--color-navy)" }}>Recommend Follow-up</h4>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
              {FOLLOW_UP_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, followUpWeeks: w }))}
                  style={{
                    background: form.followUpWeeks === w ? "var(--color-primary)" : "var(--color-surface)",
                    color: form.followUpWeeks === w ? "#fff" : "var(--color-text-secondary)",
                    border: `1.5px solid ${form.followUpWeeks === w ? "var(--color-primary)" : "var(--color-border)"}`,
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    transition: "all 0.15s",
                  }}
                >
                  {w === 0 ? "None" : `${w} wk${w > 1 ? "s" : ""}`}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky footer */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column" as const, gap: "0.5rem", position: "sticky", bottom: 0, background: "var(--color-surface)" }}>
          <button
            onClick={handlePublish}
            disabled={saving || !canPublish}
            style={{ background: canPublish ? "var(--color-primary)" : "var(--color-border)", color: "#fff", border: "none", borderRadius: 12, padding: "0.875rem", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-sans)", cursor: canPublish && !saving ? "pointer" : "not-allowed", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Publishing…" : "Publish Summary"}
          </button>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-sans)", padding: "0.25rem" }}>
            Cancel
          </button>
          {!canPublish && (
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, textAlign: "center" as const, fontFamily: "var(--font-sans)" }}>
              {!form.sessionOutcome
                ? "Select a session outcome above to publish."
                : "Fill in all three session note fields to publish."}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
