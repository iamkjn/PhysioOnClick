"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { confirmPasswordReset } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { LIMITS } from "@/lib/validation";
import { PasswordInput } from "@/components/password-input";

type Stage = "form" | "submitting" | "success" | "error";

// Firebase's own hosted reset page (physioonclick-prod.firebaseapp.com/__/auth/action)
// is blocked by this project's API key HTTP-referrer restrictions — visiting
// it always shows a generic "expired or already used" error regardless of
// the code's real state (hit in production 2026-08-14). This page runs on
// our own domain, which the key *does* allow, and completes the reset
// directly against Identity Toolkit via the client SDK instead.
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!oobCode) {
      setError("This link is missing its reset code. Please request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStage("submitting");
    try {
      await confirmPasswordReset(auth!, oobCode, password);
      setStage("success");
      setTimeout(() => router.push("/admin"), 2000);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      if (code === "auth/invalid-action-code" || code === "auth/expired-action-code") {
        setError("This link has expired or has already been used. Please request a new one.");
      } else if (code === "auth/weak-password") {
        setError("Please choose a stronger password.");
      } else {
        setError("Could not reset your password. Please try again.");
      }
      setStage("error");
    }
  }

  if (stage === "success") {
    return (
      <div className="admin-gate-screen">
        <div className="admin-gate-card">
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--color-navy)", marginTop: 0 }}>Password updated</h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
            Taking you to sign in…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-gate-screen">
      <div className="admin-gate-card">
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--color-navy)", marginTop: 0, marginBottom: "var(--space-3)" }}>
          Choose a new password
        </h1>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "var(--space-3)" }}>
          <label htmlFor="new-password" className="sr-only">New password</label>
          <PasswordInput
            id="new-password"
            className="input"
            placeholder="New password"
            autoComplete="new-password"
            required
            maxLength={LIMITS.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label htmlFor="confirm-password" className="sr-only">Confirm new password</label>
          <PasswordInput
            id="confirm-password"
            className="input"
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
            maxLength={LIMITS.password}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && (
            <p role="alert" aria-live="assertive" style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: 0, fontFamily: "var(--font-sans)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="button primary full-width"
            disabled={stage === "submitting"}
            style={{ marginTop: "var(--space-1)", opacity: stage === "submitting" ? 0.7 : 1, cursor: stage === "submitting" ? "not-allowed" : "pointer" }}
          >
            {stage === "submitting" ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
