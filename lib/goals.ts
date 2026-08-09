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

// Every whole-number divisor of streakTarget that is a meaningful pain-checkin
// interval: excludes 1 (checking in every single day defeats the point of a
// periodic checkpoint) and streakTarget itself (a single checkpoint at the very
// end isn't a recurring cadence). Pure function — used to populate the admin
// interval <select> and to validate what the admin submits.
export function getValidCheckinIntervals(streakTarget: number): number[] {
  if (!Number.isInteger(streakTarget) || streakTarget < 2) return [];
  const divisors: number[] = [];
  for (let n = 2; n < streakTarget; n += 1) {
    if (streakTarget % n === 0) divisors.push(n);
  }
  return divisors;
}

// The doctor-set pain check-in cadence for this person, in days, or null when
// the feature isn't enabled for them.
export async function getPainCheckinInterval(uid: string, personId: string): Promise<number | null> {
  const snap = await getDoc(goalRef(uid, personId));
  if (!snap.exists()) return null;
  const interval = snap.data().painCheckinInterval;
  return typeof interval === "number" && Number.isFinite(interval) ? interval : null;
}

// Which "attempt" of the streak the pain-checkin cycle is currently on. Bumped
// server-side (Cloud Function) whenever the exercise streak resets to 0, so
// past runs' checkpoint history never collides with the new run's day numbers.
// Defaults to 0 for anyone who hasn't had a reset yet (or has no goal doc).
export async function getCurrentRun(uid: string, personId: string): Promise<number> {
  const snap = await getDoc(goalRef(uid, personId));
  if (!snap.exists()) return 0;
  const run = snap.data().currentRun;
  return typeof run === "number" && Number.isFinite(run) ? run : 0;
}

// Admin-only write (enforced by firestore.rules). Clamped to a positive integer
// so a stray NaN/0/negative value never lands in Firestore.
//
// painCheckinInterval is optional and tri-state:
//   - omitted (undefined): leave whatever is already stored untouched
//   - a valid divisor of `target` (not 1, not `target`): sets the cadence
//   - null: explicitly clears/disables the feature for this patient
export async function setStreakGoal(
  uid: string,
  personId: string,
  target: number,
  adminUid: string,
  painCheckinInterval?: number | null
): Promise<void> {
  if (!Number.isInteger(target) || target < 1) {
    throw new Error("Streak goal must be a whole number of at least 1 day.");
  }
  if (painCheckinInterval != null) {
    const valid = getValidCheckinIntervals(target);
    if (!valid.includes(painCheckinInterval)) {
      throw new Error(
        `Pain check-in interval must evenly divide the streak goal (valid: ${valid.join(", ") || "none"}).`
      );
    }
  }
  const data: Record<string, unknown> = {
    streakTarget: target,
    updatedBy: adminUid,
    updatedAt: serverTimestamp(),
  };
  if (painCheckinInterval !== undefined) {
    data.painCheckinInterval = painCheckinInterval;
  }
  await setDoc(goalRef(uid, personId), data, { merge: true });
}
