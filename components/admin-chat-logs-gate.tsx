"use client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { isAdminUser } from "@/lib/admin-auth";
import { AdminSignIn } from "@/components/admin-sign-in";
import { AdminChatLogs } from "@/components/admin-chat-logs";
import { AdminShell } from "@/components/admin-shell";
import { SkeletonStatGrid } from "@/components/skeleton";

export function AdminChatLogsGate() {
  const [status, setStatus] = useState<"loading" | "out" | "forbidden" | "in">("loading");

  useEffect(() => {
    if (!auth) { setStatus("out"); return; }
    return onAuthStateChanged(auth, async (user) => {
      if (!user) { setStatus("out"); return; }
      const isAdmin = await isAdminUser(user);
      setStatus(isAdmin ? "in" : "forbidden");
    });
  }, []);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-navy)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 640, background: "var(--color-surface)", borderRadius: 20, padding: "2rem", boxShadow: "var(--shadow-card)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--gradient-primary)", marginBottom: "1.5rem" }} />
          <SkeletonStatGrid count={4} />
        </div>
      </div>
    );
  }

  if (status === "out") return <AdminSignIn />;

  if (status === "forbidden") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-navy)", padding: "1rem" }}>
        <div style={{ background: "var(--color-surface)", borderRadius: 20, padding: "2.5rem 2rem", width: "100%", maxWidth: 420, boxShadow: "var(--shadow-card)", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-sans)", color: "var(--color-navy)", fontSize: 15, lineHeight: 1.6, marginBottom: "1.5rem" }}>
            This account doesn&apos;t have admin access to PhysioOnClick.
          </p>
          <button
            onClick={() => auth && signOut(auth)}
            style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "0.75rem 1.5rem", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-sans)", cursor: "pointer" }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminShell backHref="/admin" backLabel="← Dashboard">
      <main style={{ maxWidth: 1340, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}>Admin</span>
          <h1 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--color-navy)" }}>Chat Logs</h1>
          <p style={{ margin: "0.5rem 0 0", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", fontSize: 14 }}>Browse and search all patient chat sessions.</p>
        </div>
        <AdminChatLogs />
      </main>
    </AdminShell>
  );
}
