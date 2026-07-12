# Admin Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the open admin page with a hard-gated, tabbed admin dashboard matching the teal/navy/gold design system, fixing the sign-in redirect bug and stale appointment status display.

**Architecture:** An `AdminAuthGate` client component wraps the entire admin page — it subscribes to Firebase Auth and renders either `AdminSignIn` (full-screen navy card) or `AdminDashboard` (sticky header + three tabs). All three tab components (`AdminBookingsTable`, `AdminEnquiriesTable`, `AdminLiveStats`) are converted from server components to client components reading from Firestore using the user's admin JWT. Server actions (`cancelCalBooking`, `publishSummary`) remain in `app/admin/actions.ts` and are called from client components.

**Tech Stack:** Next.js 15 App Router, React 19, Firebase Auth + Firestore client SDK, existing CSS design tokens in `app/globals.css`.

## Global Constraints

- All colours via CSS variables: `var(--color-navy)`, `var(--color-teal)`, `var(--color-teal-light)`, `var(--color-gold)`, `var(--color-gold-light)`, `var(--color-border)`, `var(--color-surface)`, `var(--color-bg)`, `var(--color-text-secondary)`, `var(--color-error)`, `var(--color-error-dark)`, `var(--color-gold-dark)`. No hardcoded hex in inline styles.
- Typography: `fontFamily: "var(--font-serif)"` for headings, `fontFamily: "var(--font-sans)"` for all UI text.
- Status badge colours exactly: pending=gold-light/gold, upcoming=teal-light/teal, completed=#D1FAE5/#059669, cancelled=#FEE2E2/error.
- `npm run lint` and `npm run build` must pass after each task.
- Firebase client SDK import: `import { db, auth } from "@/lib/firebase"`.
- Server actions import: `import { cancelCalBooking, publishSummary, type PublishSummaryInput } from "@/app/admin/actions"`.

---

### Task 1: Auth Gate + Sign-in Card + Dashboard Shell

**Files:**
- Create: `components/admin-auth-gate.tsx`
- Create: `components/admin-sign-in.tsx`
- Create: `components/admin-dashboard.tsx`
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Produces:
  - `AdminAuthGate` — `() => JSX.Element` — top-level client component; renders `AdminSignIn` or `AdminDashboard`
  - `AdminSignIn` — `() => JSX.Element` — full-screen navy sign-in card
  - `AdminDashboard` — `() => JSX.Element` — sticky header + three tabs; each tab body is an empty `<div>` placeholder until Tasks 2–5 wire in real content

- [ ] **Step 1: Create `components/admin-auth-gate.tsx`**

```tsx
"use client";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { AdminSignIn } from "@/components/admin-sign-in";
import { AdminDashboard } from "@/components/admin-dashboard";

export function AdminAuthGate() {
  const [status, setStatus] = useState<"loading" | "out" | "in">("loading");

  useEffect(() => {
    if (!auth) { setStatus("out"); return; }
    return onAuthStateChanged(auth, (user) => setStatus(user ? "in" : "out"));
  }, []);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-navy)" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.15)", borderTopColor: "var(--color-teal)", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "out") return <AdminSignIn />;
  return <AdminDashboard />;
}
```

- [ ] **Step 2: Create `components/admin-sign-in.tsx`**

```tsx
"use client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FormEvent, useState } from "react";
import { auth } from "@/lib/firebase";

export function AdminSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth!, email, password);
      window.location.reload();
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    border: "1.5px solid var(--color-border)",
    borderRadius: 10,
    padding: "0.75rem 1rem",
    fontSize: 14,
    fontFamily: "var(--font-sans)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    color: "var(--color-navy)",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-navy)", padding: "1rem" }}>
      <div style={{ background: "var(--color-surface)", borderRadius: 20, padding: "2.5rem 2rem", width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}>
        {/* Logo + title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--color-teal)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 22, fontFamily: "var(--font-serif)" }}>P</div>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--color-navy)", lineHeight: 1.1 }}>Admin Portal</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>PhysioOnClick</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: "1.5rem", fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
          Sign in to access bookings, enquiries and patient data.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          {error && <p style={{ color: "var(--color-error)", fontSize: 13, margin: 0, fontFamily: "var(--font-sans)" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ background: "var(--color-teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.875rem", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-sans)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "0.25rem" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/admin-dashboard.tsx`**

