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
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PainLog {
  date: string;
  score: number;
  note: string;
  loggedAt: Date;
}

export function computeRecoveryPercent(logs: PainLog[]): number | null {
  if (logs.length === 0) return null;
  const baseline = logs[0].score;
  if (baseline === 0) return null;
  const recent = logs.slice(-3);
  const current = recent.reduce((sum, log) => sum + log.score, 0) / recent.length;
  const pct = Math.round(((baseline - current) / baseline) * 100);
  return Math.min(100, Math.max(0, pct));
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

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function personBase(uid: string, personId: string) {
  if (!db) throw new Error("Firestore not available");
  return doc(db, "patients", uid, "people", personId);
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
  const col = collection(personBase(uid, personId), "painLogs");
  const q = query(col, orderBy("__name__", "desc"), limit(days));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    date: d.id,
    score: d.data().score as number,
    note: (d.data().note as string) ?? "",
    loggedAt: (d.data().loggedAt as { toDate(): Date })?.toDate() ?? new Date(),
  })).reverse();
}

export async function getClinicalAssessments(
  uid: string,
  personId: string,
  days = 56
): Promise<ClinicalAssessment[]> {
  const col = collection(personBase(uid, personId), "clinicalAssessments");
  const q = query(col, orderBy("__name__", "desc"), limit(days));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    date: d.id,
    painScore: d.data().painScore as number,
    mobilityScore: d.data().mobilityScore as number,
    physioNotes: (d.data().physioNotes as string) ?? "",
    sessionId: (d.data().sessionId as string) ?? "",
    recordedAt: (d.data().recordedAt as { toDate(): Date })?.toDate() ?? new Date(),
  })).reverse();
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
  const col = collection(personBase(uid, personId), "exerciseLogs");
  const q = query(col, orderBy("__name__", "desc"), limit(days));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    date: d.id,
    completions: (d.data().completions as Record<string, boolean>) ?? {},
    loggedAt: (d.data().loggedAt as { toDate(): Date })?.toDate() ?? new Date(),
  })).reverse();
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
