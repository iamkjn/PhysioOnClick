"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PersonSwitcher } from "@/components/person-switcher";
import { usePatientTarget } from "@/components/person-provider";
import { CarerModeBanner } from "@/components/carer-mode-banner";
import { useCaredForPatients } from "@/hooks/use-cared-for-patients";
import { AssignedExercises } from "@/components/assigned-exercises";
import { PatientSelfTests } from "@/components/patient-self-tests";
import { PatientExercisePlanButton } from "@/components/patient-exercise-plan-button";
import { SkeletonRow } from "@/components/skeleton";
import { getLatestSummaryId } from "@/lib/session-summaries";
import { formatPersonName } from "@/lib/name-format";

export default function ExercisesPage() {
  // undefined = auth still resolving, null = signed out, string = signed in.
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const router = useRouter();

  // The active person is shared (and persisted) via PersonProvider, so a
  // dependent picked on the home dashboard / recovery page carries over here.
  // usePatientTarget resolves whose record that is (own, dependent, or a
  // patient this user is a carer for); the list below reads/writes
  // `ownerUid`'s tree, never the signed-in uid's by assumption.
  const caredFor = useCaredForPatients(user);
  const target = usePatientTarget(uid, displayName);
  const ownerUid = target?.ownerUid ?? null;
  const personId = target?.personId ?? null;
  const isCarer = target?.mode === "carer";

  // Newest published session summary for the active person — the "Download my
  // plan" button points at its stored handout PDF. undefined while resolving
  // (or when there's no summary yet), which hides the button.
  const [planSummaryId, setPlanSummaryId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!auth) {
      setUid(null);
      return;
    }
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

  useEffect(() => {
    // The plan PDF hangs off a booking's session summary, which only the
    // account that booked can read — carers don't get the download.
    if (!ownerUid || !personId || isCarer) {
      setPlanSummaryId(undefined);
      return;
    }
    let cancelled = false;
    setPlanSummaryId(undefined);
    getLatestSummaryId(ownerUid, personId)
      .then((id) => {
        if (!cancelled) setPlanSummaryId(id ?? undefined);
      })
      .catch(() => {
        if (!cancelled) setPlanSummaryId(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerUid, personId, isCarer]);

  if (uid === undefined) {
    return (
      <div className="site-shell patient-page">
        <section className="page-section stack">
          <SkeletonRow count={4} />
        </section>
      </div>
    );
  }

  if (uid === null || !ownerUid || !personId) return null;

  return (
    <div className="site-shell patient-page">
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Exercises</span>
          <h1>{isCarer ? `${target?.name}'s rehab plan.` : "Your rehab plan."}</h1>
          <p className="muted">
            {isCarer
              ? "The exercises their physio assigned. Tick each one off as it's done today."
              : "The exercises assigned to you. Tick each one off as you complete it today."}
          </p>
        </div>
      </section>

      <section
        className="page-section"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-2)",
        }}
      >
        <PersonSwitcher
          uid={uid}
          displayName={displayName}
          label="Viewing exercises for:"
          caredFor={caredFor}
          onSelect={() => {
            // PersonSwitcher persists the selection via the shared
            // PersonProvider context; `personId` above already reads from it.
          }}
        />
        <PatientExercisePlanButton summaryId={planSummaryId} />
      </section>

      {isCarer && target ? (
        <section className="page-section">
          <CarerModeBanner name={target.name} />
        </section>
      ) : null}

      <section className="page-section">
        <AssignedExercises uid={ownerUid} personId={personId} allowMotionCheck={!isCarer} />
      </section>

      <PatientSelfTests uid={ownerUid} personId={personId} />
    </div>
  );
}
