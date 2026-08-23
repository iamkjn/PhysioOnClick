import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => () => {}),
}))
// lib/firebase.ts computes `auth` from NEXT_PUBLIC_FIREBASE_* env vars, which
// aren't set in the test env — mock it directly so `auth` is truthy and
// AdminAuthGate reaches its "loading" (skeleton) state rather than bailing
// out to status "out" immediately.
vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('@/lib/admin-auth', () => ({ isAdminUser: vi.fn() }))

import AdminRecoveryPage from '@/app/admin/recovery/page'

describe('AdminRecoveryPage', () => {
  it('shows a skeleton instead of "Checking admin access…" text', () => {
    const { container } = render(<AdminRecoveryPage />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()
  })
})
