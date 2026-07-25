// lib/motion.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { todayKey } from "@/lib/recovery";
import { DEFAULT_MOTION_TARGETS, type MotionTarget } from "@/lib/motion-targets";

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

export async function saveMotionSession(
  uid: string,
  personId: string,
  s: Omit<MotionSession, "createdAt" | "source">
): Promise<void> {
  const base = personBase(uid, personId);
  await addDoc(collection(base, "motionSessions"), {
    ...s,
    source: "web",
    createdAt: serverTimestamp(),
  });

  const logRef = doc(base, "exerciseLogs", todayKey());
  await setDoc(
    logRef,
    { completions: { [s.exerciseId]: true }, loggedAt: serverTimestamp() },
    { merge: true }
  );
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
