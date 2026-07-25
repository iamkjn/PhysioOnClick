// app/admin/recovery/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminUser } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin-shell";
import { AdminPatientSelector } from "@/components/admin-patient-selector";
import { AdminExerciseAssigner } from "@/components/admin-exercise-assigner";
import { AdminClinicalEntry } from "@/components/admin-clinical-entry";
import { AdminStreakGoal } from "@/components/admin-streak-goal";
import { AdminFollowUp } from "@/components/admin-follow-up";
import { AdminRecoveryChart } from "@/components/admin-recovery-chart";
import { SkeletonChart, SkeletonRow } from "@/components/skeleton";

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
      <AdminShell backHref="/admin" backLabel="← Back to dashboard">
        <div className="site-shell">
          <section className="page-section dashboard-grid">
            <SkeletonRow count={4} />
            <SkeletonChart height={260} />
          </section>
        </div>
      </AdminShell>
    );
  }

  if (!adminUid) {
    return (
      <AdminShell backHref="/admin" backLabel="← Back to dashboard">
        <div className="site-shell">
          <section className="page-section stack">
            <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
              Admin access required.{" "}
              <Link href="/admin" style={{ color: "var(--primary)", fontWeight: 600 }}>
                Go to sign in
              </Link>
            </p>
          </section>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell backHref="/admin" backLabel="← Back to dashboard">
      <div className="site-shell">
        <section className="page-section" style={{ paddingBottom: "var(--space-4)" }}>
          <span className="dashboard-eyebrow">Admin</span>
          <h1 style={{ margin: "var(--space-1) 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Patient recovery management</h1>
          <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
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
            <AdminStreakGoal
              adminUid={adminUid}
              patientUid={selection.patientUid}
              personId={selection.personId}
            />
            <AdminFollowUp
              adminUid={adminUid}
              patientUid={selection.patientUid}
              patientName={selection.personName}
              personId={selection.personId}
            />
          </section>
        )}
      </div>
    </AdminShell>
  );
}
