# Doctor-Interval Pain Check-ins — Design Spec

Date: 2026-08-09
Status: Approved by user, pending implementation plan

## Problem

Today patients can log a free-form pain score any day (`components/pain-check-in.tsx` →
`logPainScore` → `patients/{uid}/people/{personId}/painLogs/{date}`), and separately have
an exercise streak (`components/streak-card.tsx`, computed client-side from
`exerciseLogs`) with a doctor-set target length (`streakTarget` in
`patients/{uid}/people/{personId}/goals/current`, set via `components/admin-streak-goal.tsx`).

There is no mechanism for a doctor to require a *structured* pain check-in at a fixed
cadence within that streak (e.g. every 3 or 5 days across an 18-day streak). This spec adds
that, as a thin, additive layer that does not change existing exercise-streak or free-form
pain-log behavior.

## Goals

- Doctor picks a check-in interval `n` (days) per patient, constrained so it evenly divides
  the doctor-set streak length (`streakTarget % n === 0`, and `n` is not `1` or
  `streakTarget` itself).
- Every time the patient's live exercise streak count reaches a multiple of `n`, a
  check-in "checkpoint" becomes due. The patient can log a pain score for it that day or
  the following calendar day (same one-day grace period the existing exercise streak
  already uses). After that grace window, it is permanently `missed` — no backfill, ever.
- If the exercise streak itself resets to 0 (a missed exercise day), any still-pending
  checkpoint is marked `missed`, and the checkpoint cycle restarts from 0 alongside the
  new streak run. Past runs' checkpoints remain visible in history, untouched.
- Reminders are low-pressure: a single FCM push per due checkpoint, no email, no
  blocking UI, no "you failed" framing. This is an engagement nicety, not a clinical
  gate — doctors follow up on pain trends in person during the post-streak follow-up
  session regardless.
- Doctor and patient can both see a small timeline of checkpoints (logged / pending /
  missed) for the current streak run, on web and mobile.
- Nothing about the existing exercise streak, free-form daily pain log, assigned
  exercises, or other admin recovery panels changes.

## Non-goals

- Not replacing or modifying the existing `painLogs` free-form daily pain score.
- Not adding email reminders for this feature.
- Not enforcing/blocking anything — a missed checkpoint has no consequence beyond being
  shown as missed.
- Not changing how the exercise streak itself is computed or reset.

## Data model

Extend the existing goal doc (`lib/goals.ts`, `patients/{uid}/people/{personId}/goals/current`):

```
streakTarget: number            // existing, doctor-set streak length
painCheckinInterval?: number    // new, optional — divisor of streakTarget, e.g. 3
updatedBy, updatedAt            // existing
```

`painCheckinInterval` is optional — omitted/undefined means the feature is off for that
patient (no checkpoints generated), which is the default until a doctor sets it.

New subcollection, one doc per checkpoint occurrence:

```
patients/{uid}/people/{personId}/painCheckins/{runNumber}_{streakDay}
  runNumber: number        // increments each time the exercise streak resets to 0
  streakDay: number        // which multiple of n this checkpoint is (n, 2n, 3n, ...)
  status: 'pending' | 'logged' | 'missed'
  score?: number            // 0-10, set when logged
  note?: string              // optional, ≤500 chars, same shape as painLogs.note
  loggedAt?: timestamp
  createdAt: timestamp
```

Doc id example: `2_6` = the 2nd streak run's day-6 checkpoint. Run number lets history
across resets coexist without collisions or overwrites — a doctor can scroll back and see
every past run's checkpoints, including ones marked missed from an earlier attempt.

`runNumber` is tracked as a small counter alongside the checkpoint docs (simplest: read the
max existing `runNumber` for that patient/person, or store `currentRun` on `goals/current`
next to `painCheckinInterval` — implementation detail for the plan).

### Firestore rules

Mirror the existing `painLogs` rule shape (rules:268-280): score 0-10 int, note ≤500 chars,
status field constrained to the three enum values, owner or admin read, write restricted to
server-side (Cloud Function creates `pending`/`missed`; patient can only transition their
own `pending` doc to `logged` with a score).

## Admin UI

