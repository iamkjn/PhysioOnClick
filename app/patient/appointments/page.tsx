"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { getPatientBookings, type BookingRecord } from "@/lib/patient-bookings";

export default function AppointmentsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/patient");
        return;
      }
      // Sync Cal.com bookings into Firestore first, then load
      try {
        if (u.email) {
          await fetch(
            `/api/appointments/sync?email=${encodeURIComponent(u.email)}&userId=${u.uid}`
          );
        }
      } catch {
        // sync is best-effort
      }
      getPatientBookings(u.uid)
        .then(setBookings)
        .finally(() => setLoading(false));
    });
  }, [router]);

  const upcoming = bookings.filter((b) => b.status === "upcoming");
  const past = bookings.filter((b) => b.status !== "upcoming");

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <h1 style={{ color: "#0C2A38" }}>My Appointments</h1>
      {loading && <p style={{ color: "#5E7A84" }}>Loading…</p>}
      {!loading && bookings.length === 0 && (
        <EmptyState
          illustration="calendar"
          title="No appointments yet"
          body="Book your first session with a physio today."
          cta={{ label: 'Book Now', href: '/book', variant: 'gold' }}
        />
      )}
      {upcoming.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.05rem", color: "#0C2A38", marginBottom: "0.75rem" }}>
            Upcoming
          </h2>
          {upcoming.map((b) => (
            <BookingRow key={b.id} booking={b} />
          ))}
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 style={{ fontSize: "1.05rem", color: "#0C2A38", marginBottom: "0.75rem" }}>
            Past
          </h2>
          {past.map((b) => (
            <BookingRow key={b.id} booking={b} />
          ))}
        </section>
      )}
    </div>
  );
}

function BookingRow({ booking }: { booking: BookingRecord }) {
  const date = booking.sessionDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <Link href={`/patient/appointments/${booking.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          marginBottom: "0.625rem",
          cursor: "pointer",
        }}
      >
        <Avatar name={booking.patientName} imageUrl={booking.patientAvatarUrl} size={44} />
        <div style={{ flex: 1 }}>
          <strong style={{ display: "block", color: "#0C2A38" }}>{booking.patientName}</strong>
          <span style={{ fontSize: 13, color: "#5E7A84" }}>
            {booking.service} · {date}
          </span>
        </div>
        {booking.status !== "upcoming" ? (
          booking.summaryId ? (
            <span style={{ fontSize: 20 }}>📋</span>
          ) : (
            <span style={{ fontSize: 20, opacity: 0.4 }}>⏳</span>
          )
        ) : (
          <span
            style={{
              background: "#D8F3F9",
              color: "#0E7490",
              fontSize: 12,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 999,
            }}
          >
            Upcoming
          </span>
        )}
      </div>
    </Link>
  );
}
