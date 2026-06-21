# Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure Vitest + React Testing Library and write 14 focused tests covering the booking form, booking API route, auth/verify page, and legal compliance pages.

**Architecture:** Vitest runs tests in jsdom, using `@testing-library/react` for component rendering and `@testing-library/user-event` for interaction simulation. Firebase, Next.js router, and fetch are mocked per test file. Each task installs nothing new — all packages are installed in Task 1.

**Tech Stack:** Vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, @vitejs/plugin-react, jsdom

## Global Constraints

- TypeScript only — no `any`, no `@ts-ignore` in test files
- No new runtime dependencies — all 5 packages go in `devDependencies`
- Path alias `@/` resolves to the repo root (matches tsconfig `"@/*": ["./*"]`)
- Tests live in `tests/` at repo root — not colocated with source
- All 14 tests must pass with `npm run test:run`
- No real Firebase connections — all Firebase modules mocked in every test file

---

### Task 1: Vitest Setup

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Modify: `package.json` (add `test` and `test:run` scripts, install 5 devDependencies)

**Interfaces:**
- Consumes: nothing
- Produces: `npm test` launches Vitest watch mode; `npm run test:run` runs all tests once and exits

- [ ] **Step 1: Install dev dependencies**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Expected: packages added to `devDependencies` in package.json, no errors.

- [ ] **Step 2: Create `vitest.config.ts`**

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

- [ ] **Step 3: Create `tests/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add scripts to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest",
"test:run": "vitest run"
```

The scripts block should now look like:

```json
"scripts": {
  "clean": "rm -rf .next",
  "dev": "next dev",
  "build": "next build",
  "rebuild": "npm run clean && npm run build",
  "seed:firestore": "tsx scripts/seed-firestore.ts",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 5: Verify setup works**

```bash
npm run test:run
```

Expected output: `No test files found, exiting with code 1` or `0 tests passed` — either is fine at this stage. The command must not crash with a config error.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/setup.ts package.json package-lock.json
git commit -m "feat: add Vitest + React Testing Library setup"
```

---

### Task 2: Booking Form Tests

**Files:**
- Create: `tests/components/booking-form.test.tsx`

**Interfaces:**
- Consumes: `vitest.config.ts` and `tests/setup.ts` from Task 1
- Produces: 4 passing tests verifying consent checkbox behaviour

- [ ] **Step 1: Create the test file with all 4 tests**

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock Next.js navigation (BookingForm uses no router, but firebase import chain may need it)
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
  usePathname: () => '/',
}))

// Prevent real Firebase connections
vi.mock('@/lib/firebase', () => ({
  auth: null,
  db: null,
  storage: null,
}))

import { BookingForm } from '@/components/booking-form'