Extend `components/admin-streak-goal.tsx` (rendered in `app/admin/recovery/page.tsx`):

- Existing `streakTarget` numeric input stays as-is.
- New field below it: "Pain check-in every ___ days", a `<select>` of valid divisors of
  the current `streakTarget` value (excluding `1` and `streakTarget` itself). Recomputes
  when the doctor edits `streakTarget` before saving. Includes a "None" option (clears
  `painCheckinInterval`, feature off).
- Saves via a small addition to `setStreakGoal` in `lib/goals.ts` (adds
  `painCheckinInterval` to the existing write).

## Patient UI

### Web

- `app/patient/recovery/page.tsx` / `components/pain-check-in.tsx` unchanged for the
  existing free-form daily log.
- New small card, shown only when a checkpoint is `pending` (due today or in its grace
  day): "Day {streakDay} check-in — how's your pain?" with the same 0–10 slider pattern as
  the existing check-in, submitting to the new checkpoint doc (not `painLogs`).
- New compact timeline strip on the same page: one marker per checkpoint of the current
  run — ✓ logged, ⏳ pending (sandclock treatment when close to expiring, echoing the
  existing streak urgency cue), — missed (greyed out, non-interactive, permanent).
- If `painCheckinInterval` is unset for the patient, none of this renders — page looks
  exactly as it does today.

### Mobile (Flutter)

- New screen/widget mirroring the web check-in card and timeline, reading/writing the same
  `painCheckins` collection — closes the existing gap where mobile has no pain-score write
  path at all (mobile currently only reads `painLogs` for the recovery % calc).
- Same dual-writer shape discipline already used for `exerciseLogs` between
  `lib/recovery.ts` and `mobile_app/lib/src/features/admin/recovery/recovery_service.dart`.

### Doctor view

- `app/admin/recovery/page.tsx` gains a read-only version of the same timeline strip next
  to `AdminStreakGoal`, so the doctor can see check-in adherence at a glance ahead of the
  post-streak follow-up session.

## Notifications

New scheduled Cloud Function in `functions/src/index.ts`, `sendPainCheckinReminders`,
modeled directly on the existing `sendFollowUpReminders` pattern:

- Daily schedule. For each patient/person with `painCheckinInterval` set, compute the live
  streak count (same logic as `computeStreak` in `streak-card.tsx`, ported server-side or
  read from wherever the authoritative streak count is derived).
- When the streak count is a fresh multiple of `n` with no existing checkpoint doc for
  `{currentRun}_{streakDay}`, create it as `pending` and send **one FCM push only** — no
  email, no in-app red/blocking UI. Copy is soft/optional, e.g. "Optional: log how your
  pain feels today."
- A second pass in the same function (or a lightweight follow-up scheduled run) flips any
  `pending` checkpoint whose grace day has passed to `missed`.
- When the exercise streak resets to 0, mark any still-`pending` checkpoint for that
  patient `missed` and bump `currentRun`.
- Dedup via the same "mark a flag on the source doc so we don't resend" pattern already
  used in `sendFollowUpReminders` / `sendAssessmentReminders`.

## Explicitly not touched

- `streak-card.tsx` / `toggleExerciseCompletion` / exercise streak computation.
- `painLogs` (free-form daily pain log) and its UI.
- `assignedExercises`, `AdminExerciseAssigner`, `AdminClinicalEntry`, `AdminMotionTargets`,
  `AdminFaceTargets`, `AdminMotionSessions`, `AdminFollowUp`.
- Assessment reminder flow (`sendAssessmentReminders`) — unrelated, stays as-is.
- Email sending for this feature — deliberately excluded per product decision (this is a
  soft engagement nicety; clinical follow-up happens in-person after the streak completes).

## Open implementation details for the plan

- Exact mechanism for tracking `currentRun` (counter field vs. derived from doc scan).
- Where server-side streak count is computed from (whether to extract shared logic from
  `computeStreak` into `lib/recovery.ts` so both the Cloud Function and client use one
  source of truth — likely worth doing to avoid drift).
- Firestore composite indexes needed for the collection-group query in the new scheduled
  function, if any.
