# Patient-First Home Tab — Design

**Goal:** Signed-in patients see their own progress on the home tab, not marketing copy; a brand-new patient sees a getting-started checklist instead of an empty recovery tile.

## Problem

`HomeScreen` (`mobile_app/lib/src/features/home/home_screen.dart`) renders `PatientDashboard` for signed-in users, but then unconditionally continues into marketing content below it regardless of auth state: a trust bar, three "Why choose PhysioOnClick" feature cards, and a "Ready to book?" quick-book banner. A returning or new patient scrolls past their own dashboard straight into landing-page copy meant for guests.

Separately, `PatientDashboard`'s recovery area (`_RecoveryPercentTile`) has exactly one fallback state for a patient with no pain-log data yet: "Log your first check-in to see your recovery score." That's not useful for a patient who hasn't even booked a session yet — there's nothing to check in about.

## Design

### 1. `HomeScreen` — marketing content becomes guest-only

The `ListView` currently always renders (in order): header, dashboard-or-hero, trust bar, feature cards, quick-book card. Change: everything after the dashboard-or-hero (trust bar, feature cards, quick-book card) is wrapped in the same `user == null` branch as the hero banner, via one `StreamBuilder<User?>` around the whole post-header body. Signed-in patients see only header + `PatientDashboard`. Signed-out visitors see the existing marketing page unchanged.

### 2. `PatientDashboard` — upcoming appointment card

New widget `_UpcomingAppointmentCard`, placed directly under the person selector. Streams `AppointmentsRepository.watchBookings(uid)` (already exists, scoped to `bookedBy == uid` — covers bookings for dependents too), picks the earliest booking with `status == 'upcoming'` and `sessionDate` in the future, and renders its service name + formatted date/time. Renders nothing (`SizedBox.shrink()`) when there's no upcoming booking — this is not a new Firestore query, just a client-side pick over data already fetched elsewhere in the app via the same repository.

This card is scoped to the whole account (not the selected person in the dropdown) since "what's my next appointment" shouldn't change when switching between viewing your own recovery and a dependent's.

### 3. `PatientDashboard` — getting-started checklist for the selected person

New widget `_GettingStartedChecklist(uid, personId, personName)`, replacing `_RecoveryPercentTile` + `_PainCheckinCard` in the render tree *only* while the selected person hasn't completed all three steps below. Once all three are done, the checklist is gone for good and the existing `_RecoveryPercentTile`/`_PainCheckinCard` pair renders exactly as today — this changeover is a one-way transition per person, not a toggle.

Three steps, each resolved via a small `FutureBuilder`/`StreamBuilder` composition (no new Firestore collections):
1. **Book your first session** — done when a `bookings` doc exists with `patientId == personId` (new: one-shot query, not currently exposed by `AppointmentsRepository` — add `Future<bool> hasBookingFor(String personId)`).
2. **Complete your assessment** — done when `patients/{uid}/people/{personId}/assessmentForms` has at least one doc (new: one-shot query against that existing collection path, added as a small helper next to the checklist widget — no existing repository owns this path in a reusable way, so this stays local to the checklist rather than growing a shared repository method for a single caller).
3. **Start your rehab plan** — done when `RecoveryService.watchAssignedExercises(uid, personId)` (already exists) returns any docs.

Each row shows a check-circle or empty-circle icon and its label. The row for the *next* incomplete step also shows a small CTA: "Book session" (→ `WhoIsThisForScreen.go`) for step 1, nothing actionable for steps 2/3 (assessment is reached via the booking flow itself once booked; rehab assignment is physio-driven, not patient-initiated) — so only step 1 ever needs a button in practice, but the widget takes an optional CTA per step for symmetry rather than hardcoding a single special case.

## Data flow

No new Firestore writes, no new collections, no schema changes. Two new *read* queries (one-shot `bookings` lookup by `patientId`, one-shot `assessmentForms` existence check), both against collections the app already reads elsewhere.

## Testing

- Widget test: `HomeScreen` shows marketing content when signed out, hides it when signed in (using the existing Firebase-fake test pattern already used elsewhere in this codebase).
- Widget test: `_UpcomingAppointmentCard` renders nothing with no upcoming bookings, renders the earliest upcoming booking's service/date when present.
- Widget/unit test: getting-started checklist step-completion logic (pure function over booking/assessment/exercise-existence booleans → which step is "next"), plus a widget test that the checklist disappears once all three are done.

## Out of scope

- No changes to the marketing page's own content/copy for guests.
- No changes to `_RecoveryPercentTile`/`_PainCheckinCard`'s own internals — only when they render.
- No backend/Firestore rules changes.
