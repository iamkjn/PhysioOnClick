"use client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { SkeletonStatGrid } from "@/components/skeleton";
import { resolveStatus } from "@/components/admin-bookings-table";

type Counts = {
  blogs: number;
  bookings: number;
  completedBookings: number;
  upcomingBookings: number;
  enquiries: number;
  newEnquiries: number;
};

const DEFAULT: Counts = { blogs: 0, bookings: 0, completedBookings: 0, upcomingBookings: 0, enquiries: 0, newEnquiries: 0 };

export function AdminLiveStats() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [resolvedAuth, setResolvedAuth] = useState(false);
  const [counts, setCounts] = useState<Counts>(DEFAULT);

  useEffect(() => {
    if (!auth) {
      setResolvedAuth(true);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      setResolvedAuth(true);
      setIsSignedIn(!!user);
    });
  }, []);

  useEffect(() => {
    if (!isSignedIn || !db) return;
    const unsubs: Array<() => void> = [];

    // Blogs total
    unsubs.push(onSnapshot(collection(db, "blogs"), (s) => setCounts((c) => ({ ...c, blogs: s.size }))));

    // Bookings: total + completed + upcoming, resolved by appointment date
    // (same logic as the bookings table) rather than raw stored status.
    unsubs.push(onSnapshot(collection(db, "bookings"), (s) => {
      let completed = 0;
      let upcoming = 0;
      s.docs.forEach((d) => {
        const data = d.data();
        const status = resolveStatus(String(data.status || "pending"), String(data.appointmentDate || ""), String(data.appointmentTime || ""));
        if (status === "completed") completed++;
        else if (status === "upcoming") upcoming++;
      });
      setCounts((c) => ({ ...c, bookings: s.size, completedBookings: completed, upcomingBookings: upcoming }));
    }));

    // Enquiries: total
    unsubs.push(onSnapshot(collection(db, "enquiries"), (s) => setCounts((c) => ({ ...c, enquiries: s.size }))));

    // New enquiries
    unsubs.push(onSnapshot(query(collection(db, "enquiries"), where("status", "==", "new")), (s) => setCounts((c) => ({ ...c, newEnquiries: s.size }))));

    return () => unsubs.forEach((u) => u());
  }, [isSignedIn]);

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 20,
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  };

  // Bookings is the primary, revenue-adjacent metric admins act on first —
  // give it an accent treatment so the 3-card row isn't uniform weight.
  const primaryCardStyle: React.CSSProperties = {
    ...cardStyle,
    background: "var(--gradient-rail)",
    border: "1px solid var(--color-primary-dark)",
  };

  // Stat numbers are data, not headings — --font-sans per the design system
  // (Fraunces is reserved for section titles like "Dashboard overview" below).
  const bigNum: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontWeight: 800,
    fontSize: 48,
    color: "var(--color-navy)",
    lineHeight: 1,
    margin: 0,
  };

  const primaryBigNum: React.CSSProperties = {
    ...bigNum,
    color: "white",
  };

  const eyebrow: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--color-text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontFamily: "var(--font-sans)",
  };

  const primaryEyebrow: React.CSSProperties = {
    ...eyebrow,
    color: "var(--book-muted-caps)",
  };

  const muted: React.CSSProperties = {
    fontSize: 12,
    color: "var(--color-text-secondary)",
    fontFamily: "var(--font-sans)",
  };

  const pill = (label: string, bg: string, color: string) => (
    <span style={{ background: bg, color, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-sans)" }}>{label}</span>
  );

  if (!resolvedAuth) {
    return (
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={eyebrow}>Live Stats</span>
          <h2 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Dashboard overview</h2>
        </div>
        <SkeletonStatGrid count={3} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <span style={eyebrow}>Live Stats</span>
        <h2 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Dashboard overview</h2>
      </div>

      {/* Primary stat row — Bookings gets accent treatment as the metric admins act on first */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>

        {/* Bookings */}
        <div style={primaryCardStyle}>
          <span style={primaryEyebrow}>Bookings</span>
          <p style={primaryBigNum} aria-live="polite">{counts.bookings}</p>
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" as const }}>
            {counts.completedBookings > 0 && pill(`${counts.completedBookings} completed`, "rgba(255,255,255,0.18)", "white")}
            {counts.upcomingBookings > 0 && pill(`${counts.upcomingBookings} upcoming`, "rgba(255,255,255,0.18)", "white")}
          </div>
        </div>

        {/* Blogs */}
        <div style={cardStyle}>
          <span style={eyebrow}>Blogs</span>
          <p style={bigNum} aria-live="polite">{counts.blogs}</p>
          <span style={muted}>Live count from Firestore</span>
        </div>

        {/* Enquiries */}
        <div style={cardStyle}>
          <span style={eyebrow}>Enquiries</span>
          <p style={bigNum} aria-live="polite">{counts.enquiries}</p>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {counts.newEnquiries > 0 && pill(`${counts.newEnquiries} new`, "var(--color-gold-light)", "var(--color-gold)")}
          </div>
        </div>
      </div>
    </div>
  );
}
