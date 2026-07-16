"use client";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { AdminBookingsTable } from "@/components/admin-bookings-table";
import { AdminEnquiriesTable } from "@/components/admin-enquiries-table";
import { AdminLiveStats } from "@/components/admin-live-stats";

type Tab = "bookings" | "enquiries" | "stats";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [newEnquiries, setNewEnquiries] = useState(0);
  const user = auth?.currentUser;

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "enquiries"), where("status", "==", "new"));
    return onSnapshot(q, (s) => setNewEnquiries(s.size));
  }, []);

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
    window.location.reload();
  }

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
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Sticky header */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--color-navy)", height: 56, display: "flex", alignItems: "center", padding: "0 1.5rem", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 16, fontFamily: "var(--font-serif)" }}>P</div>
          <h1 style={{ margin: 0, color: "white", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15 }}>PhysioOnClick</h1>
          <span style={{ border: "1px solid var(--color-gold)", color: "var(--color-gold)", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-sans)", letterSpacing: "0.04em" }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "var(--font-sans)" }}>{user?.email}</span>
          <button
            onClick={handleSignOut}
            style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", minHeight: 44, padding: "0 0.25rem" }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Live region for the enquiries badge above — announces new enquiries
          without re-announcing the whole tablist on every render. */}
      <span className="sr-only" role="status" aria-live="polite">
        {newEnquiries > 0 ? `${newEnquiries} new enquir${newEnquiries === 1 ? "y" : "ies"}` : ""}
      </span>

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Admin dashboard sections"
        onKeyDown={handleTabKeyDown}
        style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", padding: "0 1.5rem", display: "flex" }}
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
    </div>
  );
}