```tsx
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
```

- [ ] **Step 4: Replace `app/admin/page.tsx` with auth gate only**

```tsx
import type { Metadata } from "next";
import { AdminAuthGate } from "@/components/admin-auth-gate";

export const metadata: Metadata = {
  title: "Admin Dashboard | PhysioOnClick",
  description: "Admin dashboard for bookings, enquiries and patient data."
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminAuthGate />;
}
```

- [ ] **Step 5: Verify build**

```bash
npm run lint && npm run build
```

Expected: no errors. Then open `http://localhost:3000/admin` — should show the navy sign-in card. Sign in as `shivali@nayak.com` — should reload into the tabbed dashboard shell with placeholder tab text.

- [ ] **Step 6: Commit**

```bash
git add components/admin-auth-gate.tsx components/admin-sign-in.tsx components/admin-dashboard.tsx app/admin/page.tsx
git commit -m "feat(admin): hard auth gate — navy sign-in card + tabbed dashboard shell"
```

---

### Task 2: Bookings Table — Client Component + Status Resolution + Filter Chips

**Files:**
- Modify: `components/admin-bookings-table.tsx` (full rewrite — server → client)
- Modify: `components/admin-dashboard.tsx` (wire in real `AdminBookingsTable`)

**Interfaces:**
- Consumes: `AdminDashboard` from Task 1 (replaces placeholder `<div>` in bookings tab)
- Consumes: `cancelCalBooking` server action from `@/app/admin/actions`
- Consumes: `SummaryForm` from `@/components/summary-form` (unchanged at this stage)
- Produces: `AdminBookingsTable` — `() => JSX.Element` — client component with live Firestore subscription

