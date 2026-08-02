# Booking-gated assessments + link email + final reminder

**Date:** 2026-08-02
**Status:** Approved design (pending spec review)

## Problem

Today any signed-in patient can start a self-assessment from the portal
(`app/patient/assessment`), with no connection to whether they've booked. We
want the assessment to be a **pre-appointment step for paid bookings**:

1. Remove the self-service "start assessment" entry points.
2. A patient can only start an assessment once they have a **paid booking**.
3. On a paid booking, email the patient a "complete your assessment" link
   alongside the invoice (and the meeting link when available), stating they
   must finish it **before** the appointment ("it helps both of us").
4. Admins can only see assessments patients have **submitted**.
5. If the assessment isn't done ~1 hour before the appointment, **re-send** the
   self-assessment link as a final reminder (email + mobile push).
6. Deliver this flow on **web and mobile**.

## Decisions (from brainstorming)

- **Scope:** paid bookings only.
- **Frequency:** per new appointment — each upcoming paid booking requires a
  fresh assessment.
- **Email link:** magic-link auto sign-in, landing on the assessment.
- **Reminder:** email + mobile push, ~1h before.
- **Mobile:** native Flutter form writing to the same Firestore shape as web.

## Current-state facts (grounding)

- Assessment data lives at `patients/{uid}/people/{personId}/assessmentForms/{autoId}`
  (`lib/assessment-forms.ts`): `submitPatientAssessmentForm(uid, personId, input)`,
  `getPatientAssessmentForms(uid, personId)`, `updateAssessmentReview(...)`. Docs
  carry `reviewStatus` (default `awaiting_review`), `formType` (`initial|checkup`),
  `consultationMode`, timestamps, red flags, etc. Only **submitted** docs exist.
- Assessment page `app/patient/assessment/page.tsx` gates on Firebase auth only.
  Entry points: `components/home-dashboard.tsx` `SECONDARY_ACTIONS` and
  `app/patient/account/page.tsx` pill row.
- Bookings live in `bookings` (`app/api/cal-webhook/route.ts` on `BOOKING_CREATED`):
  `email`, `fullName`, `sessionDate` (Timestamp = appointment start, the source of
  truth), `appointmentDate/Time/Label`, `calBookingUid`, `status: "upcoming"`,
  plus linkage `bookedBy` (uid), `patientType` (`self`|dependent), `patientId`
  (= `personId`; `self` → uid), `patientName`. Paid reconciliation adds
  `paid: true`, `amountPaidPence`, `paymentProvider`. **No Cal meeting link is
  stored today** — it must be captured from the webhook payload.
- Paid receipt email: `lib/emails/receipt-email.ts` (`sendReceiptEmail(...)`),
  called from `app/api/payments/webhook/route.ts` after the invoice PDF is built
  and the booking is stamped paid. Resend via `fetch`, `RESEND_API_KEY` /
  `ENQUIRY_EMAIL_FROM`.
- Magic link: `app/api/auth/magic-link/route.ts` — `generateSignInWithEmailLink`
  with `returnTo` restricted to `/book`|`/patient`. Must extend allow-list to
  `/patient/assessment`.
- Scheduled function precedent: `functions/src/index.ts` `sendFollowUpReminders`
  (`onSchedule`, `collectionGroup` query, dedupe marker, FCM + `notifications`
  doc). FCM send pattern reads `users/{bookedBy}.fcmToken`. `functions/` has **no**
  Resend dependency today.
- Admin: gating in `lib/admin-auth.ts` (client) + `app/admin/actions.ts`
  `ADMIN_EMAIL` (server). Admin assessment review UI already exists:
  `components/admin-assessment-review.tsx` (used by `components/admin-patient-detail.tsx`).

## Data model changes

### `bookings` doc — new fields
- `assessmentRequired: boolean` — set `true` when the booking becomes paid.
- `assessmentFormId: string | null` — the submitted assessment linked to this
  booking (null until submitted).
- `assessmentCompletedAt: Timestamp | null`.
- `meetingUrl?: string` — captured from Cal webhook `location`/`videoCallUrl`.
- `reminders: { assessmentDueSent?: boolean }` — dedupe marker for the 1h reminder.

### `assessmentForms` doc — new field
- `bookingId: string` — the booking this assessment was completed for. Lets the
  same person hold multiple bookings, each with its own assessment (per-appointment
  frequency), and lets admin correlate assessment ↔ appointment.

No change to `reviewStatus` semantics; only submitted docs are ever written, so
"admins see only submitted" holds by construction.

## Component / flow design

### A. Remove self-service entry points (web)
- Delete the assessment item from `SECONDARY_ACTIONS` in `home-dashboard.tsx`.
- Delete the "Assessment Form" pill from `app/patient/account/page.tsx`.

### B. Gate the assessment page (web)
`app/patient/assessment/page.tsx`:
- Read `?booking=<id>` from the URL (present in email link / banner). Resolve the
  active `personId` as today (PersonProvider), but prefer the booking's `patientId`
  when `?booking` is supplied.
