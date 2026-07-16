# PhysioOnClick — MVP Product Requirements Document

**Status:** Living document — current as of 2026-07-10
**Owner:** Krunal Nayak (Founder)

## 1. Overview & Vision

PhysioOnClick is a physiotherapy practice going online-first: patients book and pay for remote consultations through a web app and a companion Flutter mobile app, then track their recovery between sessions. In-person Glasgow home visits are a planned second phase, not part of this MVP.

The product spans two clients (Next.js web, Flutter mobile) sharing one Firebase backend (Auth, Firestore, Storage), with Cal.com handling scheduling and Stripe handling payment.

## 2. Target Users

- **Patient** — books and pays for sessions, manages their profile and (optionally) profiles for family members, views clinical notes and session summaries, follows an assigned exercise programme, and tracks recovery over time.
- **Admin / Physio** — the practice owner acting as clinician and operator: manages availability via Cal.com, records clinical assessments and session summaries, assigns exercises, and reviews each patient's recovery trend.

Role is enforced in `firestore.rules`: an `isAdmin()` check (custom auth claim or the fixed admin email) gates clinical writes; patients can only read/write their own UID-scoped data.

## 3. MVP Scope & Priority

| Priority | Feature | Build for MVP? | Current Status |
|---|---|---|---|
| ⭐⭐⭐⭐⭐ | Registration & Login | ✅ | **Built** |
| ⭐⭐⭐⭐⭐ | Online Booking | ✅ | **Built** |
| ⭐⭐⭐⭐⭐ | Calendar & Availability | ✅ | **Built** |
| ⭐⭐⭐⭐⭐ | Online Payments | ✅ | **Built** — via Cal.com Stripe Connect (the earlier custom `/api/checkout` was dead code, since deleted) |
| ⭐⭐⭐⭐⭐ | Patient Profile | ✅ | **Built** |
| ⭐⭐⭐⭐⭐ | Clinical Notes (Doctor) | ✅ | **Built** |
| ⭐⭐⭐⭐⭐ | Session Summary | ✅ | **Built** |
| ⭐⭐⭐⭐⭐ | Recovery Dashboard | ✅ | **Built** |
| ⭐⭐⭐⭐⭐ | Exercise Programme | ✅ | **Built** |
| ⭐⭐⭐⭐☆ | Basic Family Accounts | ✅ | **Built** |
| ⭐⭐⭐☆☆ | Video Consultation Integration | ✅ (simple integration) | **Decided (Cal Video) — enabling on the event type is the one remaining step** |

All ten MVP features now exist in the codebase or have a confirmed integration decision. This document specifies the requirements/acceptance criteria for each so gaps and edge cases can be checked deliberately.

## 4. Feature Requirements

### 4.1 Registration & Login
**Current implementation:** passwordless magic-link email auth (`app/api/auth/magic-link`, `app/auth/verify`), backed by a Firestore user record created on first sign-in.

- **FR1:** User enters their email and requests a sign-in link.
- **FR2:** Clicking the link verifies the user and creates a session; a user/patient record is created if one doesn't exist.
- **FR3:** Expired or invalid links show a clear error and let the user request a new one.

**Acceptance criteria:**
- A first-time user who completes the link flow lands with a working patient account and no duplicate records on repeat sign-ins.
- An expired-link attempt never silently fails — the user sees why and can retry.

### 4.2 Online Booking
**Current implementation:** custom 3-step booking flow (`components/booking-flow.tsx`) calling Cal.com's public v2 API via `app/api/cal/slots` and `app/api/cal/book` — no embed; bookings synced into Firestore via `app/api/cal-webhook`.

- **FR1:** Patient selects a service and an available time slot and confirms a booking without leaving the site/app.
- **FR2:** A confirmed booking is written to Firestore (via the Cal.com webhook) and linked to the patient's account when the booking email matches a known patient (`app/api/auth/link-bookings`).
- **FR3:** Booking appears in both the patient's appointments list and the admin view.

**Acceptance criteria:**
- Booking a slot removes it from availability for other patients (enforced by Cal.com).
- A guest booking (no account yet) still completes, and later gets linked once the patient signs in with the same email.

### 4.3 Calendar & Availability
**Current implementation:** managed in Cal.com host settings (`krunal-nayak-0nbytj`), not custom-built.

- **FR1:** Admin sets working hours, buffer times, and blocked-out dates in Cal.com; the booking widget reflects this in real time.
- **FR2:** Timezone is handled correctly for the patient's locale.

**Acceptance criteria:** No double-bookings occur; slots shown to patients always match what's actually free in Cal.com.

### 4.4 Online Payments
**Current implementation:** Cal.com Stripe Connect — payment is collected as part of the Cal.com booking ("Collect payment on booking"); the earlier custom `app/api/checkout` route has been deleted.

- **FR1:** Patient can pay by card for a session, either at time of booking or from the pricing page.
- **FR2:** Successful payment is recorded and tied to the correct booking/patient.
- **FR3:** Failed payment shows an error and lets the patient retry without losing their slot prematurely.