- [ ] **Step 1: Rewrite `components/admin-bookings-table.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cancelCalBooking } from "@/app/admin/actions";
import { SummaryForm } from "@/components/summary-form";

type BookingRecord = {
  id: string;
  fullName: string;
  email: string;
  service: string;
  appointmentLabel: string;
  status: string;
  calBookingUid: string;
  patientName: string;
  patientId: string;
  patientType: string;
  summaryId?: string;
};

type StatusFilter = "all" | "pending" | "upcoming" | "completed" | "cancelled";

const FILTER_OPTIONS: StatusFilter[] = ["all", "pending", "upcoming", "completed", "cancelled"];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "var(--color-gold-light)",  color: "var(--color-gold)" },
  upcoming:  { bg: "var(--color-teal-light)",  color: "var(--color-teal)" },
  completed: { bg: "#D1FAE5",                  color: "#059669" },
  cancelled: { bg: "#FEE2E2",                  color: "var(--color-error)" },
};

function resolveStatus(stored: string, appointmentLabel: string): string {
  if (stored === "cancelled") return "cancelled";
  const date = new Date(appointmentLabel);
  if (isNaN(date.getTime())) return stored;
  return date < new Date() ? "completed" : "upcoming";
}

export function AdminBookingsTable() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(25));
    return onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          fullName:         String(d.fullName || d.name || ""),
          email:            String(d.email || ""),
          service:          String(d.service || ""),
          appointmentLabel: String(d.appointmentLabel || (d.appointmentDate && d.appointmentTime ? `${d.appointmentDate} ${d.appointmentTime}` : "TBC")),
          status:           String(d.status || "pending"),
          calBookingUid:    String(d.calBookingUid || ""),
          patientName:      String(d.patientName || d.fullName || d.name || "Patient"),
          patientId:        String(d.patientId || d.bookedBy || ""),
          patientType:      String(d.patientType || "self"),
          summaryId:        d.summaryId as string | undefined,
        };
      }));
      setLoading(false);
    });
  }, []);

  const resolved = bookings.map((b) => ({ ...b, displayStatus: resolveStatus(b.status, b.appointmentLabel) }));

  const counts: Record<StatusFilter, number> = {
    all:       resolved.length,
    pending:   resolved.filter((b) => b.displayStatus === "pending").length,
    upcoming:  resolved.filter((b) => b.displayStatus === "upcoming").length,
    completed: resolved.filter((b) => b.displayStatus === "completed").length,
    cancelled: resolved.filter((b) => b.displayStatus === "cancelled").length,
  };

  const displayed = filter === "all" ? resolved : resolved.filter((b) => b.displayStatus === filter);

  const th: React.CSSProperties = { color: "#fff", fontWeight: 600, fontSize: 12, padding: "0.625rem 0.75rem", textAlign: "left" as const, whiteSpace: "nowrap" as const, fontFamily: "var(--font-sans)" };
  const td: React.CSSProperties = { padding: "0.75rem", verticalAlign: "top" as const };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}>Bookings</span>
          <h2 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Latest appointment requests</h2>
        </div>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>{displayed.length} shown · sorted by newest</span>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" as const }}>
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? "var(--color-teal)" : "var(--color-surface)",
              color: filter === f ? "#fff" : "var(--color-text-secondary)",
              border: `1.5px solid ${filter === f ? "var(--color-teal)" : "var(--color-border)"}`,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{ background: filter === f ? "rgba(255,255,255,0.2)" : "var(--color-teal-light)", color: filter === f ? "#fff" : "var(--color-teal)", borderRadius: 999, padding: "1px 6px", fontSize: 11 }}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {loading && <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Loading bookings…</p>}

      {!loading && displayed.length === 0 && (
        <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", padding: "2rem 0" }}>No bookings match this filter.</p>
      )}

      {!loading && displayed.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--color-navy)" }}>
                <th style={th}>Patient</th>
                <th style={th}>Service</th>
                <th style={th}>Appointment</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
                <th style={th}>Summary</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((item, i) => {
                const s = STATUS_STYLES[item.displayStatus] ?? STATUS_STYLES.pending;
                const rowBg = i % 2 === 0 ? "var(--color-surface)" : "var(--color-teal-light)";
                return (
                  <tr key={item.id} style={{ background: rowBg, borderBottom: "1px solid var(--color-border)" }}>
                    <td style={td}>
                      <strong style={{ display: "block", color: "var(--color-navy)", fontFamily: "var(--font-sans)" }}>{item.fullName || item.patientName}</strong>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>{item.email}</span>
                    </td>
                    <td style={{ ...td, color: "var(--color-navy)", fontFamily: "var(--font-sans)" }}>{item.service}</td>
                    <td style={{ ...td, color: item.appointmentLabel === "TBC" ? "var(--color-text-secondary)" : "var(--color-navy)", fontStyle: item.appointmentLabel === "TBC" ? "italic" : "normal", fontFamily: "var(--font-sans)" }}>
                      {item.appointmentLabel}
                    </td>
                    <td style={td}>
                      <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans)" }}>
                        {item.displayStatus}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
                        {item.calBookingUid ? (
                          <>
                            <form action={cancelCalBooking.bind(null, item.calBookingUid)}>
                              <button
                                type="submit"
                                disabled={item.displayStatus === "cancelled"}
                                style={{ background: "none", border: "1.5px solid var(--color-error)", color: "var(--color-error)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: item.displayStatus === "cancelled" ? "not-allowed" : "pointer", opacity: item.displayStatus === "cancelled" ? 0.4 : 1, fontFamily: "var(--font-sans)" }}
                              >Cancel</button>
                            </form>
                            <a
                              href={`https://cal.com/reschedule/${item.calBookingUid}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ border: "1.5px solid var(--color-teal)", color: "var(--color-teal)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-block", fontFamily: "var(--font-sans)" }}
                            >Reschedule</a>
                          </>
                        ) : (
                          <span style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={td}>
                      {item.displayStatus === "completed" && !item.summaryId && item.patientId && (
                        <SummaryForm booking={{ id: item.id, patientId: item.patientId, patientType: item.patientType, patientName: item.patientName, service: item.service }} />
                      )}
                      {item.summaryId && (
                        <span style={{ fontSize: 12, color: "#059669", fontWeight: 600, fontFamily: "var(--font-sans)" }}>✓ Published</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire `AdminBookingsTable` into `components/admin-dashboard.tsx`**

Replace the bookings tab placeholder `<div>` with the real component. At the top of `admin-dashboard.tsx`, add:

```tsx
import { AdminBookingsTable } from "@/components/admin-bookings-table";
import { AdminEnquiriesTable } from "@/components/admin-enquiries-table";
import { AdminLiveStats } from "@/components/admin-live-stats";
```

Replace the three tab content lines:

```tsx
{activeTab === "bookings"  && <AdminBookingsTable />}
{activeTab === "enquiries" && <AdminEnquiriesTable />}
{activeTab === "stats"     && <AdminLiveStats />}
```

- [ ] **Step 3: Verify**

```bash
npm run lint && npm run build
```

Then open `http://localhost:3000/admin`, sign in, click Bookings tab — real booking rows should appear with coloured status badges and filter chips. Past appointments (whose date is before today) should show "completed" not "upcoming"/"pending".

- [ ] **Step 4: Commit**

```bash
git add components/admin-bookings-table.tsx components/admin-dashboard.tsx
git commit -m "feat(admin): bookings tab — client Firestore, status resolution, filter chips, 6-col layout"
```

---

### Task 3: Summary Form — Slide-in Drawer with Assessment Scores

**Files:**
- Modify: `app/admin/actions.ts` (extend `PublishSummaryInput`)
- Modify: `components/summary-form.tsx` (full rewrite as slide-in drawer)

**Interfaces:**
- Consumes: `publishSummary` from `@/app/admin/actions`
- Produces: `SummaryForm` — same props interface as before: `{ booking: { id, patientId, patientType, patientName, service } }`

- [ ] **Step 1: Extend `PublishSummaryInput` in `app/admin/actions.ts`**

Add three new fields to the interface:

```ts
export interface PublishSummaryInput {
  bookingId: string;
  patientId: string;
  patientType: string;
  patientName: string;
  service: string;
  workedOn: string;
  exercises: string;
  nextSteps: string;
  followUpWeeks: number;
  // New assessment fields:
  painScore: number;        // 0–10
  recoveryPercent: number;  // 0–100
  sessionOutcome: "improving" | "stable" | "setback";
}
```

No changes needed to `publishSummary()` — it spreads `...input`, so new fields are automatically saved to Firestore.

- [ ] **Step 2: Rewrite `components/summary-form.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { publishSummary, type PublishSummaryInput } from "@/app/admin/actions";

interface SummaryFormProps {
  booking: {
    id: string;
    patientId: string;
    patientType: string;
    patientName: string;
    service: string;
  };
  onPublished?: () => void;
}

type Outcome = "improving" | "stable" | "setback";
const FOLLOW_UP_OPTIONS = [0, 1, 2, 4, 6, 8] as const;

function getPainColor(score: number): string {
  if (score <= 3) return "#059669";
  if (score <= 6) return "var(--color-warning, #D97706)";
  return "var(--color-error)";
}

function RecoveryRing({ percent }: { percent: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, percent)) / 100) * circ;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-teal)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 32 32)" style={{ transition: "stroke-dashoffset 0.2s" }} />
      <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-navy)" fontFamily="var(--font-sans)">{percent}%</text>
    </svg>
  );
}

export function SummaryForm({ booking, onPublished }: SummaryFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    painScore: 5,
    recoveryPercent: 50,
    sessionOutcome: "improving" as Outcome,
    workedOn: "",
    exercises: "",
    nextSteps: "",
    followUpWeeks: 2,
  });

  // Lock scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Escape key closes drawer
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  async function handlePublish() {
    if (!form.workedOn || !form.exercises || !form.nextSteps) return;
    setSaving(true);
    try {
      const input: PublishSummaryInput = { bookingId: booking.id, patientId: booking.patientId, patientType: booking.patientType, patientName: booking.patientName, service: booking.service, ...form };
      await publishSummary(input);
      if (onPublished) onPublished();
      else window.location.reload();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const canPublish = !!form.workedOn && !!form.exercises && !!form.nextSteps;

  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.06em" };
  const textareaStyle: React.CSSProperties = { width: "100%", border: "1.5px solid var(--color-border)", borderRadius: 10, padding: "0.5rem 0.75rem", fontSize: 14, resize: "vertical" as const, boxSizing: "border-box" as const, fontFamily: "var(--font-sans)", color: "var(--color-navy)" };

  const OUTCOMES: { key: Outcome; label: string; color: string }[] = [
    { key: "improving", label: "Improving ↑", color: "#059669" },
    { key: "stable",    label: "Stable →",    color: "var(--color-warning, #D97706)" },
    { key: "setback",   label: "Setback ↓",   color: "var(--color-error)" },
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ background: "var(--color-teal-light)", border: "1px solid var(--color-teal)", borderRadius: 8, color: "var(--color-teal)", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "4px 12px", fontFamily: "var(--font-sans)" }}
      >
        📋 Write summary
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(13,27,42,0.5)", zIndex: 200 }}
      />

      {/* Drawer */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)", background: "var(--color-surface)", zIndex: 201, overflowY: "auto", boxShadow: "-4px 0 32px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" as const }}>

        {/* Drawer header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", position: "sticky", top: 0, background: "var(--color-surface)", zIndex: 1 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Session Summary</h3>
            <p style={{ margin: "0.25rem 0 0", fontSize: 13, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>{booking.patientName} · {booking.service}</p>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text-secondary)", lineHeight: 1, padding: "0.25rem" }} aria-label="Close">×</button>
        </div>

        <div style={{ padding: "1.5rem", display: "grid", gap: "1.5rem", flex: 1 }}>

          {/* ── Assessment Scores ── */}
          <section>
            <h4 style={{ margin: "0 0 1rem", fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--color-navy)" }}>Assessment Scores</h4>
            <div style={{ display: "grid", gap: "1rem" }}>

              {/* Pain score */}
              <div>
                <label style={labelStyle}>Pain level today (0 = none · 10 = worst)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <input
                    type="range" min={0} max={10} step={1}
                    value={form.painScore}
                    onChange={(e) => setForm((f) => ({ ...f, painScore: Number(e.target.value) }))}
                    style={{ flex: 1, accentColor: getPainColor(form.painScore) }}
                  />
                  <span style={{ background: getPainColor(form.painScore), color: "#fff", borderRadius: 999, padding: "3px 12px", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-sans)", minWidth: 36, textAlign: "center" as const }}>
                    {form.painScore}
                  </span>
                </div>
              </div>

              {/* Recovery % */}
              <div>
                <label style={labelStyle}>Estimated recovery progress</label>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <RecoveryRing percent={form.recoveryPercent} />
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="number" min={0} max={100}
                      value={form.recoveryPercent}
                      onChange={(e) => setForm((f) => ({ ...f, recoveryPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                      style={{ border: "1.5px solid var(--color-border)", borderRadius: 10, padding: "0.5rem 0.75rem", fontSize: 16, fontWeight: 700, width: 72, fontFamily: "var(--font-sans)", color: "var(--color-navy)" }}
                    />
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-navy)", fontFamily: "var(--font-sans)" }}>%</span>
                  </div>
                </div>
              </div>

              {/* Session outcome */}
              <div>
                <label style={labelStyle}>Session outcome</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
                  {OUTCOMES.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, sessionOutcome: o.key }))}
                      style={{
                        background: form.sessionOutcome === o.key ? o.color : "var(--color-surface)",
                        color: form.sessionOutcome === o.key ? "#fff" : "var(--color-text-secondary)",
                        border: `1.5px solid ${form.sessionOutcome === o.key ? o.color : "var(--color-border)"}`,
                        borderRadius: 999,
                        padding: "6px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        transition: "all 0.15s",
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Session Notes ── */}
          <section>
            <h4 style={{ margin: "0 0 1rem", fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--color-navy)" }}>Session Notes</h4>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <label>
                <span style={labelStyle}>What we worked on today *</span>
                <textarea rows={3} value={form.workedOn} onChange={(e) => setForm((f) => ({ ...f, workedOn: e.target.value }))} placeholder="e.g. Lower back mobility, hip flexor stretching and core activation exercises" style={textareaStyle} />
              </label>
              <label>
                <span style={labelStyle}>Exercises assigned *</span>
                <textarea rows={3} value={form.exercises} onChange={(e) => setForm((f) => ({ ...f, exercises: e.target.value }))} placeholder="e.g. Cat-cow stretches ×10, bird-dog ×8 each side, glute bridges ×12 — twice daily" style={textareaStyle} />
              </label>
              <label>
                <span style={labelStyle}>Next steps & advice *</span>
                <textarea rows={3} value={form.nextSteps} onChange={(e) => setForm((f) => ({ ...f, nextSteps: e.target.value }))} placeholder="e.g. Avoid prolonged sitting, use heat pack before exercises, follow up if pain worsens" style={textareaStyle} />
              </label>
            </div>
          </section>

          {/* ── Follow-up ── */}
          <section>
            <h4 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--color-navy)" }}>Recommend Follow-up</h4>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
              {FOLLOW_UP_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, followUpWeeks: w }))}
                  style={{
                    background: form.followUpWeeks === w ? "var(--color-teal)" : "var(--color-surface)",
                    color: form.followUpWeeks === w ? "#fff" : "var(--color-text-secondary)",
                    border: `1.5px solid ${form.followUpWeeks === w ? "var(--color-teal)" : "var(--color-border)"}`,
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    transition: "all 0.15s",
                  }}
                >
                  {w === 0 ? "None" : `${w} wk${w > 1 ? "s" : ""}`}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky footer */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column" as const, gap: "0.5rem", position: "sticky", bottom: 0, background: "var(--color-surface)" }}>
          <button
            onClick={handlePublish}
            disabled={saving || !canPublish}
            style={{ background: canPublish ? "var(--color-teal)" : "var(--color-border)", color: "#fff", border: "none", borderRadius: 12, padding: "0.875rem", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-sans)", cursor: canPublish && !saving ? "pointer" : "not-allowed", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Publishing…" : "Publish Summary"}
          </button>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-sans)", padding: "0.25rem" }}>
            Cancel
          </button>
          {!canPublish && <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, textAlign: "center" as const, fontFamily: "var(--font-sans)" }}>Fill in all three session note fields to publish.</p>}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run lint && npm run build
```

Then in the browser: sign in to admin, Bookings tab, click "Write summary" on a completed booking. The drawer should slide in from the right with the pain slider, recovery ring, outcome pills, and follow-up pills.

- [ ] **Step 4: Commit**

```bash
git add app/admin/actions.ts components/summary-form.tsx
git commit -m "feat(admin): summary drawer — pain score, recovery %, session outcome, follow-up pills"
```

---

### Task 4: Enquiries Table — Client Component + Inline Status Cycling

**Files:**
- Modify: `components/admin-enquiries-table.tsx` (full rewrite — server → client)

**Interfaces:**
- Produces: `AdminEnquiriesTable` — `() => JSX.Element` — same export name, client component with live Firestore subscription and inline status update

- [ ] **Step 1: Rewrite `components/admin-enquiries-table.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, limit, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type EnquiryRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: string;
  createdAtLabel: string;
};

const STATUS_CYCLE: Record<string, string> = {
  "new":         "in-progress",
  "in-progress": "resolved",
  "resolved":    "new",
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  "new":         { bg: "var(--color-gold-light)",  color: "var(--color-gold)",  label: "New" },
  "in-progress": { bg: "var(--color-teal-light)",  color: "var(--color-teal)",  label: "In progress" },
  "resolved":    { bg: "#D1FAE5",                  color: "#059669",             label: "Resolved" },
};

export function AdminEnquiriesTable() {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"), limit(25));
    return onSnapshot(q, (snapshot) => {
      setEnquiries(snapshot.docs.map((doc) => {
        const d = doc.data();
        const ts = typeof d.createdAt?.toDate === "function" ? d.createdAt.toDate() : null;
        return {
          id: doc.id,
          name:           String(d.name || ""),
          email:          String(d.email || ""),
          phone:          String(d.phone || "Not provided"),
          service:        String(d.service || ""),
          message:        String(d.message || ""),
          status:         String(d.status || "new"),
          createdAtLabel: ts ? ts.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Just now",
        };
      }));
      setLoading(false);
    });
  }, []);

  async function cycleStatus(id: string, current: string) {
    const next = STATUS_CYCLE[current] ?? "new";
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: next } : e));
    if (!db) return;
    await updateDoc(doc(db, "enquiries", id), { status: next });
  }

  const newCount = enquiries.filter((e) => e.status === "new").length;

  const th: React.CSSProperties = { color: "#fff", fontWeight: 600, fontSize: 12, padding: "0.625rem 0.75rem", textAlign: "left" as const, whiteSpace: "nowrap" as const, fontFamily: "var(--font-sans)" };
  const td: React.CSSProperties = { padding: "0.75rem", verticalAlign: "top" as const };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}>Enquiries</span>
          <h2 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Latest contact form submissions</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>{enquiries.length} enquiries</span>
          {newCount > 0 && (
            <span style={{ background: "var(--color-gold-light)", color: "var(--color-gold)", borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans)" }}>
              {newCount} new
            </span>
          )}
        </div>
      </div>

      {loading && <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Loading enquiries…</p>}
      {!loading && enquiries.length === 0 && <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", padding: "2rem 0" }}>No enquiries yet.</p>}

      {!loading && enquiries.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--color-navy)" }}>
                <th style={th}>Received</th>
                <th style={th}>Name</th>
                <th style={th}>Service</th>
                <th style={th}>Email</th>
                <th style={th}>Message</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((item, i) => {
                const s = STATUS_STYLES[item.status] ?? STATUS_STYLES.new;
                const isExp = expanded[item.id];
                return (
                  <tr key={item.id} style={{ background: i % 2 === 0 ? "var(--color-surface)" : "var(--color-teal-light)", borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ ...td, color: "var(--color-text-secondary)", fontSize: 12, whiteSpace: "nowrap" as const, fontFamily: "var(--font-sans)" }}>{item.createdAtLabel}</td>
                    <td style={{ ...td, color: "var(--color-navy)", fontWeight: 600, fontFamily: "var(--font-sans)" }}>{item.name}</td>
                    <td style={{ ...td, color: "var(--color-navy)", fontFamily: "var(--font-sans)" }}>{item.service}</td>
                    <td style={{ ...td, color: "var(--color-text-secondary)", fontSize: 12, fontFamily: "var(--font-sans)" }}>{item.email}</td>
                    <td style={{ ...td, maxWidth: 280 }}>
                      <p style={{ margin: 0, color: "var(--color-navy)", fontFamily: "var(--font-sans)", display: "-webkit-box", WebkitLineClamp: isExp ? "unset" : 2, WebkitBoxOrient: "vertical" as const, overflow: isExp ? "visible" : "hidden" }}>
                        {item.message}
                      </p>
                      {item.message.length > 80 && (
                        <button onClick={() => setExpanded((p) => ({ ...p, [item.id]: !isExp }))} style={{ background: "none", border: "none", color: "var(--color-teal)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "2px 0", fontFamily: "var(--font-sans)" }}>
                          {isExp ? "Show less" : "Read more"}
                        </button>
                      )}
                    </td>
                    <td style={td}>
                      <button
                        onClick={() => cycleStatus(item.id, item.status)}
                        title="Click to update status"
                        style={{ background: s.bg, color: s.color, border: "none", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)" }}
                      >
                        {s.label}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run lint && npm run build
```

Open `/admin` → Enquiries tab. Enquiries load from Firestore. Click a status badge — it should cycle New → In progress → Resolved → New and update Firestore instantly.

- [ ] **Step 3: Commit**

```bash
git add components/admin-enquiries-table.tsx
git commit -m "feat(admin): enquiries tab — client Firestore, inline status cycling, message accordion"
```

---

### Task 5: Live Stats Cards — Redesigned with Breakdowns

**Files:**
- Modify: `components/admin-live-stats.tsx` (redesign cards with 2×2 grid and breakdowns)

**Interfaces:**
- Produces: `AdminLiveStats` — `() => JSX.Element` — same export name, client component (already has auth guard from earlier fix)

- [ ] **Step 1: Rewrite `components/admin-live-stats.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify**

```bash
npm run lint && npm run build
```

Open `/admin` → Live Stats tab. Should show four teal-bordered cards in a responsive grid with booking breakdown pills and enquiries "new" count.

- [ ] **Step 3: Commit**

```bash
git add components/admin-live-stats.tsx
git commit -m "feat(admin): live stats tab — 2×2 grid cards with booking and enquiry breakdowns"
```
