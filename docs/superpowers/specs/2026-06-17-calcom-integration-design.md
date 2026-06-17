# Cal.com Integration Design

**Date:** 2026-06-17
**Project:** PhysioOnClick
**Scope:** Cal.com appointment booking for web (Next.js 15) and mobile (Flutter), with Firestore sync via webhook. Also covers hiding the blog section from web and mobile.

---

## 1. Context

The current booking system is a manual request form — patients pick a preferred date/time from static dropdowns, data is saved to Firestore as `status: "pending"`, and the clinician confirms manually. There is no real availability management, no calendar sync, and no automated confirmations.

Cal.com replaces this with real scheduling: confirmed slots, live availability, and automated confirmation emails to both patient and clinician.

---

## 2. Cal.com Account

- **Username:** `krunal-nayak-0nbytj`
- **Single clinician** (solo practice — no team/org setup needed)
- **Event types already created:**

| Title | Slug | Duration |
|---|---|---|
| Initial Assessment | `initial-assessment` | 60 min |
| Follow-Up Session | `30min` | 30 min |
| Extended Session | `extended-session` | 90 min |
| Initial Online Assessment | `initial-online-assessment` | 60 min |
| Online Follow-Up | `online-follow-up` | 30 min |

> Note: Follow-Up Session has the default slug `30min`. Consider renaming to `follow-up` in the Cal.com dashboard for cleaner URLs (not required for the integration to work).

**Manual setup remaining (one-time, in Cal.com dashboard):**
1. Set weekly availability schedule (days + hours)
2. Optionally connect Google Calendar or Outlook for conflict detection
3. Add webhook: URL = `https://your-domain.com/api/cal-webhook`, events = `BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`
4. Copy the generated webhook secret into `.env.local` as `CAL_WEBHOOK_SECRET`

---

## 3. Architecture

```
Patient (web)   →  /book page  →  cal.js embed  →  Cal.com (confirms slot, sends emails)
                                                          ↓  webhook POST
Patient (mobile)  →  Flutter WebView  →  Cal.com          ↓
                                                   /api/cal-webhook (Next.js)
                                                          ↓
                                                   Firestore `bookings` collection
                                                          ↓
                                         Admin dashboard  +  Patient portal (unchanged)
```

Cal.com is the source of truth for scheduling. Firestore is kept in sync via webhook so the admin dashboard and patient portal require no changes.

---

## 4. New Environment Variables

| Variable | Purpose |
|---|---|
| `CAL_WEBHOOK_SECRET` | HMAC secret to verify Cal.com webhook signatures |
| `NEXT_PUBLIC_CAL_USERNAME` | Cal.com username (`krunal-nayak-0nbytj`) |
| `CAL_API_KEY` | Server-only key for admin cancel action (same key as above, never exposed client-side) |

Add all three to `.env.local` and to production environment config.

---

## 5. Web Changes (Next.js)

### 5a. `components/cal-embed.tsx` (new)
- Client component (`"use client"`)
- Loads the cal.js script (`https://app.cal.com/embed/embed.js`) via Next.js `<Script strategy="lazyOnload">`
- On mount, calls `Cal("inline", { calLink: process.env.NEXT_PUBLIC_CAL_USERNAME, elementOrSelector: "#cal-embed" })`
- Renders a `<div id="cal-embed">` container with a minimum height so the widget has space to render
- Used on the `/book` page

### 5b. `app/book/page.tsx` (new)
- Dedicated booking page at `/book`
- Renders `<CalEmbed />` showing the full Cal.com profile (all event types listed for patient to choose)
- Page metadata: `title: "Book an Appointment | PhysioOnClick"`

### 5c. `app/page.tsx` (modified)
- Remove `<BookingPanel>` component and its import
- Add a "Book an appointment" banner section with a brief description and a `<Link href="/book">` button
- The banner sits where the booking panel currently lives

### 5d. `components/site-header.tsx` (modified)
- Add `"Book"` nav link pointing to `/book`

### 5e. `components/booking-panel.tsx`
- No longer used — can be deleted once the homepage is updated

### 5f. Blog hiding (web)
- Remove blog nav link from `components/site-header.tsx`
- Remove blog teasers / blog section from `app/page.tsx` if present
- The `app/blog/` route, `lib/blog.ts`, and blog data remain in place — just not linked from the UI

---

## 6. Webhook API Route

### `app/api/cal-webhook/route.ts` (new)

