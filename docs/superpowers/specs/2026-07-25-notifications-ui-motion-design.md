# Notifications fix, UI polish & camera motion-check — Design

**Date:** 2026-07-25
**Status:** Approved (design), Phase 1 ready for implementation
**Author:** iamkjn + Claude

## Summary

A phased plan across five workstreams, in two phases:

- **Phase 1 (now):** (A) notification icon + read-state fix, (B) professional UI/typography polish.
- **Phase 2 (next):** (C) camera "Check your motion" live pose grading, (D) database additions for motion, (E) admin motion-target control + progress review.

Decisions locked with the product owner:

- **Platform:** Web **and** Flutter mobile both get the camera feature.
- **Order:** Quick wins (Phase 1) ship first; motion feature (Phase 2) follows.
- **Motion depth:** Full live pose grading (real-time skeleton, joint angles, range-of-motion, rep counting, feedback, saved results).
- **Budget-wise internal order for Phase 2:** build motion on **web first (v1)**, then **port to Flutter (v1.1)** — the judging logic and DB shape are written once and reused.
- **Motion targets live in Firestore, admin-editable** (single source of truth both apps read), not hard-coded.
- **Framing:** the motion tool is **movement feedback, not a medical/diagnostic device** — a clear disclaimer and graceful fallbacks are required.

## Current state (what already exists)

Everything below is in the Next.js web app (`app/`, `components/`, `lib/`).

- **Notifications:** `components/notification-bell.tsx` (emoji bell + unread badge, live via `subscribeNotifications`), `app/patient/notifications/page.tsx` (list + "Mark all read"), `lib/notifications.ts` (`subscribeNotifications`, `markAllRead`). **Gap:** nothing marks a notification read on open, so the badge only clears via the manual button.
- **Per-patient database** (Firestore), keyed `patients/{uid}/people/{personId}/…`:
  - `painLogs/{dateKey}`, `clinicalAssessments/{dateKey}`, `assignedExercises/{exerciseId}`, `exerciseLogs/{dateKey}`.
  - Helpers in `lib/recovery.ts` (`assignExercise`, `removeExercise`, `getAssignedExercises`, `toggleExerciseCompletion`, `getExerciseLogs`, …).
- **Streaks:** `components/streak-card.tsx` computes the daily streak from `exerciseLogs`.
- **Exercise catalog:** static `exercises: Exercise[]` in `lib/site-data.ts` (`{ id, title, bodyPart, condition, stage, description, videoUrl }`), currently 4 entries.
- **Admin (per patient):** `app/admin/recovery/page.tsx` composes `AdminPatientSelector`, `AdminExerciseAssigner` (assign/remove exercises), `AdminClinicalEntry`, `AdminRecoveryChart`. Also `admin-patients-list`, `admin-patient-detail`.

**Nothing exists yet** for camera / pose / motion (confirmed by grep).

---

## Phase 1A — Notification icon + read state

**Files:** `components/notification-bell.tsx`, `app/patient/notifications/page.tsx`, `lib/notifications.ts`, `app/globals.css`.

**Icon.** Replace the emoji `🔔` with an inline **SVG bell** (`stroke: currentColor`, scalable) in both the header bell and the notifications list item icon set. Keep the existing unread-count badge. Rationale: emoji render inconsistently per-OS and read as unpolished.

**Read-state behaviour.**
- Add `markRead(uid, id)` to `lib/notifications.ts` (single-doc update `{ read: true }`).
- **Opening the notifications page auto-marks visible items read** (calls the existing batched `markAllRead` once items load) → the bell badge clears on open. This is the "open = read" behaviour requested.
- **Each notification item becomes tappable:** tapping marks that item read via `markRead`, and if the notification carries a link/target, navigates there.
- The bell already subscribes to the same collection via `onSnapshot`, so the badge updates live the moment `read: true` is written — no extra wiring.

**Acceptance:**
- Bell shows a crisp SVG at all sizes; no emoji.
- Opening `/patient/notifications` clears the bell badge.
- Tapping a single item clears only that item's unread dot (and follows its link if present).
- `lib/notifications.ts` has unit coverage for `markRead` and the unchanged `markAllRead`.

## Phase 1B — Professional UI / typography polish

**Problem.** The design system ("The Clarity System" — Fraunces/DM Sans, warm paper, navy ink, single sky-blue accent; see `DESIGN.md`) is sound but **applied unevenly**: many components use one-off inline styles (`style={{ fontSize: 14, padding: "0.4rem 0" }}`, hard-coded `minHeight: 44`, ad-hoc margins). That inconsistency is what reads as amateurish.

**Approach (no re-theming — consistency only):**
1. **Lock tokens:** confirm/extend a single type scale (`--text-*`) and spacing rhythm in `app/globals.css`; ensure every step is defined and named.
2. **Replace ad-hoc inline styles** on the patient portal (`app/patient/*`, `components/patient-*`, `assigned-exercises`, `notification` views) and admin (`components/admin-*`) with the tokens/utility classes.
3. **Tighten vertical rhythm, card padding, and heading hierarchy** so pages feel like one product.
4. Use the **ui-ux-pro-max** skill; do a quick before/after **visual audit in the browser** (dev server + screenshots) to target the worst offenders rather than guessing.

**Acceptance:** no ad-hoc font-size/padding inline styles remain on the touched screens; type + spacing come from tokens; a before/after screenshot set shows consistent rhythm; light/dark and reduced-motion still pass.

