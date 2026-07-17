# Input Validation & Feedback — Web + Mobile

**Date:** 2026-07-16
**Status:** Approved (design)

## Goal

Every user data-entry input across the web app and the Flutter app validates before it
submits, and the user always gets a clear message when input isn't fulfilled — inline per
field, plus a submit-level toast/snackbar. No more silent failures.

## Decisions (locked with user)

1. **Feedback = hybrid.** Inline per-field error under the bad field + one submit-level
   toast (web) / snackbar (mobile) for overall success/failure.
2. **Scope = everything, both platforms** — all data-entry forms. Filter/selector inputs
   (search, view-switching dropdowns) are explicitly out of scope.
3. **Shared validators.** One `lib/validation.ts` (web) + one
   `mobile_app/lib/src/core/validators.dart` (mobile). No per-form regex duplication.
4. **Server-side enforcement is deferred** and documented as a follow-up slice (see
   "Out of scope"). Client validation only in this slice.

## Architecture

### A. Shared validators (the spine)

**`lib/validation.ts` (web)** — pure functions, no React, return `string | null` (error
message, or `null` when valid). Plus shared constants.

```
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const UK_PHONE_RE = /^(?:\+44\s?|0)(?:\d\s?){9,10}$/;  // requires real digits
export const LIMITS = { name: 80, email: 254, phone: 20, note: 500, clinicalNote: 2000, message: 2000, password: 128 };

validateEmail(v): string | null            // required, trim, EMAIL_RE, <=254
validateName(v, {min=2}): string | null     // required, trim, min..80, reject whitespace-only
validateUKPhone(v): string | null           // blank OK; else UK_PHONE_RE, <=20
validateRequiredText(v, {min, max, label}): string | null
validateOptionalText(v, {max}): string | null  // trim, <=max
validateDob(iso): string | null             // valid date, not future, >= 1900-01-01
validateIntInRange(v, {min, max}): string | null
```

Existing forms with their own regex (`contact-form`, `patient-profile-editor`) migrate to
these so the copy and rules match everywhere. `EMAIL_RE`/`UK_PHONE_RE` become the single
source; the enquiry API can import them later (server slice).

**`mobile_app/lib/src/core/validators.dart` (mobile)** — `TextFormField`-shaped
`String? Function(String?)` returning the error string (or `null`). Fixes the weak
`contains('@') && contains('.')` check in ONE place; all 5 auth screens + add-person consume it.

```
class Validators {
  static const emailRe = r'^[^\s@]+@[^\s@]+\.[^\s@]+$';
  static String? email(String? v);         // required, trim, regex, <=254
  static String? password(String? v, {int min = 6});  // required, min..128, NEVER trim
  static String? name(String? v, {int min = 2, int max = 80});
  static String? notes(String? v, {int max = 500});    // optional, trim, <=max
  static String? dob(DateTime? d);          // required, not future, >= 1900
}
```

### B. Feedback plumbing

- **Web toast already exists** (`components/toast-provider.tsx`, `useToast().show(msg,type)`).
  Wire it into forms that submit but don't currently toast. Keep inline `.field-error`
  for per-field problems. Reuse existing inline `form-note`/`auth-status` regions where
  present rather than adding parallel channels.
- **Mobile has no toast.** Add `mobile_app/lib/src/core/app_snack_bar.dart`:
  `showAppSnackBar(BuildContext, String message, {bool isError = false})` — thin wrapper
  over `ScaffoldMessenger.of(context).showSnackBar(...)`, red on error, calm on success.
  Used for submit success/failure; field errors stay inline via validators.

### C. Per-file targets

