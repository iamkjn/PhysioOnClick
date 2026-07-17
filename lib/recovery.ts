// lib/recovery.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  type CollectionReference,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PainLog {
  date: string;
  score: number;
  note: string;
  loggedAt: Date;
}

function rawRecoveryPercent(logs: { score: number }[]): number | null {
  if (logs.length === 0) return null;
  const baseline = logs[0].score;
  if (baseline === 0) return null;
  const recent = logs.slice(-3);
  const current = recent.reduce((sum, log) => sum + log.score, 0) / recent.length;
  const pct = Math.round(((baseline - current) / baseline) * 100);
  return Math.min(100, Math.max(-100, pct));
}

export function computeRecoveryPercent(logs: { score: number }[]): number | null {
  const pct = rawRecoveryPercent(logs);
  if (pct === null) return null;
  return Math.max(0, pct);
}

// True when pain is trending worse than the first check-in (raw percent < 0),
// so the UI can distinguish "no change" from "getting worse" even though
// computeRecoveryPercent clamps both to 0.
export function isRecoveryRegressing(logs: { score: number }[]): boolean {
  const pct = rawRecoveryPercent(logs);
  return pct !== null && pct < 0;
}

export interface RecoveryPoint {
  date: string;
  score: number;
}

export async function getRecoveryScoreSeries(
  uid: string,
  personId: string,
  days = 56
): Promise<RecoveryPoint[]> {
  const [painLogs, assessments] = await Promise.all([
    getPainLogs(uid, personId, days),
    getClinicalAssessments(uid, personId, days),
  ]);
  const scoresByDate = new Map<string, number>();
  for (const a of assessments) scoresByDate.set(a.date, a.painScore);
  for (const log of painLogs) scoresByDate.set(log.date, log.score);
  return Array.from(scoresByDate, ([date, score]) => ({ date, score })).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export interface ClinicalAssessment {
  date: string;
  painScore: number;
  mobilityScore: number;
  physioNotes: string;
  sessionId: string;
  recordedAt: Date;
}

export interface AssignedExercise {
  exerciseId: string;
  assignedAt: Date;
  assignedBy: string;
  active: boolean;
}

export interface ExerciseLog {
  date: string;
  completions: Record<string, boolean>;
  loggedAt: Date;
}

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayKey(): string {
  return localDateKey(new Date());
}

// Local-calendar-date key for `n` days ago (0 = today), matching the
// document-id scheme used for painLogs/exerciseLogs. Used to build a
// fixed 7-calendar-day window instead of counting sparse log documents.
export function dateKeyDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateKey(d);
}

function personBase(uid: string, personId: string) {
  if (!db) throw new Error("Firestore not available");
  return doc(db, "patients", uid, "people", personId);
}

// The Firestore emulator rejects orderBy("__name__", "desc") ("Firestore does
// not support descending key scans") even though production allows it — so the
// old descending-scan queries loaded fine against prod but errored against the
// emulator, breaking recovery/exercise views for all local dev. These
// collections hold at most one doc per day (ids are ISO dates, so ascending key
// order is already chronological); fetch ascending (emulator-safe) and take the
// most recent `days` in memory. Same result on emulator and prod, no index.
async function recentByDateKey<T>(
  col: CollectionReference,
  days: number,
  map: (d: QueryDocumentSnapshot) => T,
): Promise<T[]> {
  const snap = await getDocs(query(col, orderBy("__name__")));
  return snap.docs.slice(-days).map(map);
}

export async function logPainScore(
  uid: string,
  personId: string,
  score: number,
  note = ""
): Promise<void> {
  const ref = doc(personBase(uid, personId), "painLogs", todayKey());
  await setDoc(ref, { score, note, loggedAt: serverTimestamp() }, { merge: true });
}

export async function getTodayPainLog(
  uid: string,
  personId: string
): Promise<PainLog | null> {
  const ref = doc(personBase(uid, personId), "painLogs", todayKey());
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    date: snap.id,
    score: d.score as number,
    note: (d.note as string) ?? "",
    loggedAt: (d.loggedAt as { toDate(): Date })?.toDate() ?? new Date(),
  };
}

