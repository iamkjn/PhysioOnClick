"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PersonSwitcher } from "@/components/person-switcher";
import { usePerson } from "@/components/person-provider";
import { PatientAssessmentForm, PatientAssessmentHistory } from "@/components/patient-assessment-form";
import { SkeletonRow } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast-provider";
import { getPatientBookings } from "@/lib/patient-bookings";
import { selectTargetBooking, type GateBooking } from "@/lib/assessment-gate";

function AssessmentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingParam = searchParams.get("booking") ?? undefined;
  const personCtx = usePerson();
  const toast = useToast();
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [target, setTarget] = useState<GateBooking | null | undefined>(undefined);

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

  const personId = personCtx?.personId ?? uid ?? undefined;

  useEffect(() => {
    if (!uid || !personId) return;
    let cancelled = false;
    setTarget(undefined);
    getPatientBookings(uid, personId)
      .then((bookings) => {
        if (cancelled) return;
        const list: GateBooking[] = bookings.map((b) => ({
          id: b.id,
          sessionDate: b.sessionDate,
          assessmentCompletedAt: b.assessmentCompletedAt,
          paid: b.paid,
          status: b.status,
        }));
        setTarget(selectTargetBooking(list, bookingParam));
      })
      .catch(() => {
        if (!cancelled) setTarget(null);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, personId, bookingParam, reloadKey]);

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

  const personName = personCtx?.personName || displayName;

  async function handleSubmitted(formId: string) {
    setReloadKey((key) => key + 1);
    if (!target || !auth?.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch("/api/patient/assessment/link", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: target.id, assessmentFormId: formId }),
      });
      if (!res.ok) throw new Error("link failed");
    } catch {
      toast.show("Assessment submitted, but we couldn't link it to your booking.", "error");
    }
  }

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

      {target === undefined ? (
        <section className="page-section stack">
          <SkeletonRow count={3} />
        </section>
      ) : target === null ? (
        <section className="page-section">
          <EmptyState
            illustration="calendar"
            title="Book a session first"
            body="Your assessment unlocks once you have an upcoming appointment. It only takes a few minutes and helps us make the most of your session."
            cta={{ label: "Book a session", href: "/book" }}
          />
        </section>
      ) : (
        <section className="page-section assessment-page-grid">
          <PatientAssessmentForm
            uid={uid}
            personId={personId as string}
            displayName={displayName}
            personName={personName}
            bookingId={target.id}
            onSubmitted={handleSubmitted}
          />
          <PatientAssessmentHistory uid={uid} personId={personId as string} reloadKey={reloadKey} />
        </section>
      )}
    </div>
  );
}

export default function PatientAssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="site-shell patient-page">
          <section className="page-section stack">
            <SkeletonRow count={3} />
          </section>
        </div>
      }
    >
      <AssessmentPageInner />
    </Suspense>
  );
}