describe('BookingForm consent checkbox', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('shows error and does not call fetch when consent is unchecked', async () => {
    const user = userEvent.setup()
    render(<BookingForm />)

    // Fill required fields
    await user.type(screen.getByPlaceholderText('Jane Smith'), 'Jane Smith')
    await user.type(screen.getByPlaceholderText('jane@example.com'), 'jane@example.com')
    await user.selectOptions(screen.getByRole('combobox', { name: /service/i }), 'Musculoskeletal Physiotherapy')

    // Set date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await user.type(screen.getByDisplayValue(''), dateStr)

    await user.selectOptions(screen.getByRole('combobox', { name: /preferred time/i }), '09:00')

    // Submit without checking consent
    await user.click(screen.getByRole('button', { name: /request appointment/i }))

    expect(global.fetch).not.toHaveBeenCalled()
    expect(screen.getByText(/please confirm your consent/i)).toBeInTheDocument()
  })

  it('calls fetch with consent: true when consent is checked', async () => {
    const user = userEvent.setup()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, appointmentLabel: 'Mon 1 Jan 2026 09:00', meetLink: '' }), { status: 200 })
    )

    render(<BookingForm />)

    await user.type(screen.getByPlaceholderText('Jane Smith'), 'Jane Smith')
    await user.type(screen.getByPlaceholderText('jane@example.com'), 'jane@example.com')
    await user.selectOptions(screen.getByRole('combobox', { name: /service/i }), 'Musculoskeletal Physiotherapy')

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await user.type(screen.getByDisplayValue(''), dateStr)

    await user.selectOptions(screen.getByRole('combobox', { name: /preferred time/i }), '09:00')

    // Check consent
    await user.click(screen.getByRole('checkbox'))

    await user.click(screen.getByRole('button', { name: /request appointment/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/booking',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"consent":true'),
        })
      )
    })
  })

  it('resets consent to unchecked after booking another appointment', async () => {
    const user = userEvent.setup()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, appointmentLabel: 'Mon 1 Jan 2026 09:00', meetLink: '' }), { status: 200 })
    )

    render(<BookingForm />)

    await user.type(screen.getByPlaceholderText('Jane Smith'), 'Jane Smith')
    await user.type(screen.getByPlaceholderText('jane@example.com'), 'jane@example.com')
    await user.selectOptions(screen.getByRole('combobox', { name: /service/i }), 'Musculoskeletal Physiotherapy')

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await user.type(screen.getByDisplayValue(''), dateStr)

    await user.selectOptions(screen.getByRole('combobox', { name: /preferred time/i }), '09:00')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /request appointment/i }))

    // Wait for success state
    await waitFor(() => screen.getByRole('button', { name: /book another appointment/i }))

    await user.click(screen.getByRole('button', { name: /book another appointment/i }))

    // Consent checkbox should be unchecked again
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  it('renders consent checkbox with Privacy Policy link', () => {
    render(<BookingForm />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy-policy')
  })
})
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm run test:run tests/components/booking-form.test.tsx
```

Expected: `4 passed`. If any test fails, read the error carefully — the most common issue is a selector mismatch (e.g. the combobox label). Adjust the `getByRole` or `getByPlaceholderText` selectors to match the actual rendered HTML.

- [ ] **Step 3: Commit**

```bash
git add tests/components/booking-form.test.tsx
git commit -m "test: add booking form consent checkbox tests"
```

---

### Task 3: Booking API Route Tests

**Files:**
- Create: `tests/api/booking.test.ts`

**Interfaces:**
- Consumes: Task 1 setup
- Produces: 3 passing tests verifying consent enforcement and required-field validation in the API route

**Note:** The route handler at `app/api/booking/route.ts` exports `POST`. Import and call it directly with a fake `Request` object — no HTTP server needed.

- [ ] **Step 1: Create the test file with all 3 tests**

```ts
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock firebase-admin before importing the route
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => ({
    collection: () => ({
      add: vi.fn().mockResolvedValue({ id: 'mock-booking-id' }),
    }),
  }),
  getAdminAuth: () => ({
    generateSignInWithEmailLink: vi.fn().mockResolvedValue('https://example.com/auth/verify'),
  }),
}))

// Mock google-calendar
vi.mock('@/lib/google-calendar', () => ({
  createEventWithMeet: vi.fn().mockResolvedValue({
    meetLink: 'https://meet.google.com/mock',
    eventId: 'mock-event-id',
  }),
}))

// Mock client-side firebase (imported transitively)
vi.mock('@/lib/firebase', () => ({
  auth: null,
  db: null,
  storage: null,
}))

// Mock fetch for Resend email API
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
})

import { POST } from '@/app/api/booking/route'

const validBody = {
  fullName: 'Jane Smith',
  email: 'jane@example.com',
  phone: '07700900000',
  service: 'Musculoskeletal Physiotherapy',
  appointmentDate: '2026-07-01',
  appointmentTime: '09:00',
  notes: '',
  consent: true,
}

