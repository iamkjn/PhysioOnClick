# Web Account & People Parity Design

**Date:** 2026-06-19  
**Status:** Approved  
**Scope:** Bring the web patient portal to feature parity with the mobile app's Profile (Account) tab and My People screen.

---

## Problem

The mobile app has a dedicated **Profile tab** (account info, sign-out, rehab programmes, saved blogs, document uploads) and a **My People screen** (self card + dependents with add/edit/delete). The web patient portal is missing:

- A dedicated `/patient/account` page — account info is scattered across the marketing-style `/patient` dashboard with no visible sign-out.
- Edit functionality for dependents on `/patient/people`.
- The signed-in user's own card at the top of My People.
- Age display (mobile shows age; web shows raw DOB).

---

## Approach

**Option A — Reuse existing components.** New `/patient/account` page assembles existing `PatientProfileEditor` and `UploadPanel` components with a new user info card. My People gets targeted additions: "You" card, edit mode, age display, and a new `updateDependent` helper.

---

## Design

### 1. New `/patient/account` page

**File:** `app/patient/account/page.tsx` (client component)

**Auth guard:** `onAuthStateChanged` — if no user, `router.push('/patient')`.

**Layout (top to bottom):**

1. **User info card**
   - Displays `auth.currentUser.displayName` and `email`
   - Sign Out button: calls `signOut(auth)`, then `router.push('/patient')`

2. **Quick links row**
   - Two pill/tile links: `My People → /patient/people` and `My Appointments → /patient/appointments`
   - Same visual style as the existing quick links on `/patient`

3. **`<PatientProfileEditor />`** — dropped in as-is (name, phone, email update)

4. **`<UploadPanel />`** — dropped in as-is (upload + list documents)

5. **`<RehabProgramsSection />`** — new client component
   - Reads `rehabPrograms` collection, filtered by `patientEmail === auth.currentUser.email`
   - Displays: programme title, stage, notes, goals list, exercise IDs list
   - Empty state: "No rehab programme assigned yet."

6. **`<SavedBlogsSection />`** — new client component
   - Reads `patients/{uid}/favoriteBlogs` ordered by `savedAt desc`
   - Displays: article title, category
   - Empty state: "No saved articles yet. Star a blog article to add it here."

**Portal nav update:** Add a third quick-link pill to `/patient` page: `My Account → /patient/account`.

---

### 2. My People updates

**File:** `app/patient/people/page.tsx`

#### 2a. "You" card at top
- After auth resolves, render a non-deletable, non-editable card for the signed-in user.
- Shows `auth.currentUser.displayName`, `email`, and a "You" badge.
- Uses the existing `<Avatar />` component.
- Appears above the dependents list.

#### 2b. Edit dependent
- Add `editingId: string | null` state (only one card editable at a time).
- Each dependent card gets an **Edit** button.
- Clicking Edit expands an inline edit form below the card, pre-filled with current values (name, DOB, relationship, notes).
- Save calls `updateDependent(id, data)` then refreshes the list.
- Cancel collapses the form and resets `editingId` to null.

#### 2c. Age display
- Compute age from DOB: `new Date()` year diff, adjusted for birthday not yet passed.
- Display: `{relationship} · {age} years old` (replaces raw DOB string).

---

### 3. `lib/dependents.ts` update

Add `updateDependent(id: string, data: Partial<Omit<Dependent, 'id'>>): Promise<void>` — calls Firestore `updateDoc` on `dependents/{id}`.

No other changes to the library.

---

## Out of scope

- Avatar photo upload on web (camera/gallery not applicable to browser; add later).
- Rehab programme management (admin-only, separate feature).
- Exercise video playback on the account page (exercise library already exists on `/patient`).

---

## Data sources (Firestore)

| Section | Collection / path |
|---|---|
| Rehab programmes | `rehabPrograms` (filter: `patientEmail`) |
| Saved blogs | `patients/{uid}/favoriteBlogs` |
| Document uploads | `patients/{uid}/uploads` (handled by existing `UploadPanel`) |
| Dependents | `dependents` (handled by existing `lib/dependents.ts`) |

---

## Files changed

| File | Change |
|---|---|
| `app/patient/account/page.tsx` | **New** — account page |
| `app/patient/page.tsx` | Add "My Account" quick-link pill |
| `app/patient/people/page.tsx` | Add "You" card, edit mode, age display |
| `lib/dependents.ts` | Add `updateDependent` export |
| `components/rehab-programs-section.tsx` | **New** — rehab programmes display |
| `components/saved-blogs-section.tsx` | **New** — saved blogs display |
