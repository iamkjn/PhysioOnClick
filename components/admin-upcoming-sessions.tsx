// components/admin-upcoming-sessions.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUpcomingBookingsAcrossPatients, type BookingRecord } from "@/lib/patient-bookings";
import { SkeletonTable } from "@/components/skeleton";

function timeUntil(date: Date, now: number): string {
  const diffMs = date.getTime() - now;
  if (diffMs <= 0) return "starting now";
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return `in ${days}d`;
}

// "Upcoming Sessions" admin overview (app/admin/sessions/page.tsx): every
// upcoming booking across all patients, soonest first, flagged when it's
// starting within the next 10 minutes — the same window the
// notifyAdminUpcomingSessions Cloud Function alerts on.
export function AdminUpcomingSessions() {
  const [bookings, setBookings] = useState<BookingRecord[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let live = true;
    getUpcomingBookingsAcrossPatients(100)
      .then((records) => {
        if (live) setBookings(records);
      })
      .catch(() => {
        if (live) {
          setBookings([]);
          setLoadError(true);
        }
      });
    return () => {
      live = false;
    };
  }, []);

  // Keep the "time until" column live without re-fetching.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="panel stack">
      <div className="dashboard-table-head">
        <div>
          <span className="dashboard-eyebrow">Sessions</span>
          <h2>Upcoming sessions</h2>
        </div>
        <span className="dashboard-table-count">
          {bookings?.length ?? 0} {bookings?.length === 1 ? "session" : "sessions"}
        </span>
      </div>

      {bookings === null && <SkeletonTable rows={6} columns={5} />}

      {bookings !== null && loadError && (
        <p className="field-error">Could not load upcoming sessions.</p>
      )}

      {bookings !== null && !loadError && bookings.length === 0 && (
        <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
          No upcoming sessions booked.
        </p>
      )}

      {bookings !== null && !loadError && bookings.length > 0 && (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <caption className="sr-only">Upcoming sessions with patient, service, date/time and time until</caption>
            <thead>
              <tr>
                <th scope="col">Patient</th>
                <th scope="col">Service</th>
                <th scope="col">Date/time</th>
                <th scope="col">Starts</th>
                <th scope="col">View</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const soon = b.sessionDate.getTime() - now <= 10 * 60_000;
                return (
                  <tr key={b.id} className={`admin-table-row${soon ? " admin-table-row-soon" : ""}`}>
                    <td style={{ fontFamily: "var(--font-sans)" }}>{b.patientName}</td>
                    <td style={{ fontFamily: "var(--font-sans)" }}>{b.service}</td>
                    <td style={{ fontFamily: "var(--font-sans)" }}>
                      {b.sessionDate.toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ fontFamily: "var(--font-sans)", fontWeight: soon ? 700 : 400, color: soon ? "var(--color-error)" : undefined }}>
                      {timeUntil(b.sessionDate, now)}
                    </td>
                    <td>
                      <Link href={`/admin/session/${b.id}#self-assessment`} className="button small">
                        Review
                      </Link>
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