**Acceptance criteria:** A successful Stripe payment always results in a confirmed, correctly-priced booking; a failed payment never silently confirms a booking.

### 4.5 Patient Profile
**Current implementation:** `lib/patient-account.ts`, `app/patient/account`.

- **FR1:** Patient can view and edit name, contact details, and preferences.
- **FR2:** Profile data persists across sessions and devices (web + mobile, same Firebase backend).

**Acceptance criteria:** Edits save to Firestore and are reflected immediately on next load, on both clients.

### 4.6 Clinical Notes (Doctor)
**Current implementation:** `components/admin-clinical-entry.tsx` → `addClinicalAssessment` in `lib/recovery.ts`.

- **FR1:** Admin/physio logs a pain score, mobility score, and free-text notes against a specific patient, person, and date, optionally linked to a session ID.
- **FR2:** Only the admin role can create or edit clinical notes (enforced in `firestore.rules`).
- **FR3:** Notes feed into that patient's recovery calculation (§4.8).

**Acceptance criteria:** A patient cannot write or alter their own clinical assessments; an admin's entry is immediately reflected in the linked patient's recovery data.

### 4.7 Session Summary
**Current implementation:** `lib/session-summaries.ts`, `components/summary-form.tsx`, surfaced on `app/patient/appointments/[id]`.

- **FR1:** Admin writes a summary for a completed session, tied to a specific booking ID.
- **FR2:** Patient can view (and download, via `components/download-report-button.tsx`) the summary from their appointment detail page.

**Acceptance criteria:** A session summary is visible to the patient only after the admin has saved it; it's correctly scoped to the one booking it belongs to.

### 4.8 Recovery Dashboard
**Current implementation:** `recovery-percent-card.tsx`, `computeRecoveryPercent`, `app/patient/recovery`, `app/admin/recovery`.

- **FR1:** Recovery percentage is computed from pain-score logs and clinical assessments over time.
- **FR2:** Patient sees their own trend; admin sees trends across their patients.

**Acceptance criteria:** Adding a new pain log or clinical assessment updates the recovery percentage and trend chart without a page-level data model change.

### 4.9 Exercise Programme
**Current implementation:** exercise library in `lib/site-data.ts`; assignment via `components/admin-exercise-assigner.tsx`; patient view via `components/assigned-exercises.tsx`; completion logging in `lib/recovery.ts`.

- **FR1:** Admin assigns one or more exercises from the library to a specific patient/person.
- **FR2:** Patient sees their assigned exercises (with video) and can mark daily completion.
- **FR3:** Completion is logged per day and viewable as an adherence record.

**Acceptance criteria:** An assigned exercise appears for the correct patient only; marking complete persists and is reflected in that patient's recovery view.

### 4.10 Basic Family Accounts
**Current implementation:** `app/patient/people`.

- **FR1:** One login can manage multiple "people" (e.g. a parent booking/tracking for a child).
- **FR2:** Appointments, recovery, clinical notes, and exercises are scoped per-person, not merged across the account.

**Acceptance criteria:** Switching the active person in the account shows only that person's data; no cross-person data leakage.

### 4.11 Video Consultation Integration (decision made, one step remaining)
**Current implementation:** payment path confirmed (Cal.com Stripe Connect, GBP, £50/£40). Video itself not yet confirmed enabled — Cal Video is available free on the current plan, just needs turning on as the event type's location.

**Recommended approach:** since booking already runs through Cal.com, the "simple integration" the priority table calls for is enabling Cal.com's native video conferencing (Cal Video or Google Meet) on the relevant event type, rather than standing up a separate video stack (Zoom/Twilio/custom WebRTC). Cal.com then auto-generates a join link per booking with no extra infrastructure.

- **FR1:** A booking for a remote/video service type automatically gets a video join link generated at booking time.
- **FR2:** The join link is shown in the booking confirmation (email) and in the patient's appointment detail page.
- **FR3:** The admin sees the same join link from their appointment view.
- **FR4:** The link works from both the web app and the mobile app's booking WebView without requiring a separate video-app login.

**Acceptance criteria:** A patient can join a remote session from the link with one tap/click, on both web and mobile, with no additional account setup.

**Decision made:** Cal.com-native video (Cal Video), not a dedicated provider — consistent with the payment integration already set up on the same platform. Remaining: confirm it's actually turned on for the live event type.

## 5. Non-Functional Requirements

- **Data privacy:** clinical notes, pain scores, and session summaries are health data — access must stay restricted to the owning patient and admin only, per the existing `firestore.rules` model. No relaxing of those rules for convenience.
- **Cross-platform parity:** every patient-facing MVP feature above exists (or must exist) on both the Next.js web app and the Flutter mobile app, since patients may use either.
- **Reliability of booking↔account linking:** guest bookings must reliably link to the right patient account by email; this is load-bearing for profile, recovery, and clinical-note continuity.

