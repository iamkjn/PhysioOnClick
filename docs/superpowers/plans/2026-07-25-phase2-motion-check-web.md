# Phase 2 (web v1) — Camera "Check your motion" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a camera-based "Check your motion" feature to the web patient portal that, for an assigned exercise, uses the webcam to measure the targeted joint's range-of-motion and count reps in real time, gives live feedback, and saves a session summary — plus admin control over each exercise's motion target and a per-patient motion-session review.

**Architecture:** Pose estimation runs 100% client-side (MediaPipe Tasks Vision `PoseLandmarker`, dynamically imported with `ssr:false`) so nothing new touches the Cloudflare Worker/SSR. A pure, unit-tested judging engine (angles → ROM → reps → quality) is decoupled from the camera/DOM. Motion targets live in Firestore (admin-editable) with in-code defaults as fallback; results save under the existing per-patient tree and also mark the day's exercise complete so the existing streak/adherence counts them.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, `@mediapipe/tasks-vision` (new dep, client-only), Firebase Firestore (client SDK + REST admin shim), Vitest + Testing Library.

## Global Constraints

- **Client-only pose:** the MediaPipe import and any `PoseLandmarker`/`getUserMedia` code MUST live in a component loaded via `next/dynamic` with `{ ssr: false }`, or behind a `useEffect`/event handler — never imported at module top-level of a server-reachable file. Rationale: workerd forbids `new Function()` and has no DOM; SSR of this code 500s (see `next.config.mjs` firebase note).
- **No CSP** is set, so loading the MediaPipe WASM + `.task` model from the official CDN at runtime is allowed. v1 loads from CDN; self-hosting under `/public` is a documented v1.1 option.
- **Framing:** the feature is **movement feedback, not a medical/diagnostic device.** A visible disclaimer is required on the camera screen. Graceful fallbacks for: no camera, permission denied, and poor/no tracking.
- **Privacy:** never upload or persist video/images — only derived numbers (reps, ROM degrees, quality) are saved.
- **DB location:** per-patient data lives at `patients/{uid}/people/{personId}/...` (see `lib/recovery.ts`). Motion targets are top-level `exerciseMotionTargets/{exerciseId}`.
- **Admin identity:** `isAdmin()` in `firestore.rules` = `request.auth.token.admin == true || request.auth.token.email == "hello@physioonclick.co.uk"`.
- **MediaPipe pose landmark indices (BlazePose 33):** nose 0; L/R shoulder 11/12; L/R elbow 13/14; L/R wrist 15/16; L/R hip 23/24; L/R knee 25/26; L/R ankle 27/28.
- Tests: `npx vitest run <file>`; rules tests: `npm run test:rules`. Commit after each task. Verify branch before committing.
- Exercise catalogue is static in `lib/site-data.ts` (`exercises`: ex-1 Sit to Stand/Lower limb, ex-2 Scapular Setting/Shoulder, ex-3 Bridge/Lumbar spine, ex-4 Tandem Balance/Balance). v1 defines motion targets for the three rep-based ones (ex-1, ex-2, ex-3); balance (ex-4) has no target, so its button won't appear.

---

## File Structure

