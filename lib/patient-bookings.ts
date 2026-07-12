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
}

function toBookingRecord(id: string, data: Record<string, unknown>): BookingRecord {
  const ts = data.sessionDate as { toDate?: () => Date } | undefined;
  const date = ts?.toDate ? ts.toDate() : new Date();
  return {
    id,
    patientName: (data.patientName as string) ?? "Patient",
    patientAvatarUrl: data.patientAvatarUrl as string | undefined,
    service: (data.service as string) ?? "Session",
    sessionDate: date,
    status: (data.status as BookingRecord["status"]) ?? "upcoming",
    summaryId: data.summaryId as string | undefined,
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
