// components/admin-session-view.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getBooking, getPatientBookings, displayBookingStatus, type BookingRecord } from "@/lib/patient-bookings";
import { getSessionSummary, type SessionSummary } from "@/lib/session-summaries";
import { AdminAssessmentReview } from "@/components/admin-assessment-review";
import { SkeletonRow } from "@/components/skeleton";

interface Props {
  bookingId: string;
}

const STATUS_LABEL: Record<BookingRecord["status"], string> = {
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
};
const STATUS_CLASS: Record<BookingRecord["status"], string> = {
  upcoming: "dashboard-status-pill",
  completed: "dashboard-status-pill status-confirmed",
  cancelled: "dashboard-status-pill status-cancelled",
};

function formatDateTime(date: Date) {
  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Standalone deep link into a single session — reached from the admin
// notification bell and the "Upcoming Sessions" overview (both only carry a
// bookingId), and linked from the per-patient bookings list. Renders the
// booking header, the same assessment review used on the patient detail
// screen, and the rest of that person's booking/summary history.
export function AdminSessionView({ bookingId }: Props) {
  const [booking, setBooking] = useState<BookingRecord | null | undefined>(undefined);
  const [history, setHistory] = useState<BookingRecord[] | null>(null);
  const [summaries, setSummaries] = useState<Record<string, SessionSummary | null>>({});
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let live = true;
    setBooking(undefined);
    setHistory(null);
    setSummaries({});
    setLoadError(false);

    getBooking(bookingId)
      .then(async (b) => {
        if (!live) return;
        setBooking(b);
        if (!b?.bookedBy) return;

        const records = await getPatientBookings(b.bookedBy, b.patientId);
        if (!live) return;
        setHistory(records);

        const withSummaries = records.filter((r) => r.summaryId);
        const entries = await Promise.all(
          withSummaries.map(async (r) => [r.id, await getSessionSummary(r.id)] as const)
        );
        if (live) setSummaries(Object.fromEntries(entries));
      })
      .catch(() => {
        if (live) {
          setBooking(null);
          setLoadError(true);
        }
      });

    return () => {
      live = false;
    };
  }, [bookingId]);

  if (booking === undefined) {
    return (
      <div className="stack">
        <SkeletonRow count={4} />
      </div>
    );
  }

  if (!booking || loadError) {
    return (
      <div className="panel stack">
        <p className="field-error">Could not load this session.</p>
      </div>
    );
  }

  const otherBookings = (history ?? []).filter((b) => b.id !== bookingId);
  // Stable reference across renders that don't change `history` — see the
  // matching comment in admin-patient-detail.tsx for why this matters.
  const assessmentBookings = useMemo(
    () => (history ?? []).map((b) => ({ id: b.id, service: b.service, sessionDate: b.sessionDate, status: b.status })),
    [history]
  );

  return (
    <div className="stack" style={{ gap: "var(--space-6)" }}>
      {/* 1. Header */}
      <div className="panel stack">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <div>
            <span className="eyebrow">{booking.service}</span>
            <h1 style={{ fontSize: "var(--text-xl)", margin: "0.25rem 0 0" }}>{booking.patientName}</h1>
          </div>
          <span className={STATUS_CLASS[displayBookingStatus(booking)]}>{STATUS_LABEL[displayBookingStatus(booking)]}</span>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
          {formatDateTime(booking.sessionDate)}
        </p>
        <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
          {booking.bookedBy && booking.patientId && (
            <Link
              href={`/admin/patients/${booking.bookedBy}${booking.patientId !== booking.bookedBy ? `?person=${booking.patientId}` : ""}`}
              style={{ fontSize: "var(--text-sm)", color: "var(--color-primary-dark)", fontWeight: 600 }}
            >
              View full patient record →
            </Link>
          )}
          {displayBookingStatus(booking) === "upcoming" && (
            <Link
              href={`/admin/session/${bookingId}/start`}
              style={{ fontSize: "var(--text-sm)", color: "var(--color-primary-dark)", fontWeight: 600 }}
            >
              Start Session →
            </Link>
          )}
        </div>
      </div>

      {/* 2. Assessment (reuses the same review UI as the patient detail screen,
          including the Phase 1 read-only body chart) */}
      {booking.bookedBy && (
        <AdminAssessmentReview
          patientUid={booking.bookedBy}
          personId={booking.patientId ?? booking.bookedBy}
          bookings={assessmentBookings}
        />
      )}

      {/* 3. Past session history */}
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Past session history</h2>
        {history === null ? (
          <SkeletonRow count={3} />
        ) : otherBookings.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
            No other sessions for {booking.patientName} yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {otherBookings.map((b) => {
              const summary = summaries[b.id];
              return (
                <div key={b.id} style={{ padding: "0.6rem 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                    <div>
                      <strong style={{ fontSize: "var(--text-sm)" }}>{b.service}</strong>
                      <span className="muted" style={{ marginLeft: "0.5rem", fontSize: "var(--text-xs)" }}>
                        {b.sessionDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <span className={STATUS_CLASS[displayBookingStatus(b)]}>{STATUS_LABEL[displayBookingStatus(b)]}</span>
                  </div>
                  {summary && (
                    <dl className="assessment-detail-grid" style={{ marginTop: "0.5rem" }}>
                      <div><dt>Worked on</dt><dd>{summary.workedOn || "Not recorded"}</dd></div>
                      <div><dt>Exercises</dt><dd>{summary.exercises || "Not recorded"}</dd></div>
                      <div><dt>Recovery</dt><dd>{summary.recoveryPercent}%, pain {summary.painScore}/10</dd></div>
                    </dl>
                  )}
                  <Link
                    href={`/admin/session/${b.id}`}
                    style={{ fontSize: "var(--text-xs)", color: "var(--color-primary-dark)", fontWeight: 600 }}
                  >
                    View session →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
