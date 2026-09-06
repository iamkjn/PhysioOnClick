// app/patient/recovery/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getRecoveryScoreSeries } from "@/lib/recovery";
import { PersonSwitcher } from "@/components/person-switcher";
import { usePerson } from "@/components/person-provider";
import { PainCheckIn } from "@/components/pain-check-in";
import { PainCheckinCard } from "@/components/pain-checkin-card";
import { PainCheckinTimeline } from "@/components/pain-checkin-timeline";
import { RecoveryChart } from "@/components/recovery-chart";
import { AssignedExercises } from "@/components/assigned-exercises";
import { AdherenceBar } from "@/components/adherence-bar";
import { DownloadReportButton } from "@/components/download-report-button";
import { RecoveryPercentCard } from "@/components/recovery-percent-card";
import { SkeletonRow } from "@/components/skeleton";

export default function RecoveryPage() {
  // undefined = auth still resolving, null = confirmed signed out, string = signed in.
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // The active person is shared (and persisted) via PersonProvider, so a
  // dependent picked on the home dashboard / exercises page carries over here.
  // Deriving it from context — rather than local state seeded to `uid` — keeps
  // the PersonSwitcher's selection and every chart below in sync.
  const personCtx = usePerson();
  const personId = uid ? (personCtx?.personId ?? uid) : null;
  const personName = personCtx?.personId ? personCtx.personName : displayName;

  // The recovery score ring and the pain-trend chart are only meaningful once
  // there's at least one pain check-in (or physio-entered assessment) to show.
  // Before that they render as apologetic empty cards that read as broken, so
  // hide both sections entirely until data exists. On a fetch error, err
  // toward showing them (their own error/empty copy then takes over).
  const [hasRecoveryData, setHasRecoveryData] = useState(false);
  useEffect(() => {
    if (!uid || !personId) return;
    let cancelled = false;
    getRecoveryScoreSeries(uid, personId, 9999)
      .then((series) => {
        if (!cancelled) setHasRecoveryData(series.length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasRecoveryData(true);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, personId]);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setDisplayName(user.displayName || user.email || "Patient");
      } else {
        setUid(null);
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

  if (uid === null || !personId) {
    // Signed out — redirect is in flight; render nothing rather than a
    // "please sign in" flash.
    return null;
  }

  return (
    <div className="site-shell patient-page">
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Recovery dashboard</span>
          <h1>Track your recovery progress.</h1>
          <p className="muted">Log daily pain scores, tick off exercises, and download your full report.</p>
        </div>
      </section>

      <section className="page-section stack" style={{ gap: "var(--space-2)" }}>
        <PersonSwitcher
          uid={uid}
          displayName={displayName}
          onSelect={() => {
            // PersonSwitcher persists the selection via the shared
            // PersonProvider context; `personId` / `personName` above already
            // read from it.
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
        <PainCheckinCard uid={uid} personId={personId} />
      </section>

      <section className="page-section">
        <PainCheckinTimeline uid={uid} personId={personId} />
      </section>

      {hasRecoveryData && (
        <>
          <section className="page-section">
            <RecoveryPercentCard uid={uid} personId={personId} />
          </section>

          <section className="page-section">
            <RecoveryChart ref={chartRef} uid={uid} personId={personId} showMobility />
          </section>
        </>
      )}

      <section className="page-section">
        <AssignedExercises uid={uid} personId={personId} />
      </section>
    </div>
  );
}