- `lib/motion-engine.ts` — **new, pure.** Landmark index constants, `computeAngle`, the `MotionJudge` class. No DOM, no Firebase. Fully unit-tested.
- `lib/motion-targets.ts` — **new, pure.** `MotionTarget` type + `DEFAULT_MOTION_TARGETS` (ex-1/2/3).
- `lib/motion.ts` — **new.** Firestore layer: `getMotionTarget`, `saveMotionTarget`, `saveMotionSession`, `getMotionSessions`, types. Uses `@/lib/firebase`.
- `lib/pose-detector.ts` — **new, client-only.** Thin wrapper that lazy-loads `@mediapipe/tasks-vision`, creates a `PoseLandmarker`, exposes `detect(video, timestamp)`.
- `components/motion-check.tsx` — **new, client-only** (`"use client"`, consumed via `next/dynamic` ssr:false). The camera modal: stream, canvas overlay, rep/ROM UI, cues, save, disclaimer, fallbacks.
- `components/motion-check-button.tsx` — **new, client.** Camera-availability gate + opens the modal; rendered per exercise card.
- `components/admin-motion-targets.tsx` — **new, client.** Admin editor for `exerciseMotionTargets`.
- `components/admin-motion-sessions.tsx` — **new, client.** Per-patient motion-session review.
- Modified: `components/assigned-exercises.tsx` (mount the button), `app/admin/recovery/page.tsx` (mount the two admin components), `firestore.rules`, `app/globals.css` (motion UI styles), `package.json` (dep).
- Tests: `tests/lib/motion-engine.test.ts`, `tests/lib/motion.test.ts`, `tests/rules/firestore.test.ts` (extend), `tests/components/motion-check-button.test.tsx`, `tests/components/admin-motion-targets.test.tsx`.

---

## Task 1: Pose math — landmark constants + `computeAngle`

**Files:** Create `lib/motion-engine.ts`; Test `tests/lib/motion-engine.test.ts`.

**Interfaces:**
- Produces: `type Landmark = { x: number; y: number; z?: number; visibility?: number }`; `const POSE = { NOSE:0, L_SHOULDER:11, R_SHOULDER:12, L_ELBOW:13, R_ELBOW:14, L_WRIST:15, R_WRIST:16, L_HIP:23, R_HIP:24, L_KNEE:25, R_KNEE:26, L_ANKLE:27, R_ANKLE:28 } as const`; `function computeAngle(a: Landmark, vertex: Landmark, b: Landmark): number` (degrees 0–180).

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/motion-engine.test.ts
import { describe, it, expect } from 'vitest'
import { computeAngle, type Landmark } from '@/lib/motion-engine'

const p = (x: number, y: number): Landmark => ({ x, y })

