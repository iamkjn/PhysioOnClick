// components/admin-patient-detail.tsx
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getPatientBookings, type BookingRecord } from "@/lib/patient-bookings";
import { getSessionSummary, type SessionSummary } from "@/lib/session-summaries";
import { getPainLogs, type PainLog } from "@/lib/recovery";
import { cancelCalBooking } from "@/app/admin/actions";
import { Avatar } from "@/components/avatar";
import { PersonSwitcher } from "@/components/person-switcher";
import { RecoveryPercentCard } from "@/components/recovery-percent-card";
import { AdminRecoveryChart } from "@/components/admin-recovery-chart";
import { AdminClinicalEntry } from "@/components/admin-clinical-entry";
import { AdminExerciseAssigner } from "@/components/admin-exercise-assigner";
import { SummaryForm } from "@/components/summary-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Skeleton, SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface Props {
  patientUid: string;
}

interface PatientRecord {
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoUrl?: string;
}

interface Person {
  id: string;
  name: string;
}

// getPatientBookings() doesn't expose calBookingUid/patientType (cancel and
// the session-summary form both need them), so each row is enriched with a
// direct read of its own booking doc right after the list loads.
interface AdminBookingRow extends BookingRecord {
  calBookingUid?: string;
  patientType: string;
}

interface AssessmentRow {
  date: string;
  painScore: number;
  mobilityScore: number;
  physioNotes: string;
}

const BOOKING_STATUS_LABEL: Record<AdminBookingRow["status"], string> = {
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
};

const BOOKING_STATUS_CLASS: Record<AdminBookingRow["status"], string> = {
  upcoming: "dashboard-status-pill",
  completed: "dashboard-status-pill status-confirmed",
  cancelled: "dashboard-status-pill status-cancelled",
};

// The stored `status` field is only ever written as "upcoming" or
// "cancelled" (see app/api/cal-webhook/route.ts) — "completed" is always
// derived from the session date having passed, same as
// app/patient/appointments/page.tsx and admin-bookings-table.tsx do.
function displayStatus(b: AdminBookingRow): AdminBookingRow["status"] {
  if (b.status === "cancelled") return "cancelled";
  return b.sessionDate < new Date() ? "completed" : "upcoming";
}

