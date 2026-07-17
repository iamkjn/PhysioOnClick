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
      <div
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div
          role="tablist"
          aria-label="Admin dashboard sections"
          onKeyDown={handleTabKeyDown}
          style={{ display: "flex" }}
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
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid var(--color-primary)" : "2px solid transparent",
                color: activeTab === tab.key ? "var(--color-navy)" : "var(--color-text-secondary)",
                fontFamily: "var(--font-sans)",
                fontWeight: activeTab === tab.key ? 700 : 400,
                fontSize: 14,
                padding: "0.875rem 1.25rem",
                minHeight: 46,
                cursor: "pointer",
                transition: "color 0.15s",
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Link
          href="/admin/patients"
          style={{
            color: "var(--primary)",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
            padding: "0.875rem 0.25rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            minHeight: 46,
          }}
        >
          Patients <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Tab content */}
      <main style={{ maxWidth: 1340, margin: "0 auto", padding: "2rem 1.5rem" }}>
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
