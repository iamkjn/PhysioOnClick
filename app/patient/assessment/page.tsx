"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PersonSwitcher } from "@/components/person-switcher";
import { usePerson } from "@/components/person-provider";
import { PatientAssessmentForm, PatientAssessmentHistory } from "@/components/patient-assessment-form";
import { SkeletonRow } from "@/components/skeleton";

export default function PatientAssessmentPage() {
  const router = useRouter();
  const personCtx = usePerson();
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!auth) {
      setUid(null);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUid(null);
        return;
      }
      setUid(user.uid);
      setDisplayName(user.displayName || user.email || "Patient");
    });
  }, []);

  useEffect(() => {
    if (uid === null) router.push("/patient");
  }, [uid, router]);

  if (uid === undefined) {
    return (
      <div className="site-shell patient-page">
        <section className="page-section stack">
          <SkeletonRow count={3} />
        </section>
      </div>
    );
  }

  if (uid === null) return null;

  const personId = personCtx?.personId ?? uid;
  const personName = personCtx?.personName || displayName;

  return (
    <div className="site-shell patient-page assessment-page">
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Assessment form</span>
          <h1 style={{ color: "var(--color-text-primary)" }}>Prepare for your physiotherapy check-up.</h1>
          <p className="muted">
            Complete this once before a first appointment, then again for follow-up check-ups when something changes.
          </p>
        </div>
      </section>

      <section className="page-section stack" style={{ gap: "var(--space-2)" }}>
        <PersonSwitcher
          uid={uid}
          displayName={displayName}
          alwaysShow
          onAddPerson={() => router.push("/patient/people")}
          onSelect={() => {
            // Selection is persisted by PersonProvider and read below.
          }}
        />
      </section>

      <section className="page-section assessment-page-grid">
        <PatientAssessmentForm
          uid={uid}
          personId={personId}
          displayName={displayName}
          personName={personName}
          onSubmitted={() => setReloadKey((key) => key + 1)}
        />
        <PatientAssessmentHistory uid={uid} personId={personId} reloadKey={reloadKey} />
      </section>
    </div>
  );
}
