# Doctor-Interval Pain Check-ins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a doctor set a pain check-in interval (a divisor of the patient's streak goal) so patients get periodic, low-pressure pain-score checkpoints tied to their live exercise streak, visible as a timeline to both patient and doctor, with a single FCM reminder — no email, no blocking UI, no backfill of missed checkpoints.

**Architecture:** Additive layer on top of the existing streak-goal (`lib/goals.ts`) and recovery (`lib/recovery.ts`) modules. A new `painCheckins` Firestore subcollection holds one doc per checkpoint (`{runNumber}_{streakDay}`), created/expired server-side by a new scheduled Cloud Function, and updated by the patient only to transition `pending → logged`. Web and mobile both read/write the same collection directly (no new API route needed — same pattern as `painLogs`/`exerciseLogs`).

**Tech Stack:** Next.js 15 client components + `firebase/firestore` (web), Cloud Functions v2 (`onSchedule`) + `firebase-admin`, Flutter/`cloud_firestore` (mobile), Firestore Security Rules, Vitest.

## Global Constraints

- `n` (the check-in interval) must satisfy `streakTarget % n === 0`, `n !== 1`, `n !== streakTarget` — copied verbatim from the spec.
- No email for this feature — FCM push only, and only one push per due checkpoint.
- A checkpoint can be logged the day it becomes due or the following calendar day only; after that it is permanently `missed` and never editable again.
- If the live exercise streak resets to 0, any still-`pending` checkpoint is marked `missed` and the checkpoint cycle restarts (`runNumber` increments) alongside the new streak run.
- Nothing about the existing exercise streak (`streak-card.tsx`, `toggleExerciseCompletion`), the free-form daily `painLogs`, or other admin recovery panels changes.
- Follow existing code conventions exactly: `personBase(uid, personId)` helper pattern, `todayKey()`/date-key scheme, toast usage (`useToast`), CSS variable tokens (no hardcoded colors/spacing), skeleton-loading components already in the file being touched.

---

### Task 1: Extract shared streak-day calculation

The streak count is currently computed only inside `components/streak-card.tsx` as a private function. The new Cloud Function and the pain-checkin UI both need the same number, so it must live in `lib/recovery.ts` as an exported, independently testable pure function first.

**Files:**
- Modify: `lib/recovery.ts` (add export near `dateKeyDaysAgo`, after line 107)
- Modify: `components/streak-card.tsx:18-26` (delete local `computeStreak`, import the shared one)
- Test: `tests/lib/recovery.test.ts` (new file — none currently exists for this module)

**Interfaces:**
- Produces: `computeStreakDays(completedDates: Set<string>): number` — exported from `lib/recovery.ts`. Consumed by Task 6 (Cloud Function port) conceptually (Cloud Functions is a separate npm project so it gets its own copy — see Task 6 — but the **logic** and **tests** here are the source of truth both must match).

- [ ] **Step 1: Write the failing test**

Create `tests/lib/recovery.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))

import { computeStreakDays, dateKeyDaysAgo } from '@/lib/recovery'

describe('computeStreakDays', () => {
  it('returns 0 when no days are completed', () => {
    expect(computeStreakDays(new Set())).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    const done = new Set([dateKeyDaysAgo(0), dateKeyDaysAgo(1), dateKeyDaysAgo(2)])
    expect(computeStreakDays(done)).toBe(3)
  })

  it('counts consecutive days ending yesterday when today is not yet logged', () => {
    const done = new Set([dateKeyDaysAgo(1), dateKeyDaysAgo(2)])
    expect(computeStreakDays(done)).toBe(2)
  })

  it('stops counting at the first gap', () => {
    const done = new Set([dateKeyDaysAgo(0), dateKeyDaysAgo(1), dateKeyDaysAgo(3)])
    expect(computeStreakDays(done)).toBe(2)
  })

  it('returns 0 when today is not logged and yesterday is also missing', () => {
    const done = new Set([dateKeyDaysAgo(3)])
    expect(computeStreakDays(done)).toBe(0)
  })
})
```

Note: the top of the file needs `import { vi } from 'vitest'` too — use:
```ts
import { describe, it, expect, vi } from 'vitest'
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/recovery.test.ts`
Expected: FAIL — `computeStreakDays` is not exported from `lib/recovery.ts`.

- [ ] **Step 3: Add the export to `lib/recovery.ts`**

Insert immediately after the `dateKeyDaysAgo` function (currently ending at line 107, right before `function personBase`):

```ts
// Current daily streak = the run of consecutive days, counting back from today,
// on which at least one assigned exercise was completed. Today not yet logged
// doesn't break the streak — the run is allowed to start at "yesterday" so an
// untouched today reads as "keep it going", not "streak lost". Shared by
// streak-card.tsx and the pain-checkin UI/Cloud Function, which both need the
// exact same number.
export function computeStreakDays(completedDates: Set<string>): number {
  let streak = 0;
  const startOffset = completedDates.has(dateKeyDaysAgo(0)) ? 0 : 1;
  for (let i = startOffset; i < 400; i += 1) {
    if (completedDates.has(dateKeyDaysAgo(i))) streak += 1;
    else break;
  }
  return streak;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/recovery.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Update `components/streak-card.tsx` to use the shared function**

Replace lines 1-26 (imports through the end of the local `computeStreak` function):

```tsx
"use client";

import { useEffect, useState } from "react";
import { getExerciseLogs, dateKeyDaysAgo, computeStreakDays } from "@/lib/recovery";
import { getStreakGoal } from "@/lib/goals";
import { Skeleton, SkeletonText } from "@/components/skeleton";

interface Props {
  uid: string;
  personId: string;
}
```

And update the call site at (old) line 46 from `setStreak(computeStreak(done));` to:

```tsx
        setStreak(computeStreakDays(done));
```

- [ ] **Step 6: Run the full existing test suite and lint to confirm nothing broke**

Run: `npm run test:run && npm run lint`
Expected: all pass, no new errors.

- [ ] **Step 7: Commit**

```bash
git add lib/recovery.ts components/streak-card.tsx tests/lib/recovery.test.ts
git commit -m "refactor: extract computeStreakDays into lib/recovery.ts"
```

---

### Task 2: Extend `lib/goals.ts` with check-in interval + run tracking

**Files:**
- Modify: `lib/goals.ts` (whole file, currently 42 lines)
- Test: `tests/lib/goals.test.ts` (extend existing file)

**Interfaces:**
- Produces: `getValidCheckinIntervals(streakTarget: number): number[]`, `getPainCheckinInterval(uid, personId): Promise<number | null>`, `getCurrentRun(uid, personId): Promise<number>`, and an extended `setStreakGoal(uid, personId, target, adminUid, painCheckinInterval?: number | null): Promise<void>`.
- Consumed by: Task 4 (`lib/pain-checkins.ts`), Task 7 (admin UI), Task 8 (patient/admin UI wiring).

- [ ] **Step 1: Write the failing tests**

Append to `tests/lib/goals.test.ts` (after the existing `describe('setStreakGoal', ...)` block, before the final closing — the file currently ends at line 66/67):

```ts
describe('getValidCheckinIntervals', () => {
  it('returns divisors of the target excluding 1 and the target itself', () => {
    expect(getValidCheckinIntervals(18)).toEqual([2, 3, 6, 9])
  })

  it('returns an empty array when the target has no valid divisor', () => {
    expect(getValidCheckinIntervals(7)).toEqual([])
  })

  it('returns an empty array for a target below 2', () => {
    expect(getValidCheckinIntervals(1)).toEqual([])
    expect(getValidCheckinIntervals(0)).toEqual([])
  })

  it('returns an empty array for a non-integer target', () => {
    expect(getValidCheckinIntervals(4.5)).toEqual([])
  })
})