**Signature verification:**
- Read raw request body as text
- Compute `HMAC-SHA256(body, CAL_WEBHOOK_SECRET)`
- Compare with `X-Cal-Signature-256` header (constant-time comparison)
- Return `401` if mismatch

**Event handling:**

`BOOKING_CREATED`:
```
Firestore doc (bookings collection):
  fullName:         payload.attendees[0].name
  email:            payload.attendees[0].email
  phone:            payload.attendees[0].phoneNumber || ""
  service:          payload.eventType.title
  appointmentDate:  ISO date portion of payload.startTime converted to Europe/London timezone
  appointmentTime:  HH:MM portion of payload.startTime converted to Europe/London timezone
  appointmentLabel: human-readable e.g. "Wednesday 17 June at 10:00" (London time)
  notes:            payload.responses?.notes?.value || ""
  status:           "confirmed"
  source:           "cal-com"
  calBookingUid:    payload.uid
  createdAt:        serverTimestamp()
```

`BOOKING_CANCELLED`:
- Find Firestore doc where `calBookingUid == payload.uid`
- Update `status` to `"cancelled"`

`BOOKING_RESCHEDULED`:
- Find Firestore doc where `calBookingUid == payload.uid`
- Update `appointmentDate`, `appointmentTime`, `appointmentLabel` from new `payload.startTime`

All other event types: return `200` with no action (idempotent).

---

## 7. Admin Panel Enhancements

File: `components/admin-bookings-table.tsx` (modified)

**Status badges:**
- `confirmed` → green pill
- `pending` → amber pill (legacy manual bookings)
- `cancelled` → red pill

**Cancel action** (only shown when `calBookingUid` is present):
- Server Action in `app/admin/actions.ts` (new)
- Calls `DELETE https://api.cal.com/v2/bookings/:uid` with `Authorization: Bearer CAL_API_KEY`
- Cal.com fires `BOOKING_CANCELLED` webhook → Firestore updates automatically
- Admin table re-renders via `revalidatePath("/admin")`

**Reschedule link** (only shown when `calBookingUid` is present):
- Anchor tag: `https://cal.com/reschedule/:uid` (opens in new tab)
- Cal.com handles the rescheduling flow and fires `BOOKING_RESCHEDULED` webhook

**New environment variable for admin actions:**

| Variable | Purpose |
|---|---|
| `CAL_API_KEY` | Server-only Cal.com API key for cancel action (value from Cal.com Settings → API Keys) |

---

## 8. Mobile Changes (Flutter)

### 8a. `pubspec.yaml` (modified)
- Add `webview_flutter: ^4.x` dependency

### 8b. `lib/src/features/booking/booking_screen.dart` (modified)
- Remove the manual form (all `TextFormField`, date/time pickers, `_submit` method)
- Replace with `WebViewWidget` loading `https://cal.com/krunal-nayak-0nbytj`
- WebView controller initialises with JavaScript enabled
- Keep the "Your recent bookings" `StreamBuilder` section below — it still reads from Firestore and now shows Cal.com-synced bookings
- Auth gate stays: if no user is signed in, show the `AuthSheet` prompt

### 8c. Blog hiding (mobile)
- Remove the blog tab from `lib/src/features/root/root_shell.dart` bottom navigation
- `lib/src/features/blog/` screens remain in place — just not reachable from the nav

---

## 9. Files Changed Summary

| File | Action |
|---|---|
| `components/cal-embed.tsx` | New |
| `app/book/page.tsx` | New |
| `app/api/cal-webhook/route.ts` | New |
| `app/admin/actions.ts` | New |
| `app/page.tsx` | Modified — remove BookingPanel, add book banner, remove blog section |
| `components/site-header.tsx` | Modified — add Book nav link, remove Blog nav link |
| `components/admin-bookings-table.tsx` | Modified — status badges, cancel/reschedule actions |
| `components/booking-panel.tsx` | Delete |
| `mobile_app/pubspec.yaml` | Modified — add webview_flutter |
| `mobile_app/lib/src/features/booking/booking_screen.dart` | Modified — replace form with WebView |
| `mobile_app/lib/src/features/root/root_shell.dart` | Modified — remove blog tab |
| `.env.local` / production env | Add CAL_WEBHOOK_SECRET, NEXT_PUBLIC_CAL_USERNAME, CAL_API_KEY |

---

## 10. Out of Scope

- Multiple clinicians / Cal.com Teams
- Custom Cal.com UI (API-driven availability picker)
- Payment via Cal.com (Stripe checkout stays separate)
- Deleting blog data or routes (just hidden from nav)
