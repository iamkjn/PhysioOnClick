"use client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { AdminSignIn } from "@/components/admin-sign-in";
import { AdminChatLogs } from "@/components/admin-chat-logs";

export function AdminChatLogsGate() {
  const [status, setStatus] = useState<"loading" | "out" | "in">("loading");

  useEffect(() => {
    if (!auth) { setStatus("out"); return; }
    return onAuthStateChanged(auth, (user) => setStatus(user ? "in" : "out"));
  }, []);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-navy)" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid var(--color-spinner-track)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "out") return <AdminSignIn />;

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
    window.location.reload();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--color-navy)", height: 56, display: "flex", alignItems: "center", padding: "0 1.5rem", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "var(--font-serif)" }}>P</div>
          <span style={{ color: "#fff", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15 }}>PhysioOnClick</span>
          <span style={{ border: "1px solid var(--color-gold)", color: "var(--color-gold)", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-sans)", letterSpacing: "0.04em" }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a href="/admin" style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "var(--font-sans)", textDecoration: "none" }}>← Dashboard</a>
          <button onClick={handleSignOut} style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Sign out</button>
        </div>
      </header>
      <main style={{ maxWidth: 1340, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}>Admin</span>
          <h1 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--color-navy)" }}>Chat Logs</h1>
          <p style={{ margin: "0.5rem 0 0", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", fontSize: 14 }}>Browse and search all patient chat sessions.</p>
        </div>
        <AdminChatLogs />
      </main>
    </div>
  );
}