- Query the person's **paid, upcoming** bookings (`getPatientBookings(uid, personId)`
  filtered to `paid == true` and upcoming). If none → render a "Book a session
  first" empty state (no form). If some → pick the target booking (the `?booking`
  one, else the soonest upcoming unassessed booking) and render the form.
- On submit, in addition to `submitPatientAssessmentForm`, stamp the target booking
  (`assessmentFormId`, `assessmentCompletedAt`) and set `bookingId` on the form.
  Booking stamp is written by a small server route (`app/api/patient/assessment/link`,
  ID-token verified, owner-scoped) since booking docs aren't client-writable for
  these fields under `firestore.rules`.

### C. Upcoming-appointment banner (web)
- On `app/patient/appointments` (and/or the dashboard), show a "Complete your
  assessment" prompt for any paid upcoming booking with `assessmentCompletedAt == null`,
  linking to `/patient/assessment?booking=<id>`.

### D. Assessment-link email (web, paid bookings)
- Extend `sendReceiptEmail` (or add a sibling `lib/emails/assessment-link-email.ts`
  and send both from the payments webhook) to include an **"Complete your
  assessment"** CTA + the meeting link when present, with copy that the assessment
  must be finished **before** the appointment.
- The CTA URL is a magic-link sign-in URL with `returnTo=/patient/assessment?booking=<id>`.
  Extend the magic-link `returnTo` allow-list to permit `/patient/assessment`.
- Capture `meetingUrl` from the Cal webhook payload and persist it on the booking so
  both the email and the banner can show it.

### E. Admin (web)
- Ensure the admin assessment list (`admin-assessment-review.tsx` /
  `admin-patient-detail.tsx`) only lists submitted forms (it does) and shows a clear
  **Submitted / Awaiting** status per the linked booking. No new page required;
  small display tweak + surface `bookingId`/appointment date for context.

### F. Final reminder ~1h before (Cloud Function + web email route)
- New `onSchedule({ schedule: "*/15 * * * *", timeZone: "Europe/London" })` function
  `sendAssessmentReminders` in `functions/src/index.ts`:
  - Query `bookings` where `status == "upcoming"`, `paid == true`,
    `assessmentCompletedAt == null`, `reminders.assessmentDueSent != true`, and
    `sessionDate` in `[now+55m, now+65m]`.
  - For each: send **FCM push** (existing pattern, deep-link payload
    `{ type: "assessment_due", bookingId }`), write a `notifications` doc, and
    trigger the **email** by POSTing to a secret-protected web route
    `POST /api/assessment/reminder-email` (`{ bookingId }`, shared `CRON_SECRET`
    header) so the email reuses the web template. Then set
    `reminders.assessmentDueSent = true` (dedupe).
- Rationale for split: email templating/Resend already lives in web; FCM + scheduling
  already lives in functions. Each side keeps its existing responsibility; the
  function orchestrates.

### G. Mobile (native Flutter form)
- New `mobile_app/lib/src/features/assessment/`: an `AssessmentScreen` +
  `assessment_repository.dart` writing to
  `patients/{uid}/people/{personId}/assessmentForms/{autoId}` with the **same field
  shape** as web (mirror `PatientAssessmentFormInput`), and calling the same booking
  link route.
- Gating identical to web: reachable only from a paid **upcoming** appointment — an
  entry point ("Complete assessment") on the appointment tile/detail in
  `features/appointments/`, not a standalone tab.
- Push reminder (`type: "assessment_due"`) deep-links to the assessment for
  `bookingId`.
- The Flutter form mirrors the web form's sections/fields so admin review is
  unchanged. (This is the largest single unit of work; it is self-contained.)

## Testing

- **Web unit (Vitest):**
  - Gate logic: no paid booking → blocked; paid upcoming booking → allowed; picks
    correct target booking from `?booking` and from soonest-unassessed fallback.
  - Booking-link route: owner can stamp own booking; non-owner → 403.
  - Reminder-email route: rejects without `CRON_SECRET`; sends for a due booking.
  - Magic-link allow-list accepts `/patient/assessment`, still rejects arbitrary paths.
  - Email builder includes assessment CTA + meeting link when present.
- **Functions:** unit-test the window query + dedupe marker logic (mock Firestore),
  mirroring existing `sendFollowUpReminders` tests if present.
- **Mobile:** repository writes expected field shape (widget/unit test as feasible);
  manual gating check from a paid appointment.

## Out of scope / YAGNI

- Free/unpaid bookings (paid-only per decision).
- Rewriting the admin review UI (reuse existing).
- Per-booking unguessable tokens (magic-link sign-in covers access).
- A standalone mobile assessment tab (entry is via the appointment only).

## Rollout notes

- New env: `CRON_SECRET` (web + functions). Confirm `RESEND_API_KEY` reachable by
  the reminder path (web route already has it).
- Deploy order: web (routes + gating + email) → functions (scheduled reminder) →
  mobile.
- Existing self-service assessments already submitted remain valid; the gate only
  affects new access.
