import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => () => {}),
  signOut: vi.fn(),
}))
vi.mock('@/lib/admin-auth', () => ({ isAdminUser: vi.fn() }))
vi.mock('@/components/admin-sign-in', () => ({ AdminSignIn: () => null }))
vi.mock('@/components/admin-dashboard', () => ({ AdminDashboard: () => null }))

import { AdminAuthGate } from '@/components/admin-auth-gate'

describe('AdminAuthGate', () => {
  it('shows a branded skeleton pulse instead of a spinner while resolving', () => {
    const { container } = render(<AdminAuthGate />)
    expect(container.querySelector('.skeleton-stat-grid')).toBeInTheDocument()
    expect(container.querySelector('[style*="border-top-color"]')).not.toBeInTheDocument()
  })
})
