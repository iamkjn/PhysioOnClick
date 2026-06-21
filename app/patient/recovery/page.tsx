// app/patient/recovery/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PersonSwitcher } from "@/components/person-switcher";
import { PainCheckIn } from "@/components/pain-check-in";
import { RecoveryChart } from "@/components/recovery-chart";
import { AssignedExercises } from "@/components/assigned-exercises";
import { AdherenceBar } from "@/components/adherence-bar";
import { DownloadReportButton } from "@/components/download-report-button";

export default function RecoveryPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [personId, setPersonId] = useState<string | null>(null);
  const [personName, setPersonName] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setPersonId(user.uid);
        const name = user.displayName || user.email || "Patient";
        setDisplayName(name);
        setPersonName(name);
      } else {
        setUid(null);
        setPersonId(null);
      }
    });
  }, []);

  if (!uid || !personId) {
    return (
      <div className="site-shell">
        <section className="page-section stack">
          <p className="muted">Please sign in to view your recovery dashboard.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Recovery dashboard</span>
          <h1>Track your recovery progress.</h1>
          <p className="lead">Log daily pain scores, tick off exercises, and download your full report.</p>
        </div>
      </section>

      <section className="page-section stack" style={{ gap: "0.5rem" }}>
        <PersonSwitcher
          uid={uid}
          displayName={displayName}
          onSelect={(id, name) => {
            setPersonId(id);
            setPersonName(name);
          }}
        />
        <DownloadReportButton
          uid={uid}
          personId={personId}
          personName={personName}
          chartRef={chartRef}
        />
      </section>

      <section className="page-section dashboard-grid">
        <PainCheckIn uid={uid} personId={personId} />
        <AdherenceBar uid={uid} personId={personId} />
      </section>

      <section className="page-section">
        <RecoveryChart ref={chartRef} uid={uid} personId={personId} />
      </section>

      <section className="page-section">
        <AssignedExercises uid={uid} personId={personId} />
      </section>
    </div>
  );
}
