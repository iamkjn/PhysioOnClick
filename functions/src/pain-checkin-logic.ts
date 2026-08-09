// functions/src/pain-checkin-logic.ts
//
// Pure decision logic for sendPainCheckinReminders (functions/src/index.ts).
// Kept dependency-free (no firebase-admin imports) so it mirrors
// lib/recovery.ts's computeStreakDays and can be reasoned about/tested in
// isolation from Firestore. Manual verification: see the smoke-test steps in
// the docstring above sendPainCheckinReminders in index.ts.

export type PainCheckinAction =
  | { type: "create"; runNumber: number; streakDay: number }
  | { type: "expire"; streakDay: number }
  | { type: "bumpRun" };

export interface ExistingCheckin {
  streakDay: number;
  status: "pending" | "logged" | "missed";
}

// Decides what Firestore writes (if any) this patient/person needs on today's
// run of the scheduled function, given:
//   - streak: the live exercise-streak day count (0 = broken/not started)
//   - interval: the doctor-set check-in cadence (divides the streak goal)
//   - currentRun: which streak "attempt" the pain-checkin cycle is on
//   - existingCheckins: every checkpoint doc that belongs to currentRun
//
// Rules (mirrors the design spec):
//   1. If the streak has broken (streak === 0) and there's a pending
//      checkpoint for this run, expire it and bump the run counter so the
//      next cycle starts clean at runNumber + 1.
//   2. Otherwise, any pending checkpoint whose grace day has passed (the live
//      streak has moved more than one day beyond it) is expired — logging is
//      only allowed the day a checkpoint becomes due or the following day.
//   3. If the streak just landed on a fresh multiple of the interval with no
//      existing checkpoint doc for that streakDay, create one as pending.
export function computeCheckinActions(
  streak: number,
  interval: number,
  currentRun: number,
  existingCheckins: ExistingCheckin[]
): PainCheckinAction[] {
  const actions: PainCheckinAction[] = [];
  const pending = existingCheckins.filter((c) => c.status === "pending");

  if (streak === 0) {
    if (pending.length > 0) {
      for (const c of pending) actions.push({ type: "expire", streakDay: c.streakDay });
      actions.push({ type: "bumpRun" });
    }
    return actions;
  }

  for (const c of pending) {
    if (streak > c.streakDay + 1) actions.push({ type: "expire", streakDay: c.streakDay });
  }

  if (interval > 1 && streak % interval === 0) {
    const alreadyExists = existingCheckins.some((c) => c.streakDay === streak);
    if (!alreadyExists) actions.push({ type: "create", runNumber: currentRun, streakDay: streak });
  }

  return actions;
}