---

## Phase 2 — Camera "Check your motion" (live pose grading)

### C. Feature & engine

**Patient UX.** On an assigned exercise, show a **"Check your motion"** button **only when a camera is present** (`navigator.mediaDevices.enumerateDevices()` → any `videoinput`). Tap → permission prompt → live view with **skeleton overlay**, **rep counter**, a **range-of-motion meter** for the targeted body part, and short cues ("go deeper", "slow down", "good rep"). On finish, a session summary is saved. Persistent **disclaimer**: movement feedback, not a medical diagnosis. **Fallbacks:** no camera → button hidden with an explainer; permission denied → clear retry copy; poor tracking/lighting → "we can't see you clearly" state.

**Web engine.**
- **MediaPipe Tasks Vision `PoseLandmarker`** (33 landmarks incl. 3D world coords). Model + WASM runtime **self-hosted under `/public`** (not a CDN) to satisfy Cloudflare/CSP and avoid the gRPC/`new Function()` SSR hazard noted in `CLAUDE.md`.
- Component is **client-only** (`dynamic(() => …, { ssr: false })`) so it never SSRs on the Worker.

**Shared judging engine (pure, unit-tested).** Input: pose landmarks + an exercise `MotionTarget`. Responsibilities:
- Compute the relevant **joint angle(s)** per frame (e.g. knee = angle at knee from hip→knee→ankle).
- Track **ROM** (min/max angle) over the session.
- **Count reps** via hysteresis threshold crossing (enter/exit angles) to avoid double-counting jitter.
- Score **quality** (0–100) from ROM achieved vs target and tempo.
- Emit **live cues** and a **session summary**.

Written in TypeScript for web; **ported to Dart** for Flutter (v1.1) with the same rules → identical results. Unit-tested against recorded landmark fixtures on both platforms.

**Flutter (v1.1).** `camera` plugin for frames + Google **ML Kit Pose Detection** (`google_mlkit_pose_detection`) for landmarks; reuse the ported judging engine and the same `MotionTarget` config + Firestore result shape.

### D. Database additions

- **Motion targets — `exerciseMotionTargets/{exerciseId}`** (top-level, admin-editable, read by both apps). Shape (draft):
  ```
  {
    exerciseId: string,
    bodyPart: string,            // e.g. "Knee"
    jointAngle: {                // which three landmarks form the measured angle
      a: LandmarkName, vertex: LandmarkName, b: LandmarkName
    },
    targetRomMin: number,        // degrees
    targetRomMax: number,
    repEnterAngle: number,       // hysteresis thresholds for rep detection
    repExitAngle: number,
    repTarget: number,
    updatedBy: string,
    updatedAt: Timestamp
  }
  ```
- **Motion results — `patients/{uid}/people/{personId}/motionSessions/{sessionId}`**:
  ```
  {
    exerciseId, bodyPart,
    date: dateKey,
    reps, repTarget,
    romMin, romMax, targetRomMin, targetRomMax,
    avgQuality: number,          // 0–100
    passed: boolean,
    durationSec: number,
    source: "web" | "mobile",
    createdAt: Timestamp
  }
  ```
- **Streak/adherence integration:** a completed motion session also writes the day's `exerciseLogs` completion for that exercise, so the **existing streak + adherence** counts it — one source of truth, no parallel streak logic.
- **Security rules** (`firestore.rules`): patients read their own `motionSessions`; only admin writes `exerciseMotionTargets`; add any needed index to `firestore.indexes.json`.
- **Dual-writer caution** (see project memory): web and mobile share `exerciseLogs` docs with differing shapes — agree the `motionSessions` shape up front and write it identically from both platforms to avoid retrofitting.

### E. Admin: motion targets + progress

Extend the **existing** per-patient admin screen (`app/admin/recovery`) so it is the single place to:
1. **Assign exercises** (already `AdminExerciseAssigner`).
2. **Set the motion target** per exercise (new editor writing `exerciseMotionTargets/{exerciseId}`): joints, target ROM, rep target.
3. **Review progress:** a patient's recent `motionSessions`, ROM trend (reuse `AdminRecoveryChart` infra), plus the existing streak/adherence.

No new top-level admin surfaces — build on what exists so it stays clear to manage.

---

## Testing

- **Unit:** `lib/notifications.ts` (markRead/markAllRead); the pure judging engine (angle, ROM, rep hysteresis, quality) against landmark fixtures; motion DB helpers.
- **Rules:** `firestore.rules` tests for `motionSessions` (patient-owned) and `exerciseMotionTargets` (admin-write).
- **Visual:** before/after screenshots for Phase 1B; browser smoke of the motion flow (camera-present and camera-absent paths).

## Out of scope (YAGNI for v1)

- Full admin CRUD of the exercise catalog (catalog stays static in `site-data.ts`; only motion targets are Firestore-editable).
- Storing/uploading video of the patient (privacy + storage cost); only derived metrics are saved.
- Multi-angle / body-tracking beyond the single targeted joint per exercise.
- Flutter build lands as v1.1 after the web v1 is validated.

## Execution notes

- Subagent-driven execution (per owner preference); independent workstreams (1A, 1B, and the Phase-2 pose-engine spike) can run in parallel.
- Verify branch before any commit/deploy (parallel-session hazard); build/deploy only from the correct branch.