describe('computeAngle', () => {
  it('is 90° for a right angle', () => {
    // vertex at origin, one arm along +x, one along +y
    expect(computeAngle(p(1, 0), p(0, 0), p(0, 1))).toBeCloseTo(90, 1)
  })
  it('is 180° for a straight line', () => {
    expect(computeAngle(p(-1, 0), p(0, 0), p(1, 0))).toBeCloseTo(180, 1)
  })
  it('is ~0° when arms overlap', () => {
    expect(computeAngle(p(1, 0), p(0, 0), p(1, 0))).toBeCloseTo(0, 1)
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (module not found)

Run: `npx vitest run tests/lib/motion-engine.test.ts`

- [ ] **Step 3: Implement**

```ts
// lib/motion-engine.ts
export type Landmark = { x: number; y: number; z?: number; visibility?: number };

export const POSE = {
  NOSE: 0,
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW: 13, R_ELBOW: 14,
  L_WRIST: 15, R_WRIST: 16,
  L_HIP: 23, R_HIP: 24,
  L_KNEE: 25, R_KNEE: 26,
  L_ANKLE: 27, R_ANKLE: 28,
} as const;

// Interior angle (degrees, 0–180) at `vertex` formed by vertex→a and vertex→b.
export function computeAngle(a: Landmark, vertex: Landmark, b: Landmark): number {
  const v1x = a.x - vertex.x, v1y = a.y - vertex.y;
  const v2x = b.x - vertex.x, v2y = b.y - vertex.y;
  const dot = v1x * v2x + v1y * v2y;
  const m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y);
  if (m1 === 0 || m2 === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
}
```

- [ ] **Step 4: Run — expect PASS.** `npx vitest run tests/lib/motion-engine.test.ts`
- [ ] **Step 5: Commit** — `git add lib/motion-engine.ts tests/lib/motion-engine.test.ts && git commit -m "feat(motion): pose landmark constants + joint-angle math"`

---

## Task 2: `MotionTarget` type, defaults, and the `MotionJudge`

**Files:** Create `lib/motion-targets.ts`; extend `lib/motion-engine.ts` (add `MotionJudge`); Test `tests/lib/motion-engine.test.ts` (extend).

**Interfaces:**
- Produces in `lib/motion-targets.ts`:
```ts
export type MotionTarget = {
  exerciseId: string;
  bodyPart: string;
  // three landmark indices whose interior angle at `vertex` is measured
  joint: { a: number; vertex: number; b: number };
  targetRomMin: number;   // degrees
  targetRomMax: number;
  repEnterAngle: number;  // cross ABOVE this = entering the "extended" phase
  repExitAngle: number;   // cross BELOW this = returned; completes one rep
  repTarget: number;
};
export const DEFAULT_MOTION_TARGETS: Record<string, MotionTarget>;
```
- Produces in `lib/motion-engine.ts`:
```ts
export type FrameResult = { angle: number; reps: number; romMin: number; romMax: number; phase: 'down' | 'up'; cue: string };
export type SessionSummary = { reps: number; romMin: number; romMax: number; avgQuality: number; passed: boolean };
export class MotionJudge {
  constructor(target: MotionTarget);
  update(landmarks: Landmark[]): FrameResult; // call per frame
  summary(): SessionSummary;
}
```

Rep detection is hysteresis: a rep counts when the angle rises above `repEnterAngle` (phase→'up') and then falls below `repExitAngle` (phase→'down'). Quality per rep = how close that rep's peak angle got to `targetRomMax` (100 if ≥ target, scaled down otherwise), averaged. `passed` = reps ≥ repTarget && avgQuality ≥ 60.

- [ ] **Step 1: Write the failing tests** (append)

```ts
// tests/lib/motion-engine.test.ts (append)
import { MotionJudge } from '@/lib/motion-engine'
import { DEFAULT_MOTION_TARGETS } from '@/lib/motion-targets'

// Build a 33-length landmark array where the knee angle (hip 24, knee 26, ankle 28)
// resolves to `deg`, everything else zeroed. hip above knee, ankle below.
function kneeFrame(deg: number) {
  const lm = Array.from({ length: 33 }, () => ({ x: 0, y: 0 }))
  const rad = (deg * Math.PI) / 180
  lm[26] = { x: 0, y: 0 }                       // knee (vertex)
  lm[24] = { x: 0, y: -1 }                      // hip straight up from knee
  lm[28] = { x: Math.sin(rad), y: -Math.cos(rad) } // ankle at `deg` from the hip arm
  return lm
}

describe('MotionJudge (sit-to-stand knee)', () => {
  it('counts a rep on an extend-then-return cycle and tracks ROM', () => {
    const j = new MotionJudge(DEFAULT_MOTION_TARGETS['ex-1'])
    j.update(kneeFrame(85))     // seated (below exit)
    j.update(kneeFrame(170))    // stood (above enter) -> phase up
    const r = j.update(kneeFrame(85)) // sat back (below exit) -> +1 rep
    expect(r.reps).toBe(1)
    expect(r.romMax).toBeGreaterThanOrEqual(169)
    expect(r.romMin).toBeLessThanOrEqual(86)
  })
  it('does not double-count while staying extended', () => {
    const j = new MotionJudge(DEFAULT_MOTION_TARGETS['ex-1'])
    j.update(kneeFrame(85)); j.update(kneeFrame(170)); j.update(kneeFrame(175))
    expect(j.summary().reps).toBe(0) // never returned below exit
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `npx vitest run tests/lib/motion-engine.test.ts`

- [ ] **Step 3: Implement `lib/motion-targets.ts`**

```ts
// lib/motion-targets.ts
import { POSE } from '@/lib/motion-engine';

export type MotionTarget = {
  exerciseId: string;
  bodyPart: string;
  joint: { a: number; vertex: number; b: number };
  targetRomMin: number;
  targetRomMax: number;
  repEnterAngle: number;
  repExitAngle: number;
  repTarget: number;
};

// v1 defaults for the three rep-based exercises. Balance (ex-4) has none, so its
// "Check your motion" button never renders. Admin can override any of these in
// Firestore (exerciseMotionTargets/{exerciseId}); these are the fallback.
export const DEFAULT_MOTION_TARGETS: Record<string, MotionTarget> = {
  'ex-1': { exerciseId: 'ex-1', bodyPart: 'Lower limb',
    joint: { a: POSE.R_HIP, vertex: POSE.R_KNEE, b: POSE.R_ANKLE },
    targetRomMin: 85, targetRomMax: 170, repEnterAngle: 160, repExitAngle: 100, repTarget: 10 },
  'ex-2': { exerciseId: 'ex-2', bodyPart: 'Shoulder',
    joint: { a: POSE.R_HIP, vertex: POSE.R_SHOULDER, b: POSE.R_ELBOW },
    targetRomMin: 20, targetRomMax: 160, repEnterAngle: 140, repExitAngle: 50, repTarget: 10 },
  'ex-3': { exerciseId: 'ex-3', bodyPart: 'Lumbar spine',
    joint: { a: POSE.R_SHOULDER, vertex: POSE.R_HIP, b: POSE.R_KNEE },
    targetRomMin: 120, targetRomMax: 175, repEnterAngle: 165, repExitAngle: 135, repTarget: 10 },
};
```

- [ ] **Step 4: Implement `MotionJudge`** (append to `lib/motion-engine.ts`)

```ts
// lib/motion-engine.ts (append)
import type { MotionTarget } from '@/lib/motion-targets';

export type FrameResult = { angle: number; reps: number; romMin: number; romMax: number; phase: 'down' | 'up'; cue: string };
export type SessionSummary = { reps: number; romMin: number; romMax: number; avgQuality: number; passed: boolean };

export class MotionJudge {
  private t: MotionTarget;
  private phase: 'down' | 'up' = 'down';
  private reps = 0;
  private romMin = Infinity;
  private romMax = -Infinity;
  private peakThisRep = -Infinity;
  private qualities: number[] = [];

  constructor(target: MotionTarget) { this.t = target; }

  update(landmarks: Landmark[]): FrameResult {
    const j = this.t.joint;
    const a = landmarks[j.a], v = landmarks[j.vertex], b = landmarks[j.b];
    const angle = a && v && b ? computeAngle(a, v, b) : 0;
    this.romMin = Math.min(this.romMin, angle);
    this.romMax = Math.max(this.romMax, angle);

    let cue = 'Keep going';
    if (this.phase === 'down' && angle >= this.t.repEnterAngle) {
      this.phase = 'up'; this.peakThisRep = angle;
    } else if (this.phase === 'up') {
      this.peakThisRep = Math.max(this.peakThisRep, angle);
      if (angle <= this.t.repExitAngle) {
        this.phase = 'down';
        this.reps += 1;
        const q = Math.min(100, Math.round((this.peakThisRep / this.t.targetRomMax) * 100));
        this.qualities.push(q);
        cue = q >= 90 ? 'Good rep' : 'Try for more range';
        this.peakThisRep = -Infinity;
      }
    }
    if (this.phase === 'up' && angle < this.t.targetRomMax - 15) cue = 'Go further';
    return { angle: Math.round(angle), reps: this.reps, romMin: Math.round(this.romMin), romMax: Math.round(this.romMax), phase: this.phase, cue };
  }

  summary(): SessionSummary {
    const avgQuality = this.qualities.length
      ? Math.round(this.qualities.reduce((s, q) => s + q, 0) / this.qualities.length) : 0;
    return {
      reps: this.reps,
      romMin: this.romMin === Infinity ? 0 : Math.round(this.romMin),
      romMax: this.romMax === -Infinity ? 0 : Math.round(this.romMax),
      avgQuality,
      passed: this.reps >= this.t.repTarget && avgQuality >= 60,
    };
  }
}
```

- [ ] **Step 5: Run — expect PASS.** `npx vitest run tests/lib/motion-engine.test.ts`
- [ ] **Step 6: Commit** — `git add lib/motion-engine.ts lib/motion-targets.ts tests/lib/motion-engine.test.ts && git commit -m "feat(motion): MotionTarget defaults + hysteresis rep/ROM/quality judge"`

---

## Task 3: Firestore motion layer (`lib/motion.ts`)

**Files:** Create `lib/motion.ts`; Test `tests/lib/motion.test.ts`.

**Interfaces:**
```ts
export type MotionSession = {
  exerciseId: string; bodyPart: string; date: string;
  reps: number; repTarget: number;
  romMin: number; romMax: number; targetRomMin: number; targetRomMax: number;
  avgQuality: number; passed: boolean; durationSec: number;
  source: 'web' | 'mobile'; createdAt?: unknown;
};
export function getMotionTarget(exerciseId: string): Promise<MotionTarget | null>; // Firestore override, else DEFAULT_MOTION_TARGETS[id] ?? null
export function saveMotionTarget(target: MotionTarget, adminUid: string): Promise<void>; // exerciseMotionTargets/{exerciseId}
export function saveMotionSession(uid: string, personId: string, s: Omit<MotionSession,'createdAt'|'source'>): Promise<void>; // writes session + marks today's exerciseLog complete
export function getMotionSessions(uid: string, personId: string, max?: number): Promise<MotionSession[]>;
```

`saveMotionSession` writes `patients/{uid}/people/{personId}/motionSessions/{autoId}` with `source:'web'`, `createdAt: serverTimestamp()`, and ALSO `setDoc(..., exerciseLogs/{todayKey}, { completions: { [exerciseId]: true }, loggedAt: serverTimestamp() }, { merge:true })` so the existing streak/adherence counts it. Reuse `todayKey` from `lib/recovery.ts`.

- [ ] **Step 1: Write the failing test** — mock `firebase/firestore` and `@/lib/firebase` (mirror `tests/components/admin-patient-selector.test.tsx`'s mock style). Assert:
  - `getMotionTarget('ex-1')` returns the default when the Firestore doc doesn't exist (`getDoc` → `{ exists: () => false }`).
  - `getMotionTarget('ex-1')` returns the Firestore data when the doc exists.
  - `getMotionTarget('ex-9')` returns `null` (no default, no doc).
  - `saveMotionSession` calls `addDoc`/`setDoc` for the session AND a `setDoc` merge on `exerciseLogs/<today>` with `{ [exerciseId]: true }`.

```ts
// tests/lib/motion.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/lib/firebase', () => ({ db: {} }))
const getDoc = vi.fn(); const setDoc = vi.fn().mockResolvedValue(undefined); const addDoc = vi.fn().mockResolvedValue({ id: 'x' })
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((..._a) => ({ __doc: _a })),
  collection: vi.fn((..._a) => ({ __col: _a })),
  getDoc: (...a: unknown[]) => getDoc(...a),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  setDoc: (...a: unknown[]) => setDoc(...a),
  addDoc: (...a: unknown[]) => addDoc(...a),
  serverTimestamp: () => 'TS',
  query: vi.fn(), orderBy: vi.fn(), limit: vi.fn(),
}))
import { getMotionTarget, saveMotionSession } from '@/lib/motion'

beforeEach(() => { getDoc.mockReset(); setDoc.mockClear(); addDoc.mockClear() })

describe('getMotionTarget', () => {
  it('falls back to the code default when no Firestore doc', async () => {
    getDoc.mockResolvedValue({ exists: () => false })
    const t = await getMotionTarget('ex-1')
    expect(t?.exerciseId).toBe('ex-1'); expect(t?.repTarget).toBe(10)
  })
  it('returns null for an unknown exercise with no doc', async () => {
    getDoc.mockResolvedValue({ exists: () => false })
    expect(await getMotionTarget('ex-999')).toBeNull()
  })
})

describe('saveMotionSession', () => {
  it('writes the session and marks today\'s exercise log complete', async () => {
    await saveMotionSession('u1', 'p1', {
      exerciseId: 'ex-1', bodyPart: 'Lower limb', date: '2026-07-25',
      reps: 10, repTarget: 10, romMin: 85, romMax: 170, targetRomMin: 85, targetRomMax: 170,
      avgQuality: 88, passed: true, durationSec: 42,
    })
    expect(addDoc).toHaveBeenCalledTimes(1)
    // the exerciseLogs merge write:
    const mergeCall = setDoc.mock.calls.find(c => JSON.stringify(c[1]).includes('completions'))
    expect(mergeCall).toBeTruthy()
    expect(mergeCall![2]).toEqual({ merge: true })
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `npx vitest run tests/lib/motion.test.ts`

- [ ] **Step 3: Implement `lib/motion.ts`** (full, per the interfaces above; read `lib/recovery.ts` for `personBase`/`todayKey` patterns and reuse `todayKey`). Session write uses `addDoc(collection(personBase,'motionSessions'), {...})`; target read uses `getDoc(doc(db,'exerciseMotionTargets',exerciseId))` then `DEFAULT_MOTION_TARGETS[exerciseId] ?? null`.

- [ ] **Step 4: Run — expect PASS.** `npx vitest run tests/lib/motion.test.ts`
- [ ] **Step 5: Run full suite + lint.** `npm run test:run` && `npm run lint`
- [ ] **Step 6: Commit** — `git commit -m "feat(motion): Firestore motion targets + session persistence (counts toward streak)"`

---

## Task 4: Firestore rules for motion data

**Files:** Modify `firestore.rules`; extend `tests/rules/firestore.test.ts`.

- Under the existing `patients/{uid}/people/{personId}` subtree (where `exerciseLogs`/`painLogs` are ruled), add `match /motionSessions/{sessionId}` allowing read/write when the requester owns that patient tree (same condition the sibling `exerciseLogs` uses) or `isAdmin()`.
- Add top-level `match /exerciseMotionTargets/{exerciseId} { allow read: if isSignedIn(); allow create, update, delete: if isAdmin(); }` (mirrors `exerciseVideos`).

- [ ] **Step 1: Read** the existing `patients/.../people/.../{exerciseLogs}` match block and the `exerciseVideos` block to copy their exact conditions.
- [ ] **Step 2: Write failing rules tests** (extend `tests/rules/firestore.test.ts`): a patient can write their own `motionSessions` doc and read it; a different signed-in user cannot; any signed-in user can read `exerciseMotionTargets` but only admin can write it.
- [ ] **Step 3: Run — expect FAIL.** `npm run test:rules`
- [ ] **Step 4: Add the two rules blocks.**
- [ ] **Step 5: Run — expect PASS.** `npm run test:rules`
- [ ] **Step 6: Commit** — `git commit -m "feat(motion): firestore rules for motionSessions + exerciseMotionTargets"`

---

## Task 5: Install MediaPipe + client-only pose detector wrapper

**Files:** `package.json` (add dep); Create `lib/pose-detector.ts`.

- [ ] **Step 1: Install** — `npm install @mediapipe/tasks-vision@^0.10.14` (pin the installed version). Confirm it lands in `dependencies`.
- [ ] **Step 2: Implement `lib/pose-detector.ts`** — a lazy factory; the `@mediapipe/tasks-vision` import is INSIDE the async function so it is only pulled when called in the browser:

```ts
// lib/pose-detector.ts
// Client-only. Never import this from a server-reachable module top level.
export type PoseDetector = {
  detect(video: HTMLVideoElement, timestampMs: number): { x: number; y: number; z?: number; visibility?: number }[];
  close(): void;
};

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export async function createPoseDetector(): Promise<PoseDetector> {
  const vision = await import('@mediapipe/tasks-vision');
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM);
  const landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numPoses: 1,
  });
  return {
    detect(video, ts) {
      const res = landmarker.detectForVideo(video, ts);
      return res.landmarks?.[0] ?? [];
    },
    close() { landmarker.close(); },
  };
}
```

- [ ] **Step 3: Verify the production build tolerates the new dep** — `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false npm run build`. Expect: compiles; no server-side attempt to bundle the wasm at import (it's a dynamic import inside a function). If the build errors on `@mediapipe/tasks-vision` in the server bundle, add it to a client boundary only (it should already be, since nothing server-side imports `lib/pose-detector.ts`).
- [ ] **Step 4: Commit** — `git commit -m "feat(motion): add MediaPipe tasks-vision + client-only pose detector wrapper"`

---

## Task 6: The `MotionCheck` camera component

**Files:** Create `components/motion-check.tsx`; add styles to `app/globals.css`.

**Interface (props):** `{ exercise: { id: string; title: string; bodyPart: string }; target: MotionTarget; uid: string; personId: string; onClose: () => void }`.

Behaviour: on mount, `getUserMedia({ video: { facingMode:'user' } })`; on success, start a `requestAnimationFrame` loop that calls the pose detector, draws the skeleton on a `<canvas>` overlaying the `<video>`, feeds landmarks into a `MotionJudge`, and updates the live rep count / ROM meter / cue. A "Finish" button stops the loop, calls `saveMotionSession` with `judge.summary()`, and calls `onClose`. States: `requesting` (permission), `denied` (retry copy), `no-track` (when landmarks empty for >~3s: "Step back so we can see you"), `running`, `saving`. Always show the disclaimer: "Movement feedback only — not a medical assessment." Stop all tracks and `detector.close()` on unmount. Full component code is the deliverable; keep the pose import via `createPoseDetector()` from Task 5 (dynamic).

- [ ] **Step 1:** Implement the component (video+canvas, RAF loop, judge wiring, save, disclaimer, all states, cleanup).
- [ ] **Step 2:** Add `.motion-check-*` styles (modal, video, overlay canvas, rep counter, ROM meter, cue banner, disclaimer) to `app/globals.css`, using existing tokens.
- [ ] **Step 3: Verify build.** `npm run build` compiles.
- [ ] **Step 4: Commit** — `git commit -m "feat(motion): live camera MotionCheck component with skeleton overlay + save"`

(No unit test — it's camera/DOM. Verified by build + Task 8 browser smoke of the camera-absent path; the correctness-bearing logic is the unit-tested MotionJudge.)

---

## Task 7: Wire "Check your motion" into the exercise cards

**Files:** Create `components/motion-check-button.tsx`; Modify `components/assigned-exercises.tsx`; Test `tests/components/motion-check-button.test.tsx`.

`motion-check-button.tsx`: on mount, resolve `getMotionTarget(exerciseId)` and detect a camera via `navigator.mediaDevices?.enumerateDevices()` (any `kind==='videoinput'`). Render nothing if no target or no camera. Otherwise render a "Check your motion" button that lazy-loads `MotionCheck` via `next/dynamic(() => import('@/components/motion-check'), { ssr:false })` and opens it in a modal.

In `assigned-exercises.tsx`, render `<MotionCheckButton exerciseId={ex.id} exercise={ex} uid={uid} personId={personId} />` inside each `.exercise-card` (near the completion button). Preserve all existing behaviour.

- [ ] **Step 1: Write the failing test** (`tests/components/motion-check-button.test.tsx`): mock `@/lib/motion` `getMotionTarget` → resolves a target; mock `navigator.mediaDevices.enumerateDevices` → one `videoinput`; assert the button renders. Second case: `enumerateDevices` → no videoinput → button absent. Mock `next/dynamic` to a stub.
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement** the button + wire into `assigned-exercises.tsx`.
- [ ] **Step 4: Run** the new test + `tests/components/assigned-exercises.test.tsx` + full suite + lint — all PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(motion): camera-gated Check-your-motion button on exercise cards"`

---

## Task 8: Admin — motion targets editor + session review

**Files:** Create `components/admin-motion-targets.tsx`, `components/admin-motion-sessions.tsx`; Modify `app/admin/recovery/page.tsx`; Test `tests/components/admin-motion-targets.test.tsx`.

- `admin-motion-targets.tsx`: for each exercise in `lib/site-data` that has a default or stored target, a small form (targetRomMin/Max, repEnter/Exit, repTarget) that loads via `getMotionTarget` and saves via `saveMotionTarget(target, adminUid)`. Mirrors `admin-exercise-assigner.tsx`'s panel/row style.
- `admin-motion-sessions.tsx`: given the selected `{patientUid, personId}`, lists recent `getMotionSessions` (date, exercise, reps/target, ROM achieved vs target, quality, pass/fail).
- `app/admin/recovery/page.tsx`: mount both inside the existing selection flow next to `AdminExerciseAssigner` (they receive `adminUid` and the current `selection`). Keep the page's existing composition.

- [ ] **Step 1: Write the failing test** for `admin-motion-targets.tsx` (mock `@/lib/motion`; assert it loads a target into fields and calls `saveMotionTarget` on submit).
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement** both components + mount in the admin page.
- [ ] **Step 4: Run** the new test + `tests/app/admin-recovery.test.tsx` + full suite + lint — PASS.
- [ ] **Step 5: Production build + browser smoke.** `npm run build`; then run the dev server and load `/patient/exercises` in a NON-camera context (or with camera denied) to confirm the button hides / the app never SSR-crashes on the MediaPipe import; check console + `preview_logs` clean. Do NOT trigger sign-in emails.
- [ ] **Step 6: Commit** — `git commit -m "feat(motion): admin motion-target editor + per-patient session review"`

---

## Self-Review

**Spec coverage (design doc Phase 2 C/D/E):**
- C engine/UX: Tasks 1–2 (pure judge), 5 (pose), 6 (camera UI), 7 (button/gating + fallbacks). ✔
- D database: Task 3 (`exerciseMotionTargets` + `motionSessions` + streak write), Task 4 (rules). ✔
- E admin: Task 8 (target editor + session review on existing admin page). ✔
- "Movement feedback, not medical": disclaimer in Task 6; privacy (no video saved) in Global Constraints + Task 3. ✔
- Flutter is explicitly v1.1 — not in this plan. ✔

**Placeholder scan:** engine/DB/rules tasks carry full code + tests; UI tasks specify the exact interface, states, wiring, and verification. No TBD.

**Type consistency:** `Landmark`, `POSE`, `computeAngle`, `MotionJudge`, `FrameResult`, `SessionSummary` (Task 1–2); `MotionTarget`, `DEFAULT_MOTION_TARGETS` (Task 2); `MotionSession`, `getMotionTarget`/`saveMotionTarget`/`saveMotionSession`/`getMotionSessions` (Task 3) — used consistently in Tasks 5–8. `createPoseDetector` (Task 5) consumed in Task 6.

## Notes
- v1 loads MediaPipe WASM + model from CDN (no CSP to block it). Self-hosting under `/public` is a drop-in v1.1 change (swap the two URLs).
- The camera components can't be unit-tested; correctness lives in the unit-tested `MotionJudge`. Real device verification (a physio pointing a webcam at themselves) is the acceptance test and should be done with the owner before wide release.
