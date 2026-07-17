"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "firebase/auth";

import { PersonSwitcher } from "@/components/person-switcher";
import { RecoveryPercentCard } from "@/components/recovery-percent-card";
import { usePerson } from "@/components/person-provider";

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
    href: "/patient/people",
    label: "My people",
    hint: "Family members you manage",
    icon: (
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0-1.5-5.6M16 20a6 6 0 0 0-1-3.3" />
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

        <div className="home-dashboard-grid">
          <RecoveryPercentCard uid={user.uid} personId={personId} />

          <nav className="home-dashboard-actions" aria-label="Quick links">
            <Link className="home-action home-action-primary" href="/book" prefetch>
              <span className="home-action-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM12 12v4M10 14h4" />
                </svg>
              </span>
              <span className="home-action-text">
                <strong>Book a session</strong>
                <small>Find your next available slot</small>
              </span>
              <span className="home-action-arrow" aria-hidden>→</span>
            </Link>

            {SECONDARY_ACTIONS.map((action) => (
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
      </div>
    </section>
  );
}
