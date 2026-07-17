"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { PersonSwitcher } from "@/components/person-switcher";
import { usePerson } from "@/components/person-provider";
import { SkeletonRow } from "@/components/skeleton";
import { getPatientBookings, type BookingRecord } from "@/lib/patient-bookings";

function resolveStatus(booking: BookingRecord): BookingRecord["status"] {
  if (booking.status === "cancelled") return "cancelled";
  return booking.sessionDate < new Date() ? "completed" : "upcoming";
}

export default function AppointmentsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncDone, setSyncDone] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const router = useRouter();
  // Shared with the rest of the app (home dashboard, recovery) via
  // PersonProvider, so switching person here or elsewhere stays in sync.
  const personCtx = usePerson();
  const personId = uid ? (personCtx?.personId ?? uid) : null;

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/patient");
        return;
      }
      // Sync Cal.com bookings into Firestore first, then load — otherwise
      // the load effect below races the sync and new appointments only
      // show up after a manual refresh.
      try {
        if (u.email) {
          const idToken = await u.getIdToken();
          await fetch("/api/appointments/sync", {
            headers: { Authorization: `Bearer ${idToken}` },
          });
        }
      } catch {
        // sync is best-effort; still let the page load below
      } finally {
        setSyncDone(true);
      }
      setUid(u.uid);
      setDisplayName(u.displayName || u.email || "Patient");
    });
  }, [router]);

  useEffect(() => {
    if (!syncDone || !uid || !personId) return;
    setLoading(true);
    setLoadError(false);
    getPatientBookings(uid, personId)
      .then(setBookings)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [syncDone, uid, personId]);

  const resolved = bookings.map((b) => ({ ...b, displayStatus: resolveStatus(b) }));
  const upcoming = resolved.filter((b) => b.displayStatus === "upcoming");
  const past = resolved.filter((b) => b.displayStatus !== "upcoming");

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <span className="eyebrow">Appointments</span>
      <h1 style={{ color: "var(--color-text-primary)" }}>Your appointments</h1>
      <p className="muted" style={{ marginTop: "-0.5rem", marginBottom: "1.5rem" }}>
        Review upcoming sessions and revisit summaries from past visits.
      </p>
      {uid && (
        <div style={{ marginBottom: "1.5rem" }}>
          <PersonSwitcher
            uid={uid}
            displayName={displayName}
            onSelect={() => {
              // PersonSwitcher persists the selection via the shared
              // PersonProvider context; personId above already reads from it.
            }}
          />
        </div>
      )}
      {loading && <SkeletonRow count={3} />}
      {!loading && loadError && (
        <p className="field-error">Could not load your appointments. Please refresh the page.</p>
      )}
      {!loading && !loadError && bookings.length === 0 && (
        <EmptyState
          illustration="calendar"
          title="No appointments yet"
          body="Book your first session with a physio today."
          cta={{ label: 'Book Now', href: '/book', variant: 'gold' }}
        />
      )}
      {upcoming.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ color: "var(--color-text-primary)", marginBottom: "0.75rem" }}>
            Upcoming
          </h2>
          {upcoming.map((b) => (
            <BookingRow key={b.id} booking={b} />
          ))}
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 style={{ color: "var(--color-text-primary)", marginBottom: "0.75rem" }}>
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
          background: "var(--color-surface)",
          borderRadius: "var(--radius-card)",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          boxShadow: "var(--shadow)",
          marginBottom: "0.625rem",
          cursor: "pointer",
        }}
      >
        <Avatar name={booking.patientName} imageUrl={booking.patientAvatarUrl} size={44} />
        <div style={{ flex: 1 }}>
          <strong
            style={{
              display: "block",
              color: booking.displayStatus === "cancelled" ? "var(--color-text-secondary)" : "var(--color-text-primary)",
              textDecoration: booking.displayStatus === "cancelled" ? "line-through" : "none",
            }}
          >
            {booking.patientName}
          </strong>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            {booking.service} · {date}
          </span>
        </div>
        {booking.displayStatus === "cancelled" ? (
          <span
            style={{
              background: "var(--color-bg)",
              color: "var(--color-text-secondary)",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--color-border)",
            }}
          >
            Cancelled
          </span>
        ) : booking.displayStatus !== "upcoming" ? (
          booking.summaryId ? (
            <span role="img" aria-label="Summary available" style={{ fontSize: 20 }}>📋</span>
          ) : (
            <span role="img" aria-label="Summary pending" style={{ fontSize: 20, opacity: 0.4 }}>⏳</span>
          )
        ) : (
          <span
            style={{
              background: "var(--color-primary-light)",
              color: "var(--color-primary-dark)",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "var(--radius-pill)",
            }}
          >
            Upcoming
          </span>
        )}
      </div>
    </Link>
  );
}
