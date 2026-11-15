// components/admin-portal-invite.tsx
"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { auth } from "@/lib/firebase";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";

interface Props {
  patientUid: string;
  patientName: string;
}

// "Send sign-in invite": emails the patient and their carers a welcome email
// with a one-click sign-in link (app/api/admin/send-invite).
export function AdminPortalInvite({ patientUid, patientName }: Props) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  async function send() {
    setConfirming(false);
    setSending(true);
    try {
      const token = await auth?.currentUser?.getIdToken().catch(() => null);
      if (!token) throw new Error("Not signed in");
      const res = await fetch("/api/admin/send-invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uid: patientUid }),
      });
      const json = (await res.json().catch(() => ({}))) as { sent?: string[]; failed?: string[]; error?: string };
      if (!res.ok && !json.sent?.length) throw new Error(json.error ?? "failed");
      const sent = json.sent ?? [];
      const failed = json.failed ?? [];
      toast.show(
        failed.length
          ? `Invite sent to ${sent.join(", ")}. Could not send to ${failed.join(", ")}.`
          : `Invite sent to ${sent.join(", ")}.`,
        failed.length ? "error" : "success",
      );
    } catch {
      toast.show("Could not send the invite. Try again.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="button small secondary admin-invite-button"
        disabled={sending}
        onClick={() => setConfirming(true)}
      >
        <Send aria-hidden="true" /> {sending ? "Sending…" : "Send sign-in invite"}
      </button>
      <ConfirmDialog
        isOpen={confirming}
        title="Send sign-in invite?"
        body={`Emails ${patientName || "this patient"} and any carers listed below a welcome email with a one-click sign-in link and simple steps for signing in again later.`}
        confirmLabel="Send invite"
        onConfirm={() => void send()}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