describe('getPainCheckinInterval', () => {
  beforeEach(() => {
    getDocMock.mockReset()
  })

  it('returns painCheckinInterval when the goal doc exists and has a valid interval', async () => {
    getDocMock.mockResolvedValue({ exists: () => true, data: () => ({ streakTarget: 18, painCheckinInterval: 3 }) })
    await expect(getPainCheckinInterval('uid-1', 'person-1')).resolves.toBe(3)
  })

  it('returns null when no interval is set', async () => {
    getDocMock.mockResolvedValue({ exists: () => true, data: () => ({ streakTarget: 18 }) })
    await expect(getPainCheckinInterval('uid-1', 'person-1')).resolves.toBeNull()
  })

  it('returns null when the goal doc does not exist', async () => {
    getDocMock.mockResolvedValue({ exists: () => false, data: () => undefined })
    await expect(getPainCheckinInterval('uid-1', 'person-1')).resolves.toBeNull()
  })
})

describe('getCurrentRun', () => {
  beforeEach(() => {
    getDocMock.mockReset()
  })

  it('returns currentRun when set', async () => {
    getDocMock.mockResolvedValue({ exists: () => true, data: () => ({ currentRun: 2 }) })
    await expect(getCurrentRun('uid-1', 'person-1')).resolves.toBe(2)
  })

  it('defaults to 0 when currentRun is not set', async () => {
    getDocMock.mockResolvedValue({ exists: () => true, data: () => ({}) })
    await expect(getCurrentRun('uid-1', 'person-1')).resolves.toBe(0)
  })

  it('defaults to 0 when the goal doc does not exist', async () => {
    getDocMock.mockResolvedValue({ exists: () => false, data: () => undefined })
    await expect(getCurrentRun('uid-1', 'person-1')).resolves.toBe(0)
  })
})

