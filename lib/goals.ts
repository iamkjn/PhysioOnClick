// lib/goals.ts
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Isolated per-person subcollection at patients/{uid}/people/{personId}/goals/current.
// Mirrors the personBase pattern in lib/recovery.ts; kept private/duplicated here
// rather than imported since recovery.ts doesn't export it.
function personBase(uid: string, personId: string) {
  if (!db) throw new Error("Firestore not available");
  return doc(db, "patients", uid, "people", personId);
}

function goalRef(uid: string, personId: string) {
  return doc(personBase(uid, personId), "goals", "current");
}

// Returns the admin-set daily streak target for this person, or null when no
// goal has been set (or the stored value is somehow not a number).
export async function getStreakGoal(uid: string, personId: string): Promise<number | null> {
  const snap = await getDoc(goalRef(uid, personId));
  if (!snap.exists()) return null;
  const target = snap.data().streakTarget;
  return typeof target === "number" && Number.isFinite(target) ? target : null;
}

// Admin-only write (enforced by firestore.rules). Clamped to a positive integer
// so a stray NaN/0/negative value never lands in Firestore.
export async function setStreakGoal(
  uid: string,
  personId: string,
  target: number,
  adminUid: string
): Promise<void> {
  if (!Number.isInteger(target) || target < 1) {
    throw new Error("Streak goal must be a whole number of at least 1 day.");
  }
  await setDoc(
    goalRef(uid, personId),
    { streakTarget: target, updatedBy: adminUid, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
