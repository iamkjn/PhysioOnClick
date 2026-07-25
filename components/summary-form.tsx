"use client";
import { useEffect, useState } from "react";
import { publishSummary, type PublishSummaryInput } from "@/app/admin/actions";
import { auth } from "@/lib/firebase";
import { useToast } from "@/components/toast-provider";
import { validateRequiredText, validateIntInRange, LIMITS } from "@/lib/validation";
import { ClipboardIcon } from "@/components/icons";

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
  if (score <= 3) return "var(--color-success)";
  if (score <= 6) return "var(--color-warning, #D97706)";
  return "var(--color-error)";
}

function RecoveryRing({ percent }: { percent: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, percent)) / 100) * circ;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="summary-ring">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 32 32)" className="summary-ring-arc" />
      <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-navy)" fontFamily="var(--font-sans)">{percent}%</text>
    </svg>
  );
}

export function SummaryForm({ booking, onPublished }: SummaryFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
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
    const errs: Record<string, string> = {};
    const w = validateRequiredText(form.workedOn, { max: LIMITS.clinicalNote, message: "Enter what you worked on today." });
    if (w) errs.workedOn = w;
    const ex = validateRequiredText(form.exercises, { max: LIMITS.clinicalNote, message: "Enter the exercises you assigned." });
    if (ex) errs.exercises = ex;
    const ns = validateRequiredText(form.nextSteps, { max: LIMITS.clinicalNote, message: "Enter the next steps and advice." });
    if (ns) errs.nextSteps = ns;
    if (form.sessionOutcome == null) errs.sessionOutcome = "Select a session outcome.";
    const rp = validateIntInRange(form.recoveryPercent, 0, 100);
    if (rp) errs.recoveryPercent = rp;
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.show("Please complete the highlighted fields before publishing.", "error");
      return;
    }

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
      const idToken = await auth?.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in");
      await publishSummary(input, idToken);
      if (onPublished) onPublished();
      setErrors({});
      toast.show("Summary published.", "success");
      setOpen(false);
    } catch {
      toast.show("Could not publish. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  const canPublish = !!form.workedOn && !!form.exercises && !!form.nextSteps && form.sessionOutcome !== null;

  const OUTCOMES: { key: Outcome; label: string; color: string; tint: string }[] = [
    { key: "improving", label: "Improving ↑", color: "var(--color-success)", tint: "var(--color-success-light)" },
    { key: "stable",    label: "Stable →",    color: "var(--color-warning, #D97706)", tint: "rgba(217, 119, 6, 0.15)" },
    { key: "setback",   label: "Setback ↓",   color: "var(--color-error)", tint: "var(--color-error-light)" },
  ];

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="summary-trigger">
        <ClipboardIcon className="inline-icon" /> Write summary
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => setOpen(false)} className="summary-backdrop" />

      {/* Drawer */}
      <div className="summary-drawer">

        {/* Drawer header */}
        <div className="summary-drawer-header">
          <div>
            <h3 className="summary-drawer-title">Session Summary</h3>
            <p className="summary-drawer-subtitle">{booking.patientName} · {booking.service}</p>
          </div>
          <button onClick={() => setOpen(false)} className="summary-close" aria-label="Close">×</button>
        </div>

        <div className="summary-body">

          {/* ── Assessment Scores ── */}
          <section>
            <h4 className="summary-section-title">Assessment Scores</h4>
            <div className="summary-fields">

              {/* Pain score */}
              <div>
                {/* htmlFor/id — the label previously wrapped only the caption
                    text, leaving the range input with no accessible name. */}
                <label htmlFor="summary-pain-score" className="summary-label">Pain level today (0 = none · 10 = worst)</label>
                <div className="summary-row">
                  <input
                    id="summary-pain-score"
                    type="range" min={0} max={10} step={1}
                    value={form.painScore}
                    onChange={(e) => setForm((f) => ({ ...f, painScore: Number(e.target.value) }))}
                    aria-valuetext={`${form.painScore} out of 10`}
                    className="summary-pain-slider"
                    style={{ accentColor: getPainColor(form.painScore) }}
                  />
                  <span className="summary-pain-badge" style={{ background: getPainColor(form.painScore) }}>
                    {form.painScore}
                  </span>
                </div>
              </div>

              {/* Recovery % */}
              <div>
                <label htmlFor="summary-recovery-percent" className="summary-label">Estimated recovery progress</label>
                <div className="summary-row">
                  <RecoveryRing percent={form.recoveryPercent} />
                  <div className="summary-inline-group">
                    <input
                      id="summary-recovery-percent"
                      type="number" min={0} max={100} step={1}
                      value={form.recoveryPercent}
                      onChange={(e) => setForm((f) => ({ ...f, recoveryPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                      aria-invalid={errors.recoveryPercent ? true : undefined}
                      aria-describedby={errors.recoveryPercent ? "err-recovery-percent" : undefined}
                      className="summary-recovery-input"
                    />
                    <span className="summary-recovery-suffix">%</span>
                  </div>
                </div>
                {errors.recoveryPercent && <span className="field-error" id="err-recovery-percent">{errors.recoveryPercent}</span>}
              </div>

              {/* Session outcome */}
              <div role="group" aria-label="Session outcome">
                <span className="summary-label">Session outcome</span>
                <div className="summary-chip-row">
                  {OUTCOMES.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      aria-pressed={form.sessionOutcome === o.key}
                      onClick={() => setForm((f) => ({ ...f, sessionOutcome: o.key }))}
                      className="summary-chip"
                      style={{
                        background: form.sessionOutcome === o.key ? o.tint : "var(--color-surface)",
                        color: form.sessionOutcome === o.key ? o.color : "var(--color-text-secondary)",
                        border: `1.5px solid ${form.sessionOutcome === o.key ? o.color : "var(--color-border)"}`,
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {errors.sessionOutcome && <span className="field-error" id="err-session-outcome">{errors.sessionOutcome}</span>}
              </div>
            </div>
          </section>

          {/* ── Session Notes ── */}
          <section>
            <h4 className="summary-section-title">
              Session Notes <span className="summary-section-hint">· all three required</span>
            </h4>
            <div className="summary-fields summary-fields--compact">
              <label>
                <span className="summary-label">What we worked on today *</span>
                <textarea
                  rows={3}
                  required
                  maxLength={LIMITS.clinicalNote}
                  value={form.workedOn}
                  onChange={(e) => setForm((f) => ({ ...f, workedOn: e.target.value }))}
                  placeholder="e.g. Lower back mobility, hip flexor stretching and core activation exercises"
                  className="summary-textarea"
                  aria-invalid={errors.workedOn ? true : undefined}
                  aria-describedby={errors.workedOn ? "err-worked-on" : undefined}
                />
                {errors.workedOn && <span className="field-error" id="err-worked-on">{errors.workedOn}</span>}
              </label>
              <label>
                <span className="summary-label">Exercises assigned *</span>
                <textarea
                  rows={3}
                  required
                  maxLength={LIMITS.clinicalNote}
                  value={form.exercises}
                  onChange={(e) => setForm((f) => ({ ...f, exercises: e.target.value }))}
                  placeholder="e.g. Cat-cow stretches ×10, bird-dog ×8 each side, glute bridges ×12, twice daily"
                  className="summary-textarea"
                  aria-invalid={errors.exercises ? true : undefined}
                  aria-describedby={errors.exercises ? "err-exercises" : undefined}
                />
                {errors.exercises && <span className="field-error" id="err-exercises">{errors.exercises}</span>}
              </label>
              <label>
                <span className="summary-label">Next steps & advice *</span>
                <textarea
                  rows={3}
                  required
                  maxLength={LIMITS.clinicalNote}
                  value={form.nextSteps}
                  onChange={(e) => setForm((f) => ({ ...f, nextSteps: e.target.value }))}
                  placeholder="e.g. Avoid prolonged sitting, use heat pack before exercises, follow up if pain worsens"
                  className="summary-textarea"
                  aria-invalid={errors.nextSteps ? true : undefined}
                  aria-describedby={errors.nextSteps ? "err-next-steps" : undefined}
                />
                {errors.nextSteps && <span className="field-error" id="err-next-steps">{errors.nextSteps}</span>}
              </label>
            </div>
          </section>

          {/* ── Follow-up ── */}
          <section>
            <h4 className="summary-section-title summary-section-title--compact">Recommend Follow-up</h4>
            <div role="group" aria-label="Recommend follow-up" className="summary-chip-row">
              {FOLLOW_UP_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  aria-pressed={form.followUpWeeks === w}
                  onClick={() => setForm((f) => ({ ...f, followUpWeeks: w }))}
                  className="summary-chip"
                  style={{
                    background: form.followUpWeeks === w ? "var(--color-primary-light)" : "var(--color-surface)",
                    color: form.followUpWeeks === w ? "var(--color-primary-dark)" : "var(--color-text-secondary)",
                    border: `1.5px solid ${form.followUpWeeks === w ? "var(--color-primary-dark)" : "var(--color-border)"}`,
                  }}
                >
                  {w === 0 ? "None" : `${w} wk${w > 1 ? "s" : ""}`}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky footer */}
        <div className="summary-footer">
          <button
            onClick={handlePublish}
            disabled={saving || !canPublish}
            className={`summary-publish${saving ? " is-saving" : ""}`}
            // Readable white-on-accent needs the darker --primary — raw
            // --color-primary under white text was ~2.8:1, well under AA.
            style={{ background: canPublish ? "var(--primary)" : "var(--color-border)" }}
          >
            {saving ? "Publishing…" : "Publish Summary"}
          </button>
          <button onClick={() => setOpen(false)} className="summary-cancel">
            Cancel
          </button>
          {!canPublish && (
            <p className="summary-help-text">
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