describe('setStreakGoal with painCheckinInterval', () => {
  beforeEach(() => {
    setDocMock.mockReset()
    setDocMock.mockResolvedValue(undefined)
  })

  it('writes painCheckinInterval when a valid divisor is passed', async () => {
    await setStreakGoal('uid-1', 'person-1', 18, 'admin-1', 3)
    const [, data] = setDocMock.mock.calls[0]
    expect(data).toMatchObject({ streakTarget: 18, painCheckinInterval: 3 })
  })

  it('writes painCheckinInterval: null when explicitly cleared', async () => {
    await setStreakGoal('uid-1', 'person-1', 18, 'admin-1', null)
    const [, data] = setDocMock.mock.calls[0]
    expect(data).toMatchObject({ streakTarget: 18, painCheckinInterval: null })
  })

  it('omits painCheckinInterval entirely when the parameter is not passed', async () => {
    await setStreakGoal('uid-1', 'person-1', 18, 'admin-1')
    const [, data] = setDocMock.mock.calls[0]
    expect(data).not.toHaveProperty('painCheckinInterval')
  })

  it('rejects an interval of 1', async () => {
    await expect(setStreakGoal('uid-1', 'person-1', 18, 'admin-1', 1)).rejects.toThrow()
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('rejects an interval equal to the target', async () => {
    await expect(setStreakGoal('uid-1', 'person-1', 18, 'admin-1', 18)).rejects.toThrow()
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('rejects an interval that does not evenly divide the target', async () => {
    await expect(setStreakGoal('uid-1', 'person-1', 18, 'admin-1', 5)).rejects.toThrow()
    expect(setDocMock).not.toHaveBeenCalled()
  })
})
```

Update the top-level import line (currently line 15) to also pull in the new exports:

```ts
import {
  getStreakGoal,
  setStreakGoal,
  getValidCheckinIntervals,
  getPainCheckinInterval,
  getCurrentRun,
} from '@/lib/goals'
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/goals.test.ts`
Expected: FAIL — the new exports don't exist yet.

- [ ] **Step 3: Rewrite `lib/goals.ts`**

Replace the full file contents:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/goals.test.ts`
Expected: PASS (all tests, old and new)

- [ ] **Step 5: Commit**

```bash
git add lib/goals.ts tests/lib/goals.test.ts
git commit -m "feat: add pain-checkin interval and run tracking to lib/goals.ts"
```

---

### Task 3: Firestore rules for `painCheckinInterval` and the new `painCheckins` collection

**Files:**
- Modify: `firestore.rules` (goals rule at the block containing `streakTarget is int`, and add a new `painCheckins` match block right after the existing `exerciseLogs` match)
- Test: `tests/rules/firestore.test.ts` (extend)

**Interfaces:**
- Consumes: field names from Task 2 (`painCheckinInterval`, `streakTarget`) and Task 4 (`runNumber`, `streakDay`, `status`, `score`, `note`, `loggedAt`).
- Produces: enforced write shape that Task 4's `lib/pain-checkins.ts` and Task 6's Cloud Function must satisfy.

- [ ] **Step 1: Write the failing rules tests**

Find the existing `describe('patients/{uid}/people/{personId}/goals ...')` block in `tests/rules/firestore.test.ts` (starts at line 506). Add new `it` blocks inside it, right before the closing `})` of that describe (after the "allows an admin write with a valid streakTarget" test, currently ending around line 562):

```ts
  it('allows an admin write that includes a valid painCheckinInterval', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(goalDoc(db), goal({ streakTarget: 18, painCheckinInterval: 3 })))
  })

  it('allows an admin write that explicitly clears painCheckinInterval to null', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(goalDoc(db), goal({ streakTarget: 18, painCheckinInterval: null })))
  })

  it('denies painCheckinInterval equal to 1', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(goalDoc(db), goal({ streakTarget: 18, painCheckinInterval: 1 })))
  })

  it('denies painCheckinInterval equal to streakTarget', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(goalDoc(db), goal({ streakTarget: 18, painCheckinInterval: 18 })))
  })

  it('denies painCheckinInterval that does not evenly divide streakTarget', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertFails(setDoc(goalDoc(db), goal({ streakTarget: 18, painCheckinInterval: 5 })))
  })
```

Then add a brand-new top-level `describe` block, placed right after the `goals` describe block closes (after its final `})`, before the `patientExerciseVideos` describe at line 565):

```ts
describe('patients/{uid}/people/{personId}/painCheckins (doctor-interval pain checkpoints)', () => {
  const PERSON = 'person-1'
  const checkinDoc = (db: unknown, id = '0_3', uid = PATIENT) =>
    doc(db as never, `patients/${uid}/people/${PERSON}/painCheckins/${id}`)
  const pendingCheckin = (overrides: Record<string, unknown> = {}) => ({
    runNumber: 0,
    streakDay: 3,
    status: 'pending',
    createdAt: serverTimestamp(),
    ...overrides,
  })

  it('lets an admin create a pending checkpoint', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(db), pendingCheckin()))
  })

  it('denies a patient creating a checkpoint directly', async () => {
    const db = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(setDoc(checkinDoc(db), pendingCheckin()))
  })

  it('lets the owner read their own checkpoints', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(admin), pendingCheckin()))

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(getDoc(checkinDoc(owner)))
  })

  it('denies a different signed-in user reading the checkpoint', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(admin), pendingCheckin()))

    const other = testEnv.authenticatedContext(OTHER).firestore()
    await assertFails(getDoc(checkinDoc(other)))
  })

  it('lets the owner log a valid score against their own pending checkpoint', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(admin), pendingCheckin()))

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertSucceeds(
      updateDoc(checkinDoc(owner), {
        status: 'logged',
        score: 4,
        note: 'sharp twinge',
        loggedAt: serverTimestamp(),
      })
    )
  })

  it('denies the owner logging a score outside 0-10', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(admin), pendingCheckin()))

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(
      updateDoc(checkinDoc(owner), {
        status: 'logged',
        score: 11,
        note: '',
        loggedAt: serverTimestamp(),
      })
    )
  })

  it('denies the owner updating a checkpoint that is already logged', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(
      setDoc(checkinDoc(admin), pendingCheckin({ status: 'logged', score: 2, note: '', loggedAt: serverTimestamp() }))
    )

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(
      updateDoc(checkinDoc(owner), { status: 'logged', score: 9, note: '', loggedAt: serverTimestamp() })
    )
  })

  it('denies the owner updating a checkpoint that is already missed', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(admin), pendingCheckin({ status: 'missed' })))

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(
      updateDoc(checkinDoc(owner), { status: 'logged', score: 5, note: '', loggedAt: serverTimestamp() })
    )
  })

  it('denies the owner writing extra fields not in the allowed set', async () => {
    const admin = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(admin), pendingCheckin()))

    const owner = testEnv.authenticatedContext(PATIENT).firestore()
    await assertFails(
      updateDoc(checkinDoc(owner), {
        status: 'logged',
        score: 4,
        note: '',
        loggedAt: serverTimestamp(),
        runNumber: 99,
      })
    )
  })

  it('lets an admin delete a checkpoint', async () => {
    const db = testEnv.authenticatedContext(ADMIN, { admin: true }).firestore()
    await assertSucceeds(setDoc(checkinDoc(db), pendingCheckin()))
    await assertSucceeds(deleteDoc(checkinDoc(db)))
  })
})
```

Check `updateDoc` and `deleteDoc` are already imported at the top of `tests/rules/firestore.test.ts` (they're used elsewhere in the file for `assignedExercises`/`exerciseVideos`-style tests) — if not already imported, add them to the existing `firebase/firestore` import line.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/rules/firestore.test.ts`
Expected: FAIL — `painCheckinInterval` rejected as an unexpected field by the current goals rule (extra-field checks aren't in place yet, but the divisor-validation tests will fail since no such check exists), and every `painCheckins` test fails since the collection has no rule (falls through to default-deny).

Note: this requires the Firestore emulator running. If `npm run test:run` doesn't already spin it up automatically, start it first: `npm run emulators` in a separate terminal, then run the command above. Check `tests/rules/firestore.test.ts`'s top-of-file setup (`beforeAll`) to confirm how it connects — follow whatever pattern is already there.

- [ ] **Step 3: Update the goals rule in `firestore.rules`**

Replace the existing goals match block:

```
    match /patients/{userId}/people/{personId}/goals/{goalId} {
      allow read: if isAdmin() || (isSignedIn() && request.auth.uid == userId);
      // Defense in depth on top of the client-side check in lib/goals.ts
      // setStreakGoal — the target must be a whole number of at least 1 day.
      allow create, update: if isAdmin() &&
        request.resource.data.streakTarget is int &&
        request.resource.data.streakTarget >= 1;
      allow delete: if isAdmin();
    }
```

with:

```
    match /patients/{userId}/people/{personId}/goals/{goalId} {
      allow read: if isAdmin() || (isSignedIn() && request.auth.uid == userId);
      // Defense in depth on top of the client-side checks in lib/goals.ts
      // setStreakGoal: streakTarget must be a whole number of at least 1 day;
      // painCheckinInterval (optional) must be null, or a whole-number divisor
      // of streakTarget that is neither 1 nor streakTarget itself.
      allow create, update: if isAdmin() &&
        request.resource.data.streakTarget is int &&
        request.resource.data.streakTarget >= 1 &&
        (
          !('painCheckinInterval' in request.resource.data) ||
          request.resource.data.painCheckinInterval == null ||
          (
            request.resource.data.painCheckinInterval is int &&
            request.resource.data.painCheckinInterval > 1 &&
            request.resource.data.painCheckinInterval < request.resource.data.streakTarget &&
            request.resource.data.streakTarget % request.resource.data.painCheckinInterval == 0
          )
        );
      allow delete: if isAdmin();
    }
```

- [ ] **Step 4: Add the `painCheckins` rule block**

Insert immediately after the existing `exerciseLogs` match block (`match /patients/{userId}/people/{personId}/exerciseLogs/{date} { ... }`):

```
    // Doctor-interval pain checkpoints (lib/pain-checkins.ts). Docs are only
    // ever created (as status:'pending') or expired (to 'missed') server-side
    // by the sendPainCheckinReminders Cloud Function via the Admin SDK, which
    // bypasses these rules entirely. The one client write path is the patient
    // logging a score against their own still-pending checkpoint — they can
    // never create, delete, or touch a checkpoint that's already logged/missed,
    // and can't write any field this rule doesn't explicitly allow.
    match /patients/{userId}/people/{personId}/painCheckins/{checkinId} {
      allow read: if isAdmin() || (isSignedIn() && request.auth.uid == userId);
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || (
        isSignedIn() && request.auth.uid == userId &&
        resource.data.status == 'pending' &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'score', 'note', 'loggedAt']) &&
        request.resource.data.status == 'logged' &&
        request.resource.data.score is int &&
        request.resource.data.score >= 0 &&
        request.resource.data.score <= 10 &&
        request.resource.data.note is string &&
        request.resource.data.note.size() <= 500 &&
        request.resource.data.loggedAt is timestamp
      );
    }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/rules/firestore.test.ts`
Expected: PASS (all tests, old and new)

- [ ] **Step 6: Commit**

```bash
git add firestore.rules tests/rules/firestore.test.ts
git commit -m "feat: add firestore rules for pain-checkin interval and painCheckins collection"
```

---

### Task 4: `lib/pain-checkins.ts` — client read/write module

**Files:**
- Create: `lib/pain-checkins.ts`
- Test: `tests/lib/pain-checkins.test.ts`

**Interfaces:**
- Consumes: `personBase`-style pattern (self-contained, matches `lib/goals.ts`/`lib/recovery.ts`).
- Produces: `PainCheckin` type, `getPainCheckins(uid, personId): Promise<PainCheckin[]>`, `findDueCheckin(checkins: PainCheckin[], currentRun: number): PainCheckin | null`, `currentRunCheckins(checkins: PainCheckin[], currentRun: number): PainCheckin[]`, `logPainCheckinScore(uid, personId, checkinId, score, note?): Promise<void>`. Consumed by Task 7 (`pain-checkin-card.tsx`, `pain-checkin-timeline.tsx`) and Task 8 (page wiring).

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/pain-checkins.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))

const getDocsMock = vi.fn()
const updateDocMock = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  query: vi.fn((col) => col),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}))

import {
  getPainCheckins,
  findDueCheckin,
  currentRunCheckins,
  logPainCheckinScore,
  type PainCheckin,
} from '@/lib/pain-checkins'

function fakeDoc(id: string, data: Record<string, unknown>) {
  return { id, data: () => data }
}

describe('getPainCheckins', () => {
  beforeEach(() => {
    getDocsMock.mockReset()
  })

  it('maps Firestore docs into PainCheckin objects', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        fakeDoc('0_3', { runNumber: 0, streakDay: 3, status: 'logged', score: 4, note: 'ok', loggedAt: { toDate: () => new Date('2026-01-01') } }),
        fakeDoc('0_6', { runNumber: 0, streakDay: 6, status: 'pending' }),
      ],
    })
    const result = await getPainCheckins('uid-1', 'person-1')
    expect(result).toEqual([
      { id: '0_3', runNumber: 0, streakDay: 3, status: 'logged', score: 4, note: 'ok', loggedAt: new Date('2026-01-01') },
      { id: '0_6', runNumber: 0, streakDay: 6, status: 'pending', score: null, note: '', loggedAt: null },
    ])
  })

  it('returns an empty array when there are no checkpoints', async () => {
    getDocsMock.mockResolvedValue({ docs: [] })
    await expect(getPainCheckins('uid-1', 'person-1')).resolves.toEqual([])
  })
})

