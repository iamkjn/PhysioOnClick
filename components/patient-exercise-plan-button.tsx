"use client";

import { useState } from "react";

import { auth } from "@/lib/firebase";
import { useToast } from "@/components/toast-provider";

/**
 * "Download my plan (PDF)" — fetches the stored exercise-plan handout for the
 * given session summary via `/api/exercise-plan/{summaryId}/pdf` (Bearer
 * idToken), then opens the returned PDF in a new tab.
 *
 * Renders nothing when there is no `summaryId` — the newest-summary lookup
 * lives in the page, and a person with no published summary simply has no
 * plan to download yet.
 */
export function PatientExercisePlanButton({ summaryId }: { summaryId?: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (!summaryId) return null;

  async function handleDownload() {
    if (!auth?.currentUser) {
      toast.show("Please sign in again to download your plan.", "error");
      return;
    }
    setBusy(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/exercise-plan/${summaryId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      // Revoke after the new tab has had a chance to load the resource.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toast.show("Could not download your plan. Try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="button secondary small"
      onClick={handleDownload}
      disabled={busy}
    >
      {busy ? "Preparing…" : "Download my plan (PDF)"}
    </button>
  );
}