function makeRequest(body: object): Request {
  return new Request('http://localhost/api/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/booking', () => {
  it('returns 400 when consent is false', async () => {
    const res = await POST(makeRequest({ ...validBody, consent: false }))
    expect(res.status).toBe(400)
    const data = await res.json() as { error: string }
    expect(data.error).toBe('Consent is required.')
  })

  it('returns 200 when all required fields are present and consent is true', async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const data = await res.json() as { ok: boolean }
    expect(data.ok).toBe(true)
  })

  it('returns 400 when a required field is missing', async () => {
    const { email: _removed, ...withoutEmail } = validBody
    const res = await POST(makeRequest({ ...withoutEmail, consent: true }))
    expect(res.status).toBe(400)
    const data = await res.json() as { error: string }
    expect(data.error).toBe('Missing required booking details.')
  })
})
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm run test:run tests/api/booking.test.ts
```

Expected: `3 passed`. If you see `getAdminDb is not a function` or similar, confirm the mock factory returns the right shape — the mock must return an object with a `collection` method that returns an object with `add`.

- [ ] **Step 3: Commit**

```bash
git add tests/api/booking.test.ts
git commit -m "test: add booking API route consent and validation tests"
```

---

### Task 4: Auth Verify Page Tests

**Files:**
- Create: `tests/app/auth-verify.test.tsx`

**Interfaces:**
- Consumes: Task 1 setup
- Produces: 3 passing tests covering invalid link, expired link, and successful sign-in states

**Note:** The page component (`VerifyPage`) is wrapped in `Suspense` via `VerifyPageWrapper`. Import and render `VerifyPageWrapper`. The component uses `window.location.href` inside a `useEffect` — jsdom sets this to `http://localhost/` by default, which is fine since `isSignInWithEmailLink` is mocked.

- [ ] **Step 1: Create the test file with all 3 tests**

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

// Must mock firebase/auth BEFORE importing the page
vi.mock('firebase/auth', () => ({
  isSignInWithEmailLink: vi.fn(),
  signInWithEmailLink: vi.fn(),
  FirebaseError: class FirebaseError extends Error {
    constructor(public code: string, message: string) { super(message) }
  },
}))

vi.mock('@/lib/firebase', () => ({ auth: {} }))

vi.mock('@/lib/patient-account', () => ({
  ensurePatientRecord: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({
    get: (key: string) => key === 'email' ? 'jane@example.com' : null,
  }),
}))

// Mock fetch for /api/auth/link-bookings (non-blocking)
global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))

import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import VerifyPageWrapper from '@/app/auth/verify/page'

