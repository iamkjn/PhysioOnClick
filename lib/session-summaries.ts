import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SessionSummary {
  id: string;
  bookingId: string;
  patientName: string;
  workedOn: string;
  exercises: string;
  nextSteps: string;
  followUpWeeks: number;
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
    publishedAt: ts?.toDate ? ts.toDate() : new Date(),
  };
}
