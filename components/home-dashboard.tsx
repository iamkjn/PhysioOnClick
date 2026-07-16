"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "firebase/auth";

import { PersonSwitcher } from "@/components/person-switcher";
import { RecoveryPercentCard } from "@/components/recovery-percent-card";

export function HomeDashboard({ user }: { user: User }) {
  const router = useRouter();
  const displayName = user.displayName || user.email || "Patient";
  const [personId, setPersonId] = useState(user.uid);
  const [personName, setPersonName] = useState(displayName);

  return (
    <section className="home-dashboard">
      <div className="site-shell">
        <div className="home-dashboard-header">
          <div>
            <span className="eyebrow">Welcome back</span>
            <h2>{displayName.split(" ")[0]}&apos;s recovery</h2>
            <p className="muted">Viewing recovery for {personName}</p>
          </div>
          <PersonSwitcher
            uid={user.uid}
            displayName={displayName}
            alwaysShow
            onAddPerson={() => router.push("/patient/people")}
            onSelect={(id, name) => {
              setPersonId(id);
              setPersonName(name);
            }}
          />
        </div>
        <div className="home-dashboard-grid">
          <RecoveryPercentCard uid={user.uid} personId={personId} />
          <div className="panel home-dashboard-links">
            <h3>Quick links</h3>
            <div className="home-dashboard-links-row">
              <Link className="button primary" href="/book" prefetch>
                Book a Session
              </Link>
              <Link className="button secondary" href="/patient/people" prefetch>
                My People
              </Link>
              <Link className="button secondary" href="/patient/appointments" prefetch>
                My Appointments
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