export async function getPainLogs(
  uid: string,
  personId: string,
  days = 56
): Promise<PainLog[]> {
  return recentByDateKey(collection(personBase(uid, personId), "painLogs"), days, (d) => ({
    date: d.id,
    score: d.data().score as number,
    note: (d.data().note as string) ?? "",
    loggedAt: (d.data().loggedAt as { toDate(): Date })?.toDate() ?? new Date(),
  }));
}

export async function getClinicalAssessments(
  uid: string,
  personId: string,
  days = 56
): Promise<ClinicalAssessment[]> {
  return recentByDateKey(collection(personBase(uid, personId), "clinicalAssessments"), days, (d) => ({
    date: d.id,
    painScore: d.data().painScore as number,
    mobilityScore: d.data().mobilityScore as number,
    physioNotes: (d.data().physioNotes as string) ?? "",
    sessionId: (d.data().sessionId as string) ?? "",
    recordedAt: (d.data().recordedAt as { toDate(): Date })?.toDate() ?? new Date(),
  }));
}

export async function getAssignedExercises(
  uid: string,
  personId: string
): Promise<AssignedExercise[]> {
  const col = collection(personBase(uid, personId), "assignedExercises");
  const snap = await getDocs(col);
  return snap.docs
    .map((d) => ({
      exerciseId: d.id,
      assignedAt: (d.data().assignedAt as { toDate(): Date })?.toDate() ?? new Date(),
      assignedBy: (d.data().assignedBy as string) ?? "",
      active: (d.data().active as boolean) ?? true,
    }))
    .filter((e) => e.active);
}

export async function getTodayExerciseLog(
  uid: string,
  personId: string
): Promise<ExerciseLog | null> {
  const ref = doc(personBase(uid, personId), "exerciseLogs", todayKey());
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return {
    date: snap.id,
    completions: (snap.data().completions as Record<string, boolean>) ?? {},
    loggedAt: (snap.data().loggedAt as { toDate(): Date })?.toDate() ?? new Date(),
  };
}

export async function toggleExerciseCompletion(
  uid: string,
  personId: string,
  exerciseId: string,
  done: boolean
): Promise<void> {
  const ref = doc(personBase(uid, personId), "exerciseLogs", todayKey());
  await setDoc(
    ref,
    { completions: { [exerciseId]: done }, loggedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getExerciseLogs(
  uid: string,
  personId: string,
  days = 7
): Promise<ExerciseLog[]> {
  return recentByDateKey(collection(personBase(uid, personId), "exerciseLogs"), days, (d) => ({
    date: d.id,
    completions: (d.data().completions as Record<string, boolean>) ?? {},
    loggedAt: (d.data().loggedAt as { toDate(): Date })?.toDate() ?? new Date(),
  }));
}

export async function assignExercise(
  uid: string,
  personId: string,
  exerciseId: string,
  physioUid: string
): Promise<void> {
  const ref = doc(personBase(uid, personId), "assignedExercises", exerciseId);
  await setDoc(ref, {
    exerciseId,
    assignedAt: serverTimestamp(),
    assignedBy: physioUid,
    active: true,
  });
}

export async function removeExercise(
  uid: string,
  personId: string,
  exerciseId: string
): Promise<void> {
  const ref = doc(personBase(uid, personId), "assignedExercises", exerciseId);
  await updateDoc(ref, { active: false });
}

export async function addClinicalAssessment(
  uid: string,
  personId: string,
  data: {
    date: string;
    painScore: number;
    mobilityScore: number;
    physioNotes: string;
    sessionId?: string;
  }
): Promise<void> {
  const ref = doc(personBase(uid, personId), "clinicalAssessments", data.date);
  await setDoc(ref, {
    painScore: data.painScore,
    mobilityScore: data.mobilityScore,
    physioNotes: data.physioNotes,
    sessionId: data.sessionId ?? "",
    recordedAt: serverTimestamp(),
  });
}
