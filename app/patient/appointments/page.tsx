"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { PersonSwitcher } from "@/components/person-switcher";
import { SkeletonRow } from "@/components/skeleton";
import { getPatientBookings, type BookingRecord } from "@/lib/patient-bookings";

function resolveStatus(booking: BookingRecord): BookingRecord["status"] {
  if (booking.status === "cancelled") return "cancelled";
  return booking.sessionDate < new Date() ? "completed" : "upcoming";
}

export default function AppointmentsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [personId, setPersonId] = useState<string | null>(null);
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
      setUid(u.uid);
      setDisplayName(u.displayName || u.email || "Patient");
      setPersonId(u.uid);
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
    });
  }, [router]);

  useEffect(() => {
    if (!uid || !personId) return;
    setLoading(true);
    getPatientBookings(uid, personId)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [uid, personId]);

  const resolved = bookings.map((b) => ({ ...b, displayStatus: resolveStatus(b) }));
  const upcoming = resolved.filter((b) => b.displayStatus === "upcoming");
  const past = resolved.filter((b) => b.displayStatus !== "upcoming");

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <h1 style={{ color: "var(--color-text-primary)" }}>My Appointments</h1>
      {uid && (
        <div style={{ marginBottom: "1.5rem" }}>
          <PersonSwitcher
            uid={uid}
            displayName={displayName}
            onSelect={(id) => setPersonId(id)}
          />
        </div>
      )}
      {loading && <SkeletonRow count={3} />}
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
          <h2 style={{ fontSize: "1.05rem", color: "var(--color-text-primary)", marginBottom: "0.75rem" }}>
            Upcoming
          </h2>
          {upcoming.map((b) => (
            <BookingRow key={b.id} booking={b} />
          ))}
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 style={{ fontSize: "1.05rem", color: "var(--color-text-primary)", marginBottom: "0.75rem" }}>
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

function BookingRow({ booking }: { booking: BookingRecord & { displayStatus: BookingRecord["status"] } }) {
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
          <strong style={{ display: "block", color: "var(--color-text-primary)" }}>{booking.patientName}</strong>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            {booking.service} · {date}
          </span>
        </div>
        {booking.displayStatus !== "upcoming" ? (
          booking.summaryId ? (
            <span style={{ fontSize: 20 }}>📋</span>
          ) : (
            <span style={{ fontSize: 20, opacity: 0.4 }}>⏳</span>
          )
        ) : (
          <span
            style={{
              background: "var(--color-primary-light)",
              color: "var(--color-primary-dark)",
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
