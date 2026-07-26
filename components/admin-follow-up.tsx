// components/admin-follow-up.tsx
"use client";

import { useState } from "react";
import { scheduleFollowUp } from "@/app/admin/actions";
import { auth } from "@/lib/firebase";
import { track } from "@/lib/analytics";
import { useToast } from "@/components/toast-provider";
import { LIMITS, validateOptionalText } from "@/lib/validation";

interface Props {
  adminUid: string;
  patientUid: string;
  patientName: string;
  personId: string;
}

// adminUid isn't read here — kept in the prop shape for parity with the
// sibling panels (AdminStreakGoal/AdminExerciseAssigner) that mount alongside
// this one. The server action re-derives the actual admin identity from the
// verified idToken rather than trusting a client-supplied uid.
export function AdminFollowUp({ patientUid, patientName, personId }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [dueDate, setDueDate] = useState(today);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!dueDate || dueDate < today) {
      setError("Choose a date of today or later.");
      return;
    }
    const noteErr = validateOptionalText(note, LIMITS.clinicalNote);
    if (noteErr) {
      setError(noteErr);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const idToken = await auth?.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in");
      await scheduleFollowUp(
        { patientUid, patientName, dueDate, note, personId },
        idToken
      );
      track("follow_up_scheduled", { for_dependent: Boolean(personId) });
      toast.show("Follow-up scheduled — patient notified.", "success");
      setDueDate(today);
      setNote("");
    } catch {
      toast.show("Could not schedule the follow-up. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel stack">
      {/* h2, not h3 — sibling of AdminExerciseAssigner/AdminClinicalEntry/
          AdminStreakGoal (all h2) under the recovery page's single h1. */}
      <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Schedule follow-up</h2>
      <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        Notifies {patientName || "the patient"} immediately by in-app alert and email.
      </p>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        aria-busy={saving}
        style={{ display: "grid", gap: "var(--space-3)" }}
      >
        <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          Due date <span aria-hidden="true" style={{ color: "var(--color-error)" }}>*</span>
          <input
            type="date"
            className="input"
            value={dueDate}
            min={today}
            onChange={(e) => {
              setDueDate(e.target.value);
              setError(null);
            }}
            style={{ marginTop: "var(--space-1)" }}
            required
            aria-required="true"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "err-follow-up" : undefined}
          />
        </label>
        <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          Note (optional)
          <textarea
            className="input"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setError(null);
            }}
            rows={3}
            placeholder="What to check in on next time…"
            maxLength={LIMITS.clinicalNote}
            style={{ marginTop: "var(--space-1)", resize: "vertical" }}
          />
        </label>
        {error && (
          <span className="field-error" id="err-follow-up" role="alert">
            {error}
          </span>
        )}
        <button
          type="submit"
          className="button primary"
          disabled={saving}
          style={{ opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Scheduling…" : "Schedule follow-up"}
        </button>
      </form>
    </div>
  );
}