describe('currentRunCheckins', () => {
  it('filters to only the given run and sorts by streakDay ascending', () => {
    const checkins: PainCheckin[] = [
      { id: 'a', runNumber: 1, streakDay: 6, status: 'pending', score: null, note: '', loggedAt: null },
      { id: 'b', runNumber: 0, streakDay: 3, status: 'missed', score: null, note: '', loggedAt: null },
      { id: 'c', runNumber: 1, streakDay: 3, status: 'logged', score: 2, note: '', loggedAt: null },
    ]
    expect(currentRunCheckins(checkins, 1).map((c) => c.id)).toEqual(['c', 'a'])
  })
})

describe('findDueCheckin', () => {
  it('returns the pending checkpoint for the current run', () => {
    const checkins: PainCheckin[] = [
      { id: 'a', runNumber: 0, streakDay: 3, status: 'logged', score: 2, note: '', loggedAt: null },
      { id: 'b', runNumber: 0, streakDay: 6, status: 'pending', score: null, note: '', loggedAt: null },
    ]
    expect(findDueCheckin(checkins, 0)?.id).toBe('b')
  })

  it('returns null when there is no pending checkpoint for the current run', () => {
    const checkins: PainCheckin[] = [
      { id: 'a', runNumber: 0, streakDay: 3, status: 'logged', score: 2, note: '', loggedAt: null },
    ]
    expect(findDueCheckin(checkins, 0)).toBeNull()
  })

  it('ignores a pending checkpoint from a stale run', () => {
    const checkins: PainCheckin[] = [
      { id: 'a', runNumber: 0, streakDay: 3, status: 'pending', score: null, note: '', loggedAt: null },
    ]
    expect(findDueCheckin(checkins, 1)).toBeNull()
  })
})

