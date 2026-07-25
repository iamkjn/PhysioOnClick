"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PersonSwitcher } from "@/components/person-switcher";
import { AssignedExercises } from "@/components/assigned-exercises";
import { SkeletonRow } from "@/components/skeleton";

export default function ExercisesPage() {
  // undefined = auth still resolving, null = signed out, string = signed in.
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState("");
  const [personId, setPersonId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setUid(null);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setPersonId(user.uid);
        setDisplayName(user.displayName || user.email || "Patient");
      } else {
        setUid(null);
        setPersonId(null);
      }
    });
  }, []);

  useEffect(() => {
    if (uid === null) router.push("/patient");
  }, [uid, router]);

  if (uid === undefined) {
    return (
      <div className="site-shell patient-page">
        <section className="page-section stack">
          <SkeletonRow count={4} />
        </section>
      </div>
    );
  }

  if (uid === null || !personId) return null;

  return (
    <div className="site-shell patient-page">
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Exercises</span>
          <h1>Your rehab plan.</h1>
          <p className="muted">The exercises assigned to you. Tick each one off as you complete it today.</p>
        </div>
      </section>

      <section className="page-section stack" style={{ gap: "var(--space-2)" }}>
        <PersonSwitcher
          uid={uid}
          displayName={displayName}
          onSelect={(id) => setPersonId(id)}
        />
      </section>

      <section className="page-section">
        <AssignedExercises uid={uid} personId={personId} />
      </section>
    </div>
  );
}
