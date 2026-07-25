"use client";

import Link from "next/link";
import { AdherenceBar } from "@/components/adherence-bar";
import { RecoveryChart } from "@/components/recovery-chart";
import { StreakCard } from "@/components/streak-card";

interface Props {
  uid: string;
  personId: string;
}

// A chart card plus a caption link that deep-links into the full recovery
// page. Kept as one unit so every card has a consistent "see more" affordance,
// and so the link target (always the recovery page) lives in one place.
function DashboardCard({ children, caption, href }: { children: React.ReactNode; caption: string; href: string }) {
  return (
    <div className="dashboard-card-with-link">
      {children}
      <Link href={href} className="dashboard-card-link">
        {caption} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

// The signed-in patient's home dashboard, styled after the mobile app's home
// tab: at-a-glance pain trend, weekly adherence and daily streak, each linking
// through to the full recovery view.
export function PatientDashboard({ uid, personId }: Props) {
  return (
    <div className="patient-dashboard-grid">
      <DashboardCard caption="My pain recovery" href="/patient/recovery">
        <div className="panel stack" style={{ gap: "var(--space-3)" }}>
          <h3 style={{ margin: 0 }}>Pain score</h3>
          <RecoveryChart uid={uid} personId={personId} />
        </div>
      </DashboardCard>

      <DashboardCard caption="My adherence" href="/patient/recovery">
        <AdherenceBar uid={uid} personId={personId} />
      </DashboardCard>

      <DashboardCard caption="My daily streak" href="/patient/recovery">
        <StreakCard uid={uid} personId={personId} />
      </DashboardCard>
    </div>
  );
}
