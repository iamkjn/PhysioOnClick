// components/admin-streak-goal.tsx
"use client";

import { useEffect, useState } from "react";
import { getStreakGoal, setStreakGoal, getPainCheckinInterval, getValidCheckinIntervals } from "@/lib/goals";
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
  const [intervalValue, setIntervalValue] = useState(""); // "" = none
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setError(null);
    Promise.all([getStreakGoal(patientUid, personId), getPainCheckinInterval(patientUid, personId)])
      .then(([goal, interval]) => {
        if (cancelled) return;
        setValue(goal !== null ? String(goal) : "");
        setIntervalValue(interval !== null ? String(interval) : "");
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

  const target = Number(value);
  const validIntervals = Number.isInteger(target) && target >= 1 ? getValidCheckinIntervals(target) : [];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isInteger(target) || target < 1) {
      setError("Enter a whole number of at least 1 day.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const interval = intervalValue === "" ? null : Number(intervalValue);
      await setStreakGoal(patientUid, personId, target, adminUid, interval);
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
        <SkeletonForm fields={2} />
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
              setIntervalValue("");
              setError(null);
            }}
            placeholder="e.g. 18"
            style={{ marginTop: "var(--space-1)", maxWidth: "10rem" }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "err-streak-goal" : undefined}
          />
        </label>
        <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          Pain check-in every
          <select
            className="input"
            value={intervalValue}
            onChange={(e) => setIntervalValue(e.target.value)}
            disabled={validIntervals.length === 0}
            style={{ marginTop: "var(--space-1)", maxWidth: "12rem" }}
          >
            <option value="">None (off)</option>
            {validIntervals.map((n) => (
              <option key={n} value={n}>
                {n} days
              </option>
            ))}
          </select>
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
      {validIntervals.length === 0 && Number.isInteger(target) && target >= 1 && (
        <p className="muted" style={{ margin: 0, fontSize: "var(--text-xs)" }}>
          No pain check-in interval evenly divides a {target}-day goal — pick a different goal length to enable one.
        </p>
      )}
      {error && (
        <span className="field-error" id="err-streak-goal" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
