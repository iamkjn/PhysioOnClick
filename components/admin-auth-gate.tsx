"use client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { isAdminUser } from "@/lib/admin-auth";
import { AdminSignIn } from "@/components/admin-sign-in";
import { AdminDashboard } from "@/components/admin-dashboard";
import { SkeletonStatGrid } from "@/components/skeleton";

export function AdminAuthGate() {
  const [status, setStatus] = useState<"loading" | "out" | "forbidden" | "in">("loading");

  useEffect(() => {
    if (!auth) { setStatus("out"); return; }
    return onAuthStateChanged(auth, async (user) => {
      if (!user) { setStatus("out"); return; }
      try {
        const isAdmin = await isAdminUser(user);
        setStatus(isAdmin ? "in" : "forbidden");
      } catch (error) {
        // getIdTokenResult() does a network round-trip to refresh the token.
        // Without this catch, any failure here (flaky network, a slow cold
        // start) leaves `status` stuck at "loading" forever — the sign-in
        // screen is the only recoverable state to fall back to.
        console.error("admin auth check failed", error);
        setStatus("out");
      }
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

  return <AdminDashboard />;
}
