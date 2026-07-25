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
      <div className="admin-gate-screen admin-gate-screen-wide">
        <div className="admin-gate-card admin-gate-card-wide">
          <div className="admin-gate-icon" />
          <SkeletonStatGrid count={4} />
        </div>
      </div>
    );
  }

  if (status === "out") return <AdminSignIn />;

  if (status === "forbidden") {
    return (
      <div className="admin-gate-screen">
        <div className="admin-gate-card admin-gate-card-centered">
          <p className="admin-gate-message">
            This account doesn&apos;t have admin access to PhysioOnClick.
          </p>
          <button onClick={() => auth && signOut(auth)} className="admin-gate-button">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminShell backHref="/admin" backLabel="← Dashboard">
      <main style={{ maxWidth: "var(--shell)", margin: "0 auto", padding: "var(--space-6) var(--space-5)" }}>
        <div style={{ marginBottom: "var(--space-5)" }}>
          <span className="dashboard-eyebrow">Admin</span>
          <h1 style={{ margin: "var(--space-1) 0 0", fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--color-navy)" }}>Chat Logs</h1>
          <p style={{ margin: "var(--space-2) 0 0", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)" }}>Browse and search all patient chat sessions.</p>
        </div>
        <AdminChatLogs />
      </main>
    </AdminShell>
  );
}
