# Test Suite Design — PhysioOnClick

**Date:** 2026-06-21
**Goal:** Confidence before launch — focused tests on critical booking, auth, and legal compliance flows
**Runner:** Vitest + React Testing Library + jsdom

---

## Context

PhysioOnClick has no test suite. The recent compliance work (consent checkbox, API validation, T&Cs, Privacy Policy) introduced behaviour that must be verified automatically so regressions are caught when new features are added.

This spec covers the minimum viable test suite: 14 focused tests across 5 test files, targeting only the critical paths.

---

## New Files

```
vitest.config.ts
tests/
  setup.ts
  components/
    booking-form.test.tsx
  api/
    booking.test.ts
  app/
    auth-verify.test.tsx
    terms.test.tsx
    privacy-policy.test.tsx
```

---

## Dependencies (dev only)

| Package | Purpose |
|---|---|
| `vitest` | Test runner |
| `@vitejs/plugin-react` | JSX transform for Vitest |
| `@testing-library/react` | Component rendering |
| `@testing-library/user-event` | Simulates real user interactions |
| `@testing-library/jest-dom` | DOM matchers (`toBeInTheDocument`, etc.) |

Install command:
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

---

## Configuration

### `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

### `tests/setup.ts`

```ts
import '@testing-library/jest-dom'
```

### `package.json` scripts (add to existing)

```json
"test": "vitest",
"test:run": "vitest run"
```

---

## Mocking Strategy

| Module | Mock approach |
|---|---|
| `lib/firebase.ts` | `vi.mock('@/lib/firebase')` — prevents real Firebase connections in all tests |
| `fetch` | `vi.fn()` assigned to `global.fetch` per test — controls API responses |
| `next/navigation` | `vi.mock('next/navigation')` — prevents router errors in page component tests |
| Firebase Admin SDK | `vi.mock('@/lib/firebase-admin')` — for API route tests |

---

## Test Cases

### 1. `tests/components/booking-form.test.tsx` (4 tests)

Mocks required: `lib/firebase`, `next/navigation`, `global.fetch`

| # | Test | Assertion |
|---|---|---|
| 1 | Submit without consent checked | `fetch` is NOT called; error message "Please confirm your consent" is visible |
| 2 | Submit with consent checked | `fetch` called with body containing `consent: true` |
| 3 | "Book another appointment" after success | Consent checkbox is unchecked (reset to false) |
| 4 | Consent checkbox renders correctly | Checkbox is present; label contains "Privacy Policy" link |

---

### 2. `tests/api/booking.test.ts` (3 tests)

Tests the Next.js API route handler directly (imported and called with a mocked `Request` object). Mocks required: `lib/firebase-admin`, `lib/google-calendar`, `lib/firebase`.

| # | Test | Assertion |
|---|---|---|
| 1 | POST `{ consent: false, ...validFields }` | Returns 400, body `{ error: "Consent is required." }` |
| 2 | POST `{ consent: true, ...validFields }` | Returns 200 (Google Calendar + Firestore mocked) |
| 3 | POST `{ consent: true }` missing required field (no email) | Returns 400 |

---

### 3. `tests/app/auth-verify.test.tsx` (3 tests)

The page uses `isSignInWithEmailLink` + `signInWithEmailLink` from `firebase/auth` and has 5 stages: `verifying`, `needs-email`, `signing-in`, `success`, `error`.

Mocks required: `firebase/auth` (`isSignInWithEmailLink`, `signInWithEmailLink`), `lib/firebase` (exports `auth`), `lib/patient-account` (`ensurePatientRecord`), `next/navigation` (`useSearchParams`, `useRouter`), `global.fetch` (for `/api/auth/link-bookings`)

| # | Test | Assertion |
|---|---|---|
| 1 | `isSignInWithEmailLink` returns `false` (invalid link) | Renders error state with "not a valid sign-in link" message |
| 2 | Valid link + email in URL, `signInWithEmailLink` rejects with `auth/expired-action-code` | Renders error state with "expired or already been used" message |
| 3 | Valid link + email in URL, `signInWithEmailLink` resolves | Renders "You are in!" success state |

---

### 4. `tests/app/terms.test.tsx` (2 tests)

Mocks required: none (static page, no Firebase/router calls)

| # | Test | Assertion |
|---|---|---|
| 1 | Page renders all 9 section headings | "Who we are", "Nature of the service", "Geographic scope", "Limitations of online assessment", "Payment & cancellation", "Data & privacy", "Emergency situations", "Governing law", "Changes to these terms" all present |
| 2 | Page contains contact email and policy links | `hello@physioonclick.co.uk`, link to `/privacy-policy`, link to `/cancellation-policy` |

---

### 5. `tests/app/privacy-policy.test.tsx` (2 tests)

Mocks required: none (static page)

| # | Test | Assertion |
|---|---|---|
| 1 | Page renders all 8 section headings | "Who we are", "What data we collect", "Lawful basis for processing", "Third-party processors", "Data retention", "Your rights", "Cookies", "Complaints" all present |
| 2 | Page names all required third-party processors | "Google Firebase", "Stripe", "Cal.com", "Google Calendar" all mentioned |

---

## Total: 14 tests across 5 files

---

## Out of Scope

- End-to-end (Playwright/Cypress) — add post-launch on staging
- Admin dashboard tests — not a launch-critical path
- Firestore security rules testing — separate concern (Firebase Emulator)
- Visual regression tests — not needed at this stage

---

## Constraints

- No real Firebase connections in tests — all Firebase modules must be mocked
- Tests must run with `npm run test:run` in under 30 seconds
- TypeScript — no `any`, no `@ts-ignore` in test files
- No new runtime dependencies — all 5 packages are `devDependencies` only
