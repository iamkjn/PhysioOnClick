"use client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";

type Counts = {
  blogs: number;
  bookings: number;
  pendingBookings: number;
  upcomingBookings: number;
  enquiries: number;
  newEnquiries: number;
  revenue: number;
  blogs108: number;
  pricingProducts: number;
  testimonials: number;
};

const DEFAULT: Counts = { blogs: 0, bookings: 0, pendingBookings: 0, upcomingBookings: 0, enquiries: 0, newEnquiries: 0, revenue: 520, blogs108: 108, pricingProducts: 4, testimonials: 3 };

export function AdminLiveStats() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [counts, setCounts] = useState<Counts>(DEFAULT);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => setIsSignedIn(!!user));
  }, []);

  useEffect(() => {
    if (!isSignedIn || !db) return;
    const unsubs: Array<() => void> = [];

    // Blogs total
    unsubs.push(onSnapshot(collection(db, "blogs"), (s) => setCounts((c) => ({ ...c, blogs: s.size }))));

    // Bookings: total + pending + upcoming
    unsubs.push(onSnapshot(collection(db, "bookings"), (s) => {
      const pending  = s.docs.filter((d) => d.data().status === "pending").length;
      const upcoming = s.docs.filter((d) => d.data().status === "upcoming").length;
      setCounts((c) => ({ ...c, bookings: s.size, pendingBookings: pending, upcomingBookings: upcoming }));
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

  const bigNum: React.CSSProperties = {
    fontFamily: "var(--font-serif)",
    fontSize: 48,
    color: "var(--color-navy)",
    lineHeight: 1,
    margin: 0,
  };

  const eyebrow: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--color-text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontFamily: "var(--font-sans)",
  };

  const muted: React.CSSProperties = {
    fontSize: 12,
    color: "var(--color-text-secondary)",
    fontFamily: "var(--font-sans)",
  };

  const pill = (label: string, bg: string, color: string) => (
    <span style={{ background: bg, color, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-sans)" }}>{label}</span>
  );

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <span style={eyebrow}>Live Stats</span>
        <h2 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Dashboard overview</h2>
      </div>

      {/* Primary 2×2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>

        {/* Blogs */}
        <div style={cardStyle}>
          <span style={eyebrow}>Blogs</span>
          <p style={bigNum}>{counts.blogs}</p>
          <span style={muted}>Live count from Firestore</span>
        </div>

        {/* Bookings */}
        <div style={cardStyle}>
          <span style={eyebrow}>Bookings</span>
          <p style={bigNum}>{counts.bookings}</p>
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" as const }}>
            {counts.pendingBookings > 0 && pill(`${counts.pendingBookings} pending`, "var(--color-gold-light)", "var(--color-gold)")}
            {counts.upcomingBookings > 0 && pill(`${counts.upcomingBookings} upcoming`, "var(--color-teal-light)", "var(--color-teal)")}
          </div>
        </div>

        {/* Enquiries */}
        <div style={cardStyle}>
          <span style={eyebrow}>Enquiries</span>
          <p style={bigNum}>{counts.enquiries}</p>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {counts.newEnquiries > 0 && pill(`${counts.newEnquiries} new`, "var(--color-gold-light)", "var(--color-gold)")}
          </div>
        </div>

        {/* Revenue */}
        <div style={cardStyle}>
          <span style={eyebrow}>Projected revenue</span>
          <p style={bigNum}>£{counts.revenue.toLocaleString()}</p>
          <span style={muted}>Sample from package sales</span>
        </div>
      </div>

      {/* Secondary info row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
        {[
          { label: "Blog articles", value: counts.blogs108, note: "Ready-to-publish SEO content" },
          { label: "Pricing products", value: counts.pricingProducts, note: "Stripe checkout mapped" },
          { label: "Testimonials", value: counts.testimonials, note: "Homepage + local pages" },
        ].map((item) => (
          <div key={item.label} style={{ ...cardStyle, padding: "1rem", gap: "0.25rem" }}>
            <span style={{ ...eyebrow, fontSize: 10 }}>{item.label}</span>
            <strong style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--color-navy)" }}>{item.value}</strong>
            <span style={{ ...muted, fontSize: 11 }}>{item.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
