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
//   - lastStreak: the streak value observed on the PREVIOUS cron run (0 if
//     never observed / no prior data)
//
// Rules (mirrors the design spec):
//   1. A reset is detected as `streak < lastStreak` — not merely
//      `streak === 0` — because computeStreakDays' one-day grace (today not
//      yet logged still counts as unbroken) means a real reset can drop the
//      count without ever touching exactly 0 (e.g. 3 -> 1 when a day was
//      skipped and today was just logged). On a detected reset, expire every
//      still-pending checkpoint for the current run AND unconditionally bump
//      the run counter — even when nothing happened to be pending — so the
//      run counter never gets stuck and a stale run can't collide with a new
//      attempt's doc IDs. If the post-reset streak itself already lands on a
//      fresh interval multiple (e.g. a reset straight from 6 to 3 with
//      interval 3), create that checkpoint under the NEW run number right
//      away — otherwise the new run's first checkpoint would be silently
//      skipped, since nothing revisits this streakDay once it's passed.
//   2. Otherwise (streak >= lastStreak, i.e. not a reset), any pending
//      checkpoint whose grace day has passed (the live streak has moved more
//      than one day beyond it) is expired — logging is only allowed the day a
//      checkpoint becomes due or the following day.
//   3. If the streak just landed on a fresh multiple of the interval with no
//      existing checkpoint doc for that streakDay, create one as pending.
export function computeCheckinActions(
  streak: number,
  interval: number,
  currentRun: number,
  existingCheckins: ExistingCheckin[],
  lastStreak: number
): PainCheckinAction[] {
  const actions: PainCheckinAction[] = [];
  const pending = existingCheckins.filter((c) => c.status === "pending");

  if (streak < lastStreak) {
    for (const c of pending) actions.push({ type: "expire", streakDay: c.streakDay });
    actions.push({ type: "bumpRun" });
    if (streak > 0 && interval > 1 && streak % interval === 0) {
      actions.push({ type: "create", runNumber: currentRun + 1, streakDay: streak });
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
