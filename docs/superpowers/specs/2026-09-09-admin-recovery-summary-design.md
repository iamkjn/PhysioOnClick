# Admin recovery summary — design

## Problem

On the admin side, the patient detail screen (`components/admin-patient-detail.tsx`)
shows a recovery ring, a "current pain" number, and a pain chart — but **not the
daily streak or exercise adherence**, which only render on the patient's own
dashboard. Clinicians literally cannot see whether a patient is doing their
exercises.

Worse, the shared `RecoveryPercentCard` and `RecoveryChart` leak patient-facing
copy into the clinician view ("Log your first pain check-in", link to
`/patient/recovery`). And `AdminClinicalEntry` presents a bare "Pain score"
slider with no framing, so it reads like the clinician is expected to log pain
daily — they are not. Pain is patient-self-reported via daily check-ins; the
clinician records a **session assessment** (pain + mobility + notes, tied to a
booking date).

## Solution

### A. New `components/admin-recovery-summary.tsx`

One read-only clinician dashboard block, wired into both
`admin-patient-detail.tsx` and `/admin/recovery`. Contains:

1. **Recovery-score ring** — reuse `RecoveryPercentCard` with a new `adminView`
   prop that swaps the empty/error copy to *"No pain check-ins from this patient
   yet."* / *"Couldn't load recovery data."* and drops the patient CTA link.
2. **Daily streak + adherence** card — streak number (reusing
   `computeStreakDays`), plus "X of last 28 days completed" adherence and a
   28-cell dot grid (green = at least one assigned exercise done that day).
   Renders nothing extra when the patient has no assigned exercises.
3. **Latest self-reported pain** — score `/10` + date + note, or "none yet".

Data: `getExerciseLogs(uid, personId, 28)`, `getAssignedExercises`,
`getPainLogs(uid, personId, 1)`. No schema changes, no new indexes.

### B. `RecoveryChart` — `adminView` prop

Turn on `showMobility` and replace the empty-state string "Log your first pain
check-in above." with "No pain or assessment data recorded yet."

### C. `AdminClinicalEntry` — reframe as session assessment

- Heading → "Record session assessment"
- Helper line: *"Recorded at a session — not a daily log. Patients report daily
  pain through their own check-ins."*
- Slider labels → "Pain (clinician-assessed)" / "Mobility (clinician-assessed)"

### Wiring

- `admin-patient-detail.tsx`: replace the ad-hoc "Recovery summary" + "Current
  pain" `<section>` (and the separate `AdminRecoveryChart`) with
  `<AdminRecoverySummary>` followed by `<AdminRecoveryChart adminView>`.
- `app/admin/recovery/page.tsx`: add `<AdminRecoverySummary>` beside the chart.

## Testing

- `tests/components/admin-recovery-summary.test.tsx`: streak/adherence math,
  empty-state (no assigned exercises), latest-pain rendering.
- Extend `tests/components/recovery-percent-card.test.tsx` for `adminView` copy.

## Out of scope

Changing how pain is stored, streak algorithm changes, mobile app.
