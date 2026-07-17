# Recovery graphics · Admin patient views · Family single-login — Design

Date: 2026-07-16
Scope: **web only** (no Flutter). Three independent workstreams. No new npm deps.

## Context / current state (mapped)

- **Recovery (web):** animated SVG ring (`components/recovery-percent-card.tsx`), Recharts pain-trend
  line chart (`components/recovery-chart.tsx`), adherence bar. Gaps: `mobilityScore` stored in
  `clinicalAssessments` but charted nowhere; admin-entered `painScore`/`recoveryPercent` on a
  `sessionSummary` never shown on the patient appointment-detail page.
- **Admin:** no patient list page, no per-patient detail page. Only `AdminPatientSelector` buried in
  `/admin/recovery`. `getPatientBookings` exists but admin never calls it; session summaries written
  by admin are never displayed back. Sticky navy header copy-pasted in 3 files.
- **Family/friends:** add/edit/remove people + view their recovery works on web. Booking FOR a
  dependent is broken on web (no "who is this for" step; `pendingSelections` never written → every web
  booking attributed to the account holder). Mobile (`who_is_this_for_screen.dart`) does it correctly
  by writing `pendingSelections/{uid}`, which `app/api/cal-webhook/route.ts` already merges. Active
  person doesn't persist across pages (per-page local state, resets to self).

## Firestore facts (unchanged by this work)

- `dependents/{id}`: `{ ownerId, name, dob, relationship, notes, avatarUrl?, createdAt }`.
- Recovery: `patients/{uid}/people/{personId}/{painLogs|clinicalAssessments|assignedExercises|exerciseLogs}`.
  `personId === uid` for self, `=== dependent.id` otherwise.
- `bookings/{id}`: server-written only (`allow create: if false`); carries `bookedBy`, `patientId`,
  `patientType`, `patientName`.
- `pendingSelections/{userId}`: `allow read,write: if auth.uid == userId`. Webhook reads it to
  attribute a booking to a dependent. **Web must mirror mobile's write to this doc.**

---

## Workstream A — Admin patient list → detail (read + existing actions)

Client components (existing admin pattern: client Firestore SDK + `AdminAuthGate`). Reuse everything.

- `app/admin/patients/page.tsx` (NEW) — `AdminAuthGate` → `AdminPatientsList`. Searchable list of all
  `patients` docs (same fetch as `admin-patient-selector.tsx`). Row → `/admin/patients/{uid}`.
- `app/admin/patients/[id]/page.tsx` (NEW) — `AdminAuthGate` → `AdminPatientDetail patientUid={id}`.
- `components/admin-patients-list.tsx` (NEW), `components/admin-patient-detail.tsx` (NEW).
- `components/admin-shell.tsx` (NEW) — extract the triplicated sticky navy header (`P` mark + "Admin"
  pill + optional back link + children). Adopt in `admin-dashboard.tsx`, `admin-chat-logs-gate.tsx`,
  `app/admin/recovery/page.tsx`.
- `components/admin-dashboard.tsx` (EDIT) — add a "Patients" nav entry linking to `/admin/patients`.

**Detail page sections** (self/dependent switcher via `PersonSwitcher` using its prop API — no context):
1. Recovery summary: `RecoveryPercentCard` (read-only) + current pain number.
2. Pain trend: `AdminRecoveryChart` (existing wrapper over `RecoveryChart`).
3. Bookings: `getPatientBookings(uid)` list; cancel via `cancelCalBooking` (behind `ConfirmDialog`).
4. Clinical assessments: list + add via `AdminClinicalEntry`.
5. Assigned exercises: `AdminExerciseAssigner`.
6. Session summaries: `getSessionSummary(bookingId)` per booking; publish/edit via `SummaryForm`.

Chosen over a dashboard modal: a real linkable `/admin/patients/[id]` route is simpler.

## Workstream B — Recovery graphics + animation + phone-responsive