describe('logPainCheckinScore', () => {
  beforeEach(() => {
    updateDocMock.mockReset()
    updateDocMock.mockResolvedValue(undefined)
  })

  it('calls updateDoc with status logged and the given score/note', async () => {
    await logPainCheckinScore('uid-1', 'person-1', '0_3', 4, 'twinge')
    expect(updateDocMock).toHaveBeenCalledTimes(1)
    const [, data] = updateDocMock.mock.calls[0]
    expect(data).toMatchObject({ status: 'logged', score: 4, note: 'twinge', loggedAt: 'SERVER_TIMESTAMP' })
  })

  it('defaults note to empty string', async () => {
    await logPainCheckinScore('uid-1', 'person-1', '0_3', 4)
    const [, data] = updateDocMock.mock.calls[0]
    expect(data.note).toBe('')
  })

  it('rejects a non-integer score and does not write', async () => {
    await expect(logPainCheckinScore('uid-1', 'person-1', '0_3', 4.5)).rejects.toThrow()
    expect(updateDocMock).not.toHaveBeenCalled()
  })

  it('rejects a score below 0', async () => {
    await expect(logPainCheckinScore('uid-1', 'person-1', '0_3', -1)).rejects.toThrow()
    expect(updateDocMock).not.toHaveBeenCalled()
  })

  it('rejects a score above 10', async () => {
    await expect(logPainCheckinScore('uid-1', 'person-1', '0_3', 11)).rejects.toThrow()
    expect(updateDocMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/pain-checkins.test.ts`
Expected: FAIL — `lib/pain-checkins.ts` doesn't exist yet.

- [ ] **Step 3: Create `lib/pain-checkins.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/pain-checkins.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add lib/pain-checkins.ts tests/lib/pain-checkins.test.ts
git commit -m "feat: add lib/pain-checkins.ts for reading and logging checkpoints"
```

---

### Task 5: Cloud Function — pure scheduling logic

Keep the decision logic (what to create, what to expire, when to bump the run) in a pure, dependency-free function so it's testable without the Firestore emulator, mirroring how `computeStreakDays` was kept pure in Task 1. `functions/` is a separate npm project (no test runner configured — confirmed via `functions/package.json`), so this file is tested manually per the steps below, matching the existing convention documented at `functions/src/index.ts:190-200` for `sendAssessmentReminders`.

**Files:**
- Create: `functions/src/pain-checkin-logic.ts`

**Interfaces:**
- Produces: `PainCheckinAction` union type and `computeCheckinActions(streak: number, interval: number, currentRun: number, existingCheckins: {streakDay: number; status: string}[]): PainCheckinAction[]`. Consumed by Task 6 (`sendPainCheckinReminders`).

- [ ] **Step 1: Create `functions/src/pain-checkin-logic.ts`**

```ts
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
```

- [ ] **Step 2: Manually verify the logic with a scratch script**

Run this from the repo root to sanity-check the pure function before wiring it into the scheduled function (no test harness exists for `functions/`, matching the existing project convention):

```bash
npx tsx -e "
import { computeCheckinActions } from './functions/src/pain-checkin-logic';
console.log('day 3 due, none exists:', JSON.stringify(computeCheckinActions(3, 3, 0, [])));
console.log('day 3 already pending:', JSON.stringify(computeCheckinActions(3, 3, 0, [{streakDay:3,status:'pending'}])));
console.log('day 4, grace still ok:', JSON.stringify(computeCheckinActions(4, 3, 0, [{streakDay:3,status:'pending'}])));
console.log('day 5, grace expired:', JSON.stringify(computeCheckinActions(5, 3, 0, [{streakDay:3,status:'pending'}])));
console.log('streak broken, pending exists:', JSON.stringify(computeCheckinActions(0, 3, 0, [{streakDay:3,status:'pending'}])));
console.log('streak broken, nothing pending:', JSON.stringify(computeCheckinActions(0, 3, 0, [])));
"
```

Expected output (six lines):
```
day 3 due, none exists: [{"type":"create","runNumber":0,"streakDay":3}]
day 3 already pending: []
day 4, grace still ok: []
day 5, grace expired: [{"type":"expire","streakDay":3}]
streak broken, pending exists: [{"type":"expire","streakDay":3},{"type":"bumpRun"}]
streak broken, nothing pending: []
```

If `npx tsx` isn't available, run `npm install -g tsx` first, or substitute `npx ts-node` — either way, confirm the six lines above before proceeding.

- [ ] **Step 3: Commit**

```bash
git add functions/src/pain-checkin-logic.ts
git commit -m "feat: add pure decision logic for pain-checkin scheduling"
```

---

### Task 6: Cloud Function — `sendPainCheckinReminders`

**Files:**
- Modify: `functions/src/index.ts` (add new export at the end of the file)

**Interfaces:**
- Consumes: `computeCheckinActions`, `ExistingCheckin` from Task 5.
- Produces: `sendPainCheckinReminders` scheduled export, deployed alongside the existing functions.

- [ ] **Step 1: Read the end of the existing file to find the insertion point**

Open `functions/src/index.ts` and find the end of `sendAssessmentReminders` (the last export in the file, per the earlier exploration ending around line 320+). This task appends a new export after it.

- [ ] **Step 2: Add the import**

At the top of `functions/src/index.ts`, alongside the existing imports (after `import { getMessaging } from "firebase-admin/messaging";`):

```ts
import { computeCheckinActions, type ExistingCheckin } from "./pain-checkin-logic";
```

- [ ] **Step 3: Append the scheduled function**

Add at the end of `functions/src/index.ts`:

```ts
// Doctor-interval pain check-ins: a low-pressure, FCM-only nudge (no email —
// this is an engagement nicety, not a clinical gate; the doctor follows up on
// pain trends in person after the streak completes). Runs daily, mirrors the
// streak day count against each patient's doctor-set interval, and applies
// whatever computeCheckinActions decides (create/expire/bumpRun). See
// functions/src/pain-checkin-logic.ts for the pure decision rules and its
// manual verification steps.
//
// Manual emulator smoke check (same pattern as sendAssessmentReminders above):
//   1. `npm run emulators` from repo root.
//   2. Seed patients/{uid}/people/{personId}/goals/current with
//      { streakTarget: 18, painCheckinInterval: 3, currentRun: 0 }.
//   3. Seed exerciseLogs docs for 3 consecutive days ending today so the live
//      streak equals 3 (see computeStreakDays in lib/recovery.ts for the
//      exact date-key scheme this must match).
//   4. Trigger the scheduled function via the Emulator UI's "Run now", or:
//      `curl -X POST http://localhost:5001/<project>/europe-west2/sendPainCheckinReminders`
//   5. Confirm a `painCheckins/0_3` doc was created with status "pending",
//      and (if a fake fcmToken is set on users/{uid}) an FCM send was
//      attempted in the emulator logs.
export const sendPainCheckinReminders = onSchedule(
  { schedule: "0 9 * * *", timeZone: "Europe/London" },
  async () => {
    const db = getFirestore();

    const fmt = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
    const dateKeyDaysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return fmt(d);
    };

    // Only patients with the feature enabled at all (painCheckinInterval > 1
    // covers every valid interval, since 1 and the target itself are rejected
    // at write time).
    const goalsSnap = await db.collectionGroup("goals").where("painCheckinInterval", ">", 1).get();

    for (const goalDoc of goalsSnap.docs) {
      try {
        const goal = goalDoc.data();
        const interval = goal.painCheckinInterval as number;
        const currentRun = typeof goal.currentRun === "number" ? goal.currentRun : 0;

        const personRef = goalDoc.ref.parent.parent;
        const patientRef = personRef?.parent.parent;
        if (!personRef || !patientRef) continue;
        const personId = personRef.id;
        const patientUid = patientRef.id;

        // Live streak: consecutive days (counting back from today, allowing
        // today itself to be un-logged) with at least one exercise completion.
        // Mirrors computeStreakDays in lib/recovery.ts exactly.
        const exerciseLogsSnap = await personRef.collection("exerciseLogs").get();
        const completedDates = new Set<string>();
        exerciseLogsSnap.forEach((d) => {
          const completions = d.data().completions as Record<string, boolean> | undefined;
          if (completions && Object.values(completions).some(Boolean)) completedDates.add(d.id);
        });
        let streak = 0;
        const startOffset = completedDates.has(dateKeyDaysAgo(0)) ? 0 : 1;
        for (let i = startOffset; i < 400; i += 1) {
          if (completedDates.has(dateKeyDaysAgo(i))) streak += 1;
          else break;
        }

        const checkinsSnap = await personRef.collection("painCheckins").get();
        const existingForRun: ExistingCheckin[] = checkinsSnap.docs
          .filter((d) => d.data().runNumber === currentRun)
          .map((d) => ({ streakDay: d.data().streakDay as number, status: d.data().status as ExistingCheckin["status"] }));

        const actions = computeCheckinActions(streak, interval, currentRun, existingForRun);
        if (actions.length === 0) continue;

        let fcmToken: string | undefined;
        let createdStreakDay: number | null = null;

        for (const action of actions) {
          if (action.type === "expire") {
            await personRef
              .collection("painCheckins")
              .doc(`${currentRun}_${action.streakDay}`)
              .set({ status: "missed" }, { merge: true });
          } else if (action.type === "bumpRun") {
            await goalDoc.ref.set({ currentRun: FieldValue.increment(1) }, { merge: true });
          } else if (action.type === "create") {
            await personRef
              .collection("painCheckins")
              .doc(`${action.runNumber}_${action.streakDay}`)
              .set({
                runNumber: action.runNumber,
                streakDay: action.streakDay,
                status: "pending",
                createdAt: FieldValue.serverTimestamp(),
              });
            createdStreakDay = action.streakDay;
          }
        }

        if (createdStreakDay !== null) {
          try {
            const userSnap = await db.doc(`users/${patientUid}`).get();
            fcmToken = userSnap.data()?.fcmToken;
            if (fcmToken) {
              await getMessaging().send({
                token: fcmToken,
                notification: {
                  title: "A quick, optional check-in",
                  body: `Day ${createdStreakDay} — want to log how your pain feels today?`,
                },
                data: {
                  type: "pain-checkin-reminder",
                  personId,
                  streakDay: String(createdStreakDay),
                },
                apns: { payload: { aps: { sound: "default" } } },
                android: { notification: { sound: "default" } },
              });
            }
          } catch (fcmErr) {
            console.error("sendPainCheckinReminders: FCM send failed", goalDoc.ref.path, fcmErr);
          }
        }
      } catch (err) {
        console.error("sendPainCheckinReminders: failed to process doc", goalDoc.ref.path, err);
      }
    }
  }
);
```

- [ ] **Step 4: Build to check for type errors**

Run: `cd functions && npm run build && cd ..`
Expected: compiles with no errors.

- [ ] **Step 5: Commit**

```bash
git add functions/src/index.ts
git commit -m "feat: add sendPainCheckinReminders scheduled Cloud Function"
```

---

### Task 7: New UI components — check-in card and timeline

**Files:**
- Create: `components/pain-checkin-card.tsx`
- Create: `components/pain-checkin-timeline.tsx`

**Interfaces:**
- Consumes: `getCurrentRun`, `getPainCheckinInterval` (Task 2), `getPainCheckins`, `currentRunCheckins`, `findDueCheckin`, `logPainCheckinScore`, `PainCheckin` (Task 4).
- Produces: `<PainCheckinCard uid personId />`, `<PainCheckinTimeline uid personId readOnly? />`. Consumed by Task 8.

- [ ] **Step 1: Create `components/pain-checkin-card.tsx`**

```tsx
// components/pain-checkin-card.tsx
"use client";

import { useEffect, useState } from "react";
import { getCurrentRun, getPainCheckinInterval } from "@/lib/goals";
import { getPainCheckins, findDueCheckin, logPainCheckinScore, type PainCheckin } from "@/lib/pain-checkins";
import { useToast } from "@/components/toast-provider";
import { validateOptionalText, LIMITS } from "@/lib/validation";

interface Props {
  uid: string;
  personId: string;
}

function painColor(score: number): string {
  if (score <= 3) return "var(--color-success)";
  if (score <= 6) return "var(--color-warning)";
  return "var(--color-error)";
}

// Renders nothing when the doctor hasn't enabled pain check-ins for this
// patient, or when there's no checkpoint due right now — this card is purely
// additive to the existing daily PainCheckIn and must never appear as a
// blocking or nagging element. Soft framing throughout: "Optional" in the
// copy, never "you missed it".
export function PainCheckinCard({ uid, personId }: Props) {
  const [due, setDue] = useState<PainCheckin | null | undefined>(undefined);
  const [score, setScore] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setDue(undefined);
    (async () => {
      const interval = await getPainCheckinInterval(uid, personId);
      if (interval === null) {
        if (!cancelled) setDue(null);
        return;
      }
      const [run, checkins] = await Promise.all([getCurrentRun(uid, personId), getPainCheckins(uid, personId)]);
      if (cancelled) return;
      setDue(findDueCheckin(checkins, run));
    })().catch(() => {
      if (!cancelled) setDue(null);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, personId]);

  if (!due) return null;

  if (justLogged) {
    return (
      <div className="panel stack">
        <h3>Day {due.streakDay} check-in</h3>
        <p className="muted">Thanks — logged. Your physio will see this ahead of your follow-up.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!due) return;
    setSaving(true);
    setError(null);
    const noteErr = validateOptionalText(note, LIMITS.note);
    if (noteErr) {
      setError(noteErr);
      toast.show("Please shorten your note before saving.", "error");
      setSaving(false);
      return;
    }
    try {
      await logPainCheckinScore(uid, personId, due.id, score, note);
      setJustLogged(true);
      toast.show("Check-in logged.", "success");
    } catch {
      setError("Could not save, please try again.");
      toast.show("Could not save, please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel stack">
      <h3>Day {due.streakDay} check-in</h3>
      <p className="muted">
        Optional: your physio likes a check-in every few days. How&apos;s your pain right now?
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "grid", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>No pain (0)</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: painColor(score) }}>{score}</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>Worst (10)</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            aria-label="Pain score, 0 to 10"
            aria-valuetext={`${score} out of 10`}
            style={{ width: "100%", accentColor: painColor(score) }}
          />
        </div>
        <input
          type="text"
          className="input"
          placeholder="Optional note"
          aria-label="Optional note about your pain"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={LIMITS.note}
        />
        {error && <p className="field-error">{error}</p>}
        <button type="submit" className="button primary" disabled={saving}>
          {saving ? "Saving…" : "Log check-in"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/pain-checkin-timeline.tsx`**

```tsx
// components/pain-checkin-timeline.tsx
"use client";

import { useEffect, useState } from "react";
import { getCurrentRun, getPainCheckinInterval } from "@/lib/goals";
import { getPainCheckins, currentRunCheckins, type PainCheckin } from "@/lib/pain-checkins";

interface Props {
  uid: string;
  personId: string;
  // Doctor view: no interactivity, just status. Both variants render the
  // same markers — only the surrounding copy differs.
  readOnly?: boolean;
}

function statusIcon(status: PainCheckin["status"]): { symbol: string; label: string; color: string } {
  if (status === "logged") return { symbol: "✓", label: "Logged", color: "var(--color-success)" };
  if (status === "missed") return { symbol: "—", label: "Missed", color: "var(--color-text-secondary)" };
  return { symbol: "⏳", label: "Pending", color: "var(--color-warning)" };
}

// Renders nothing when the doctor hasn't enabled pain check-ins for this
// patient — same "invisible unless relevant" rule as PainCheckinCard.
export function PainCheckinTimeline({ uid, personId, readOnly = false }: Props) {
  const [checkins, setCheckins] = useState<PainCheckin[] | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCheckins(null);
    setEnabled(null);
    (async () => {
      const interval = await getPainCheckinInterval(uid, personId);
      if (cancelled) return;
      if (interval === null) {
        setEnabled(false);
        return;
      }
      setEnabled(true);
      const [run, all] = await Promise.all([getCurrentRun(uid, personId), getPainCheckins(uid, personId)]);
      if (cancelled) return;
      setCheckins(currentRunCheckins(all, run));
    })().catch(() => {
      if (!cancelled) setEnabled(false);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, personId]);

  if (enabled === false) return null;
  if (enabled === null || checkins === null) return null;
  if (checkins.length === 0) {
    return (
      <div className="panel stack">
        <h3>Pain check-ins</h3>
        <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
          {readOnly
            ? "No check-in has come due yet for this streak."
            : "Your first check-in will appear here once it's due."}
        </p>
      </div>
    );
  }

  return (
    <div className="panel stack">
      <h3>Pain check-ins</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
        {checkins.map((c) => {
          const { symbol, label, color } = statusIcon(c.status);
          return (
            <div
              key={c.id}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)" }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 20,
                  color,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  border: `1px solid ${color}`,
                }}
              >
                {symbol}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Day {c.streakDay}
              </span>
              <span className="sr-only">{label}</span>
              {c.status === "logged" && c.score !== null && (
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color }}>{c.score}/10</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Check the project's global CSS for an existing `.sr-only` utility class (search `grep -rn "sr-only" app/globals.css styles/ 2>/dev/null`); if it doesn't exist, replace the `<span className="sr-only">` line with an inline visually-hidden style instead of adding new global CSS:

```tsx
<span style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
  {label}
</span>
```

- [ ] **Step 3: Manual verification**

Run `npm run dev`, sign in as a test patient with a `goals/current` doc that has `painCheckinInterval` set and a live streak (seed via `npm run seed:firestore` or manually in the emulator), and visit `/patient/recovery`. Confirm no console errors and that the components render nothing when `painCheckinInterval` is unset (test against a patient without it).

- [ ] **Step 4: Commit**

```bash
git add components/pain-checkin-card.tsx components/pain-checkin-timeline.tsx
git commit -m "feat: add PainCheckinCard and PainCheckinTimeline components"
```

---

### Task 8: Admin interval field + page wiring (web)

**Files:**
- Modify: `components/admin-streak-goal.tsx` (whole file)
- Modify: `app/patient/recovery/page.tsx` (dashboard-grid section)
- Modify: `app/admin/recovery/page.tsx` (admin-panels-grid section)

**Interfaces:**
- Consumes: `getValidCheckinIntervals`, `getPainCheckinInterval`, `setStreakGoal` (Task 2), `PainCheckinCard`, `PainCheckinTimeline` (Task 7).

- [ ] **Step 1: Update `components/admin-streak-goal.tsx`**

Replace the full file:

```tsx
// components/admin-streak-goal.tsx
"use client";

import { useEffect, useState } from "react";
import { getStreakGoal, setStreakGoal, getPainCheckinInterval, getValidCheckinIntervals } from "@/lib/goals";
import { SkeletonForm } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface Props {
  adminUid: string;
  patientUid: string;
  personId: string;
}

export function AdminStreakGoal({ adminUid, patientUid, personId }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState("");
  const [intervalValue, setIntervalValue] = useState(""); // "" = none
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setError(null);
    Promise.all([getStreakGoal(patientUid, personId), getPainCheckinInterval(patientUid, personId)])
      .then(([goal, interval]) => {
        if (cancelled) return;
        setValue(goal !== null ? String(goal) : "");
        setIntervalValue(interval !== null ? String(interval) : "");
        setLoaded(true);
      })
      .catch(() => {
        // Don't let a load failure hang the panel forever — fall back to an
        // empty field and let the admin retry the save.
        if (cancelled) return;
        setError("Could not load the current goal.");
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [patientUid, personId]);

  const target = Number(value);
  const validIntervals = Number.isInteger(target) && target >= 1 ? getValidCheckinIntervals(target) : [];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isInteger(target) || target < 1) {
      setError("Enter a whole number of at least 1 day.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const interval = intervalValue === "" ? null : Number(intervalValue);
      await setStreakGoal(patientUid, personId, target, adminUid, interval);
      toast.show("Streak goal saved.", "success");
    } catch {
      toast.show("Could not save the streak goal. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="panel stack">
        <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Daily streak goal</h2>
        <SkeletonForm fields={2} />
      </div>
    );
  }

  return (
    <div className="panel stack">
      <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Daily streak goal</h2>
      <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        Set a target number of consecutive days to motivate this patient. Their streak card will
        show progress toward it.
      </p>
      <form
        onSubmit={(e) => void handleSave(e)}
        aria-busy={saving}
        style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-3)", flexWrap: "wrap" }}
      >
        <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          Daily streak goal (days)
          <input
            type="number"
            className="input"
            min={1}
            step={1}
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setIntervalValue("");
              setError(null);
            }}
            placeholder="e.g. 18"
            style={{ marginTop: "var(--space-1)", maxWidth: "10rem" }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "err-streak-goal" : undefined}
          />
        </label>
        <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          Pain check-in every
          <select
            className="input"
            value={intervalValue}
            onChange={(e) => setIntervalValue(e.target.value)}
            disabled={validIntervals.length === 0}
            style={{ marginTop: "var(--space-1)", maxWidth: "12rem" }}
          >
            <option value="">None (off)</option>
            {validIntervals.map((n) => (
              <option key={n} value={n}>
                {n} days
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="button primary"
          disabled={saving}
          style={{ opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving…" : "Save goal"}
        </button>
      </form>
      {validIntervals.length === 0 && Number.isInteger(target) && target >= 1 && (
        <p className="muted" style={{ margin: 0, fontSize: "var(--text-xs)" }}>
          No pain check-in interval evenly divides a {target}-day goal — pick a different goal length to enable one.
        </p>
      )}
      {error && (
        <span className="field-error" id="err-streak-goal" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into `app/patient/recovery/page.tsx`**

Add the import alongside the existing component imports (after `import { PainCheckIn } from "@/components/pain-check-in";`):

```tsx
import { PainCheckinCard } from "@/components/pain-checkin-card";
import { PainCheckinTimeline } from "@/components/pain-checkin-timeline";
```

In the JSX, change the existing `dashboard-grid` section:

```tsx
      <section className="page-section dashboard-grid">
        <PainCheckIn uid={uid} personId={personId} />
        <AdherenceBar uid={uid} personId={personId} />
      </section>
```

to:

```tsx
      <section className="page-section dashboard-grid">
        <PainCheckIn uid={uid} personId={personId} />
        <AdherenceBar uid={uid} personId={personId} />
        <PainCheckinCard uid={uid} personId={personId} />
      </section>

      <section className="page-section">
        <PainCheckinTimeline uid={uid} personId={personId} />
      </section>
```

- [ ] **Step 3: Wire into `app/admin/recovery/page.tsx`**

Add the import alongside the existing component imports (after `import { AdminStreakGoal } from "@/components/admin-streak-goal";`):

```tsx
import { PainCheckinTimeline } from "@/components/pain-checkin-timeline";
```

In the `admin-panels-grid` section, add right after the `<AdminStreakGoal ... />` block:

```tsx
            <AdminStreakGoal
              adminUid={adminUid}
              patientUid={selection.patientUid}
              personId={selection.personId}
            />
            <PainCheckinTimeline uid={selection.patientUid} personId={selection.personId} readOnly />
```

- [ ] **Step 4: Manual browser verification**

Run `npm run dev`. As admin, go to `/admin/recovery`, select a patient, set a streak goal of 18 and interval of 3, save, confirm the toast and that reloading the panel shows the saved interval selected. As that patient, visit `/patient/recovery` and confirm the page renders without errors (the check-in card/timeline will be empty/hidden until a checkpoint is actually due, which requires the Cloud Function or manual Firestore seeding — that's expected at this stage).

- [ ] **Step 5: Run lint and the full test suite**

Run: `npm run lint && npm run test:run`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add components/admin-streak-goal.tsx app/patient/recovery/page.tsx app/admin/recovery/page.tsx
git commit -m "feat: wire pain-checkin interval into admin streak goal and recovery pages"
```

---

### Task 9: Mobile (Flutter) — patient pain-checkin write path

Closes the gap noted during exploration: mobile can currently only read pain logs, with no write UI for pain scores at all, and this feature would otherwise be web-only.

**Files:**
- Modify: `mobile_app/lib/src/features/admin/recovery/recovery_service.dart` (add methods — despite the "admin" directory name, this is the file mobile already uses for all recovery reads, per the existing `watchPainLogs`/`watchEarliestPainLog` methods)
- Modify: `mobile_app/lib/src/features/home/patient_dashboard.dart` (add a card widget)

**Interfaces:**
- Consumes: nothing new — mirrors `lib/pain-checkins.ts` and `lib/goals.ts` field shapes exactly (Firestore is the shared source of truth across web/mobile, per the existing dual-writer pattern for `exerciseLogs`).
- Produces: `RecoveryService.watchPainCheckins`, `RecoveryService.getCurrentRun`, `RecoveryService.getPainCheckinInterval`, `RecoveryService.logPainCheckinScore`.

- [ ] **Step 1: Add methods to `RecoveryService`**

Add to `mobile_app/lib/src/features/admin/recovery/recovery_service.dart`, near the existing `watchPainLogs`/`watchEarliestPainLog` methods:

```dart
  static Stream<List<Map<String, dynamic>>> watchPainCheckins(
      String uid, String personId) {
    return _personBase(uid, personId)
        .collection('painCheckins')
        .orderBy('streakDay')
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => {
                  'id': d.id,
                  'runNumber': d.data()['runNumber'] ?? 0,
                  'streakDay': d.data()['streakDay'] ?? 0,
                  'status': d.data()['status'] ?? 'pending',
                  'score': d.data()['score'],
                  'note': d.data()['note'] ?? '',
                })
            .toList());
  }

  static Future<int> getCurrentRun(String uid, String personId) async {
    final snap = await _personBase(uid, personId).collection('goals').doc('current').get();
    final run = snap.data()?['currentRun'];
    return run is int ? run : 0;
  }

  static Future<int?> getPainCheckinInterval(String uid, String personId) async {
    final snap = await _personBase(uid, personId).collection('goals').doc('current').get();
    final interval = snap.data()?['painCheckinInterval'];
    return interval is int ? interval : null;
  }

  static Future<void> logPainCheckinScore(
    String uid,
    String personId,
    String checkinId,
    int score, {
    String note = '',
  }) async {
    if (score < 0 || score > 10) {
      throw ArgumentError('Pain score must be between 0 and 10.');
    }
    await _personBase(uid, personId)
        .collection('painCheckins')
        .doc(checkinId)
        .update({
      'status': 'logged',
      'score': score,
      'note': note,
      'loggedAt': FieldValue.serverTimestamp(),
    });
  }
```

- [ ] **Step 2: Add a check-in card widget to the patient dashboard**

Add a new private widget in `mobile_app/lib/src/features/home/patient_dashboard.dart`, near `_RecoveryPercentTile` (around line 196):

```dart
class _PainCheckinCard extends StatefulWidget {
  const _PainCheckinCard({required this.uid, required this.personId});

  final String uid;
  final String personId;

  @override
  State<_PainCheckinCard> createState() => _PainCheckinCardState();
}

class _PainCheckinCardState extends State<_PainCheckinCard> {
  int _score = 5;
  bool _saving = false;
  bool _loggedJustNow = false;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<int?>(
      future: RecoveryService.getPainCheckinInterval(widget.uid, widget.personId),
      builder: (context, intervalSnap) {
        if (intervalSnap.data == null) return const SizedBox.shrink();
        return StreamBuilder<List<Map<String, dynamic>>>(
          stream: RecoveryService.watchPainCheckins(widget.uid, widget.personId),
          builder: (context, checkinsSnap) {
            final checkins = checkinsSnap.data ?? const [];
            return FutureBuilder<int>(
              future: RecoveryService.getCurrentRun(widget.uid, widget.personId),
              builder: (context, runSnap) {
                if (!runSnap.hasData) return const SizedBox.shrink();
                final currentRun = runSnap.data!;
                final due = checkins.firstWhere(
                  (c) => c['runNumber'] == currentRun && c['status'] == 'pending',
                  orElse: () => const {},
                );
                if (due.isEmpty) return const SizedBox.shrink();

                if (_loggedJustNow) {
                  return const Card(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Text('Thanks — logged. Your physio will see this ahead of your follow-up.'),
                    ),
                  );
                }

                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Day ${due['streakDay']} check-in',
                            style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        const Text(
                            'Optional: your physio likes a check-in every few days. How\'s your pain right now?'),
                        Slider(
                          value: _score.toDouble(),
                          min: 0,
                          max: 10,
                          divisions: 10,
                          label: '$_score',
                          onChanged: (v) => setState(() => _score = v.round()),
                        ),
                        Align(
                          alignment: Alignment.centerRight,
                          child: FilledButton(
                            onPressed: _saving
                                ? null
                                : () async {
                                    setState(() => _saving = true);
                                    try {
                                      await RecoveryService.logPainCheckinScore(
                                        widget.uid,
                                        widget.personId,
                                        due['id'] as String,
                                        _score,
                                      );
                                      if (mounted) setState(() => _loggedJustNow = true);
                                    } finally {
                                      if (mounted) setState(() => _saving = false);
                                    }
                                  },
                            child: Text(_saving ? 'Saving…' : 'Log check-in'),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        );
      },
    );
  }
}
```

Add `const _PainCheckinCard(uid: widget.user.uid, personId: _personId),` right after the existing `_RecoveryPercentTile(uid: widget.user.uid, personId: _personId),` line (around line 81), inside whatever layout widget (`Column`/`ListView`) contains it — match the surrounding widget's existing children list style exactly.

- [ ] **Step 3: Verify it compiles**

Run: `cd mobile_app && flutter analyze && cd ..`
Expected: no new errors introduced by these two files (pre-existing warnings elsewhere are out of scope).

- [ ] **Step 4: Manual verification in a simulator/emulator**

If a simulator is available: run the app, sign in as a patient with `painCheckinInterval` set and a checkpoint doc seeded as `pending` in the emulator, confirm the card renders on the dashboard and logging a score updates Firestore and hides the card. If no simulator/emulator is readily available in this session, note that this step is deferred and flag it clearly rather than claiming it was verified.

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/admin/recovery/recovery_service.dart mobile_app/lib/src/features/home/patient_dashboard.dart
git commit -m "feat: add mobile pain-checkin write path (RecoveryService + dashboard card)"
```

---

## Post-implementation checklist (not a task — a reminder for the final review pass)

- [ ] `npm run test:run` passes in full (not just the new/touched files).
- [ ] `npm run lint` is clean.
- [ ] `npx vitest run tests/rules/firestore.test.ts` passes against the emulator.
- [ ] `cd functions && npm run build` succeeds.
- [ ] `cd mobile_app && flutter analyze` introduces no new issues in the touched files.
- [ ] Manually confirm on `/admin/recovery` and `/patient/recovery` that nothing about the existing streak card, free-form pain check-in, exercise assignment, or other admin panels changed visually or behaviorally for a patient with `painCheckinInterval` unset (the default/most common case).
