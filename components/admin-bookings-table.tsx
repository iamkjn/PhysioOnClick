"use client";
import { useEffect, useRef, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { cancelCalBooking } from "@/app/admin/actions";
import { SummaryForm } from "@/components/summary-form";
import { SkeletonTable } from "@/components/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";

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

// appointmentDate/appointmentTime are Europe/London wall-clock strings (see
// toLondonParts() in app/api/cal-webhook/route.ts). Comparing them via `new
// Date(...)` parses in the VIEWER's local timezone, so an admin outside the
// UK gets the wrong upcoming/completed split. Instead, compute "now" as the
// same kind of London wall-clock string and compare lexicographically — both
// sides use zero-padded "YYYY-MM-DD"/"HH:MM", so string order matches date
// order regardless of DST.
function nowInLondon(): string {
  const londonStr = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });
  const [datePart, timePart] = londonStr.split(", ");
  const [day, month, year] = datePart.split("/");
  const [hour, minute] = timePart.split(":");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function resolveStatus(stored: string, appointmentDate: string, appointmentTime: string): string {
  if (stored === "cancelled") return "cancelled";
  if (!appointmentDate || !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) return stored;
  const time = appointmentTime || "00:00";
  return `${appointmentDate}T${time}` < nowInLondon() ? "completed" : "upcoming";
}

type SortKey = "patient" | "service" | "appointment" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

/** Column header labels, in table order, for the sortable headers. */
const SORT_LABELS: Record<SortKey, string> = {
  patient: "Patient",
  service: "Service",
  appointment: "Appointment",
  status: "Status",
};

