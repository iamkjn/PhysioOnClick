"use client";
import { useEffect, useRef, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cancelCalBooking } from "@/app/admin/actions";
import { SummaryForm } from "@/components/summary-form";
import { SkeletonTable } from "@/components/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";

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

// dashboard-status-pill only ships status-pending/-confirmed/-cancelled modifiers
// (warning/success/error). "upcoming" has no dedicated modifier, so it falls
// back to the base pill (primary-light/primary), and "completed" reuses the
// success-toned "confirmed" modifier.
const STATUS_PILL_CLASS: Record<string, string> = {
  pending:   "dashboard-status-pill status-pending",
  upcoming:  "dashboard-status-pill",
  completed: "dashboard-status-pill status-confirmed",
  cancelled: "dashboard-status-pill status-cancelled",
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
  const [cancelTarget, setCancelTarget] = useState<{ id: string; label: string } | null>(null);
  const cancelFormRefs = useRef<Record<string, HTMLFormElement | null>>({});

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

  return (
    <div>
      <div className="dashboard-table-head" style={{ marginBottom: "1rem" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}>Bookings</span>
          <h2 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Latest appointment requests</h2>
        </div>
        <span className="dashboard-table-count">{displayed.length} shown · sorted by newest</span>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" as const }}>
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="button small"
            style={{
              background: filter === f ? "var(--color-primary)" : "var(--color-surface)",
              color: filter === f ? "white" : "var(--color-text-secondary)",
              borderColor: filter === f ? "var(--color-primary)" : "var(--color-border)",
              padding: "4px 12px",
              minHeight: "auto",
              fontSize: 12,
              gap: "0.375rem",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{ background: filter === f ? "rgba(255,255,255,0.2)" : "var(--color-primary-light)", color: filter === f ? "white" : "var(--color-primary)", borderRadius: 999, padding: "1px 6px", fontSize: 11 }}>
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
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Service</th>
                <th>Appointment</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong style={{ display: "block", color: "var(--color-navy)", fontFamily: "var(--font-sans)" }}>{item.fullName || item.patientName}</strong>
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>{item.email}</span>
                  </td>
                  <td style={{ color: "var(--color-navy)", fontFamily: "var(--font-sans)" }}>{item.service}</td>
                  <td style={{ color: item.appointmentLabel === "TBC" ? "var(--color-text-secondary)" : "var(--color-navy)", fontStyle: item.appointmentLabel === "TBC" ? "italic" : "normal", fontFamily: "var(--font-sans)" }}>
                    {item.appointmentLabel}
                  </td>
                  <td>
                    <span className={STATUS_PILL_CLASS[item.displayStatus] ?? "dashboard-status-pill"}>
                      {item.displayStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
                      {item.calBookingUid ? (
                        <>
                          <form
                            ref={(el) => { cancelFormRefs.current[item.id] = el; }}
                            action={cancelCalBooking.bind(null, item.calBookingUid)}
                          >
                            <button
                              type="button"
                              className="button small"
                              disabled={item.displayStatus === "cancelled"}
                              onClick={() => setCancelTarget({ id: item.id, label: item.fullName || item.patientName })}
                              style={{
                                background: "none",
                                border: "1.5px solid var(--color-error)",
                                color: "var(--color-error)",
                                minHeight: "auto",
                                padding: "4px 10px",
                                fontSize: 12,
                                opacity: item.displayStatus === "cancelled" ? 0.4 : 1,
                              }}
                            >
                              Cancel
                            </button>
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
                  <td>
                    {item.displayStatus === "completed" && !item.summaryId && item.patientId && (
                      <SummaryForm booking={{ id: item.id, patientId: item.patientId, patientType: item.patientType, patientName: item.patientName, service: item.service }} />
                    )}
                    {item.summaryId && (
                      <span style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600, fontFamily: "var(--font-sans)" }}>✓ Published</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={cancelTarget !== null}
        title="Cancel this booking?"
        body={cancelTarget ? `This cancels ${cancelTarget.label}'s appointment via Cal.com. This can't be undone from here.` : ""}
        confirmLabel="Cancel booking"
        confirmVariant="destructive"
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => {
          const target = cancelTarget;
          setCancelTarget(null);
          if (!target) return;
          cancelFormRefs.current[target.id]?.requestSubmit();
        }}
      />
    </div>
  );
}
