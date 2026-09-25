"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  FileText,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { AdminShell } from "@/components/admin-shell";
import { AdminBookingsTable } from "@/components/admin-bookings-table";
import { AdminEnquiriesTable } from "@/components/admin-enquiries-table";
import { AdminLiveStats } from "@/components/admin-live-stats";

type Tab = "bookings" | "enquiries" | "stats";

type QuickAction = {
  href: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

const QUICK_ACTIONS: QuickAction[] = [
  { href: "/admin/sessions", label: "Sessions", detail: "Today and upcoming", icon: CalendarDays },
  { href: "/admin/patients", label: "Patients", detail: "Records and assessments", icon: Users },
  { href: "/admin/recovery", label: "Recovery tools", detail: "Exercises and motion", icon: Activity },
  { href: "/admin/invoices", label: "Invoices", detail: "Billing documents", icon: FileText },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [newEnquiries, setNewEnquiries] = useState(0);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "enquiries"), where("status", "==", "new"));
    return onSnapshot(q, (s) => setNewEnquiries(s.size));
  }, []);

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: "bookings", label: "Bookings", icon: CalendarCheck2 },
    { key: "enquiries", label: "Enquiries", icon: MessageSquare },
    { key: "stats", label: "Live stats", icon: BarChart3 },
  ];

  function handleTabKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const currentIndex = tabs.findIndex((t) => t.key === activeTab);
    const nextIndex = e.key === "ArrowRight"
      ? (currentIndex + 1) % tabs.length
      : (currentIndex - 1 + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.key);
    document.getElementById(`admin-tab-${nextTab.key}`)?.focus();
  }

  return (
    <AdminShell>
      <span className="sr-only" role="status" aria-live="polite">
        {newEnquiries > 0 ? `${newEnquiries} new enquir${newEnquiries === 1 ? "y" : "ies"}` : ""}
      </span>

      <main className="admin-dashboard-main" id="main-content">
        <section className="admin-dashboard-hero" aria-labelledby="admin-dashboard-title">
          <div className="admin-dashboard-hero-copy">
            <span className="admin-dashboard-kicker">Practice overview</span>
            <h1 id="admin-dashboard-title">Your clinical workspace</h1>
            <p>Review today&apos;s work, respond to patients and keep care moving.</p>
          </div>
          <div className="admin-dashboard-hero-actions">
            <Link href="/admin/sessions" className="button admin-hero-primary">
              <CalendarDays aria-hidden="true" />
              Upcoming sessions
            </Link>
            <Link href="/admin/patients" className="button admin-hero-secondary">
              <Users aria-hidden="true" />
              Patient records
            </Link>
          </div>
          <div className="admin-dashboard-live-state">
            <span aria-hidden="true" />
            Live practice data
          </div>
        </section>

        <nav className="admin-quick-actions" aria-label="Admin shortcuts">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="admin-quick-action">
                <span className="admin-quick-action-icon"><Icon aria-hidden="true" /></span>
                <span className="admin-quick-action-copy">
                  <strong>{action.label}</strong>
                  <small>{action.detail}</small>
                </span>
                <ArrowRight className="admin-quick-action-arrow" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>

        <section className="admin-dashboard-workspace" aria-labelledby="admin-activity-title">
          <div className="admin-dashboard-workspace-head">
            <div>
              <span className="dashboard-eyebrow">Operations</span>
              <h2 id="admin-activity-title">Practice activity</h2>
            </div>
            {newEnquiries > 0 && (
              <button type="button" className="admin-attention-button" onClick={() => setActiveTab("enquiries")}>
                <span aria-hidden="true" />
                {newEnquiries} new enquir{newEnquiries === 1 ? "y" : "ies"}
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Admin dashboard sections"
            onKeyDown={handleTabKeyDown}
            className="admin-dashboard-tabs"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`admin-tab-${tab.key}`}
                  role="tab"
                  aria-selected={active}
                  aria-controls={`admin-tabpanel-${tab.key}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setActiveTab(tab.key)}
                  className={`admin-tab-button${active ? " is-active" : ""}`}
                >
                  <Icon aria-hidden="true" />
                  <span>{tab.label}</span>
                  {tab.key === "enquiries" && newEnquiries > 0 && (
                    <span className="admin-tab-count" aria-label={`${newEnquiries} new`}>{newEnquiries}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="admin-dashboard-panel">
            <div id="admin-tabpanel-bookings" role="tabpanel" aria-labelledby="admin-tab-bookings" hidden={activeTab !== "bookings"}>
              {activeTab === "bookings" && <AdminBookingsTable />}
            </div>
            <div id="admin-tabpanel-enquiries" role="tabpanel" aria-labelledby="admin-tab-enquiries" hidden={activeTab !== "enquiries"}>
              {activeTab === "enquiries" && <AdminEnquiriesTable />}
            </div>
            <div id="admin-tabpanel-stats" role="tabpanel" aria-labelledby="admin-tab-stats" hidden={activeTab !== "stats"}>
              {activeTab === "stats" && <AdminLiveStats />}
            </div>
          </div>
        </section>
      </main>
    </AdminShell>
  );
}
