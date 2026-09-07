import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getPatientBookings } from "@/lib/patient-bookings";

export interface SessionSummary {
  id: string;
  bookingId: string;
  patientName: string;
  workedOn: string;
  exercises: string;
  nextSteps: string;
  followUpWeeks: number;
  painScore: number;
  recoveryPercent: number;
  publishedAt: Date;
}

export async function getSessionSummary(bookingId: string): Promise<SessionSummary | null> {
  if (!db) return null;
  const q = query(
    collection(db, "sessionSummaries"),
    where("bookingId", "==", bookingId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  const ts = data.publishedAt as { toDate?: () => Date } | undefined;
  return {
    id: d.id,
    bookingId: data.bookingId as string,
    patientName: (data.patientName as string) ?? "",
    workedOn: (data.workedOn as string) ?? "",
    exercises: (data.exercises as string) ?? "",
    nextSteps: (data.nextSteps as string) ?? "",
    followUpWeeks: (data.followUpWeeks as number) ?? 0,
    painScore: (data.painScore as number) ?? 0,
    recoveryPercent: (data.recoveryPercent as number) ?? 0,
    publishedAt: ts?.toDate ? ts.toDate() : new Date(),
  };
}

/**
 * The id of the most recent session summary for a patient (or one of their
 * dependents), or null when they have none yet. `getPatientBookings` already
 * returns bookings newest-first, so this is the first one carrying a
 * `summaryId`. Used to point "Download my plan" at the latest handout.
 */
export async function getLatestSummaryId(
  uid: string,
  personId?: string,
): Promise<string | null> {
  const bookings = await getPatientBookings(uid, personId);
  return bookings.find((b) => b.summaryId)?.summaryId ?? null;
}
