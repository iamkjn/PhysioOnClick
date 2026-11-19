// app/patient/recovery/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getRecoveryScoreSeries } from "@/lib/recovery";
import { PersonSwitcher } from "@/components/person-switcher";
import { usePatientTarget } from "@/components/person-provider";
import { CarerModeBanner } from "@/components/carer-mode-banner";
import { useCaredForPatients } from "@/hooks/use-cared-for-patients";
import { PainCheckIn } from "@/components/pain-check-in";
import { PainCheckinCard } from "@/components/pain-checkin-card";
import { PainCheckinTimeline } from "@/components/pain-checkin-timeline";
import { RecoveryChart } from "@/components/recovery-chart";
import { AssignedExercises } from "@/components/assigned-exercises";
import { AdherenceBar } from "@/components/adherence-bar";
import { DownloadReportButton } from "@/components/download-report-button";
import { RecoveryPercentCard } from "@/components/recovery-percent-card";
import { SkeletonRow } from "@/components/skeleton";
import { formatPersonName } from "@/lib/name-format";

export default function RecoveryPage() {
  // undefined = auth still resolving, null = confirmed signed out, string = signed in.
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // The active person is shared (and persisted) via PersonProvider, so a
  // dependent picked on the home dashboard / exercises page carries over here.
  // usePatientTarget resolves whose record that is: the signed-in user's own,
  // a dependent's (same account), or — carer mode — another patient's. Every
  // component below gets `ownerUid`, never the signed-in uid, as its `uid`.
  const caredFor = useCaredForPatients(user);
  const target = usePatientTarget(uid, displayName);
  const ownerUid = target?.ownerUid ?? null;
  const personId = target?.personId ?? null;
  const personName = target?.name ?? displayName;
  const isCarer = target?.mode === "carer";

  // The recovery score ring and the pain-trend chart are only meaningful once
  // there's at least one pain check-in (or physio-entered assessment) to show.
  // Before that they render as apologetic empty cards that read as broken, so
  // hide both sections entirely until data exists. On a fetch error, err
  // toward showing them (their own error/empty copy then takes over).
  const [hasRecoveryData, setHasRecoveryData] = useState(false);
  useEffect(() => {
    if (!ownerUid || !personId) return;
    let cancelled = false;
    getRecoveryScoreSeries(ownerUid, personId, 9999)
      .then((series) => {
        if (!cancelled) setHasRecoveryData(series.length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasRecoveryData(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerUid, personId]);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setUser(user);
        setDisplayName(formatPersonName(user.displayName, user.email || "Patient"));
      } else {
        setUid(null);
        setUser(null);
      }
    });
  }, []);

  useEffect(() => {
    if (uid === null) router.push("/patient");
  }, [uid, router]);

  if (uid === undefined) {
    return (
      <div className="site-shell">
        <section className="page-section stack">
          <SkeletonRow count={3} />
        </section>
      </div>
    );
  }

  if (uid === null || !ownerUid || !personId) {
    // Signed out — redirect is in flight; render nothing rather than a
    // "please sign in" flash.
    return null;
  }

  return (
    <div className="site-shell patient-page">
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Recovery dashboard</span>
          <h1>{isCarer ? `Track ${personName}'s recovery.` : "Track your recovery progress."}</h1>
          <p className="muted">Log daily pain scores, tick off exercises, and download your full report.</p>
        </div>
      </section>

      <section className="page-section stack" style={{ gap: "var(--space-2)" }}>
        <PersonSwitcher
          uid={uid}
          displayName={displayName}
          label="Viewing recovery for:"
          caredFor={caredFor}
          onSelect={() => {
            // PersonSwitcher persists the selection via the shared
            // PersonProvider context; `personId` / `personName` above already
            // read from it.
          }}
        />
        {isCarer ? <CarerModeBanner name={personName} /> : null}
        <DownloadReportButton
          uid={ownerUid}
          personId={personId}
          personName={personName}
          chartRef={chartRef}
          // Assessment forms (the patient's own medical questionnaire) are
          // never shared with carers, so their report leaves that part out.
          includeAssessmentForms={!isCarer}
        />
      </section>

      <section className="page-section dashboard-grid">
        <PainCheckIn uid={ownerUid} personId={personId} />
        <AdherenceBar uid={ownerUid} personId={personId} />
        <PainCheckinCard uid={ownerUid} personId={personId} />
      </section>

      <section className="page-section">
        <PainCheckinTimeline uid={ownerUid} personId={personId} />
      </section>

      {hasRecoveryData && (
        <>
          <section className="page-section">
            <RecoveryPercentCard uid={ownerUid} personId={personId} />
          </section>

          <section className="page-section">
            <RecoveryChart ref={chartRef} uid={ownerUid} personId={personId} showMobility />
          </section>
        </>
      )}

      <section className="page-section">
        <AssignedExercises uid={ownerUid} personId={personId} allowMotionCheck={!isCarer} byCarer={isCarer} />
      </section>
    </div>
  );
}
