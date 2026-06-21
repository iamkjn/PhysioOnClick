# Recovery Dashboard — Design Spec

**Date:** 2026-06-21  
**Feature:** Patient recovery dashboard with pain tracking, exercise adherence, and physio clinical assessments  
**Scope:** Web (`/patient/recovery`, `/admin/recovery`) + Flutter mobile app admin section

---

## Overview

A dedicated recovery dashboard at `/patient/recovery` that allows:
- Patients to log daily pain scores and tick off completed exercises
- Physiotherapists to assign exercises and record clinical assessments per session
- Both patient and physio data to appear on a shared recovery chart
- Multi-person support — one account can track recovery for multiple people (family members, dependents)

The physio manages everything from either the web admin panel or a new admin section in the Flutter mobile app, unlocked by their admin account role.

---

## Firestore Schema

All recovery data lives under the existing `patients/{uid}` document as sub-collections, with a `people/{personId}/` level to support multi-person accounts.

```
patients/{uid}/
  people/{personId}/
    painLogs/{YYYY-MM-DD}
      score: number          // 0–10, patient self-reported
      note: string           // optional, patient's own note
      loggedAt: Timestamp

    clinicalAssessments/{YYYY-MM-DD}
      painScore: number      // 0–10, physio-recorded
      mobilityScore: number  // 0–10, physio-recorded
      physioNotes: string
      sessionId: string      // links to bookings/{id}
      recordedAt: Timestamp

    assignedExercises/{exerciseId}
      exerciseId: string     // matches exercise.id in site-data / Firestore
      assignedAt: Timestamp
      assignedBy: string     // physio uid
      active: boolean

    exerciseLogs/{YYYY-MM-DD}
      completions: { [exerciseId]: boolean }
      loggedAt: Timestamp
```

**Person identity:**
- `personId === uid` for the account holder ("Me")
- `personId === dependent.id` for dependents (auto-generated Firestore doc ID from the top-level `dependents` collection, which already stores all family members with `ownerId: uid`)

**Date keys** (one document per day) keep range queries cheap — the chart fetches a 56-day snapshot, not a full collection scan.

---

## Pages

### `/patient/recovery` (new)

Dedicated recovery page, auth-gated (patient or admin role). Linked from the nav pill row on `/patient` alongside "My Appointments", "My People", "My Account".

### `/admin/recovery` (new)

Admin-only recovery management page within the existing `/admin/` area. Physio can search patients, pick a person, assign exercises, and add clinical assessments.

---

## Components

### New — patient-facing

| Component | File | Responsibility |
|---|---|---|
| `PersonSwitcher` | `components/person-switcher.tsx` | Dropdown of people under the account. Reads `users/{uid}` for "Me" + queries `dependents` collection where `ownerId === uid` (existing lib). Defaults to account holder. Sets active `personId` for all child components. |
| `PainCheckIn` | `components/pain-check-in.tsx` | Slider 0–10 + optional note + submit. Writes to `painLogs/{today}`. Disabled (shows today's score) if a log already exists for today. |
| `RecoveryChart` | `components/recovery-chart.tsx` | Recharts `LineChart` reading the last 56 days of `painLogs` (teal line) and `clinicalAssessments` (navy line) for the selected `personId`. Replaces the dummy `ProgressChart`. |
| `AssignedExercises` | `components/assigned-exercises.tsx` | Grid of exercises assigned to this person. Each card has a daily checkbox. Reads `assignedExercises` (which exercises) and `exerciseLogs/{today}` (which are ticked). Checking a box merges `completions.{exerciseId}: true` into `exerciseLogs/{today}`. |
| `AdherenceBar` | `components/adherence-bar.tsx` | "5 of 7 days this week" — computed from `exerciseLogs` for the current Mon–Sun week. Simple progress bar. |

### New — admin-facing (web)

| Component | File | Responsibility |
|---|---|---|
| `AdminPatientSelector` | `components/admin-patient-selector.tsx` | Search and select a patient by name/email, then select which person under their account. |
| `AdminExerciseAssigner` | `components/admin-exercise-assigner.tsx` | Shows assigned exercises for the selected person with remove buttons. Shows remaining exercises from library to assign. Writes to `assignedExercises`. |
| `AdminClinicalEntry` | `components/admin-clinical-entry.tsx` | Form: date, pain score, mobility score, notes, optional booking link. Writes to `clinicalAssessments/{date}`. |
| `AdminRecoveryChart` | `components/admin-recovery-chart.tsx` | Read-only version of `RecoveryChart` for the selected patient/person. |

### Updated

| Component | Change |
|---|---|
| `components/progress-chart.tsx` | Remove hardcoded dummy data. `RecoveryChart` supersedes it. Can be deleted after migration. |
| `app/patient/page.tsx` | Add "My Recovery" nav pill linking to `/patient/recovery`. |

---

## Data Flow

### Patient side

1. Patient lands on `/patient/recovery` — `PersonSwitcher` loads their people list, defaults to "Me" (`personId = uid`)
2. Selecting a different person re-renders `RecoveryChart`, `PainCheckIn`, `AssignedExercises`, `AdherenceBar` with the new `personId`
3. `RecoveryChart` queries `painLogs` + `clinicalAssessments` for last 56 days, merges into a date-indexed array, renders two lines
4. `PainCheckIn` writes `painLogs/{YYYY-MM-DD}` — idempotent (overwrites if logged again same day)
5. Exercise checkbox → merge write to `exerciseLogs/{today}.completions.{exerciseId}`

### Physio side (web + mobile)

1. Physio logs in → `role === "admin"` detected → admin UI unlocked
2. Selects patient + person via `AdminPatientSelector`
3. Assigns/removes exercises via `AdminExerciseAssigner` → writes `assignedExercises/{exerciseId}`
4. After a session, adds clinical assessment via `AdminClinicalEntry` → writes `clinicalAssessments/{YYYY-MM-DD}`
5. Views patient's chart via `AdminRecoveryChart` (read-only)

All reads/writes are client-side Firestore — same pattern as `PatientLiveOverview`. No server functions required.

---

## Flutter Mobile — Admin Section

**Existing tabs (unchanged for patients):** Home, Services, Booking, Profile

**When admin account logs in:** A 5th tab — **Manage** — appears. Invisible to patient accounts. Role is read from `users/{uid}.role` on sign-in.

**Manage tab screens:**

1. **Patient list screen** — searchable list of patients. Tap a patient → person selector → recovery panel
2. **Recovery panel screen** — mirrors web admin capabilities:
   - View recovery chart (read-only)
   - Assign / remove exercises
   - Add clinical assessment

Both web and Flutter write to identical Firestore paths, so data is always in sync.

---

## Security Rules

Firestore rules to add/update:

- Patients can read/write `patients/{uid}/people/{personId}/**` only where `uid === request.auth.uid`
- Admins (`role === "admin"`) can read/write any `patients/*/people/**` path
- Patients can **read** `clinicalAssessments` (to see the physio line on their chart) but cannot **write** to it — writes are admin-only

---

## Out of Scope (this spec)

- Push/WhatsApp reminders for daily pain check-in (separate feature)
- AI-generated recovery commentary ("your pain reduced 20% this week") — separate feature
- PDF export of recovery report — separate feature
- Video upload for exercise library — separate feature
