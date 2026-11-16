"use client";

import { useState } from "react";

import { auth } from "@/lib/firebase";
import { useToast } from "@/components/toast-provider";

/**
 * Admin "Print plan" — opens the stored exercise-plan handout PDF for a
 * session summary in a new tab, ready to print and leave on the patient's
 * fridge at the next home visit.
 *
 * Same route as the patient's "Download my plan" button
 * (`/api/exercise-plan/{summaryId}/pdf`), which already authorises the
 * practice admin. The tab is opened synchronously inside the click, before
 * the fetch, so pop-up blockers treat it as user-initiated; if the browser
 * blocks it anyway, the PDF is downloaded instead.
 *
 * A 404 means no PDF has been stored for this summary: it is still being
 * generated just after publishing, or generation failed. "Resend plan email"
 * rebuilds it.
 */
export function AdminPrintPlanButton({
  summaryId,
  className = "button secondary small",
}: {
  summaryId?: string | null;
  className?: string;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (!summaryId) return null;

  async function handlePrint() {
    const user = auth?.currentUser;
    if (!user) {
      toast.show("Please sign in again to print the plan.", "error");
      return;
    }
    const tab = window.open("", "_blank");
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/exercise-plan/${summaryId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) {
        tab?.close();
        toast.show(
          "The plan PDF isn't ready yet. Wait a minute and try again, or use Resend plan email to rebuild it.",
          "warning",
        );
        return;
      }
      if (!res.ok) throw new Error(`Plan PDF failed (${res.status})`);
      const url = URL.createObjectURL(await res.blob());
      if (tab) {
        tab.location.href = url;
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = "exercise-plan.pdf";
        a.click();
        toast.show("Pop-ups are blocked, so the plan was downloaded instead. Open it to print.", "info");
      }
      // The new tab needs the URL while it loads, so release it later.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      tab?.close();
      toast.show("Could not open the plan. Try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={className} onClick={() => void handlePrint()} disabled={busy}>
      {busy ? "Opening…" : "Print plan"}
    </button>
  );
}
