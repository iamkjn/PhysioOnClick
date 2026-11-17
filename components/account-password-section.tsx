"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { SetPasswordForm } from "@/components/set-password-form";

type Status = "loading" | "none" | "has" | "unknown";

/**
 * Account page: create a password (emailed-link-only accounts) or change it.
 * Status comes from /api/auth/password-status; if that fails we still let the
 * user set one, just with neutral wording.
 */
export function AccountPasswordSection() {
  const [status, setStatus] = useState<Status>("loading");
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const user = getAuth().currentUser;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = getAuth().currentUser;
      if (!current) return;
      try {
        const res = await fetch("/api/auth/password-status", {
          headers: { Authorization: `Bearer ${await current.getIdToken()}` },
        });
        const data = res.ok ? ((await res.json()) as { hasPassword?: unknown }) : {};
        if (cancelled) return;
        setStatus(data.hasPassword === true ? "has" : data.hasPassword === false ? "none" : "unknown");
      } catch {
        if (!cancelled) setStatus("unknown");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user || status === "loading") return null;

  const hasPassword = status === "has" || saved;
  const title = hasPassword ? "Change your password" : status === "none" ? "Create a password" : "Set a password";

  return (
    <div className="panel stack" style={{ padding: "1.25rem", gap: "0.75rem" }}>
      {saved ? (
        <p className="auth-status auth-status-success" role="status" style={{ margin: 0 }}>
          Password saved. Next time, sign in at physioonclick.co.uk/patient with your email and this password.
        </p>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          {status === "none"
            ? "You sign in with an emailed link at the moment. Add a password and you can sign in with your email and password any time."
            : hasPassword
            ? "You can sign in with your email and password."
            : "Sign in with your email and password any time."}
        </p>
      )}
      {open ? (
        <SetPasswordForm
          user={user}
          onSaved={() => {
            setSaved(true);
            setOpen(false);
          }}
        />
      ) : (
        <div>
          <button type="button" className="button secondary small" onClick={() => setOpen(true)}>
            {title}
          </button>
        </div>
      )}
    </div>
  );
}