## 6. Out of Scope (for this MVP)

- Symptom checker (previously removed from both web and mobile by explicit product decision).
- In-person Glasgow home visits (planned phase 2, not part of this online-first MVP).
- Any video provider beyond the single "simple integration" described in §4.11 (no in-call chat, recording, or multi-party calls).

## 7. Success Metrics

- % of bookings completed fully online (booking → payment → confirmation) without manual admin intervention.
- Patient repeat-booking rate.
- Exercise programme adherence rate (completion logs vs. assigned exercises).
- Reduction in admin time spent on manual clinical record-keeping (proxy: clinical notes and summaries entered digitally vs. offline).

## 8. Known Gaps & Risks

Found by auditing the current implementation against this document's own acceptance criteria — real, verified issues, not speculative ones.

### 8.1 ~~Family Accounts: bookings aren't person-scoped~~ — FIXED
Was: `lib/patient-bookings.ts` filtered only by `bookedBy == userId`, no `personId` field, so a parent booking for two children saw both merged with no way to tell them apart. Fixed: `getPatientBookings` now accepts an optional `personId` and filters on the `patientId` field the booking-creation paths already write; `app/patient/appointments/page.tsx` wires in the same `PersonSwitcher` the recovery page uses; added the required composite index in `firestore.indexes.json`. Also fixed a related bug found in the process: `app/api/auth/link-bookings/route.ts` was writing a field called `patientUid` that no read path or security rule ever checked (should have been `bookedBy`) — guest bookings were silently never linking to a new account after sign-up.

### 8.2 ~~`bookings` collection is open-write~~ — FIXED
Was: `allow create: if true` (unauthenticated included), with a dead client helper (`saveBooking()` in `lib/firestore-helpers.ts`) as the only would-be caller. Fixed: `create` is now `if false` — confirmed zero legitimate client callers exist; all real writes go through the Admin SDK (Cal.com webhook, appointments sync, link-bookings), which bypasses rules entirely. Removed the dead `saveBooking()` function.

### 8.3 ~~`payments` collection is client-writable but unused~~ — FIXED
Was: `allow create: if createsOwnEmailResource()`, with nothing in the app reading the collection. Fixed: locked to `allow read, write: if isAdmin()`. Removed the now-unused `createsOwnEmailResource()` rule helper.

### 8.4 ~~Video Consultation feasibility unconfirmed~~ — PARTIALLY RESOLVED
Payment side confirmed: Cal.com's Stripe Connect is set up (GBP, £50/£40 pricing, "Collect payment on booking" enabled), and confirmed available on the free plan alongside Cal Video. Cal Video itself isn't yet confirmed turned on as the event type's location — that's the one remaining step. The orphaned custom booking pipeline (`booking-form.tsx`, `api/booking`, `lib/google-calendar.ts`, `api/checkout`) has been deleted as superseded by this.

### 8.5 ~~Calendar & Availability has a history of embed reliability issues~~ — MOOT
The Cal.com inline embed (and its Next.js SPA-navigation reinitialization bug) is gone: booking is now a custom flow calling Cal.com's API server-side (§4.2), so there is no third-party embed inside Next.js routing to break.

### 8.6 ~~Zero automated test coverage~~ — CORRECTED
This was wrong — stated without actually running the suite. A real test suite exists (`tests/`, 42 files, 141 tests), and it has since grown to cover the booking path's API routes (`tests/api/cal-book.test.ts`, `tests/api/cal-slots.test.ts`). Running it caught a genuine bug — see §9. Remaining gap: `cal-webhook` and `link-bookings` are still untested.

## 9. Roadmap & Priorities

Full reasoning in [`docs/strategic-review.md`](strategic-review.md). Summary of what changes in this document as a result:

**Immediate, in order:**
1. **Test the money/data path** (§8.6) — booking creation (`cal/book` and `cal/slots` now tested) and the magic-link auth flow; `cal-webhook` and `link-bookings` remain. Payment runs through Cal.com Stripe Connect, so there is no custom checkout code to test.
2. **Confirm §4.11/§8.4** — check whether the current Cal.com plan includes native video before building or integrating anything else.
3. **Run one real patient through the entire flow** (book → pay → attend → session summary → portal login) before adding new scope. This will surface more real problems than further building will.

**Explicitly deferred** (not needed for the next real patient, revisit after the above):
- Family accounts beyond what §4.10/§8.1 already fixes
- AI chatbot
- Admin live-stats dashboard depth
- Recovery adherence charts/trend visuals beyond §4.8's current scope
- Further animation/micro-interaction polish
- Mobile app parity work beyond what's already shipped

**Standing question, not yet decided:** whether the custom booking/clinical/recovery backend remains the right long-term bet versus a mature physio-specific SaaS (Cliniko/Jane App/Physitrack), which already provide built-in video and certified compliance at low monthly cost. Revisit with real patient-volume evidence once the immediate priorities above are done — not before, and not by default momentum.
