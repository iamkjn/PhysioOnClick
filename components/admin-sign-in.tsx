"use client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FormEvent, useState } from "react";
import { auth } from "@/lib/firebase";

export function AdminSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth!, email, password);
      window.location.reload();
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    border: "1.5px solid var(--color-border)",
    borderRadius: 10,
    padding: "0.75rem 1rem",
    fontSize: 14,
    fontFamily: "var(--font-sans)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    color: "var(--color-navy)",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-navy)", padding: "1rem" }}>
      <div style={{ background: "var(--color-surface)", borderRadius: 20, padding: "2.5rem 2rem", width: "100%", maxWidth: 420, boxShadow: "var(--shadow-card)" }}>
        {/* Logo + title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 22, fontFamily: "var(--font-serif)" }}>P</div>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--color-navy)", lineHeight: 1.1 }}>Admin Portal</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>PhysioOnClick</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: "1.5rem", fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
          Sign in to access bookings, enquiries and patient data.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          {error && <p style={{ color: "var(--color-error)", fontSize: 13, margin: 0, fontFamily: "var(--font-sans)" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "0.875rem", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-sans)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "0.25rem" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
