# Magic Link Auth — Design Spec
**Date:** 2026-06-21  
**Status:** Approved

## Problem

Patients who book an appointment via the website get a confirmation email but have no patient portal account. If they want to view their appointment, rehab plan, or uploaded documents, they must separately sign up with a password — a friction point most skip. Bookings in Firestore are unlinked from any Firebase Auth user.

## Goal

When a patient books an appointment, automatically provision their patient portal access. The booking confirmation email already going out via Resend will include a magic link ("Access your patient portal →"). Clicking it signs them in with no password required.

## Scope

- Auto-embed a Firebase magic link in the existing booking confirmation email
- New `/auth/verify` page that handles the magic link click and signs the patient in
- New `/api/auth/magic-link` endpoint for requesting a fresh link on demand
- "Send me a sign-in link" option added to the existing patient auth panel
- Link all past bookings to the Firebase Auth user on first sign-in (by email match)

Out of scope: admin-facing changes, OTP/code-based login, changes to Google sign-in.

## Architecture

Two parts sharing the same Firebase email link mechanism:

**At booking time**, the existing `POST /api/booking` route gains one extra step: call `generateSignInWithEmailLink()` from the Firebase Admin SDK to produce a signed URL, then pass it to the existing `sendBookingEmail()` function, which embeds it as a button. Magic link generation is non-blocking — if it fails, the booking saves and the email sends without the button.

**At sign-in time**, the patient clicks the link and lands on `/auth/verify`. That page calls `signInWithEmailLink()` (Firebase client SDK), which validates the one-time code, creates the Firebase Auth account on first use, and signs the patient in. We then call `ensurePatientRecord()` and batch-update all `bookings` docs where `email == user.email` to store `patientUid = user.uid`.

## Data Flow

### Booking → email
```
POST /api/booking
  → save to Firestore `bookings` (existing, unchanged)
  → Admin SDK: generateSignInWithEmailLink(email, {
      url: NEXT_PUBLIC_SITE_URL/auth/verify?email=<encoded-email>,
      handleCodeInApp: true,
    })
  → Resend: existing booking details HTML + "Access your patient portal →" button
  → return { ok: true }  ← booking never fails due to link error
```

### Patient clicks link → signed in
```
GET /auth/verify?email=<email>&oobCode=...
  → isSignInWithEmailLink(auth, window.location.href)  ← confirm valid link
  → email = URL query param (same device) OR user types it (different device)
  → signInWithEmailLink(auth, email, window.location.href)
  → ensurePatientRecord(user)  ← writes to Firestore `users` + `patients`
  → Firestore batch: bookings where email == user.email → set patientUid = user.uid
  → redirect to /patient
```

### Fresh link on demand
```
POST /api/auth/magic-link  { email }
  → rate-limit check: reject with 429 if same email requested within 60s
  → Admin SDK: generateSignInWithEmailLink(email, actionCodeSettings)
  → Resend: "Here is your sign-in link" email
  → return { ok: true }
```

## Files

| File | Action | Notes |
|---|---|---|
| `lib/firebase-admin.ts` | Edit | Add `getAdminAuth()` export using `getAuth()` from `firebase-admin/auth` |
| `app/api/booking/route.ts` | Edit | Call `generateSignInWithEmailLink`, pass URL to `sendBookingEmail` |
| `app/auth/verify/page.tsx` | Create | Client component — handles magic link, email prompt for cross-device |
| `app/api/auth/magic-link/route.ts` | Create | Generates and sends fresh magic link; simple in-memory rate limit |
| `components/auth-panel.tsx` | Edit | Add "Send me a sign-in link" tab; keep email+password and Google as-is |

## Error Handling

| Scenario | Behaviour |
|---|---|
| Magic link generation fails at booking | Booking saves, email sends without portal button; error logged server-side |
| Link expired or already used (`auth/invalid-action-code`, `auth/expired-action-code`) | `/auth/verify` shows message + "Send me a new link →" button |
| Different device (no email in URL) | `/auth/verify` shows email input; patient types booking email |
| First-time patient (no Auth account) | `signInWithEmailLink` creates the account automatically |
| Resend failure on fresh link | `/api/auth/magic-link` returns error; auth panel shows "Couldn't send — try again" |
| Rate limit on fresh link (same email within 60s) | 429 response; auth panel shows "Please wait before requesting another link" |

## Firebase Console Setup (manual, one-time)

1. Firebase Console → Authentication → Sign-in methods → enable **Email link (passwordless sign-in)**
2. Add the production domain to **Authorized domains** if not already present

## No New Environment Variables

Uses the existing `NEXT_PUBLIC_SITE_URL` as the base URL for `actionCodeSettings.url`. No new secrets or config required.

## Success Criteria

- A patient who books receives their confirmation email with a working "Access your patient portal →" button
- Clicking the button signs them in (new account created on first click)
- The patient portal shows their booking under Appointments
- Returning patients clicking an old link see a clear expired message with a re-send option
- The existing email+password and Google sign-in paths are unaffected