**Web (data-entry):**
| File | Changes |
|---|---|
| `app/auth/verify/page.tsx` | `validateEmail` on both email inputs; replace silent `return`s with inline error + status; 254 cap |
| `app/patient/people/page.tsx` | name 2–80/trim/reject-blank, dob not-future/≥1900, notes ≤500; per-field errors (has toast) |
| `components/admin-clinical-entry.tsx` | date ≤today + guard empty (doc-ID), physioNotes ≤2000, sessionId ≤200; add success/error toast |
| `components/admin-sign-in.tsx` | email trim+regex+254, password presence+128; reuse inline alert |
| `components/auth-panel.tsx` | fullName 2–80/trim, email trim+regex (fix trim inconsistency), password 8–128; reuse `auth-status` |
| `components/booking-step-time.tsx` | name 2–80 + `maxLength`, email regex+254, keep consent/password; inline `book-error` |
| `components/contact-form.tsx` | migrate to shared validators; add caps (name 80, email 254, message 2000). Already strong otherwise |
| `components/pain-check-in.tsx` | note ≤500 + trim; has toast |
| `components/patient-profile-editor.tsx` | name 2–80 + `maxLength`, fix loose phone regex + 20 cap; replace brittle string-matched status with per-field error state |
| `components/summary-form.tsx` | workedOn/exercises/nextSteps required+trim+≤2000, sessionOutcome required, recoveryPercent int 0–100; **add try/catch + success/error toast** (currently no feedback) |
| `components/upload-panel.tsx` | JS type-check (ext + MIME), ≤10MB size cap, sanitise `file.name` before Storage path (path-injection fix); inline `form-note` |

**Mobile (data-entry):**
| File | Changes |
|---|---|
| `auth/auth_sheet.dart` | shared `Validators`; **stop trimming password (bug)**; fix duplicated weak email in reset path; caps |
| `auth/sign_in_screen.dart` | shared email/password validators; distinct empty-password copy; caps |
| `auth/sign_up_screen.dart` | shared validators; name/email/password caps via `LengthLimitingTextInputFormatter`; confirm-required |
| `auth/forgot_password_screen.dart` | shared email validator; required message; 254 cap |
| `people/add_person_sheet.dart` | wrap in `Form`+validators (name 2–80, dob required msg, notes ≤500); **add try/catch → error snackbar**; success snackbar |
| `admin/recovery/admin_recovery_panel_screen.dart` | notes ≤2000; **add try/catch (stuck-spinner bug) + success/error snackbar** |

### D. Silent-failure fixes bundled in (same theme)
- Mobile `auth_sheet.dart`: password trimmed before submit → corrupts credentials. Stop.
- `summary-form.tsx`, mobile `admin_recovery_panel_screen.dart`, `add_person_sheet.dart`:
  no `catch` → error swallowed / spinner stuck. Add catch → toast/snackbar.
- `admin-enquiries-table.tsx`: status update reverts silently on write failure → add error
  toast. (This file is otherwise a selector; only the write-failure feedback is in scope.)

## Testing

- **Web:** unit-test `lib/validation.ts` with vitest (`tests/lib/validation.test.ts`) — the
  edge cases the audit surfaced: `a@.`, `@b.c`, trailing dot, whitespace-only name, future
  DOB, over-cap lengths, blank-vs-filled phone. This is the one non-trivial logic unit.
- **Mobile:** `mobile_app/test/validators_test.dart` mirroring the same cases.
- Per-form wiring is verified by driving the dev server (browser preview) for 2–3
  representative forms (contact, booking, patient profile); mobile verified by
  `flutter analyze` + the validator unit test (no device drive in this slice).

## Out of scope (flagged follow-ups)
- **Server-side enforcement** — the real trust boundary. Mirror caps/format/enum in
  `app/api/enquiry`, `app/api/auth/magic-link`, `app/admin/actions.ts` (publishSummary),
  and length/type rules in `firestore.rules` / `storage.rules`. Separate slice.
- Confirm-password field on **web** signup (`auth-panel`) — feature add, not validation.
- The 10 filter/selector files (search boxes, view dropdowns, booking orchestrator).
- Web signup password min stays 8, mobile stays 6 (Firebase floor) — not unified.