- `components/recovery-chart.tsx` (EDIT): `ResponsiveContainer`; gradient area fill under the line;
  Recharts line-draw animation on mount; faint "healthy zone" reference band; **add mobility series**
  from `clinicalAssessments.mobilityScore`. **Keep props backward-compatible** (A reuses via
  `AdminRecoveryChart`). Keep the existing accessible text summary.
- `components/recovery-percent-card.tsx` (EDIT): count-up animation on the % number via
  `requestAnimationFrame` (respect `prefers-reduced-motion`). Keep the existing ring + props.
- `app/patient/appointments/[id]/page.tsx` (EDIT): render `summary.painScore` +
  `summary.recoveryPercent` (reuse the ring) — currently captured by admin but invisible to patient.
- `app/patient/recovery/page.tsx` + `app/globals.css` (EDIT): responsive pass so cards/chart stack
  cleanly ≤640px. **B is the only agent that edits `globals.css`.**

Chosen over framer-motion / new chart lib: Recharts + GSAP + CSS already installed.

## Workstream C — Family/friends under one login (web)

- `components/person-provider.tsx` (NEW): React context holding `{ personId, personName }`, persisted
  to `localStorage`, default self. Reconcile guard: if a stored `personId` isn't in
  `{uid, ...dependentIds}` for the current user, fall back to self.
- `app/layout.tsx` (EDIT): mount `PersonProvider` (covers both `/` home dashboard and `/patient/*`).
- `components/person-switcher.tsx` (EDIT): read/write the context; **keep the existing prop API**
  (admin reuse must not break). Add the reconcile guard.
- Booking-for-dependent (mirror mobile `who_is_this_for_screen.dart` exactly):
  - `components/booking-step-time.tsx` (EDIT): a "Booking for" picker (self + dependents), default =
    active person. On confirm, if a signed-in user + a non-self person is chosen, write
    `pendingSelections/{uid}` `{ patientType, patientId, patientName, patientAvatarUrl? }` **before**
    POSTing to `/api/cal/book`. Read `app/api/cal-webhook/route.ts` to match field names exactly.
    No change to `/api/cal/book` or the webhook.
  - `components/booking-flow.tsx` (EDIT): thread active person into the flow/rail.
- `components/home-dashboard.tsx` (EDIT): switcher uses context; "Book a session" CTA respects active
  person.
- `app/patient/appointments/page.tsx` (EDIT): switcher uses context.

## File ownership (no two agents edit the same file — safe parallel run)

- **A:** `app/admin/patients/**` (new), `components/admin-patients-list.tsx`,
  `components/admin-patient-detail.tsx`, `components/admin-shell.tsx`, `components/admin-dashboard.tsx`,
  `components/admin-chat-logs-gate.tsx`, `app/admin/recovery/page.tsx`. CSS via scoped `<style>` only.
- **B:** `components/recovery-chart.tsx`, `components/recovery-percent-card.tsx`,
  `app/patient/appointments/[id]/page.tsx`, `app/patient/recovery/page.tsx`, `app/globals.css`.
- **C:** `components/person-provider.tsx` (new), `app/layout.tsx`, `components/person-switcher.tsx`,
  `components/booking-step-time.tsx`, `components/booking-flow.tsx`, `components/home-dashboard.tsx`,
  `app/patient/appointments/page.tsx`. CSS scoped/inline only.

Shared read-only contracts: B keeps `recovery-chart.tsx` and `recovery-percent-card.tsx` props
backward-compatible; C keeps `person-switcher.tsx` prop API backward-compatible.

## Out of scope (flagged)

Flutter/Dart work; dependent avatar upload on web; linking admin chat-logs into patient detail.

## Verification

Single `npm run build` + `npm run lint` after all three land; then browser preview of
`/admin/patients`, `/patient/recovery`, and the booking flow. Existing tests stay green
(`npm run test:run`).
