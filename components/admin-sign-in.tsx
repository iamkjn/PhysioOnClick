"use client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FormEvent, useState } from "react";
import { auth } from "@/lib/firebase";
import { validateEmail, LIMITS } from "@/lib/validation";

export function AdminSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

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
          <input id="admin-password" type="password" className="input" placeholder="Password" autoComplete="current-password" required maxLength={LIMITS.password} value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p role="alert" aria-live="assertive" style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: 0, fontFamily: "var(--font-sans)" }}>{error}</p>}
          <button
            type="submit"
            className="button primary full-width"
            disabled={loading}
            style={{ marginTop: "var(--space-1)", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
