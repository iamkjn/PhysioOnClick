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
import { ClipboardIcon } from "@/components/icons";
import { TrustpilotInvitations } from "@/components/trustpilot-invitations";
import { getPatientBookings, type BookingRecord } from "@/lib/patient-bookings";
import { getFollowUps, type FollowUp } from "@/lib/follow-ups";
import { formatPersonName } from "@/lib/name-format";

type SessionPackage = {
  id: string;
  title: string;
  patientName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  status: string;
};

type SlotMap = Record<string, string[]>;
type PackageCheckIn = {
  painScore: number;
  progress: "better" | "same" | "worse";
  exercises: "yes" | "partly" | "no";
  newSymptoms: boolean;
  changeNote: string;
  focus: string;
};

const defaultCheckIn: PackageCheckIn = {
  painScore: 5,
  progress: "same",
  exercises: "partly",
  newSymptoms: false,
  changeNote: "",
  focus: "",
};

function resolveStatus(booking: BookingRecord): BookingRecord["status"] {
  if (booking.status === "cancelled") return "cancelled";
  return booking.sessionDate < new Date() ? "completed" : "upcoming";
}

// dueDate is a plain "YYYY-MM-DD" calendar day with no time component —
// parsing it as local midnight (rather than letting `new Date("YYYY-MM-DD")`
// default to UTC midnight) keeps the displayed day from shifting a day back
// in timezones behind UTC.
function prettyDueDate(dueDate: string): string {
  return new Date(`${dueDate}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function dateKey(d: Date) {
  return d.toLocaleDateString("en-CA");
}

function slotLabel(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

export default function AppointmentsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncDone, setSyncDone] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [packagesReload, setPackagesReload] = useState(0);
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
      setDisplayName(formatPersonName(u.displayName, u.email || "Patient"));
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

  useEffect(() => {
    if (!uid || !personId) return;
    getFollowUps(uid, personId)
      .then(setFollowUps)
      .catch(() => setFollowUps([]));
  }, [uid, personId]);

  useEffect(() => {
    if (!uid) return;
    let live = true;
    const auth = getAuth();
    auth.currentUser?.getIdToken()
      .then((token) => fetch("/api/package-sessions", { headers: { Authorization: `Bearer ${token}` } }))
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { packages?: SessionPackage[] }) => {
        if (live) setPackages(data.packages ?? []);
      })
      .catch(() => {
        if (live) setPackages([]);
      });
    return () => {
      live = false;
    };
  }, [uid, packagesReload]);

  const resolved = bookings.map((b) => ({ ...b, displayStatus: resolveStatus(b) }));
  const upcoming = resolved.filter((b) => b.displayStatus === "upcoming");
  const past = resolved.filter((b) => b.displayStatus !== "upcoming");

  return (
    <div className="site-shell patient-page">
      <TrustpilotInvitations
        bookings={past.map((b) => ({ id: b.id, patientName: b.patientName, sessionDate: b.sessionDate }))}
      />
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Appointments</span>
          <h1 style={{ color: "var(--color-text-primary)" }}>Your appointments</h1>
          <p className="muted">Review upcoming sessions and revisit summaries from past visits.</p>
        </div>
      </section>

      {uid && (
        <section className="page-section">
          <PersonSwitcher
            uid={uid}
            displayName={displayName}
            label="Viewing appointments for:"
            onSelect={() => {
              // PersonSwitcher persists the selection via the shared
              // PersonProvider context; personId above already reads from it.
            }}
          />
        </section>
      )}

      {followUps.length > 0 && (
        <section className="page-section">
          <div className="panel stack">
            <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>
              Upcoming follow-up{followUps.length > 1 ? "s" : ""}
            </h2>
            {followUps.map((f) => (
              <p key={f.id} style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                Follow-up on <strong>{prettyDueDate(f.dueDate)}</strong>
                {f.note ? ` — ${f.note}` : ""}
              </p>
            ))}
          </div>
        </section>
      )}

      {packages.length > 0 && (
        <section className="page-section">
          <SessionPackagesPanel packages={packages} onBooked={() => setPackagesReload((value) => value + 1)} />
        </section>
      )}

      {loading && (
        <section className="page-section">
          <SkeletonRow count={3} />
        </section>
      )}
      {!loading && loadError && (
        <section className="page-section">
          <p className="field-error">Could not load your appointments. Please refresh the page.</p>
        </section>
      )}
      {!loading && !loadError && bookings.length === 0 && (
        <section className="page-section">
          <EmptyState
            illustration="calendar"
            title="No appointments yet"
            body="Book your first session with a physio today."
            cta={{ label: 'Book Now', href: '/book', variant: 'gold' }}
          />
        </section>
      )}
      {upcoming.length > 0 && (
        <section className="page-section stack">
          <div className="section-heading">
            <h2>Upcoming</h2>
          </div>
          <div className="patient-dashboard-grid">
            {upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section className="page-section stack">
          <div className="section-heading">
            <h2>Past</h2>
          </div>
          <div className="patient-dashboard-grid">
            {past.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
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
  const isPackageFollowUp = Boolean(booking.packageSessionNumber && booking.packageSessionNumber > 1);
  const needsAssessment =
    booking.paid && !isPackageFollowUp && booking.assessmentCompletedAt === null && booking.displayStatus === "upcoming";
  return (
    <div>
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
          marginBottom: needsAssessment ? 0 : "0.625rem",
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
            {booking.packageSessionNumber && booking.packageTotalSessions
              ? ` · Package ${booking.packageSessionNumber}/${booking.packageTotalSessions}`
              : ""}
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
            <span role="img" aria-label="Summary available">
              <ClipboardIcon className="inline-icon" />
            </span>
          ) : (
            <span aria-label="Summary not added yet" title="Summary not added yet">
              <ClipboardIcon className="inline-icon inline-icon--pending" />
            </span>
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
      {needsAssessment && (
        <Link
          href={`/patient/assessment?booking=${booking.id}`}
          className="pill-link assessment-cta"
        >
          Complete your assessment before this appointment →
        </Link>
      )}
    </div>
  );
}

function SessionPackagesPanel({
  packages,
  onBooked,
}: {
  packages: SessionPackage[];
  onBooked: () => void;
}) {
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<PackageCheckIn>(defaultCheckIn);
  const [message, setMessage] = useState<string | null>(null);

  async function loadSlots(packageId: string) {
    setActivePackageId(packageId);
    setMessage(null);
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    setCheckIn(defaultCheckIn);
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 45);
    try {
      const params = new URLSearchParams({
        service: "follow-up",
        start: dateKey(start),
        end: dateKey(end),
      });
      const res = await fetch(`/api/cal/slots?${params}`);
      const data = (await res.json()) as { slots?: SlotMap; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not load times.");
      const nextSlots = Object.values(data.slots ?? {}).flat().slice(0, 10);
      setSlots(nextSlots);
      if (!nextSlots.length) setMessage("No follow-up times are available right now. Please check again later.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load package booking times.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function bookPackageSlot(packageId: string) {
    if (!selectedSlot) {
      setMessage("Choose a time first.");
      return;
    }
    setBookingSlot(selectedSlot);
    setMessage(null);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error("Please sign in again to book your package session.");
      const res = await fetch("/api/package-sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          start: selectedSlot,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          checkIn,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not book this package session.");
      setMessage("Package session booked. It will appear in your upcoming appointments.");
      setSlots([]);
      setActivePackageId(null);
      setSelectedSlot(null);
      setCheckIn(defaultCheckIn);
      onBooked();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not book this package session.");
    } finally {
      setBookingSlot(null);
    }
  }

  return (
    <div className="panel stack">
      <div className="section-heading" style={{ marginBottom: 0 }}>
        <h2>Session packages</h2>
        <p className="muted">Use your paid bundle credits to book follow-up sessions without paying again.</p>
      </div>
      {packages.map((pack) => {
        const progress = pack.totalSessions ? Math.round((pack.usedSessions / pack.totalSessions) * 100) : 0;
        const canBook = pack.remainingSessions > 0 && pack.status !== "complete";
        return (
          <article key={pack.id} className="panel" style={{ boxShadow: "none" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div>
                <strong style={{ display: "block", color: "var(--color-text-primary)" }}>{pack.title}</strong>
                <span className="muted" style={{ fontSize: "var(--text-sm)" }}>
                  {pack.patientName} · {pack.usedSessions} of {pack.totalSessions} used · {pack.remainingSessions} remaining
                </span>
              </div>
              {canBook ? (
                <button type="button" className="button small" onClick={() => loadSlots(pack.id)}>
                  Book next session
                </button>
              ) : (
                <span className="pill-link" aria-label="Package complete">Complete</span>
              )}
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "var(--color-border)", overflow: "hidden", marginTop: "0.875rem" }}>
              <span style={{ display: "block", width: `${Math.min(100, progress)}%`, height: "100%", background: "var(--color-primary)" }} />
            </div>
            {activePackageId === pack.id && (
              <div className="stack" style={{ marginTop: "1rem" }}>
                {loadingSlots ? <p className="muted">Loading available follow-up times...</p> : null}
                {slots.length > 0 ? (
                  <>
                    <div>
                      <strong style={{ display: "block", color: "var(--color-text-primary)", marginBottom: "0.5rem" }}>
                        Choose a follow-up time
                      </strong>
                      <div className="book-chip-row" role="group" aria-label="Package follow-up times">
                        {slots.map((iso) => (
                          <button
                            key={iso}
                            type="button"
                            aria-pressed={selectedSlot === iso}
                            className={`book-chip${selectedSlot === iso ? " is-selected" : ""}`}
                            disabled={bookingSlot === iso}
                            onClick={() => setSelectedSlot(iso)}
                          >
                            {slotLabel(iso)}
                          </button>
                        ))}
                      </div>
                    </div>
                    {selectedSlot ? (
                      <div className="panel stack" style={{ boxShadow: "none", background: "var(--color-bg)" }}>
                        <div>
                          <strong style={{ display: "block", color: "var(--color-text-primary)" }}>
                            Quick follow-up check-in
                          </strong>
                          <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "var(--text-sm)" }}>
                            This replaces the full assessment for package follow-ups and helps your physio prepare.
                          </p>
                        </div>
                        <label className="book-label">
                          Pain today: {checkIn.painScore}/10
                          <input
                            type="range"
                            min={0}
                            max={10}
                            value={checkIn.painScore}
                            onChange={(event) => setCheckIn((current) => ({ ...current, painScore: Number(event.target.value) }))}
                          />
                        </label>
                        <div className="book-chip-row" role="group" aria-label="Progress since last session">
                          {[
                            ["better", "Better"],
                            ["same", "Same"],
                            ["worse", "Worse"],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              className={`book-chip${checkIn.progress === value ? " is-selected" : ""}`}
                              onClick={() => setCheckIn((current) => ({ ...current, progress: value as PackageCheckIn["progress"] }))}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="book-chip-row" role="group" aria-label="Exercise completion">
                          {[
                            ["yes", "Exercises done"],
                            ["partly", "Some done"],
                            ["no", "Not done"],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              className={`book-chip${checkIn.exercises === value ? " is-selected" : ""}`}
                              onClick={() => setCheckIn((current) => ({ ...current, exercises: value as PackageCheckIn["exercises"] }))}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <label className="book-checkbox" style={{ alignItems: "flex-start" }}>
                          <input
                            type="checkbox"
                            checked={checkIn.newSymptoms}
                            onChange={(event) => setCheckIn((current) => ({ ...current, newSymptoms: event.target.checked }))}
                          />
                          <span>New or worsening symptoms since the last session</span>
                        </label>
                        <label className="book-label">
                          What changed since last time?
                          <textarea
                            className="book-input"
                            rows={3}
                            value={checkIn.changeNote}
                            onChange={(event) => setCheckIn((current) => ({ ...current, changeNote: event.target.value }))}
                            placeholder="Short update: pain, function, flare-ups, exercise response..."
                          />
                        </label>
                        <label className="book-label">
                          What should we focus on in this session?
                          <textarea
                            className="book-input"
                            rows={3}
                            value={checkIn.focus}
                            onChange={(event) => setCheckIn((current) => ({ ...current, focus: event.target.value }))}
                            placeholder="Example: walking tolerance, shoulder movement, exercise progression..."
                          />
                        </label>
                        <button
                          type="button"
                          className="button"
                          disabled={bookingSlot === selectedSlot}
                          onClick={() => bookPackageSlot(pack.id)}
                        >
                          {bookingSlot === selectedSlot ? "Booking..." : "Confirm included session"}
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            )}
          </article>
        );
      })}
      {message ? <p className="muted" role="status">{message}</p> : null}
    </div>
  );
}
