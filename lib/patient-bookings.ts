import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatPersonName } from "@/lib/name-format";

export interface BookingRecord {
  id: string;
  patientName: string;
  patientAvatarUrl?: string;
  service: string;
  sessionDate: Date;
  status: "upcoming" | "completed" | "cancelled";
  summaryId?: string;
  paid: boolean;
  assessmentCompletedAt: Date | null;
  assessmentFormId?: string;
  // Owning account + person, so an admin screen that only has a bookingId
  // (e.g. app/admin/session/[bookingId]/page.tsx, reached from a notification)
  // can look up the rest of that person's history without a second read.
  bookedBy?: string;
  patientId?: string;
}

// Resolve the booking's start moment from whatever the writer stored. The
// Cal webhook and appointments/sync both write a `sessionDate` Timestamp AND
// `appointmentDate`+`appointmentTime` strings, but seeded and legacy bookings
// can be missing the Timestamp. The old code defaulted a missing/invalid
// Timestamp to `new Date()` (now) — which then compared equal-or-later against
// the render-time `new Date()` in resolveStatus and made past appointments
// read as "upcoming" forever. Prefer the Timestamp, fall back to parsing the
// string fields (stored as London-local "YYYY-MM-DD" + "HH:MM"), and only as a
// last resort use the epoch so an undateable booking sorts to the past rather
// than masquerading as upcoming.
function resolveSessionDate(data: Record<string, unknown>): Date {
  const ts = data.sessionDate as { toDate?: () => Date } | undefined;
  if (ts?.toDate) {
    const d = ts.toDate();
    if (!Number.isNaN(d.getTime())) return d;
  }
  const day = typeof data.appointmentDate === "string" ? data.appointmentDate : "";
  const time = typeof data.appointmentTime === "string" ? data.appointmentTime : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    const d = new Date(`${day}T${/^\d{2}:\d{2}$/.test(time) ? time : "00:00"}`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

function resolveAssessmentCompletedAt(data: Record<string, unknown>): Date | null {
  const ts = data.assessmentCompletedAt as { toDate?: () => Date } | undefined;
  if (ts?.toDate) {
    const d = ts.toDate();
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function toBookingRecord(id: string, data: Record<string, unknown>): BookingRecord {
  const date = resolveSessionDate(data);
  return {
    id,
    patientName: formatPersonName(data.patientName as string | undefined),
    patientAvatarUrl: data.patientAvatarUrl as string | undefined,
    service: (data.service as string) ?? "Session",
    sessionDate: date,
    status: (data.status as BookingRecord["status"]) ?? "upcoming",
    summaryId: data.summaryId as string | undefined,
    paid: data.paid === true,
    assessmentCompletedAt: resolveAssessmentCompletedAt(data),
    assessmentFormId: typeof data.assessmentFormId === "string" ? data.assessmentFormId : undefined,
    bookedBy: typeof data.bookedBy === "string" ? data.bookedBy : undefined,
    patientId: typeof data.patientId === "string" ? data.patientId : undefined,
  };
}

export async function getPatientBookings(userId: string, personId?: string): Promise<BookingRecord[]> {
  if (!db) return [];
  const constraints = [where("bookedBy", "==", userId)];
  if (personId) constraints.push(where("patientId", "==", personId));
  const q = query(
    collection(db, "bookings"),
    ...constraints,
    orderBy("sessionDate", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toBookingRecord(d.id, d.data() as Record<string, unknown>));
}

// The stored `status` field is only ever written as "upcoming" or
// "cancelled" (see app/api/cal-webhook/route.ts) — "completed" is always
// derived from the session date having passed. Any screen that shows or
// filters on booking status should go through this, not the raw field
// (admin-patient-detail.tsx, admin-session-view.tsx, admin-upcoming-sessions.tsx,
// app/patient/appointments/page.tsx, and admin-bookings-table.tsx all rely on it).
export function displayBookingStatus(b: Pick<BookingRecord, "status" | "sessionDate">): BookingRecord["status"] {
  if (b.status === "cancelled") return "cancelled";
  return b.sessionDate < new Date() ? "completed" : "upcoming";
}

export async function getBooking(id: string): Promise<BookingRecord | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "bookings", id));
  if (!snap.exists()) return null;
  return toBookingRecord(snap.id, snap.data() as Record<string, unknown>);
}

// For the admin "Upcoming Sessions" overview (app/admin/sessions/page.tsx):
// every upcoming booking across all patients, soonest first. Unlike
// getPatientBookings above, this deliberately isn't scoped to one
// bookedBy/patientId pair — it needs the status+sessionDate composite index
// in firestore.indexes.json (added alongside this helper).
export async function getUpcomingBookingsAcrossPatients(max = 100): Promise<BookingRecord[]> {
  if (!db) return [];
  const q = query(
    collection(db, "bookings"),
    where("status", "==", "upcoming"),
    where("sessionDate", ">=", Timestamp.fromDate(new Date())),
    orderBy("sessionDate", "asc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toBookingRecord(d.id, d.data() as Record<string, unknown>));
}