export function AdminPatientDetail({ patientUid }: Props) {
  const toast = useToast();

  // ── Patient + active person ──────────────────────────────────────────
  const [patient, setPatient] = useState<PatientRecord | null | undefined>(undefined);
  const [person, setPerson] = useState<Person>({ id: patientUid, name: "" });

  useEffect(() => {
    let live = true;
    setPatient(undefined);
    setPerson({ id: patientUid, name: "" });
    if (!db) { setPatient(null); return; }
    getDoc(doc(db, "patients", patientUid))
      .then((snap) => {
        if (!live) return;
        if (!snap.exists()) { setPatient(null); return; }
        const data = snap.data();
        const displayName = (data.displayName as string) || "Unnamed";
        setPatient({
          displayName,
          email: (data.email as string) || "",
          phoneNumber: (data.phoneNumber as string) || undefined,
          photoUrl: (data.photoUrl as string) || undefined,
        });
        setPerson({ id: patientUid, name: displayName });
      })
      .catch(() => { if (live) setPatient(null); });
    return () => { live = false; };
  }, [patientUid]);

  // ── Current pain number (most recent self-reported log) ─────────────
  const [latestPain, setLatestPain] = useState<PainLog | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    setLatestPain(undefined);
    getPainLogs(patientUid, person.id, 1)
      .then((logs) => { if (live) setLatestPain(logs[0] ?? null); })
      .catch(() => { if (live) setLatestPain(null); });
    return () => { live = false; };
  }, [patientUid, person.id]);

  // ── Bookings ──────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState<AdminBookingRow[] | null>(null);
  const [bookingsError, setBookingsError] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; calBookingUid: string; label: string } | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setBookings(null);
    setBookingsError(false);
    const isSelf = person.id === patientUid;
    (async () => {
      try {
        const records = await getPatientBookings(patientUid, person.id);
        const database = db;
        if (!database) {
          if (live) setBookings(records.map((r) => ({ ...r, patientType: isSelf ? "self" : "dependent" })));
          return;
        }
        const enriched = await Promise.all(
          records.map(async (r): Promise<AdminBookingRow> => {
            try {
              const snap = await getDoc(doc(database, "bookings", r.id));
              const data = snap.data() as Record<string, unknown> | undefined;
              return {
                ...r,
                calBookingUid: (data?.calBookingUid as string) || undefined,
                patientType: (data?.patientType as string) || (isSelf ? "self" : "dependent"),
              };
            } catch {
              return { ...r, patientType: isSelf ? "self" : "dependent" };
            }
          })
        );
        if (live) setBookings(enriched);
      } catch {
        if (live) { setBookings([]); setBookingsError(true); }
      }
    })();
    return () => { live = false; };
  }, [patientUid, person.id]);

  async function handleCancelConfirm() {
    const target = cancelTarget;
    setCancelTarget(null);
    if (!target) return;
    setCancelling(target.id);
    try {
      const idToken = await auth?.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in");
      await cancelCalBooking(target.calBookingUid, idToken);
      setBookings((prev) => prev?.map((b) => (b.id === target.id ? { ...b, status: "cancelled" as const } : b)) ?? prev);
      toast.show("Booking cancelled.", "success");
    } catch {
      toast.show("Could not cancel this booking. Try again.", "error");
    } finally {
      setCancelling(null);
    }
  }

  // ── Clinical assessments (live, since AdminClinicalEntry below has no
  // onSaved callback — this needs to reflect a new entry the moment it's
  // written) ───────────────────────────────────────────────────────────
  const [assessments, setAssessments] = useState<AssessmentRow[] | null>(null);

  useEffect(() => {
    if (!db) { setAssessments([]); return; }
    setAssessments(null);
    const col = collection(db, "patients", patientUid, "people", person.id, "clinicalAssessments");
    const q = query(col, orderBy("__name__", "desc"), limit(20));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAssessments(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              date: d.id,
              painScore: data.painScore as number,
              mobilityScore: data.mobilityScore as number,
              physioNotes: (data.physioNotes as string) ?? "",
            };
          })
        );
      },
      () => setAssessments([])
    );
    return unsub;
  }, [patientUid, person.id]);

  // ── Session summaries, one per booking ───────────────────────────────
  const [summaries, setSummaries] = useState<Record<string, SessionSummary | null>>({});

  useEffect(() => {
    if (!bookings || bookings.length === 0) return;
    // Only fetch ids not already resolved — `bookings` gets a new array
    // reference after the optimistic cancel update above, which would
    // otherwise re-fetch every summary again for no reason.
    const toFetch = bookings.filter((b) => !(b.id in summaries));
    if (toFetch.length === 0) return;
    let live = true;
    Promise.all(toFetch.map((b) => getSessionSummary(b.id).then((s) => [b.id, s] as const)))
      .then((pairs) => { if (live) setSummaries((prev) => ({ ...prev, ...Object.fromEntries(pairs) })); })
      .catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `summaries` is deliberately omitted: it's only read to skip ids already resolved, and including it would refetch on every publish.
  }, [bookings]);

  function handlePublished(bookingId: string) {
    getSessionSummary(bookingId).then((s) => {
      setSummaries((prev) => ({ ...prev, [bookingId]: s }));
    });
  }

  const adminUid = auth?.currentUser?.uid ?? "";

  // ── Render ────────────────────────────────────────────────────────────
  if (patient === undefined) {
    return (
      <div className="panel stack">
        <SkeletonRow count={4} />
      </div>
    );
  }

  if (patient === null) {
    return (
      <div className="panel stack">
        <p className="muted" style={{ fontSize: 14 }}>This patient record couldn&apos;t be found.</p>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      {/* Header */}
      <div className="panel" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" as const }}>
        <Avatar name={patient.displayName} imageUrl={patient.photoUrl} size={52} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>
            {patient.displayName}
          </h1>
          <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>
            {patient.email}{patient.phoneNumber ? ` · ${patient.phoneNumber}` : ""}
          </p>
        </div>
        <PersonSwitcher
          key={patientUid}
          uid={patientUid}
          displayName={patient.displayName}
          onSelect={(id, name) => setPerson({ id, name })}
          alwaysShow
        />
      </div>

      {/* 1. Recovery summary */}
      <section className="dashboard-grid">
        <RecoveryPercentCard uid={patientUid} personId={person.id} />
        <div className="panel stack" style={{ justifyContent: "center" }}>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Current pain</h3>
          {latestPain === undefined ? (
            <Skeleton height="2rem" width="60%" />
          ) : latestPain === null ? (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>No pain check-ins logged yet.</p>
          ) : (
            <>
              <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 800, color: "var(--color-navy)" }}>
                {latestPain.score}
                <span style={{ fontSize: 16, fontWeight: 400, color: "var(--color-text-secondary)" }}>/10</span>
              </p>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                Logged {latestPain.date}
                {latestPain.note ? ` · “${latestPain.note}”` : ""}
              </p>
            </>
          )}
        </div>
      </section>

      {/* 2. Pain trend */}
      <AdminRecoveryChart patientUid={patientUid} personId={person.id} />

      {/* 3. Bookings */}
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Bookings</h2>
        {bookingsError && (
          <p role="alert" style={{ color: "var(--color-error)", fontSize: 14, margin: 0 }}>Could not load bookings.</p>
        )}
        {!bookings ? (
          <SkeletonRow count={3} />
        ) : bookings.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>No bookings for {person.name || "this person"} yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {bookings.map((b) => {
              const status = displayStatus(b);
              return (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  flexWrap: "wrap" as const,
                  padding: "0.6rem 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 160 }}>
                  <strong style={{ display: "block", fontSize: 14, color: "var(--color-text-primary)" }}>{b.service}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {b.sessionDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <span className={BOOKING_STATUS_CLASS[status]}>{BOOKING_STATUS_LABEL[status]}</span>
                {status === "upcoming" && b.calBookingUid && (
                  <button
                    type="button"
                    className="button small"
                    disabled={cancelling === b.id}
                    onClick={() => setCancelTarget({ id: b.id, calBookingUid: b.calBookingUid!, label: b.service })}
                    style={{
                      background: "none",
                      border: "1.5px solid var(--color-error)",
                      color: "var(--color-error)",
                      padding: "0 10px",
                      fontSize: 13,
                      cursor: cancelling === b.id ? "not-allowed" : "pointer",
                      opacity: cancelling === b.id ? 0.6 : 1,
                    }}
                  >
                    {cancelling === b.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Clinical assessments */}
      <section className="dashboard-grid">
        <div className="panel stack">
          <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Clinical assessments</h2>
          {!assessments ? (
            <SkeletonRow count={2} />
          ) : assessments.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>No assessments recorded yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {assessments.map((a) => (
                <div key={a.date} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", fontSize: 13 }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>{a.date}</strong>
                    <span className="muted">Pain {a.painScore}/10 · Mobility {a.mobilityScore}/10</span>
                  </div>
                  {a.physioNotes && (
                    <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>{a.physioNotes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <AdminClinicalEntry patientUid={patientUid} personId={person.id} />
      </section>

      {/* 5. Assigned exercises */}
      {adminUid && (
        <AdminExerciseAssigner adminUid={adminUid} patientUid={patientUid} personId={person.id} />
      )}

      {/* 6. Session summaries */}
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Session summaries</h2>
        {!bookings ? (
          <SkeletonRow count={2} />
        ) : bookings.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>No bookings to summarise yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {bookings.map((b) => {
              const summary = summaries[b.id];
              const status = displayStatus(b);
              return (
                <div key={b.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" as const }}>
                    <strong style={{ fontSize: 14, color: "var(--color-text-primary)" }}>
                      {b.service} · {b.sessionDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </strong>
                    {status === "completed" && summary === null && (
                      <SummaryForm
                        booking={{ id: b.id, patientId: person.id, patientType: b.patientType, patientName: b.patientName, service: b.service }}
                        onPublished={() => handlePublished(b.id)}
                      />
                    )}
                  </div>
                  {summary && (
                    <div style={{ marginTop: "0.5rem", display: "grid", gap: "0.4rem", fontSize: 13 }}>
                      <p style={{ margin: 0 }}><strong>Worked on:</strong> {summary.workedOn}</p>
                      <p style={{ margin: 0 }}><strong>Exercises:</strong> {summary.exercises}</p>
                      <p style={{ margin: 0 }}><strong>Next steps:</strong> {summary.nextSteps}</p>
                      {summary.followUpWeeks > 0 && (
                        <p className="muted" style={{ margin: 0 }}>
                          Follow-up recommended in {summary.followUpWeeks} week{summary.followUpWeeks > 1 ? "s" : ""}.
                        </p>
                      )}
                    </div>
                  )}
                  {summary === undefined && (
                    <p className="muted" style={{ margin: "0.4rem 0 0", fontSize: 13 }}>Loading…</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={cancelTarget !== null}
        title="Cancel this booking?"
        body={cancelTarget ? `This cancels ${person.name || "this patient"}'s "${cancelTarget.label}" appointment via Cal.com. This can't be undone from here.` : ""}
        confirmLabel="Cancel booking"
        confirmVariant="destructive"
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => void handleCancelConfirm()}
      />
    </div>
  );
}
