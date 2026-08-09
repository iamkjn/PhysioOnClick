"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "firebase/auth";

import { PersonSwitcher } from "@/components/person-switcher";
import { RecoveryPercentCard } from "@/components/recovery-percent-card";
import { PatientDashboard } from "@/components/patient-dashboard";
import { usePerson } from "@/components/person-provider";
import { getAssignedExercises } from "@/lib/recovery";
import { getPatientBookings } from "@/lib/patient-bookings";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const SECONDARY_ACTIONS = [
  {
    href: "/patient/appointments",
    label: "My appointments",
    hint: "Upcoming and past sessions",
    icon: (
      <path d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
    ),
  },
  {
    href: "/patient/recovery",
    label: "My recovery",
    hint: "Full pain and exercise trends",
    icon: <path d="M4 15l4-5 4 3 6-8M4 20h16" />,
  },
  {
    href: "/patient/exercises",
    label: "My exercises",
    hint: "Your assigned rehab plan",
    icon: <path d="M6.5 6.5 9 9M15 15l2.5 2.5M4 8v8M8 4v16M16 4v16M20 8v8M8 12h8" />,
  },
  {
    href: "/patient/people",
    label: "My people",
    hint: "Family members you manage",
    icon: (
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0-1.5-5.6M16 20a6 6 0 0 0-1-3.3" />
    ),
  },
  {
    href: "/patient/invoices",
    label: "Invoices & payments",
    hint: "Receipts for you and your people",
    icon: (
      <>
        <path d="M6 3h9l3 3v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
  },
];

export function HomeDashboard({ user }: { user: User }) {
  const router = useRouter();
  const displayName = user.displayName || user.email || "Patient";
  const firstName = displayName.split(" ")[0];
  // The active person is shared (and persisted) via PersonProvider so it
  // carries over to /book, /patient/recovery, and /patient/appointments.
  const personCtx = usePerson();
  const personId = personCtx?.personId ?? user.uid;
  const personName = personCtx?.personId ? personCtx.personName : displayName;
  const viewingOther = personId !== user.uid;

  // Recovery-tracking UI ("Your recovery at a glance", "My recovery", "My
  // exercises") only means anything once a physio has assessed the patient
  // and assigned a recovery plan — before that every chart is empty/zeroed,
  // which reads as broken rather than "nothing yet". Gate all three on having
  // at least one active assigned exercise for the person in view.
  const [hasRecoveryPlan, setHasRecoveryPlan] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getAssignedExercises(user.uid, personId)
      .then((exercises) => {
        if (!cancelled) setHasRecoveryPlan(exercises.length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasRecoveryPlan(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.uid, personId]);

  // "Invoices & payments" has nothing to show until the first appointment is
  // booked (paid or not — an invoice only exists once a booking does), so
  // it's hidden rather than linking to a permanently empty list.
  const [hasBooked, setHasBooked] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getPatientBookings(user.uid, personId)
      .then((bookings) => {
        if (!cancelled) setHasBooked(bookings.length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasBooked(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.uid, personId]);

  return (
    <section className="home-dashboard">
      <div className="home-dashboard-glow" aria-hidden />
      <div className="site-shell home-dashboard-inner home-dashboard-rise">
        <header className="home-dashboard-header">
          <div className="home-dashboard-greeting">
            <span className="eyebrow">Welcome back</span>
            <h2>
              {greeting()}, {firstName}
            </h2>
            <p>
              {viewingOther
                ? `Following ${personName}'s recovery.`
                : "Here's how your recovery is tracking today."}
            </p>
          </div>
          <PersonSwitcher
            uid={user.uid}
            displayName={displayName}
            alwaysShow
            onAddPerson={() => router.push("/patient/people")}
            onSelect={() => {
              // PersonSwitcher persists the selection via the shared
              // PersonProvider context; personId/personName above already
              // read from it, so there's no local state to update here.
            }}
          />
        </header>

        <div className={hasRecoveryPlan ? "home-dashboard-grid" : "home-dashboard-grid home-dashboard-grid--full"}>
          {/* The recovery ring is meaningless (and always empty) before a
              physio has assigned a plan, so it's dropped entirely rather than
              shown blank — the quick-links nav below expands to fill the
              width it would have used (--full) instead of leaving it bare. */}
          {hasRecoveryPlan ? <RecoveryPercentCard uid={user.uid} personId={personId} /> : null}

          {/* "Book a session" intentionally omitted — the header's persistent
              "Book Now" button already covers booking, so repeating it here was
              redundant. */}
          <nav className="home-dashboard-actions" aria-label="Quick links">
            {SECONDARY_ACTIONS.filter((action) => {
              if (!hasRecoveryPlan && (action.href === "/patient/recovery" || action.href === "/patient/exercises")) {
                return false;
              }
              if (!hasBooked && action.href === "/patient/invoices") return false;
              return true;
            }).map((action) => (
              <Link key={action.href} className="home-action" href={action.href} prefetch>
                <span className="home-action-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {action.icon}
                  </svg>
                </span>
                <span className="home-action-text">
                  <strong>{action.label}</strong>
                  <small>{action.hint}</small>
                </span>
                <span className="home-action-arrow" aria-hidden>→</span>
              </Link>
            ))}
          </nav>
        </div>

        {hasRecoveryPlan ? (
          <div className="home-dashboard-charts">
            <h3 className="home-dashboard-charts-title">Your recovery at a glance</h3>
            <PatientDashboard uid={user.uid} personId={personId} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
