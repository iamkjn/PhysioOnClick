// app/admin/recovery/page.tsx
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminUser } from "@/lib/admin-auth";
import { AdminPatientSelector } from "@/components/admin-patient-selector";
import { AdminExerciseAssigner } from "@/components/admin-exercise-assigner";
import { AdminClinicalEntry } from "@/components/admin-clinical-entry";
import { AdminRecoveryChart } from "@/components/admin-recovery-chart";

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
      <div className="site-shell">
        <section className="page-section stack">
          <p className="muted">Checking admin access…</p>
        </section>
      </div>
    );
  }

  if (!adminUid) {
    return (
      <div className="site-shell">
        <section className="page-section stack">
          <p className="muted">Admin access required.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Admin</span>
          <h1>Patient recovery management</h1>
          <p className="lead">
            Assign exercises and record clinical assessments for any patient.
          </p>
        </div>
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
  );
}
