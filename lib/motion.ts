// lib/motion.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { todayKey } from "@/lib/recovery";
import { DEFAULT_MOTION_TARGETS, type MotionTarget } from "@/lib/motion-targets";
import { DEFAULT_FACE_TARGETS, type FaceTarget } from "@/lib/face-targets";

export type MotionSession = {
  exerciseId: string;
  bodyPart: string;
  date: string;
  reps: number;
  repTarget: number;
  romMin: number;
  romMax: number;
  targetRomMin: number;
  targetRomMax: number;
  avgQuality: number;
  passed: boolean;
  durationSec: number;
  source: "web" | "mobile";
  // Discriminates body-joint sessions ("body", the default for any legacy doc
  // written before facial tracking existed) from facial-symmetry sessions.
  kind?: "body" | "face";
  // Facial-only fields, present when kind === "face". Body sessions omit them.
  symmetryAvg?: number; // 0–100, left/right evenness averaged over the session
  weakerSide?: "left" | "right" | "even";
  leftRangePct?: number; // 0–100 best per-side activation
  rightRangePct?: number;
  createdAt?: unknown;
};

function personBase(uid: string, personId: string) {
  if (!db) throw new Error("Firestore not available");
  return doc(db, "patients", uid, "people", personId);
}

export async function getMotionTarget(exerciseId: string): Promise<MotionTarget | null> {
  if (!db) throw new Error("Firestore not available");
  const ref = doc(db, "exerciseMotionTargets", exerciseId);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as MotionTarget;
  return DEFAULT_MOTION_TARGETS[exerciseId] ?? null;
}

export async function saveMotionTarget(target: MotionTarget, adminUid: string): Promise<void> {
  if (!db) throw new Error("Firestore not available");
  const ref = doc(db, "exerciseMotionTargets", target.exerciseId);
  await setDoc(
    ref,
    { ...target, updatedAt: serverTimestamp(), updatedBy: adminUid },
    { merge: true }
  );
}

export async function getFaceMotionTarget(exerciseId: string): Promise<FaceTarget | null> {
  if (!db) throw new Error("Firestore not available");
  const ref = doc(db, "faceMotionTargets", exerciseId);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as FaceTarget;
  return DEFAULT_FACE_TARGETS[exerciseId] ?? null;
}

export async function saveMotionSession(
  uid: string,
  personId: string,
  s: Omit<MotionSession, "createdAt" | "source">
): Promise<void> {
  // Both writes go in one batch so a session is never recorded without the
  // day's exercise being marked complete (which feeds the streak) — either
  // both land or neither does, instead of the two sequential writes racing
  // a mid-flight failure/reload.
  if (!db) throw new Error("Firestore not available");
  const base = personBase(uid, personId);
  const batch = writeBatch(db);

  const sessionRef = doc(collection(base, "motionSessions"));
  batch.set(sessionRef, {
    ...s,
    source: "web",
    createdAt: serverTimestamp(),
  });

  const logRef = doc(base, "exerciseLogs", todayKey());
  batch.set(
    logRef,
    { completions: { [s.exerciseId]: true }, loggedAt: serverTimestamp() },
    { merge: true }
  );

  await batch.commit();
}

export async function getMotionSessions(
  uid: string,
  personId: string,
  max = 20
): Promise<MotionSession[]> {
  const base = personBase(uid, personId);
  const col = collection(base, "motionSessions");
  const snap = await getDocs(query(col, orderBy("createdAt", "desc"), limit(max)));
  return snap.docs.map((d) => d.data() as MotionSession);
}
