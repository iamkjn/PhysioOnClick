# Admin patients list, DOB, and dependent booking names — design

Three independent changes, approved by the product owner 2026-09-09.

## 1. Dependents in the admin patients list

**Problem:** `admin-patients-list.tsx` only read the `patients` collection, so
dependents (top-level `dependents` collection, keyed by `ownerId`) were only
reachable via the person-switcher inside a primary's detail page. Unusable at
scale.

**Change:**
- List merges `patients` + `dependents` into one searchable list.
- Dependent row label: `<relationship> of <primary name>` — the relationship is
  shown verbatim as the account holder entered it (e.g. "Partner of Seena
  George"). Searchable by dependent name, relationship, primary name/email.
- Filter: All / Primary / Dependents.
- Dependent row → `/admin/patients/<ownerUid>?person=<dependentId>`.
  `AdminPatientDetail` + `PersonSwitcher` gained an `initialPersonId` that
  preselects that dependent (read from the URL in a lazy initializer — no
  `useSearchParams` Suspense boundary).
- Age (from `dob`) shown on rows and the detail header.
- No Firestore rules change — admin already reads `dependents`.

## 2. Date of birth on every account

**Problem:** dependents require DOB; primary signup never asked.

**Change:**
- Signup form (`auth-panel.tsx`) requires a `date` DOB, validated with
  `validateDob`, passed to `ensurePatientRecord(user, name, dob)` → written to
  `users` + `patients` docs.
- `lib/age.ts`: `calcAge`, `formatAge`, `DEFAULT_DOB = "2000-01-01"`.
- `ensurePatientRecord` / `ensureUserRecord` backfill: on any sign-in, if the
  doc has no `dob`, write `DEFAULT_DOB`; a real value is never overwritten.
  Covers Google sign-ups and all pre-existing accounts. Owner will ask those
  patients to correct it.
- `patient-profile-editor.tsx` gains a DOB field + a warning when the value is
  still `DEFAULT_DOB`. `mergePatientProfileDetails` writes `dob`.

## 3. Dependent booking names

**Problem:** the Cal.com booking was always created with the account holder's
name, so the clinician's calendar invite named the parent, not the patient.

**Change:** in `booking-step-time.tsx`, when the booking is for a dependent the
Cal booking `name` sent to `/api/checkout/create` (→ `BookingIntent.name` →
Stripe webhook `createCalBooking`) becomes
`"<Dependent> (booked by <Account holder>)"`. Attendee email stays the account
holder's. The `pendingSelections.patientName` (what the admin dashboard shows)
keeps the clean dependent name.

## Testing

`tests/lib/age.test.ts` covers `calcAge`/`formatAge`. Existing auth-panel /
person-switcher / profile-editor suites still pass. tsc clean for all touched
files (8 remaining errors are pre-existing, in untouched test files).

## Not done / follow-up

- "Assign exercises" gating (only when assessment submitted + summary pending) —
  deferred, product owner dismissed the scoping question.
- No hard block for accounts on `DEFAULT_DOB` — soft warning only, per owner.