export function AdminBookingsTable() {
  const toast = useToast();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "appointment", dir: "desc" });
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; label: string } | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const cancelFormRefs = useRef<Record<string, HTMLFormElement | null>>({});

  useEffect(() => {
    if (!db) return;
    // Fetched in one live subscription and then filtered, sorted and paged in
    // memory. That keeps the realtime updates and makes sorting instant; at a
    // single-practice scale 200 rows is well within what the client can hold.
    // Past that, this needs Firestore cursor pagination instead.
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(200));
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
    }, (err) => {
      // Without this handler a rejected read (most often a Firestore rules
      // denial) leaves `loading` true forever and the table shows skeleton
      // rows indefinitely, with no clue as to why.
      console.error("bookings snapshot failed", err);
      setLoadError("Could not load bookings. Check that this account has admin access.");
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

  const byStatus = filter === "all" ? resolved : resolved.filter((b) => b.displayStatus === filter);

  const term = search.trim().toLowerCase();
  const matched = term
    ? byStatus.filter((b) =>
        [b.fullName, b.patientName, b.email, b.service].some((f) => f.toLowerCase().includes(term)))
    : byStatus;

  // Sort keys map to what the column actually displays, so the order matches
  // what the reader sees. "appointment" sorts on the raw date+time rather than
  // the label, since the label can be "TBC" — those sort last in either
  // direction, as an unscheduled booking is never a meaningful extreme.
  const sorted = [...matched].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    if (sort.key === "appointment") {
      const av = a.appointmentDate ? `${a.appointmentDate}T${a.appointmentTime || "00:00"}` : "";
      const bv = b.appointmentDate ? `${b.appointmentDate}T${b.appointmentTime || "00:00"}` : "";
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return av < bv ? -dir : av > bv ? dir : 0;
    }
    const av = sort.key === "patient" ? (a.fullName || a.patientName) : sort.key === "service" ? a.service : a.displayStatus;
    const bv = sort.key === "patient" ? (b.fullName || b.patientName) : sort.key === "service" ? b.service : b.displayStatus;
    return av.localeCompare(bv) * dir;
  });

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // Clamped rather than stored, so deleting or filtering rows can never strand
  // the view on a page that no longer exists.
  const currentPage = Math.min(page, pageCount);
  const displayed = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
    setPage(1);
  }

  return (
    <div>
      <div className="dashboard-table-head" style={{ marginBottom: "1rem" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}>Bookings</span>
          <h2 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Latest appointment requests</h2>
        </div>
        <span className="dashboard-table-count">
          {sorted.length} {sorted.length === 1 ? "booking" : "bookings"} · sorted by {SORT_LABELS[sort.key].toLowerCase()} ({sort.dir === "asc" ? "ascending" : "descending"})
        </span>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="bookings-search" className="sr-only">Search bookings by patient, email or service</label>
        <input
          id="bookings-search"
          type="search"
          className="input"
          placeholder="Search patient, email or service…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 380 }}
        />
      </div>

      {/* Filter chips — the most-tapped control on this page, so it keeps a
          full 44px touch target even though the table rows below stay
          dense (filter chips are explicitly exempt from the "tint, never
          solid fill" selected-state rule). */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" as const }} role="group" aria-label="Filter bookings by status">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className="button small"
            aria-pressed={filter === f}
            style={{
              background: filter === f ? "var(--color-primary-dark)" : "var(--color-surface)",
              color: filter === f ? "white" : "var(--color-text-secondary)",
              borderColor: filter === f ? "var(--color-primary-dark)" : "var(--color-border)",
              padding: "0 12px",
              minHeight: 44,
              fontSize: 13,
              gap: "0.375rem",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{ background: filter === f ? "rgba(255,255,255,0.2)" : "var(--color-primary-light)", color: filter === f ? "white" : "var(--color-primary-dark)", borderRadius: 999, padding: "1px 6px", fontSize: 11 }}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {loading && <SkeletonTable rows={5} columns={6} />}

      {!loading && loadError && (
        <p style={{ color: "var(--color-error)", fontFamily: "var(--font-sans)", padding: "2rem 0" }}>{loadError}</p>
      )}

      {!loading && !loadError && sorted.length === 0 && (
        <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", padding: "2rem 0" }}>
          {term ? `No bookings match “${search.trim()}”.` : "No bookings match this filter."}
        </p>
      )}

      {!loading && displayed.length > 0 && (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table admin-bookings-table">
            <caption className="sr-only">Latest appointment bookings with status, actions, and session summary links</caption>
            <thead>
              <tr>
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <th
                    key={key}
                    scope="col"
                    // aria-sort tells a screen reader the current order without
                    // relying on the arrow glyph, which is decorative only.
                    aria-sort={sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(key)}
                      style={{ background: "none", border: 0, padding: 0, font: "inherit", color: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      {SORT_LABELS[key]}
                      <span aria-hidden="true" style={{ opacity: sort.key === key ? 1 : 0.35, fontSize: 10 }}>
                        {sort.key === key && sort.dir === "asc" ? "▲" : "▼"}
                      </span>
                    </button>
                  </th>
                ))}
                <th scope="col">Actions</th>
                <th scope="col">Summary</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((item) => (
                <tr key={item.id} className="admin-table-row">
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
                            action={async () => {
                              setCancelling(item.id);
                              try {
                                const idToken = await auth?.currentUser?.getIdToken();
                                if (!idToken) throw new Error("Not signed in");
                                await cancelCalBooking(item.calBookingUid, idToken);
                                toast.show("Booking cancelled.", "success");
                              } catch {
                                toast.show("Could not cancel this booking. Try again.", "error");
                              } finally {
                                setCancelling(null);
                              }
                            }}
                          >
                            <button
                              type="button"
                              className="button small"
                              disabled={item.displayStatus === "cancelled" || cancelling === item.id}
                              aria-label={`Cancel booking for ${item.fullName || item.patientName}`}
                              onClick={() => setCancelTarget({ id: item.id, label: item.fullName || item.patientName })}
                              style={{
                                background: "none",
                                border: "1.5px solid var(--color-error)",
                                color: "var(--color-error)",
                                padding: "0 10px",
                                fontSize: 13,
                                cursor: item.displayStatus === "cancelled" || cancelling === item.id ? "not-allowed" : "pointer",
                                opacity: item.displayStatus === "cancelled" ? 0.4 : cancelling === item.id ? 0.6 : 1,
                              }}
                            >
                              {cancelling === item.id ? "Cancelling…" : "Cancel"}
                            </button>
                          </form>
                          <a
                            href={`https://cal.com/reschedule/${item.calBookingUid}`}
                            target="_blank" rel="noopener noreferrer"
                            className="button small"
                            aria-label={`Reschedule booking for ${item.fullName || item.patientName}`}
                            style={{ border: "1.5px solid var(--color-primary-dark)", color: "var(--color-primary-dark)", background: "none", padding: "0 10px", fontSize: 13 }}
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

      {!loading && !loadError && pageCount > 1 && (
        <nav
          aria-label="Bookings pagination"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" as const, marginTop: "1rem" }}
        >
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span aria-live="polite" style={{ fontSize: 13, color: "var(--color-navy)", fontFamily: "var(--font-sans)", minWidth: 90, textAlign: "center" as const }}>
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === pageCount}
            >
              Next
            </button>
          </div>
        </nav>
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

      {/* Row hover — dashboard-table is a shared globals.css class with no
          hover rule of its own; scoped here rather than editing the shared
          class (see report for the recommended global version). */}
      <style>{`
        .admin-bookings-table tbody tr.admin-table-row:hover { background: var(--surface-alt); }
      `}</style>
    </div>
  );
}
