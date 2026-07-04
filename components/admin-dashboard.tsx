"use client";
import { signOut, getAuth } from "firebase/auth";
import { useState } from "react";

type Tab = "bookings" | "enquiries" | "stats";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const user = getAuth().currentUser;

  async function handleSignOut() {
    await signOut(getAuth());
    window.location.reload();
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "bookings", label: "Bookings" },
    { key: "enquiries", label: "Enquiries" },
    { key: "stats", label: "Live Stats" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Sticky header */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--color-navy)", height: 56, display: "flex", alignItems: "center", padding: "0 1.5rem", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--color-teal)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "var(--font-serif)" }}>P</div>
          <span style={{ color: "#fff", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15 }}>PhysioOnClick</span>
          <span style={{ border: "1px solid var(--color-gold)", color: "var(--color-gold)", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-sans)", letterSpacing: "0.04em" }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "var(--font-sans)" }}>{user?.email}</span>
          <button onClick={handleSignOut} style={{ background: "none", border: "none", color: "var(--color-teal)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Sign out</button>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", padding: "0 1.5rem", display: "flex" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid var(--color-teal)" : "2px solid transparent",
              color: activeTab === tab.key ? "var(--color-navy)" : "var(--color-text-secondary)",
              fontFamily: "var(--font-sans)",
              fontWeight: activeTab === tab.key ? 700 : 400,
              fontSize: 14,
              padding: "0.875rem 1.25rem",
              cursor: "pointer",
              transition: "color 0.15s",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — placeholder divs replaced in Tasks 2–5 */}
      <main style={{ maxWidth: 1340, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {activeTab === "bookings" && <div style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Bookings table loading…</div>}
        {activeTab === "enquiries" && <div style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Enquiries table loading…</div>}
        {activeTab === "stats" && <div style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Stats loading…</div>}
      </main>
    </div>
  );
}
