"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase";
import { ensurePatientRecord } from "@/lib/patient-account";
import { usePerson } from "@/components/person-provider";
import { AuthPanel } from "@/components/auth-panel";
import { PatientPortalNav } from "@/components/patient-portal-nav";
import { PatientDashboard } from "@/components/patient-dashboard";
import { PatientLiveOverview } from "@/components/patient-live-overview";
import { SkeletonRow } from "@/components/skeleton";

// The patient portal home. Signed out, it shows the sign-in / sign-up panel
// (redirecting back here on success). Signed in, it becomes the mobile-style
// dashboard: the portal tab selector, a greeting, the pain/adherence/streak
// cards, and the bookings/enquiries overview below.
export function PatientHome() {
  // undefined = auth still resolving, null = signed out, string = signed in.
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState("");
  const personCtx = usePerson();

  useEffect(() => {
    if (!auth) {
      setUid(null);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
      setDisplayName(user?.displayName || user?.email || "there");
      // This gate is always mounted on /patient, so it's the reliable place to
      // finish any sign-in — including the Google *redirect* return, where the
      // AuthPanel can be unmounted before its own completion runs. Idempotent
      // (setDoc merge), so it's safe to also fire alongside AuthPanel's own
      // ensurePatientRecord on the popup/email paths.
      if (user) {
        void ensurePatientRecord(user).catch((err) =>
          console.error("ensurePatientRecord failed on portal home", err)
        );
      }
    });
  }, []);

  if (uid === undefined) {
    return (
      <div className="page-section stack">
        <SkeletonRow count={3} />
      </div>
    );
  }

  if (uid === null) {
    return (
      <>
        <section className="page-hero page-hero-split">
          <div className="stack">
            <span className="eyebrow">Patient portal</span>
            <h1>Appointments, uploads and rehab progress in one secure space.</h1>
            <p className="lead">
              Sign in to view upcoming appointments, track pain scores and exercise adherence, and pick up your
              recovery where you left off.
            </p>
          </div>
        </section>
        <section className="page-section dashboard-grid">
          <AuthPanel role="patient" redirectTo="/patient" />
        </section>
      </>
    );
  }

  const personId = personCtx?.personId ?? uid;

  return (
    <>
      <PatientPortalNav />
      <section className="page-hero" style={{ paddingBottom: "0.5rem" }}>
        <div className="stack">
          <span className="eyebrow">Patient portal</span>
          <h1 style={{ marginBottom: 0 }}>Welcome back, {displayName.split(" ")[0]}.</h1>
          <p className="muted">Your recovery at a glance. Tap any card for the full picture.</p>
        </div>
      </section>

      <section className="page-section">
        <PatientDashboard uid={uid} personId={personId} />
      </section>

      <section className="page-section dashboard-grid">
        <PatientLiveOverview />
      </section>
    </>
  );
}
