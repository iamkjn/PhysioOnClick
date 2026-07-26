"use client";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { AdminShell } from "@/components/admin-shell";
import { AdminBookingsTable } from "@/components/admin-bookings-table";
import { AdminEnquiriesTable } from "@/components/admin-enquiries-table";
import { AdminLiveStats } from "@/components/admin-live-stats";

type Tab = "bookings" | "enquiries" | "stats";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [newEnquiries, setNewEnquiries] = useState(0);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "enquiries"), where("status", "==", "new"));
    return onSnapshot(q, (s) => setNewEnquiries(s.size));
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "bookings", label: "Bookings" },
    { key: "enquiries", label: newEnquiries > 0 ? `Enquiries (${newEnquiries})` : "Enquiries" },
    { key: "stats", label: "Live Stats" },
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
      {/* Live region for the enquiries badge above — announces new enquiries
          without re-announcing the whole tablist on every render. */}
      <span className="sr-only" role="status" aria-live="polite">
        {newEnquiries > 0 ? `${newEnquiries} new enquir${newEnquiries === 1 ? "y" : "ies"}` : ""}
      </span>

      {/* Tab bar, plus a "Patients" link to the new /admin/patients list.
          Kept outside the role="tablist" div below so it's ordinary
          navigation rather than a fourth (fake) tab — it doesn't participate
          in handleTabKeyDown's arrow-key cycling. */}
      <div className="admin-dashboard-nav">
        <div
          role="tablist"
          aria-label="Admin dashboard sections"
          onKeyDown={handleTabKeyDown}
          className="admin-dashboard-tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              id={`admin-tab-${tab.key}`}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`admin-tabpanel-${tab.key}`}
              tabIndex={activeTab === tab.key ? 0 : -1}
              onClick={() => setActiveTab(tab.key)}
              className={`admin-tab-button${activeTab === tab.key ? " is-active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="admin-dashboard-links">
          {/* Exercises & motion → the per-patient rehab screen: assign exercises
              from the library, set motion-check targets, streak goals and
              follow-ups. Previously reachable only by typing the URL. */}
          <Link
            href="/admin/recovery"
            className="admin-dashboard-link"
          >
            Exercises &amp; motion <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/admin/patients"
            className="admin-dashboard-link"
          >
            Patients <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Tab content */}
      <main className="admin-dashboard-main">
        <div className="admin-dashboard-heading">
          <span className="dashboard-eyebrow">Admin</span>
          <h1>Dashboard</h1>
          <p>Manage bookings, enquiries, patient records and recovery tools from one workspace.</p>
        </div>
        <div id="admin-tabpanel-bookings" role="tabpanel" aria-labelledby="admin-tab-bookings" hidden={activeTab !== "bookings"}>
          {activeTab === "bookings" && <AdminBookingsTable />}
        </div>
        <div id="admin-tabpanel-enquiries" role="tabpanel" aria-labelledby="admin-tab-enquiries" hidden={activeTab !== "enquiries"}>
          {activeTab === "enquiries" && <AdminEnquiriesTable />}
        </div>
        <div id="admin-tabpanel-stats" role="tabpanel" aria-labelledby="admin-tab-stats" hidden={activeTab !== "stats"}>
          {activeTab === "stats" && <AdminLiveStats />}
        </div>
      </main>
    </AdminShell>
  );
}
