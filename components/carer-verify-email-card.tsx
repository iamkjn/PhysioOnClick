"use client";

import { useState } from "react";
import type { User } from "firebase/auth";

import { requestEmailVerification } from "@/lib/email-verification";
import { resetCaredForCache } from "@/hooks/use-cared-for-patients";

type Status = { kind: "idle" | "sent" | "error" | "not-yet"; message: string };

// Shown on the home dashboard when someone listed this user as a carer but
// their email isn't verified yet (usually a password sign-up), which keeps
// carer access locked (firestore.rules isCarerOf). One button emails a
// confirmation link; the second picks up the confirmation without signing out.
export function CarerVerifyEmailCard({
  user,
  reload = () => window.location.reload(),
}: {
  user: Pick<User, "email" | "getIdToken" | "reload" | "emailVerified">;
  reload?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });

  async function send() {
    setBusy(true);
    const result = await requestEmailVerification(user);
    setBusy(false);
    if (result.ok && result.alreadyVerified) {
      await recheck();
      return;
    }
    setStatus(
      result.ok
        ? { kind: "sent", message: `We've sent a link to ${user.email ?? "your email"}. Click it, then come back here.` }
        : { kind: "error", message: result.error ?? "Could not send the email. Please try again." }
    );
  }

  async function recheck() {
    setBusy(true);
    try {
      await user.reload();
      await user.getIdToken(true);
    } catch {
      // fall through to the emailVerified check below
    }
    setBusy(false);
    if (user.emailVerified) {
      resetCaredForCache();
      reload();
      return;
    }
    setStatus({ kind: "not-yet", message: "Not confirmed yet. Check your inbox (and spam) for the link." });
  }

  return (
    <div
      className="panel stack"
      role="region"
      aria-label="Confirm your email"
      style={{ gap: "var(--space-2)", background: "var(--color-primary-light)" }}
    >
      <strong>Someone has given you access to help with their recovery.</strong>
      <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        Confirm your email address to see their exercises and progress.
      </p>
      <div className="button-row">
        <button type="button" className="button primary small" onClick={() => void send()} disabled={busy}>
          Email me a confirmation link
        </button>
        {status.kind === "sent" || status.kind === "not-yet" ? (
          <button type="button" className="button secondary small" onClick={() => void recheck()} disabled={busy}>
            I&rsquo;ve confirmed it
          </button>
        ) : null}
      </div>
      {status.message ? (
        <p
          role={status.kind === "error" ? "alert" : "status"}
          className={`auth-status ${status.kind === "error" ? "auth-status-error" : "auth-status-success"}`}
          style={{ margin: 0 }}
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
