import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: {} }))
const onAuthStateChanged = vi.fn((_auth: unknown, _cb: (user: unknown) => void) => () => {})
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth: unknown, cb: (user: unknown) => void) => onAuthStateChanged(auth, cb),
  signOut: vi.fn(),
}))
const isAdminUser = vi.fn()
vi.mock('@/lib/admin-auth', () => ({ isAdminUser: (...args: unknown[]) => isAdminUser(...(args as [])) }))
vi.mock('@/components/admin-sign-in', () => ({ AdminSignIn: () => <div>sign-in</div> }))
vi.mock('@/components/admin-dashboard', () => ({ AdminDashboard: () => null }))

import { AdminAuthGate } from '@/components/admin-auth-gate'

describe('AdminAuthGate', () => {
  it('shows a branded skeleton pulse instead of a spinner while resolving', () => {
    const { container } = render(<AdminAuthGate />)
    expect(container.querySelector('.skeleton-stat-grid')).toBeInTheDocument()
    expect(container.querySelector('[style*="border-top-color"]')).not.toBeInTheDocument()
  })

  it('falls back to the sign-in screen instead of hanging forever when the admin check rejects', async () => {
    // Regression test: isAdminUser() does a network round-trip (getIdTokenResult),
    // and previously an unhandled rejection here left the gate stuck on the
    // loading skeleton forever instead of ever resolving.
    isAdminUser.mockRejectedValueOnce(new Error('network error'))
    let callback: (user: unknown) => void = () => {}
    onAuthStateChanged.mockImplementationOnce((_auth: unknown, cb: (user: unknown) => void) => {
      callback = cb
      return () => {}
    })

    render(<AdminAuthGate />)
    callback({ uid: 'admin-1' })

    await waitFor(() => expect(screen.getByText('sign-in')).toBeInTheDocument())
  })
})
