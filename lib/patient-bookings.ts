import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    patientName: (data.patientName as string) ?? "Patient",
    patientAvatarUrl: data.patientAvatarUrl as string | undefined,
    service: (data.service as string) ?? "Session",
    sessionDate: date,
    status: (data.status as BookingRecord["status"]) ?? "upcoming",
    summaryId: data.summaryId as string | undefined,
    paid: data.paid === true,
    assessmentCompletedAt: resolveAssessmentCompletedAt(data),
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

export async function getBooking(id: string): Promise<BookingRecord | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "bookings", id));
  if (!snap.exists()) return null;
  return toBookingRecord(snap.id, snap.data() as Record<string, unknown>);
}
