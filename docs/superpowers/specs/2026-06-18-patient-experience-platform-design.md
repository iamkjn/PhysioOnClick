# Patient Experience Platform — Design Spec
**Date:** 2026-06-18  
**Project:** PhysioOnClick (Next.js web + Flutter mobile)  
**Status:** Approved by owner

---

## Overview

Add three interconnected features that transform PhysioOnClick from a booking page into a genuine patient care platform:

1. **Dependent profiles** — one account manages multiple people (family/friends)
2. **Appointment tracking** — full history with upcoming/past view on web and mobile
3. **Post-session summaries** — physio writes a plain-English summary after each session; patient receives a push notification instantly

These features share a single data layer (Firebase Firestore + Storage + FCM) and surface across the admin panel, patient web portal, and Flutter mobile app.

---

## User Flows

### Patient: Add a dependent
1. Open Profile tab (mobile) or `/patient/people` (web)
2. Tap "+ Add a person"
3. Enter: name, date of birth, relationship (Mum / Son / Partner / Other)
4. Optionally upload a profile photo (camera or gallery)
5. Person appears as a card in "My People"

### Patient: Book for a dependent
1. Navigate to Booking (mobile tab or `/book` on web)
2. **New screen:** "Who is this appointment for?"
   - Cards for self + each dependent, with avatar
   - Option: "+ Book for someone new" (creates dependent inline)
3. Select person → proceed to Cal.com calendar as normal
4. Booking saved to Firestore with `bookedBy`, `patientId`, `patientType`, `patientName`
5. Cal.com booking note auto-populated: `"Patient: [Name] (managed by [Booker] — [relationship])"`

### Patient: View appointments
- Unified list: upcoming at top, past below
- Each card shows: avatar, patient name (if dependent), service, date, status badge
- Past appointments show 📋 icon if summary is published, ⏳ if pending
- Tap past appointment → appointment detail → session summary

### Physio (admin): Write a post-session summary
1. Admin panel → Appointments → find completed session
2. Click "Write Summary"
3. Fill in form (4 fields — see Data Model)
4. Click "Publish Summary"
5. Firestore document created → Cloud Function fires → FCM push sent to patient

### Patient: Receive push notification
- Notification: `"📋 [Patient name]'s session summary is ready"`
- Tap → deep links directly to that appointment's detail screen

---

## Data Model

### `dependents/{dependentId}`
```
ownerId:      string   // userId of the account that manages this person
name:         string
dob:          string   // ISO date "YYYY-MM-DD"
relationship: string   // "Mother" | "Father" | "Son" | "Daughter" | "Partner" | "Other"
notes:        string   // optional medical context
avatarUrl:    string   // optional, Firebase Storage URL
createdAt:    timestamp
```

### `bookings/{bookingId}`
```
bookedBy:       string   // userId of the person who made the booking
patientType:    string   // "self" | "dependent"
patientId:      string   // userId (if self) or dependentId (if dependent)
patientName:    string   // display name of who the appointment is for
patientAvatarUrl: string // snapshot of avatar at booking time
service:        string
sessionDate:    timestamp
status:         string   // "upcoming" | "completed" | "cancelled"
calBookingUid:  string   // Cal.com reference for cancel/reschedule
createdAt:      timestamp
```

### `sessionSummaries/{summaryId}`
```
bookingId:       string
patientId:       string
patientType:     string
patientName:     string
workedOn:        string   // "What we worked on today"
exercises:       string   // "Exercises assigned"
nextSteps:       string   // "Next steps & advice"
followUpWeeks:   number   // recommended weeks until next session (0 = none)
publishedAt:     timestamp
notificationSent: boolean
```

### `users/{userId}` (additions)
```
avatarUrl:  string   // optional
fcmToken:   string   // updated on app launch, used for push notifications
```

---

## Firebase Architecture

### Storage paths
```
avatars/users/{userId}.jpg
avatars/dependents/{dependentId}.jpg
```

### Cloud Function: `onSummaryPublished`
- Trigger: `onCreate` on `sessionSummaries/{summaryId}`
- Reads: `bookings/{bookingId}` → `bookedBy`
- Reads: `users/{bookedBy}` → `fcmToken`
- Sends FCM message:
  - Title: `"📋 Session summary ready"`
  - Body: `"{patientName}'s {service} summary from {date} is now available"`
  - Data: `{ type: "summary", bookingId: bookingId }`
- Updates: `sessionSummaries/{summaryId}.notificationSent = true`

---

## Profile Picture UI

- **Default state:** Coloured circle with initials, colour derived from name hash (consistent, always looks clean — same pattern as Gmail/WhatsApp)
- **With photo:** Circular crop, 80px on mobile cards, 100px on profile/detail screens
- **Upload flow:** Tap avatar → bottom sheet → "Take photo" / "Choose from library" / "Remove photo"
- **Where shown:** My People cards, "Who is this for?" selector, appointment cards, appointment detail, admin panel booking list

---

## UI Components to Build

### Mobile (Flutter)

| Screen | Changes |
|---|---|
| Profile tab | "My People" section with person cards + avatars |
| New: `PeopleScreen` | Full-screen manage people: add/edit/remove, avatar upload |
| New: `AddPersonSheet` | Bottom sheet: name, DOB, relationship, optional photo |
| Booking flow | New `WhoIsThisForScreen` inserted before Cal.com WebView |
| New: `AppointmentsScreen` | Tab or section: upcoming + past, avatar-tagged, summary badge |
| New: `AppointmentDetailScreen` | Full summary view: session details + summary fields |
| `app.dart` / `main.dart` | FCM token capture on launch, notification tap handler → deep link |

### Web (Next.js — patient portal)

| Route | What it is |
|---|---|
| `/patient/people` | Manage people page with cards and avatar upload |
| `/patient/appointments` | Full appointment history with filters |
| `/patient/appointments/[id]` | Appointment detail + session summary |
| `/book` (update) | "Who is this for?" selector before Cal.com embed |

### Admin panel (Next.js)

| Area | Changes |
|---|---|
| Appointments list | Show patient name + booker name if different; show avatar |
| Appointment detail | "Write Summary" button → summary form → Publish |
| Summary form | 4 fields: worked on, exercises, next steps, follow-up weeks |

---

## Firestore Security Rules

- `dependents`: readable/writable only by `ownerId`
- `bookings`: readable by `bookedBy`; writable only by authenticated users (create) and admin (update status)
- `sessionSummaries`: readable by `bookedBy` of linked booking; writable only by admin

Note: Admin panel uses Firebase Admin SDK (server-side, Next.js API routes) which bypasses client-side Firestore rules. Client-side rules protect the patient portal and mobile app only.

---

## Out of Scope (v1)

- Web push notifications (mobile only for v1)
- Dependent has their own login
- Physio edits a published summary
- Patient marks exercises as completed
- Progress charts / pain tracking (separate feature, future spec)

---

## Success Criteria

- Patient can add a dependent and book on their behalf in under 60 seconds
- All past and upcoming appointments visible on mobile and web in one screen
- Physio publishes a summary → patient receives push notification within 30 seconds
- Profile photos optional but render consistently across all screens
- No booking friction added for patients booking for themselves (same flow as today)
