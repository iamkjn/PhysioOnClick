# Booking-Gated Assessments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the patient self-assessment a pre-appointment step gated behind a paid booking, email the assessment link (magic-link sign-in) with the invoice + meeting link, keep admin visibility to submitted forms, and send a final email+push reminder ~1h before the appointment; deliver on web and mobile.

**Architecture:** Web (Next.js App Router) adds a gate + banner + a server route to stamp bookings, extends the existing Stripe-webhook receipt email and magic-link allow-list, and adds a secret-protected reminder-email route. A new scheduled Firebase Cloud Function detects due bookings and orchestrates push + the email route. Mobile (Flutter) gets a native assessment form writing the same Firestore shape, reachable only from a paid appointment.

**Tech Stack:** Next.js 15 / React 19, Firebase (Firestore/Auth/Storage/Functions, admin REST shim `lib/firebase-admin.ts`), Resend (email via `fetch`), Vitest, Flutter (cloud_firestore, firebase_auth, http, firebase_messaging).

## Global Constraints

- Scope is **paid bookings only** (`bookings.paid == true`). Free bookings are never gated or emailed.
- Assessment frequency is **per appointment**: each upcoming paid booking requires its own submitted assessment; "done" ⇔ `bookings.assessmentCompletedAt != null`.
- Assessment Firestore path is unchanged: `patients/{uid}/people/{personId}/assessmentForms/{autoId}`. Mobile writes the **same field shape** as web (`PatientAssessmentFormInput` in `lib/assessment-forms.ts`).
- Booking `patientId` == assessment `personId` (`"self"` maps to the account `uid`). Join on this.
- Admin gating stays dual: client `lib/admin-auth.ts` + server `ADMIN_EMAIL` in `app/admin/actions.ts` (keep in sync). Admin email fallback: `hello@physioonclick.co.uk`.
- Booking fields for these features are **server-written only** (Admin SDK); do not attempt client writes to `bookings` for `assessment*`/`reminders` fields.
- Email sender env: `RESEND_API_KEY`, `ENQUIRY_EMAIL_FROM` (fallback `"PhysioOnClick <onboarding@resend.dev>"`). Missing key ⇒ skip/log in dev, hard-fail in prod (match existing `receipt-email.ts` behavior).
- New shared secret `CRON_SECRET` (web env + functions config) guards the reminder-email route.
- `sessionDate` (Firestore Timestamp) is the appointment-start source of truth.
- Deterministic/idempotent: reminder dedupe marker `bookings.reminders.assessmentDueSent`.
- Run web tests with `npm run test:run` (single file: `npx vitest run <path>`). Commit after each task.

---

## File Structure

**Web — create:**
- `lib/assessment-gate.ts` — server + shared helpers: find a person's paid upcoming bookings, pick the target booking, "assessment done" check.
- `app/api/patient/assessment/link/route.ts` — ID-token route: stamp a booking with `assessmentFormId`/`assessmentCompletedAt` (owner-scoped).
- `app/api/assessment/reminder-email/route.ts` — `CRON_SECRET`-guarded route that emails one booking's assessment reminder.
- `lib/emails/assessment-link-email.ts` — builds/sends the "complete your assessment" email (shared by webhook + reminder route).
- Tests under `tests/lib/`, `tests/api/`.

**Web — modify:**
- `components/home-dashboard.tsx` — remove assessment from `SECONDARY_ACTIONS`.
- `app/patient/account/page.tsx` — remove "Assessment Form" pill.
- `app/patient/assessment/page.tsx` — add gate + target-booking selection + stamp-on-submit.
- `components/patient-assessment-form.tsx` — accept an optional `bookingId` + `onSubmitted` to trigger the booking stamp.
- `app/patient/appointments/page.tsx` (and tile component) — "Complete your assessment" banner/CTA.
- `app/api/cal-webhook/route.ts` — capture + persist `meetingUrl` from the Cal payload.
- `app/api/payments/webhook/route.ts` — after receipt email, also send the assessment-link email; set `assessmentRequired: true` on the paid booking.
- `app/api/auth/magic-link/route.ts` — allow `returnTo == "/patient/assessment"`.
- `components/admin-assessment-review.tsx` / `components/admin-patient-detail.tsx` — Submitted/Awaiting indicator + linked appointment date.
- `lib/assessment-forms.ts` — add `bookingId` to `PatientAssessmentFormInput` + persisted doc.

