"use client";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { AdminSignIn } from "@/components/admin-sign-in";
import { AdminDashboard } from "@/components/admin-dashboard";

export function AdminAuthGate() {
  const [status, setStatus] = useState<"loading" | "out" | "in">("loading");

  useEffect(() => {
    if (!auth) { setStatus("out"); return; }
    return onAuthStateChanged(auth, (user) => setStatus(user ? "in" : "out"));
  }, []);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-navy)" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid var(--color-spinner-track)", borderTopColor: "var(--color-teal)", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "out") return <AdminSignIn />;
  return <AdminDashboard />;
}
