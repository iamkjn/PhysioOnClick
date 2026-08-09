// lib/pain-checkins.ts
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
  type CollectionReference,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PainCheckinStatus = "pending" | "logged" | "missed";

export interface PainCheckin {
  id: string;
  runNumber: number;
  streakDay: number;
  status: PainCheckinStatus;
  score: number | null;
  note: string;
  loggedAt: Date | null;
}

function personBase(uid: string, personId: string) {
  if (!db) throw new Error("Firestore not available");
  return doc(db, "patients", uid, "people", personId);
}

function checkinsCol(uid: string, personId: string): CollectionReference {
  return collection(personBase(uid, personId), "painCheckins");
}

// Doc id scheme is "{runNumber}_{streakDay}" (e.g. "0_3", "1_6") — see
// sendPainCheckinReminders in functions/src/index.ts, which is the only writer
// of pending/missed checkpoints.
export async function getPainCheckins(uid: string, personId: string): Promise<PainCheckin[]> {
  const snap = await getDocs(query(checkinsCol(uid, personId), orderBy("streakDay")));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      runNumber: (data.runNumber as number) ?? 0,
      streakDay: (data.streakDay as number) ?? 0,
      status: (data.status as PainCheckinStatus) ?? "pending",
      score: typeof data.score === "number" ? data.score : null,
      note: (data.note as string) ?? "",
      loggedAt: (data.loggedAt as { toDate(): Date } | undefined)?.toDate?.() ?? null,
    };
  });
}

// Checkpoints belonging to the current streak "run", oldest-first — what the
// timeline UI renders. Past runs (from before a streak reset) are excluded so
// the strip only ever shows the live cycle.
export function currentRunCheckins(checkins: PainCheckin[], currentRun: number): PainCheckin[] {
  return checkins
    .filter((c) => c.runNumber === currentRun)
    .sort((a, b) => a.streakDay - b.streakDay);
}

// The single checkpoint (if any) the patient can act on right now: pending,
// and belonging to the live run. There is at most one at a time by
// construction (the reminder function only ever has one streakDay outstanding
// per run), but this is written defensively in case that ever changes.
export function findDueCheckin(checkins: PainCheckin[], currentRun: number): PainCheckin | null {
  return checkins.find((c) => c.runNumber === currentRun && c.status === "pending") ?? null;
}

export async function logPainCheckinScore(
  uid: string,
  personId: string,
  checkinId: string,
  score: number,
  note = ""
): Promise<void> {
  if (!Number.isInteger(score) || score < 0 || score > 10) {
    throw new Error("Pain score must be a whole number from 0 to 10.");
  }
  const ref = doc(checkinsCol(uid, personId), checkinId);
  await updateDoc(ref, { status: "logged", score, note, loggedAt: serverTimestamp() });
}