**Functions — modify:**
- `functions/src/index.ts` — new `sendAssessmentReminders` scheduled function.
- `functions/package.json` — no new deps (uses `fetch`, Node 20 global).

**Mobile — create:**
- `mobile_app/lib/src/features/assessment/assessment_model.dart`
- `mobile_app/lib/src/features/assessment/assessment_repository.dart`
- `mobile_app/lib/src/features/assessment/assessment_screen.dart`

**Mobile — modify:**
- `mobile_app/lib/src/features/appointments/appointment_detail_screen.dart` (+ tile) — "Complete assessment" CTA gated to paid upcoming bookings lacking an assessment.
- Push handling (FCM) — deep-link `type: "assessment_due"` → assessment screen for `bookingId`.

---

## Phase 1 — Web gate foundations

### Task 1: `bookingId` on assessment form input + doc

**Files:**
- Modify: `lib/assessment-forms.ts`
- Test: `tests/lib/assessment-forms.test.ts` (create if absent)

**Interfaces:**
- Produces: `PatientAssessmentFormInput` gains optional `bookingId?: string`; `submitPatientAssessmentForm(uid, personId, input)` persists `bookingId` (default `""`).

- [ ] **Step 1: Write failing test** — assert a submitted form persists `bookingId`.

```ts
// tests/lib/assessment-forms.test.ts
import { describe, it, expect, vi } from "vitest";
// Mock firebase/firestore addDoc to capture the written payload.
vi.mock("@/lib/firebase", () => ({ db: {} }));
const addDoc = vi.fn(async () => ({ id: "form1" }));
vi.mock("firebase/firestore", async (orig) => ({
  ...(await orig<typeof import("firebase/firestore")>()),
  addDoc: (...a: unknown[]) => addDoc(...a),
  collection: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => "TS"),
}));

import { submitPatientAssessmentForm } from "@/lib/assessment-forms";

describe("submitPatientAssessmentForm", () => {
  it("persists bookingId", async () => {
    await submitPatientAssessmentForm("u1", "self", {
      // minimal valid input per PatientAssessmentFormInput; fill required fields
      formType: "initial", consultationMode: "online", bookingId: "bk1",
    } as never);
    const written = addDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(written.bookingId).toBe("bk1");
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run tests/lib/assessment-forms.test.ts` → FAIL (`bookingId` undefined or type error).

- [ ] **Step 3: Implement** — in `lib/assessment-forms.ts`: add `bookingId?: string` to `PatientAssessmentFormInput`; in the write payload of `submitPatientAssessmentForm`, add `bookingId: input.bookingId ?? ""`.

- [ ] **Step 4: Run to verify it passes** — same command → PASS. (If the minimal input trips validation, extend the test input to satisfy required fields; read the existing type to enumerate them.)

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(assessment): carry bookingId on submitted form"`

---

### Task 2: Gate helper — paid upcoming bookings + target selection

**Files:**
- Create: `lib/assessment-gate.ts`
- Test: `tests/lib/assessment-gate.test.ts`

**Interfaces:**
- Produces:
  - `type GateBooking = { id: string; sessionDate: Date; assessmentCompletedAt: Date | null; paid: boolean; status: string }`
  - `selectTargetBooking(bookings: GateBooking[], preferredId?: string): GateBooking | null` — filters to paid + upcoming (`status === "upcoming"` and `sessionDate >= now`), then returns the `preferredId` match if present & eligible, else the **soonest** upcoming booking with `assessmentCompletedAt == null`, else null.

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/assessment-gate.test.ts
import { describe, it, expect } from "vitest";
import { selectTargetBooking, type GateBooking } from "@/lib/assessment-gate";

const soon = new Date(Date.now() + 3_600_000);
const later = new Date(Date.now() + 7_200_000);
const mk = (o: Partial<GateBooking>): GateBooking => ({
  id: "x", sessionDate: soon, assessmentCompletedAt: null, paid: true, status: "upcoming", ...o,
});

