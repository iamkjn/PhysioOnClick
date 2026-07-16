// app/admin/recovery/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminUser } from "@/lib/admin-auth";
import { AdminPatientSelector } from "@/components/admin-patient-selector";
import { AdminExerciseAssigner } from "@/components/admin-exercise-assigner";
import { AdminClinicalEntry } from "@/components/admin-clinical-entry";
import { AdminRecoveryChart } from "@/components/admin-recovery-chart";
import { SkeletonChart, SkeletonRow } from "@/components/skeleton";

// Same sticky navy header as components/admin-dashboard.tsx, plus a link
// back — this page otherwise renders with zero admin chrome.
function AdminHeader() {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--color-navy)", height: 56, display: "flex", alignItems: "center", padding: "0 1.5rem", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: 1 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 16, fontFamily: "var(--font-serif)" }}>P</div>
        <span style={{ color: "white", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15 }}>PhysioOnClick</span>
        <span style={{ border: "1px solid var(--color-gold)", color: "var(--color-gold)", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-sans)", letterSpacing: "0.04em" }}>Admin</span>
      </div>
      <Link href="/admin" style={{ color: "white", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-sans)", textDecoration: "none" }}>
        ← Back to dashboard
      </Link>
    </header>
  );
}

export default function AdminRecoveryPage() {
  const [adminUid, setAdminUid] = useState<string | null>(null);
  const [checkedAdmin, setCheckedAdmin] = useState(false);
  const [selection, setSelection] = useState<{
    patientUid: string;
    personId: string;
    personName: string;
  } | null>(null);

  useEffect(() => {
    if (!auth) { setCheckedAdmin(true); return; }
    return onAuthStateChanged(auth, async (user) => {
      const isAdmin = user ? await isAdminUser(user) : false;
      setAdminUid(isAdmin ? user!.uid : null);
      setCheckedAdmin(true);
    });
  }, []);

  if (!checkedAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
        <AdminHeader />
        <div className="site-shell">
          <section className="page-section dashboard-grid">
            <SkeletonRow count={4} />
            <SkeletonChart height={260} />
          </section>
        </div>
      </div>
    );
  }

  if (!adminUid) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
        <AdminHeader />
        <div className="site-shell">
          <section className="page-section stack">
            <p className="muted" style={{ fontSize: 14 }}>
              Admin access required.{" "}
              <Link href="/admin" style={{ color: "var(--primary)", fontWeight: 600 }}>
                Go to sign in
              </Link>
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <AdminHeader />
      <div className="site-shell">
        <section className="page-section" style={{ paddingBottom: "1rem" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}>Admin</span>
          <h1 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Patient recovery management</h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: 13, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
            Assign exercises and record clinical assessments for any patient.
          </p>
        </section>

        <section className="page-section dashboard-grid">
          <AdminPatientSelector
            onSelect={(patientUid, personId, personName) =>
              setSelection({ patientUid, personId, personName })
            }
          />
          {selection && (
            <AdminRecoveryChart
              patientUid={selection.patientUid}
              personId={selection.personId}
            />
          )}
        </section>

        {selection && (
          <section className="page-section dashboard-grid">
            <AdminExerciseAssigner
              adminUid={adminUid}
              patientUid={selection.patientUid}
              personId={selection.personId}
            />
            <AdminClinicalEntry
              patientUid={selection.patientUid}
              personId={selection.personId}
            />
          </section>
        )}
      </div>
    </div>
  );
}