describe('Auth verify page', () => {
  it('shows error when link is not a valid sign-in link', async () => {
    vi.mocked(isSignInWithEmailLink).mockReturnValue(false)

    render(<VerifyPageWrapper />)

    await waitFor(() => {
      expect(screen.getByText(/not a valid sign-in link/i)).toBeInTheDocument()
    })
  })

  it('shows error when signInWithEmailLink rejects with expired code', async () => {
    vi.mocked(isSignInWithEmailLink).mockReturnValue(true)
    const { FirebaseError } = await import('firebase/auth')
    vi.mocked(signInWithEmailLink).mockRejectedValue(
      new FirebaseError('auth/expired-action-code', 'expired')
    )

    render(<VerifyPageWrapper />)

    await waitFor(() => {
      expect(screen.getByText(/expired or has already been used/i)).toBeInTheDocument()
    })
  })

  it('shows success when signInWithEmailLink resolves', async () => {
    vi.mocked(isSignInWithEmailLink).mockReturnValue(true)
    vi.mocked(signInWithEmailLink).mockResolvedValue({
      user: {
        displayName: 'Jane Smith',
        getIdToken: vi.fn().mockResolvedValue('mock-token'),
      },
    } as never)

    render(<VerifyPageWrapper />)

    await waitFor(() => {
      expect(screen.getByText(/you are in/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm run test:run tests/app/auth-verify.test.tsx
```

Expected: `3 passed`. If you see `Cannot find module 'firebase/auth'`, confirm the mock is hoisted (Vitest auto-hoists `vi.mock` calls — order in file doesn't matter). If `useSearchParams` isn't returning the email value, check the mock returns `'jane@example.com'` for `get('email')`.

- [ ] **Step 3: Commit**

```bash
git add tests/app/auth-verify.test.tsx
git commit -m "test: add auth verify page sign-in state tests"
```

---

### Task 5: Legal Pages Tests

**Files:**
- Create: `tests/app/terms.test.tsx`
- Create: `tests/app/privacy-policy.test.tsx`

**Interfaces:**
- Consumes: Task 1 setup
- Produces: 4 passing tests (2 per page) verifying all required compliance sections are rendered

**Note:** Both pages are static server components with no Firebase or router calls. They can be rendered without any mocks.

- [ ] **Step 1: Create `tests/app/terms.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

// Next.js Link renders as <a> in tests — no mock needed
import TermsPage from '@/app/terms/page'

describe('Terms & Conditions page', () => {
  it('renders all 9 required section headings', () => {
    render(<TermsPage />)

    const headings = [
      'Who we are',
      'Nature of the service',
      'Geographic scope',
      'Limitations of online assessment',
      'Payment & cancellation',
      'Data & privacy',
      'Emergency situations',
      'Governing law',
      'Changes to these terms',
    ]

    for (const heading of headings) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
  })

  it('contains contact email and links to policy pages', () => {
    render(<TermsPage />)

    expect(screen.getByRole('link', { name: /hello@physioonclick\.co\.uk/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cancellation policy/i })).toHaveAttribute('href', '/cancellation-policy')
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy-policy')
  })
})
```

- [ ] **Step 2: Create `tests/app/privacy-policy.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import PrivacyPolicyPage from '@/app/privacy-policy/page'

describe('Privacy Policy page', () => {
  it('renders all 8 required section headings', () => {
    render(<PrivacyPolicyPage />)

    const headings = [
      'Who we are',
      'What data we collect',
      'Lawful basis for processing',
      'Third-party processors',
      'Data retention',
      'Your rights',
      'Cookies',
      'Complaints',
    ]

    for (const heading of headings) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
  })

  it('names all required third-party processors including Google Calendar', () => {
    render(<PrivacyPolicyPage />)

    expect(screen.getByText(/Google Firebase/i)).toBeInTheDocument()
    expect(screen.getByText(/Stripe/i)).toBeInTheDocument()
    expect(screen.getByText(/Cal\.com/i)).toBeInTheDocument()
    expect(screen.getByText(/Google Calendar/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run all tests to confirm 14 pass**

```bash
npm run test:run
```

Expected output:
```
Test Files  5 passed (5)
Tests       14 passed (14)
```

If legal page tests fail because a heading text doesn't match exactly, read the rendered page component and adjust the heading string to match verbatim.

- [ ] **Step 4: Commit**

```bash
git add tests/app/terms.test.tsx tests/app/privacy-policy.test.tsx
git commit -m "test: add legal page section presence tests"
```

---

## Self-Review

**Spec coverage:**
- ✅ Vitest + React Testing Library — Task 1
- ✅ `@vitejs/plugin-react`, jsdom, `globals: true`, `@/` alias — Task 1
- ✅ `npm test` and `npm run test:run` — Task 1
- ✅ Booking form: 4 tests (consent blocks submit, fetch body, reset, checkbox renders) — Task 2
- ✅ API route: 3 tests (consent false → 400, valid → 200, missing field → 400) — Task 3
- ✅ Auth verify: 3 tests (invalid link, expired code, success) — Task 4 — uses `isSignInWithEmailLink`/`signInWithEmailLink` (not `signInWithCustomToken`)
- ✅ Terms: 9 headings + links — Task 5
- ✅ Privacy Policy: 8 headings + 4 processors — Task 5
- ✅ No real Firebase connections — mocked in Tasks 2, 3, 4
- ✅ Total: 14 tests

**Placeholder scan:** All test code is complete. No TBDs. Commands include expected output.

**Type consistency:** `makeRequest` in Task 3 accepts `object` and returns `Request` — consistent with `POST(request: Request)` in the route. `vi.mocked()` used for typed mock references throughout.