describe("selectTargetBooking", () => {
  it("returns null when no paid upcoming bookings", () => {
    expect(selectTargetBooking([mk({ paid: false })])).toBeNull();
  });
  it("prefers the requested booking id when eligible", () => {
    const a = mk({ id: "a", sessionDate: soon });
    const b = mk({ id: "b", sessionDate: later });
    expect(selectTargetBooking([a, b], "b")?.id).toBe("b");
  });
  it("falls back to soonest unassessed", () => {
    const done = mk({ id: "a", sessionDate: soon, assessmentCompletedAt: new Date() });
    const open = mk({ id: "b", sessionDate: later });
    expect(selectTargetBooking([done, open])?.id).toBe("b");
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run tests/lib/assessment-gate.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement**

```ts
// lib/assessment-gate.ts
export type GateBooking = {
  id: string;
  sessionDate: Date;
  assessmentCompletedAt: Date | null;
  paid: boolean;
  status: string;
};

export function selectTargetBooking(
  bookings: GateBooking[],
  preferredId?: string,
): GateBooking | null {
  const now = Date.now();
  const eligible = bookings
    .filter((b) => b.paid && b.status === "upcoming" && b.sessionDate.getTime() >= now)
    .sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime());
  if (eligible.length === 0) return null;
  if (preferredId) {
    const pref = eligible.find((b) => b.id === preferredId);
    if (pref) return pref;
  }
  return eligible.find((b) => b.assessmentCompletedAt === null) ?? null;
}
```

- [ ] **Step 4: Run to verify it passes** — PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(assessment): target-booking gate helper"`

---

### Task 3: Booking-link route — stamp booking on submit

**Files:**
- Create: `app/api/patient/assessment/link/route.ts`
- Test: `tests/api/assessment-link.test.ts`

**Interfaces:**
- Produces: `POST /api/patient/assessment/link` with `Authorization: Bearer <idToken>` and body `{ bookingId: string, assessmentFormId: string }`. Verifies token; loads `bookings/{bookingId}`; requires `booking.bookedBy === decoded.uid` (else 403); sets `assessmentFormId`, `assessmentCompletedAt: serverTimestamp()`. Returns `{ ok: true }`. 401 no/invalid token, 404 missing booking, 403 non-owner.

- [ ] **Step 1: Write failing tests** — mock `getAdminAuth`/`getAdminDb` (see `tests/api/*` for the established mocking pattern). Cases: no token → 401; non-owner → 403; owner → 200 and `update` called with `assessmentFormId` + a timestamp.

```ts
// tests/api/assessment-link.test.ts  (mirror mocking style of tests/api/payments-webhook.test.ts)
import { describe, it, expect, vi, beforeEach } from "vitest";
const verifyIdToken = vi.fn();
const update = vi.fn(async () => {});
const get = vi.fn();
vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({ verifyIdToken }),
  getAdminDb: () => ({ collection: () => ({ doc: () => ({ get, update }) }) }),
  FieldValue: { serverTimestamp: () => "TS" },
}));
import { POST } from "@/app/api/patient/assessment/link/route";
const req = (tok: string | null, body: unknown) =>
  new Request("http://x", { method: "POST", headers: tok ? { Authorization: `Bearer ${tok}` } : {}, body: JSON.stringify(body) });

beforeEach(() => { verifyIdToken.mockReset(); update.mockReset(); get.mockReset(); });

describe("assessment link route", () => {
  it("401 without token", async () => {
    expect((await POST(req(null, {}))).status).toBe(401);
  });
  it("403 for non-owner", async () => {
    verifyIdToken.mockResolvedValue({ uid: "u2" });
    get.mockResolvedValue({ exists: true, data: () => ({ bookedBy: "u1" }) });
    expect((await POST(req("t", { bookingId: "b1", assessmentFormId: "f1" }))).status).toBe(403);
  });
  it("200 for owner and stamps booking", async () => {
    verifyIdToken.mockResolvedValue({ uid: "u1" });
    get.mockResolvedValue({ exists: true, data: () => ({ bookedBy: "u1" }) });
    const res = await POST(req("t", { bookingId: "b1", assessmentFormId: "f1" }));
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ assessmentFormId: "f1" }));
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run tests/api/assessment-link.test.ts` → FAIL (route missing).

- [ ] **Step 3: Implement**

```ts
// app/api/patient/assessment/link/route.ts
import { NextResponse } from "next/server";
import { DecodedIdToken, FieldValue, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!auth || !db) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  let decoded: DecodedIdToken;
  try { decoded = await auth.verifyIdToken(token); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { bookingId, assessmentFormId } = (await request.json()) as {
    bookingId?: string; assessmentFormId?: string;
  };
  if (!bookingId || !assessmentFormId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const ref = db.collection("bookings").doc(bookingId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((snap.data() as { bookedBy?: string }).bookedBy !== decoded.uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await ref.update({ assessmentFormId, assessmentCompletedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true });
}
```

Note: confirm `FieldValue.serverTimestamp` is exported by `lib/firebase-admin.ts` (it is per CLAUDE.md). If the admin `doc()` lacks `.update`, use `.set({...}, { merge: true })`.

- [ ] **Step 4: Run to verify it passes** — PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(assessment): owner-scoped booking-link route"`

---

### Task 4: Gate the assessment page + stamp on submit

**Files:**
- Modify: `app/patient/assessment/page.tsx`, `components/patient-assessment-form.tsx`
- Test: manual (client page); logic already unit-tested in Task 2.

**Interfaces:**
- Consumes: `selectTargetBooking` (Task 2), `getPatientBookings(uid, personId)` from `lib/patient-bookings.ts` (extend to expose `paid` + `assessmentCompletedAt`), `POST /api/patient/assessment/link` (Task 3).
- Produces: page renders form only when a target booking exists; passes `bookingId` into the form; on submit success, POSTs to the link route.

- [ ] **Step 1:** Extend `lib/patient-bookings.ts` `BookingRecord` + `toBookingRecord` to include `paid: boolean` (`data.paid === true`) and `assessmentCompletedAt: Date | null` (resolve Timestamp like `sessionDate`). Keep existing fields.

- [ ] **Step 2:** In `app/patient/assessment/page.tsx`: after auth resolves, read `?booking=` via `useSearchParams`. Load `getPatientBookings(uid, personId)`, map to `GateBooking[]`, call `selectTargetBooking(list, bookingParam)`. While loading show skeleton; if `null` render an empty state:

```tsx
<EmptyState
  illustration="calendar"
  title="Book a session first"
  body="Your assessment unlocks once you have an upcoming appointment. It only takes a few minutes and helps us make the most of your session."
  cta={{ label: "Book a session", href: "/book" }}
/>
```

Else render `<PatientAssessmentForm ... bookingId={target.id} onSubmitted={handleSubmitted} />`.

- [ ] **Step 3:** In `components/patient-assessment-form.tsx`: add optional props `bookingId?: string` and `onSubmitted?: (formId: string) => void`. Pass `bookingId` into `submitPatientAssessmentForm(uid, personId, { ...input, bookingId })`; after it returns `formId`, call `onSubmitted?.(formId)`.

- [ ] **Step 4:** In the page's `handleSubmitted(formId)`: `await fetch("/api/patient/assessment/link", { method: "POST", headers: { Authorization: \`Bearer ${await user.getIdToken()}\`, "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: target.id, assessmentFormId: formId }) })` (best-effort; toast on failure).

- [ ] **Step 5:** Manual verify via dev server (logged-in patient with/without a paid booking). Commit — `git add -A && git commit -m "feat(assessment): gate page behind paid booking + stamp on submit"`

---

### Task 5: Remove self-service entry points

**Files:**
- Modify: `components/home-dashboard.tsx`, `app/patient/account/page.tsx`

- [ ] **Step 1:** Remove the `/patient/assessment` object from `SECONDARY_ACTIONS` in `home-dashboard.tsx`.
- [ ] **Step 2:** Remove the "Assessment Form" `<Link>` pill from `app/patient/account/page.tsx` (keep People, Appointments, Invoices).
- [ ] **Step 3:** `npm run test:run` (no regressions) + manual: dashboard/account no longer show an assessment link.
- [ ] **Step 4:** Commit — `git add -A && git commit -m "feat(assessment): remove self-service assessment entry points"`

---

### Task 6: "Complete your assessment" banner on appointments

**Files:**
- Modify: `app/patient/appointments/page.tsx` (and its tile/list component)

**Interfaces:**
- Consumes: `BookingRecord.paid` + `.assessmentCompletedAt` (Task 4 step 1).

- [ ] **Step 1:** For each paid upcoming booking with `assessmentCompletedAt == null`, render a prompt above/within the tile linking to `/patient/assessment?booking=<id>`:

```tsx
{b.paid && b.assessmentCompletedAt === null && b.status === "upcoming" && (
  <Link href={`/patient/assessment?booking=${b.id}`} className="assessment-cta">
    Complete your assessment before this appointment →
  </Link>
)}
```

- [ ] **Step 2:** Add minimal styles (reuse existing pill/link classes; no new design system tokens). Manual verify.
- [ ] **Step 3:** Commit — `git add -A && git commit -m "feat(assessment): appointment banner to complete assessment"`

---

## Phase 2 — Web email + meeting link

### Task 7: Capture Cal meeting link on the booking

**Files:**
- Modify: `app/api/cal-webhook/route.ts`
- Test: `tests/api/cal-webhook-meeting-url.test.ts` (or extend existing cal-webhook test)

**Interfaces:**
- Produces: `bookings.meetingUrl` populated from the Cal payload when present (`payload.location` or `payload.videoCallData?.url` / `responses.location`). Absent ⇒ field omitted.

- [ ] **Step 1: Write failing test** — feed a `BOOKING_CREATED` payload containing a video URL; assert the written booking doc includes `meetingUrl`. (Mirror the existing cal-webhook test's signature/HMAC setup.)
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — in the payload type add optional `location?: string` / `videoCallData?: { url?: string }`; compute `const meetingUrl = payload.videoCallData?.url || (typeof payload.location === "string" && /^https?:/.test(payload.location) ? payload.location : undefined);` and include `...(meetingUrl ? { meetingUrl } : {})` in the booking write.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(booking): persist Cal meeting link"`

---

### Task 8: Assessment-link email builder

**Files:**
- Create: `lib/emails/assessment-link-email.ts`
- Test: `tests/lib/assessment-link-email.test.ts`

**Interfaces:**
- Produces:
  - `buildAssessmentLinkEmailHtml(input: { patientName: string; serviceLabel: string; assessmentUrl: string; meetingUrl?: string; appointmentLabel?: string }): string`
  - `sendAssessmentLinkEmail(input: { to: string } & Parameters<typeof buildAssessmentLinkEmailHtml>[0]): Promise<{ sent: boolean }>` — mirrors `receipt-email.ts` Resend `fetch`, env handling, and `escapeHtml`.

- [ ] **Step 1: Write failing test** — `buildAssessmentLinkEmailHtml` includes the assessment URL, the "before your appointment" copy, and the meeting link only when provided; escapes `patientName`.

```ts
import { describe, it, expect } from "vitest";
import { buildAssessmentLinkEmailHtml } from "@/lib/emails/assessment-link-email";
it("includes CTA, pre-appointment copy, and conditional meeting link", () => {
  const html = buildAssessmentLinkEmailHtml({
    patientName: "A <b>", serviceLabel: "Initial", assessmentUrl: "https://s/x", meetingUrl: "https://m/y",
  });
  expect(html).toContain("https://s/x");
  expect(html).toContain("before your appointment");
  expect(html).toContain("https://m/y");
  expect(html).not.toContain("A <b>"); // escaped
});
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — copy `escapeHtml` + the Resend `fetch` block from `lib/emails/receipt-email.ts`. Copy must state the assessment must be completed **before your appointment** and that it "helps us make the most of your session." Meeting link rendered only if `meetingUrl` truthy.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(email): assessment-link email builder"`

---

### Task 9: Allow `/patient/assessment` as a magic-link return path

**Files:**
- Modify: `app/api/auth/magic-link/route.ts`
- Test: `tests/api/magic-link-returnto.test.ts` (or extend existing)

- [ ] **Step 1: Write failing test** — `sanitizeReturnPath("/patient/assessment")` returns `/patient/assessment`; `"//evil.com"` returns `/patient`. (Export `sanitizeReturnPath` if not already, or test via the POST handler's constructed URL.)
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — add `"/patient/assessment"` to `ALLOWED_RETURN_PATHS`.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(auth): allow assessment return path in magic link"`

---

### Task 10: Send assessment email + mark `assessmentRequired` from the paid webhook

**Files:**
- Modify: `app/api/payments/webhook/route.ts`
- Test: extend `tests/api/payments-webhook.test.ts`

**Interfaces:**
- Consumes: `sendAssessmentLinkEmail` (Task 8), magic-link generation. Reuse the same passwordless mechanism the magic-link route uses (`adminAuth.generateSignInWithEmailLink(email, { url: <verify?returnTo=/patient/assessment>, handleCodeInApp: true })`) to build `assessmentUrl`. If generation is unavailable, fall back to `${siteUrl}/patient/assessment`.
- Produces: on paid completion, the paid booking doc gets `assessmentRequired: true`; a best-effort assessment email is sent (does not block the webhook 200).

- [ ] **Step 1: Write failing test** — extend the paid-path test: assert `sendAssessmentLinkEmail` is called with `to == intent.email` and a URL containing `/patient/assessment`, and that the booking update includes `assessmentRequired: true`. Mock `sendAssessmentLinkEmail`.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — after the existing `sendReceiptEmail(...)` call, within the same best-effort try/catch: build `assessmentUrl` (magic sign-in with `returnTo=/patient/assessment`), call `sendAssessmentLinkEmail({ to: intent.email, patientName: intent.name, serviceLabel, assessmentUrl, meetingUrl: <from booking if available>, appointmentLabel })`. In the booking-paid `update` (the block near the `where("calBookingUid","==",booking.uid)` query, ~line 191), add `assessmentRequired: true`.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(assessment): email link + require flag on paid booking"`

---

## Phase 3 — Admin visibility

### Task 11: Submitted/Awaiting indicator in admin review

**Files:**
- Modify: `components/admin-assessment-review.tsx`, `components/admin-patient-detail.tsx`
- Test: manual (admin UI).

**Interfaces:**
- Consumes: `getPatientAssessmentForms(uid, personId)` (returns only submitted docs) + booking data for the person.

- [ ] **Step 1:** In `admin-assessment-review.tsx`, ensure the list shows only submitted forms (it does — only submitted docs exist). Add a per-form line showing the linked appointment (via `form.bookingId` → look up booking date) and a status chip: `Submitted` (has form) vs `Awaiting` (upcoming paid booking with no linked form).
- [ ] **Step 2:** In `admin-patient-detail.tsx`, if the person has a paid upcoming booking without a submitted assessment, show an "Awaiting assessment" badge near the assessment section.
- [ ] **Step 3:** Manual verify as admin. Commit — `git add -A && git commit -m "feat(admin): submitted/awaiting assessment indicator"`

---

## Phase 4 — Final reminder (functions + web route)

### Task 12: `CRON_SECRET`-guarded reminder-email route

**Files:**
- Create: `app/api/assessment/reminder-email/route.ts`
- Test: `tests/api/reminder-email.test.ts`

**Interfaces:**
- Produces: `POST /api/assessment/reminder-email`, header `x-cron-secret: <CRON_SECRET>`, body `{ bookingId: string }`. Loads booking (Admin SDK), builds the same magic-link `assessmentUrl`, calls `sendAssessmentLinkEmail`, returns `{ sent: boolean }`. 401 on bad/missing secret; 404 if booking missing.

- [ ] **Step 1: Write failing tests** — missing/wrong secret → 401; valid secret + existing booking → calls `sendAssessmentLinkEmail`, 200. Mock `getAdminDb`, `sendAssessmentLinkEmail`, and `process.env.CRON_SECRET`.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — read `process.env.CRON_SECRET`; constant-time-ish compare against `x-cron-secret`; load `bookings/{bookingId}`; email using booking `email`, `service`, `meetingUrl`, `appointmentLabel`.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(assessment): secret-guarded reminder-email route"`

---

### Task 13: Scheduled `sendAssessmentReminders` Cloud Function

**Files:**
- Modify: `functions/src/index.ts`
- Test: `functions/test/assessment-reminders.test.ts` if a functions test setup exists; else document a manual emulator check.

**Interfaces:**
- Consumes: `POST /api/assessment/reminder-email` (Task 12); FCM pattern from `onSummaryPublished`/`sendFollowUpReminders`.
- Produces: `export const sendAssessmentReminders = onSchedule({ schedule: "*/15 * * * *", timeZone: "Europe/London" }, handler)`.

- [ ] **Step 1: Implement handler** (model on `sendFollowUpReminders`):
  - `const now = Date.now(); const lo = new Date(now + 55*60000); const hi = new Date(now + 65*60000);`
  - Query: `db.collection("bookings").where("status","==","upcoming").where("paid","==",true).where("sessionDate",">=",lo).where("sessionDate","<=",hi).get()`.
  - For each doc where `assessmentCompletedAt` is null/absent and `reminders?.assessmentDueSent !== true`:
    - `await fetch(\`${SITE_URL}/api/assessment/reminder-email\`, { method:"POST", headers:{ "x-cron-secret": CRON_SECRET, "Content-Type":"application/json" }, body: JSON.stringify({ bookingId: doc.id }) })` (best-effort).
    - FCM push to `users/{booking.bookedBy}.fcmToken` with `data: { type:"assessment_due", bookingId: doc.id }` (reuse existing send pattern), and write a `patients/{bookedBy}/notifications` doc.
    - `await doc.ref.update({ "reminders.assessmentDueSent": true })`.
  - Read `SITE_URL` + `CRON_SECRET` from function config/env (`process.env`). Document required config.
- [ ] **Step 2:** Build functions (`cd functions && npm run build`) to typecheck.
- [ ] **Step 3:** If a functions test harness exists, add a unit test for the window+dedupe filter (mock Firestore). Otherwise add a comment block documenting an emulator smoke check.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat(functions): 1h-before assessment reminder (email+push)"`

---

## Phase 5 — Mobile (native Flutter assessment)

> Mirror the web form's fields exactly. Read `lib/assessment-forms.ts` (`PatientAssessmentFormInput`, enums for `formType`, `consultationMode`, red-flag keys, clinical areas, outcomes) and `components/patient-assessment-form.tsx` for section order/labels before implementing. Write to `patients/{uid}/people/{personId}/assessmentForms/{autoId}` with identical field names/shape and `reviewStatus: "awaiting_review"`, `createdAt/updatedAt` server timestamps, and `bookingId`.

### Task 14: Assessment model + repository (mobile)

**Files:**
- Create: `mobile_app/lib/src/features/assessment/assessment_model.dart`, `mobile_app/lib/src/features/assessment/assessment_repository.dart`

**Interfaces:**
- Produces:
  - `AssessmentInput` (Dart class mirroring `PatientAssessmentFormInput` fields).
  - `AssessmentRepository.submit({ required String uid, required String personId, required String bookingId, required AssessmentInput input }) → Future<String>` — writes the Firestore doc (matching web shape) and returns the new doc id, then POSTs to `$kApiBase/api/patient/assessment/link` with the Firebase ID token to stamp the booking.

- [ ] **Step 1:** Implement `AssessmentInput` with the full field set (enumerate from the web type). Include `toFirestore()` producing the exact web field map (+ `reviewStatus`, timestamps via `FieldValue.serverTimestamp()`, `bookingId`).
- [ ] **Step 2:** Implement `submit(...)`: `final ref = await FirebaseFirestore.instance.collection('patients').doc(uid).collection('people').doc(personId).collection('assessmentForms').add(input.toFirestore());` then `http.post($kApiBase/api/patient/assessment/link, headers:{Authorization: Bearer <idToken>}, body: {bookingId, assessmentFormId: ref.id})`; return `ref.id`.
- [ ] **Step 3:** `flutter analyze mobile_app/lib/src/features/assessment` → no issues.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat(mobile): assessment model + repository"`

---

### Task 15: Assessment screen (mobile)

**Files:**
- Create: `mobile_app/lib/src/features/assessment/assessment_screen.dart`

**Interfaces:**
- Consumes: `AssessmentRepository` (Task 14). Constructor `AssessmentScreen({ required String bookingId, required String personId, required String personName })`.
- Produces: a Clarity-styled multi-section form (mirror web sections) with validation, a submit button, loading + success states; on success pops with a result and shows a confirmation.

- [ ] **Step 1:** Build the form UI mirroring web sections (red flags, consultation mode, history, goals, consent). Use existing design tokens (`AppColors`, theme text styles) and card idiom from `appointments_screen.dart`.
- [ ] **Step 2:** On submit, call `AssessmentRepository().submit(...)`; show success and pop `true`.
- [ ] **Step 3:** `flutter analyze` clean. Commit — `git add -A && git commit -m "feat(mobile): native assessment screen"`

---

### Task 16: Gated entry point + push deep-link (mobile)

**Files:**
- Modify: `mobile_app/lib/src/features/appointments/appointment_detail_screen.dart` (+ tile), FCM handling entry (where `firebase_messaging` `onMessage`/`onMessageOpenedApp` is wired — search `FirebaseMessaging`), `mobile_app/lib/src/features/appointments/booking_model.dart` (add `paid`, `assessmentCompletedAt`).

**Interfaces:**
- Consumes: `AssessmentScreen` (Task 15). Booking model gains `paid: bool` and `assessmentCompletedAt: DateTime?` parsed from Firestore.

- [ ] **Step 1:** Extend `BookingRecord.fromDoc` to parse `paid` and `assessmentCompletedAt`.
- [ ] **Step 2:** On the appointment detail/tile, if `paid && isUpcoming && assessmentCompletedAt == null`, show a "Complete assessment" button pushing `AssessmentScreen(bookingId: b.id, personId: b.patientId, personName: b.patientName)`.
- [ ] **Step 3:** In FCM handling, when a message/opened-app has `data['type'] == 'assessment_due'`, navigate to `AssessmentScreen` for `data['bookingId']` (look up the booking for personId/name, or pass through).
- [ ] **Step 4:** `flutter analyze` clean; manual check from a paid upcoming appointment. Commit — `git add -A && git commit -m "feat(mobile): gated assessment entry + push deep-link"`

---

## Phase 6 — Wiring, docs, verification

### Task 17: Env, rules, docs, full verification

**Files:**
- Modify: `.env.example` (add `CRON_SECRET`), `CLAUDE.md` (document the assessment gate + reminder), `storage.rules`/`firestore.rules` (no client access to new booking fields — confirm current rules already deny client writes to `bookings.assessment*`).

- [ ] **Step 1:** Add `CRON_SECRET` to `.env.example` with a comment; document that functions config needs `SITE_URL` + `CRON_SECRET`.
- [ ] **Step 2:** Confirm `firestore.rules` for `bookings` does not allow clients to write `assessment*`/`reminders` (server-only). Adjust only if a rule currently permits it.
- [ ] **Step 3:** Update `CLAUDE.md` "Booking flow" section: assessment is gated on paid bookings, emailed via magic link, and reminded ~1h before by `sendAssessmentReminders`.
- [ ] **Step 4:** `npm run test:run` (all web tests green), `cd functions && npm run build`, `flutter analyze` (mobile) — all clean.
- [ ] **Step 5:** Browser verification (dev server) of the gate empty-state and the appointment banner; confirm no server errors in preview logs.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "docs(assessment): env, rules note, and CLAUDE.md updates"`

---

## Self-Review notes

- **Spec coverage:** remove entry points (T5), gate on paid booking (T2/T4), per-appointment frequency (`bookingId` T1 + stamp T3/T4), email with invoice+meeting link (T7/T8/T10), magic-link sign-in (T9/T10), admin submitted-only (T11), 1h reminder email+push (T12/T13), mobile native form (T14–16), env/rules/docs (T17). All spec sections mapped.
- **Placeholders:** none — routes, helpers, and email builder have concrete code; the Flutter clinical form enumerates fields by mirroring the named web source (explicit files to read), which is the correct DRY approach for a large 1:1 form.
- **Type consistency:** `selectTargetBooking`/`GateBooking`, `bookingId` field, `sendAssessmentLinkEmail`/`buildAssessmentLinkEmailHtml`, `assessmentCompletedAt`/`assessmentFormId`/`assessmentRequired`, `reminders.assessmentDueSent`, and the `x-cron-secret` header are used consistently across web, functions, and mobile tasks.
