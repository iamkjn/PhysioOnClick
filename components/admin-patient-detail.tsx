// components/admin-patient-detail.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { Activity, CalendarDays, ClipboardCheck, FileText } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { getPatientBookings, displayBookingStatus, type BookingRecord } from "@/lib/patient-bookings";
import { getSessionSummary, type SessionSummary } from "@/lib/session-summaries";
import { cancelCalBooking } from "@/app/admin/actions";
import { calcAge } from "@/lib/age";
import { formatPersonName } from "@/lib/name-format";
import { Avatar } from "@/components/avatar";
import { PersonSwitcher } from "@/components/person-switcher";
import { AdminRecoverySummary } from "@/components/admin-recovery-summary";
import { AdminRecoveryChart } from "@/components/admin-recovery-chart";
import { AdminExerciseAssigner } from "@/components/admin-exercise-assigner";
import { AdminAssessmentReview } from "@/components/admin-assessment-review";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface Props {
  patientUid: string;
  // Deep link from the patients list: preselect this dependent instead of the
  // primary account holder.
  initialPersonId?: string;
}

interface PatientRecord {
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoUrl?: string;
  dob?: string;
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

const displayStatus = displayBookingStatus;

export function AdminPatientDetail({ patientUid, initialPersonId }: Props) {
  const toast = useToast();

  // ── Patient + active person ──────────────────────────────────────────
  const [patient, setPatient] = useState<PatientRecord | null | undefined>(undefined);
  const [person, setPerson] = useState<Person>(() => ({
    id: initialPersonId && initialPersonId !== patientUid ? initialPersonId : patientUid,
    name: "",
  }));

  // `initialPersonId` arrives from the page a tick after mount (it's read in an
  // effect there). Re-target to the deep-linked dependent when it does; the
  // PersonSwitcher fills the name in once its dependents load.
  useEffect(() => {
    if (initialPersonId && initialPersonId !== patientUid) {
      setPerson((prev) => (prev.id === initialPersonId ? prev : { id: initialPersonId, name: "" }));
    }
  }, [initialPersonId, patientUid]);

  useEffect(() => {
    let live = true;
    setPatient(undefined);
    if (!db) { setPatient(null); return; }
    getDoc(doc(db, "patients", patientUid))
      .then((snap) => {
        if (!live) return;
        if (!snap.exists()) { setPatient(null); return; }
        const data = snap.data();
        const displayName = formatPersonName(data.displayName as string | undefined, "Unnamed");
        setPatient({
          displayName,
          email: (data.email as string) || "",
          phoneNumber: (data.phoneNumber as string) || undefined,
          photoUrl: (data.photoUrl as string) || undefined,
          dob: (data.dob as string) || undefined,
        });
        // Only claim the "primary" slot if we're not already viewing a
        // deep-linked dependent (PersonSwitcher fills that name in once its
        // dependents load).
        setPerson((prev) => (prev.id === patientUid ? { id: patientUid, name: displayName } : prev));
      })
      .catch(() => { if (live) setPatient(null); });
    return () => { live = false; };
  }, [patientUid]);

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
    // Ascending key order then slice/reverse in memory: the Firestore emulator
    // rejects descending key scans, so orderBy("__name__","desc") errored locally.
    const q = query(col, orderBy("__name__"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAssessments(
          snap.docs.slice(-20).reverse().map((d) => {
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

  // ── Assessment-form linkage, reported up by AdminAssessmentReview so we
  // can flag bookings that are still awaiting a submitted assessment ──────
  const [linkedBookingIds, setLinkedBookingIds] = useState<string[]>([]);
  // Memoized so it's a stable reference across renders that don't change
  // `bookings` — an inline `.map()` here recreated the array on every render,
  // which (combined with AdminAssessmentReview's own derived-forms memo)
  // caused an infinite render loop. See admin-assessment-review.tsx.
  const assessmentBookings = useMemo(
    () => bookings?.map((b) => ({ id: b.id, service: b.service, sessionDate: b.sessionDate, status: b.status })),
    [bookings]
  );
  const awaitingAssessment = (bookings ?? []).some(
    (b) => b.paid && displayStatus(b) === "upcoming" && !linkedBookingIds.includes(b.id)
  );

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

  const adminUid = auth?.currentUser?.uid ?? "";
  const bookingCounts = useMemo(() => {
    const rows = bookings ?? [];
    return {
      upcoming: rows.filter((b) => displayStatus(b) === "upcoming").length,
      completed: rows.filter((b) => displayStatus(b) === "completed").length,
      cancelled: rows.filter((b) => displayStatus(b) === "cancelled").length,
    };
  }, [bookings]);
  const latestAssessment = assessments?.[0];

  // Exercises can only be *assigned* from this screen while the patient has a
  // submitted online assessment AND a completed session whose summary is still
  // to be written — assigning belongs to that write-up step. Otherwise the
  // panel is a read-only view of the current plan (edit it on /admin/recovery).
  const hasSubmittedAssessment = linkedBookingIds.length > 0;
  const hasPendingSummary = (bookings ?? []).some(
    (b) => displayStatus(b) === "completed" && summaries[b.id] === null
  );
  const canAssignExercises = hasSubmittedAssessment && hasPendingSummary;
  const assignReadOnlyReason = !hasSubmittedAssessment
    ? "Read-only — no online assessment has been submitted yet. Assign exercises on the Recovery management screen if needed."
    : "Read-only — every completed session has a summary. Assign exercises while writing a session summary, or on the Recovery management screen.";

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
        <p className="muted" style={{ fontSize: "var(--text-sm)" }}>This patient record couldn&apos;t be found.</p>
      </div>
    );
  }

  const activePersonName = formatPersonName(
    person.id === patientUid ? patient.displayName : person.name,
    patient.displayName
  );
  const patientAge = calcAge(patient.dob);

  return (
    <div className="admin-patient-detail">
      <section className="admin-patient-hero" aria-labelledby="admin-patient-title">
        <div className="admin-patient-identity">
          <Avatar name={activePersonName} imageUrl={patient.photoUrl} size={64} />
          <div>
            <span className="dashboard-eyebrow">Patient record</span>
            <h1 id="admin-patient-title">{activePersonName}</h1>
            <p>
              Account holder: {patient.displayName}
              {person.id !== patientUid ? " · Dependent profile" : ""}
            </p>
          </div>
        </div>

        <div className="admin-patient-actions">
          <PersonSwitcher
            key={patientUid}
            uid={patientUid}
            displayName={patient.displayName}
            label="Viewing records for:"
            initialPersonId={initialPersonId}
            onSelect={(id, name) => setPerson({ id, name: formatPersonName(name, "") })}
            alwaysShow
          />
          <div className="admin-patient-contact" aria-label="Patient contact details">
            <span>{patient.email || "No email"}</span>
            {patient.phoneNumber ? <span>{patient.phoneNumber}</span> : null}
            {patientAge !== null ? <span>{patientAge} yrs</span> : null}
          </div>
        </div>
      </section>

      <section className="admin-patient-kpis" aria-label="Patient summary">
        <div className="admin-patient-kpi">
          <CalendarDays aria-hidden="true" />
          <span>Upcoming</span>
          <strong>{bookings ? bookingCounts.upcoming : "..."}</strong>
        </div>
        <div className="admin-patient-kpi">
          <ClipboardCheck aria-hidden="true" />
          <span>Completed</span>
          <strong>{bookings ? bookingCounts.completed : "..."}</strong>
        </div>
        <div className="admin-patient-kpi">
          <Activity aria-hidden="true" />
          <span>Latest pain</span>
          <strong>{latestAssessment ? `${latestAssessment.painScore}/10` : "None"}</strong>
        </div>
        <div className="admin-patient-kpi">
          <FileText aria-hidden="true" />
          <span>Forms</span>
          <strong>{linkedBookingIds.length}</strong>
        </div>
      </section>

      {/* 1. Recovery summary — ring, streak, adherence, latest self-reported pain */}
      <AdminRecoverySummary patientUid={patientUid} personId={person.id} />

      {/* 2. Pain trend */}
      <AdminRecoveryChart patientUid={patientUid} personId={person.id} />

      {/* 3. Bookings */}
      <div className="panel admin-patient-card stack">
        <div className="admin-patient-section-head">
          <div>
            <span className="dashboard-eyebrow">Appointments</span>
            <h2>Bookings</h2>
          </div>
          {bookings ? (
            <span className="dashboard-table-count">
              {bookingCounts.upcoming} upcoming · {bookingCounts.cancelled} cancelled
            </span>
          ) : null}
        </div>
        {bookingsError && (
          <p role="alert" style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: 0 }}>Could not load bookings.</p>
        )}
        {!bookings ? (
          <SkeletonRow count={3} />
        ) : bookings.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>No bookings for {person.name ? formatPersonName(person.name) : "this person"} yet.</p>
        ) : (
          <div className="admin-patient-bookings">
            {bookings.map((b) => {
              const status = displayStatus(b);
              return (
              <div
                key={b.id}
                className="admin-patient-booking-row"
              >
                <span className="admin-patient-booking-icon" aria-hidden="true">
                  <CalendarDays />
                </span>
                <div>
                  <strong>{b.service}</strong>
                  <span>
                    {b.sessionDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="admin-patient-row-actions">
                  <span className={BOOKING_STATUS_CLASS[status]}>{BOOKING_STATUS_LABEL[status]}</span>
                  <Link href={`/admin/session/${b.id}`} className="button small">
                    View
                  </Link>
                  {linkedBookingIds.includes(b.id) && (
                    <Link href={`/admin/session/${b.id}#self-assessment`} className="button small secondary">
                      Assessment
                    </Link>
                  )}
                  {status === "upcoming" && b.calBookingUid && (
                    <button
                      type="button"
                      className="button small admin-danger-button"
                      disabled={cancelling === b.id}
                      onClick={() => setCancelTarget({ id: b.id, calBookingUid: b.calBookingUid!, label: b.service })}
                    >
                      {cancelling === b.id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Clinical assessments (history only — recording an assessment lives
          on /admin/recovery, not on this screen) */}
      <section>
        <div className="panel admin-patient-card stack">
          <div className="admin-patient-section-head">
            <div>
              <span className="dashboard-eyebrow">Clinical history</span>
              <h2>Clinical assessments</h2>
            </div>
          </div>
          {!assessments ? (
            <SkeletonRow count={2} />
          ) : assessments.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>No assessments recorded yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "var(--space-2)" }}>
              {assessments.map((a) => (
                <div key={a.date} className="admin-patient-clinical-row">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", fontSize: "var(--text-xs)" }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>{a.date}</strong>
                    <span className="muted">Pain {a.painScore}/10 · Mobility {a.mobilityScore}/10</span>
                  </div>
                  {a.physioNotes && (
                    <p className="muted" style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)" }}>{a.physioNotes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Patient assessment forms and check-ups */}
      {awaitingAssessment && (
        <span className="dashboard-status-pill status-pending" style={{ justifySelf: "start" }}>
          Awaiting assessment
        </span>
      )}
      <section id="self-assessment-history" className="admin-assessment-anchor">
        <AdminAssessmentReview
          patientUid={patientUid}
          personId={person.id}
          bookings={assessmentBookings}
          onFormsChange={setLinkedBookingIds}
        />
      </section>

      {/* 6. Assigned exercises */}
      {adminUid && (
        <AdminExerciseAssigner
          adminUid={adminUid}
          patientUid={patientUid}
          personId={person.id}
          readOnly={!canAssignExercises}
          readOnlyReason={assignReadOnlyReason}
        />
      )}

      {/* 7. Session summaries */}
      <div className="panel admin-patient-card stack">
        <div className="admin-patient-section-head">
          <div>
            <span className="dashboard-eyebrow">Clinical notes</span>
            <h2>Session summaries</h2>
          </div>
        </div>
        {!bookings ? (
          <SkeletonRow count={2} />
        ) : bookings.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>No bookings to summarise yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {bookings.map((b) => {
              const summary = summaries[b.id];
              const status = displayStatus(b);
              return (
                <div key={b.id} className="admin-patient-summary-row">
                  <div className="admin-patient-summary-head">
                    <strong>
                      {b.service} · {b.sessionDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </strong>
                    {status !== "cancelled" && summary === null && (
                      // "Start Session" is the only way to add a summary now — it opens
                      // the full screening -> self-tests -> diagnosis -> exercises ->
                      // summary wizard. The old one-shot "Write summary" quick form was
                      // retired and its fields merged into this wizard's Summary step.
                      // See components/start-session-flow.tsx.
                      <Link href={`/admin/session/${b.id}/start`} className="summary-trigger">
                        Start Session
                      </Link>
                    )}
                  </div>
                  {summary && (
                    <div className="admin-patient-summary-body">
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
                    <p className="muted" style={{ margin: "0.4rem 0 0", fontSize: "var(--text-xs)" }}>Loading…</p>
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
        body={cancelTarget ? `This cancels ${person.name ? formatPersonName(person.name) : "this patient"}'s "${cancelTarget.label}" appointment via Cal.com. This can't be undone from here.` : ""}
        confirmLabel="Cancel booking"
        confirmVariant="destructive"
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => void handleCancelConfirm()}
      />
    </div>
  );
}
