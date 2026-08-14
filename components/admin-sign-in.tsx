"use client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FormEvent, useState } from "react";
import { auth } from "@/lib/firebase";
import { validateEmail, LIMITS } from "@/lib/validation";
import { PasswordInput } from "@/components/password-input";

export function AdminSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResetMessage("");

    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth!, email.trim(), password);
      window.location.reload();
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setResetMessage("");

    const emailErr = validateEmail(email);
    if (emailErr) {
      setError("Enter your email address above first, then click “Forgot password?”.");
      return;
    }

    setResetting(true);
    try {
      // Routed through our own Resend-sent email (app/api/admin/forgot-password)
      // rather than Firebase's client-side sendPasswordResetEmail: Firebase's
      // default sender is silently spam-filtered/dropped by several mail
      // providers for a custom domain — hit in production 2026-08-13, no
      // error, the email just never arrived. Our own sender is already
      // proven to deliver (booking confirmations, magic links).
      await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // Network failure — still show the generic message; nothing here should
      // reveal whether the account exists.
    } finally {
      setResetting(false);
      setResetMessage("If an account exists for that email, a password reset link has been sent.");
    }
  }

  return (
    <div className="admin-gate-screen">
      <div className="admin-gate-card">
        {/* Logo + title */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 22, fontFamily: "var(--font-serif)" }}>P</div>
          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--color-navy)", lineHeight: 1.1, margin: 0 }}>Admin Portal</h1>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>PhysioOnClick</div>
          </div>
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-5)", fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
          Sign in to access bookings, enquiries and patient data.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "var(--space-3)" }}>
          <label htmlFor="admin-email" className="sr-only">Email address</label>
          <input id="admin-email" type="email" className="input" placeholder="Email address" autoComplete="email" required maxLength={LIMITS.email} value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="admin-password" className="sr-only">Password</label>
          <PasswordInput id="admin-password" className="input" placeholder="Password" autoComplete="current-password" required maxLength={LIMITS.password} value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p role="alert" aria-live="assertive" style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: 0, fontFamily: "var(--font-sans)" }}>{error}</p>}
          {resetMessage && <p role="status" aria-live="polite" style={{ color: "var(--color-success)", fontSize: "var(--text-sm)", margin: 0, fontFamily: "var(--font-sans)" }}>{resetMessage}</p>}
          <button
            type="submit"
            className="button primary full-width"
            disabled={loading}
            style={{ marginTop: "var(--space-1)", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetting}
            style={{
              background: "none",
              border: 0,
              padding: 0,
              color: "var(--color-primary)",
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-sans)",
              textAlign: "center",
              cursor: resetting ? "not-allowed" : "pointer",
              opacity: resetting ? 0.7 : 1,
            }}
          >
            {resetting ? "Sending reset link…" : "Forgot password?"}
          </button>
        </form>
      </div>
    </div>
  );
}
