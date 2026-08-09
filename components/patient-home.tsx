"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { auth } from "@/lib/firebase";
import { ensurePatientRecord } from "@/lib/patient-account";
import { AuthPanel } from "@/components/auth-panel";
import { SkeletonRow } from "@/components/skeleton";

// /patient is now purely the sign-in gate. The single signed-in home is `/`
// (components/home-dashboard.tsx), so a signed-in visitor here is bounced there
// and the sign-in panel redirects to `/` on success. This is also the reliable
// place to finish a Google *redirect* sign-in (which returns to /patient), where
// the AuthPanel can be unmounted before its own completion runs — so we ensure
// the patient record here before redirecting.
export function PatientHome() {
  // undefined = auth still resolving, null = signed out, string = signed in.
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setUid(null);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        void ensurePatientRecord(user).catch((err) =>
          console.error("ensurePatientRecord failed on portal gate", err)
        );
        setUid(user.uid);
      } else {
        setUid(null);
      }
    });
  }, []);

  useEffect(() => {
    if (typeof uid === "string") router.replace("/");
  }, [uid, router]);

  if (uid === undefined) {
    return (
      <div className="page-section stack">
        <SkeletonRow count={3} />
      </div>
    );
  }

  if (typeof uid === "string") {
    // Signed in — redirect to the home dashboard is in flight; render nothing
    // rather than flashing the sign-in panel.
    return null;
  }

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
      <section className="page-section patient-auth-layout">
        {/* redirectTo={null}: this component's own onAuthStateChanged effect
            above already redirects to "/" once uid resolves. Letting AuthPanel
            also push/refresh to the same destination raced with that redirect
            and could abort the in-flight RSC fetch, leaving <main> empty until
            a manual reload. */}
        <AuthPanel role="patient" redirectTo={null} />
        <aside className="panel auth-context-panel" aria-label="Patient portal benefits">
          <span className="eyebrow">What you can do</span>
          <h2>Pick up your care plan without hunting through emails.</h2>
          <ul className="auth-context-list">
            <li>View upcoming appointments and session notes.</li>
            <li>Track pain scores, streaks and exercise adherence.</li>
            <li>Manage people you book or care for in one account.</li>
            <li>Keep rehab updates ready before your next consultation.</li>
          </ul>
        </aside>
      </section>
    </>
  );
}
