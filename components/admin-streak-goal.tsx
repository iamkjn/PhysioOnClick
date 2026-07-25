// components/admin-streak-goal.tsx
"use client";

import { useEffect, useState } from "react";
import { getStreakGoal, setStreakGoal } from "@/lib/goals";
import { SkeletonForm } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface Props {
  adminUid: string;
  patientUid: string;
  personId: string;
}

export function AdminStreakGoal({ adminUid, patientUid, personId }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setError(null);
    getStreakGoal(patientUid, personId)
      .then((goal) => {
        if (cancelled) return;
        setValue(goal !== null ? String(goal) : "");
        setLoaded(true);
      })
      .catch(() => {
        // Don't let a load failure hang the panel forever — fall back to an
        // empty field and let the admin retry the save.
        if (cancelled) return;
        setError("Could not load the current goal.");
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [patientUid, personId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const target = Number(value);
    if (!Number.isInteger(target) || target < 1) {
      setError("Enter a whole number of at least 1 day.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await setStreakGoal(patientUid, personId, target, adminUid);
      toast.show("Streak goal saved.", "success");
    } catch {
      toast.show("Could not save the streak goal. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Daily streak goal</h2>
        <SkeletonForm fields={1} />
      </div>
    );
  }

  return (
    <div className="panel stack">
      <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Daily streak goal</h2>
      <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        Set a target number of consecutive days to motivate this patient. Their streak card will
        show progress toward it.
      </p>
      <form
        onSubmit={(e) => void handleSave(e)}
        aria-busy={saving}
        style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-3)", flexWrap: "wrap" }}
      >
        <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          Daily streak goal (days)
          <input
            type="number"
            className="input"
            min={1}
            step={1}
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder="e.g. 14"
            style={{ marginTop: "var(--space-1)", maxWidth: "10rem" }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "err-streak-goal" : undefined}
          />
        </label>
        <button
          type="submit"
          className="button primary"
          disabled={saving}
          style={{ opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving…" : "Save goal"}
        </button>
      </form>
      {error && (
        <span className="field-error" id="err-streak-goal" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
