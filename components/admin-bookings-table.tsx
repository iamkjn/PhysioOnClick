"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cancelCalBooking } from "@/app/admin/actions";
import { SummaryForm } from "@/components/summary-form";
import { SkeletonTable } from "@/components/skeleton";

type BookingRecord = {
  id: string;
  fullName: string;
  email: string;
  service: string;
  appointmentLabel: string;
  appointmentDate: string;
  appointmentTime: string;
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
  upcoming:  { bg: "var(--color-primary-light)",  color: "var(--color-primary)" },
  completed: { bg: "#D1FAE5",                  color: "var(--color-success)" },
  cancelled: { bg: "#FEE2E2",                  color: "var(--color-error)" },
};

function resolveStatus(stored: string, appointmentDate: string, appointmentTime: string): string {
  if (stored === "cancelled") return "cancelled";
  if (!appointmentDate) return stored;
  const date = new Date(`${appointmentDate}T${appointmentTime || "00:00"}:00`);
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
          appointmentDate:  String(d.appointmentDate || ""),
          appointmentTime:  String(d.appointmentTime || ""),
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

  const resolved = bookings.map((b) => ({ ...b, displayStatus: resolveStatus(b.status, b.appointmentDate, b.appointmentTime) }));

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
              background: filter === f ? "var(--color-primary)" : "var(--color-surface)",
              color: filter === f ? "#fff" : "var(--color-text-secondary)",
              border: `1.5px solid ${filter === f ? "var(--color-primary)" : "var(--color-border)"}`,
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
            <span style={{ background: filter === f ? "rgba(255,255,255,0.2)" : "var(--color-primary-light)", color: filter === f ? "#fff" : "var(--color-primary)", borderRadius: 999, padding: "1px 6px", fontSize: 11 }}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {loading && <SkeletonTable rows={5} columns={6} />}

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
                const rowBg = i % 2 === 0 ? "var(--color-surface)" : "var(--color-primary-light)";
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
                              style={{ border: "1.5px solid var(--color-primary)", color: "var(--color-primary)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-block", fontFamily: "var(--font-sans)" }}
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
                        <span style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600, fontFamily: "var(--font-sans)" }}>✓ Published</span>
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
