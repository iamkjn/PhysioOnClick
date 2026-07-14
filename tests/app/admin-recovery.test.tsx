import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => () => {}),
}))
vi.mock('@/lib/admin-auth', () => ({ isAdminUser: vi.fn() }))

import AdminRecoveryPage from '@/app/admin/recovery/page'

describe('AdminRecoveryPage', () => {
  it('shows a skeleton instead of "Checking admin access…" text', () => {
    const { container } = render(<AdminRecoveryPage />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()
  })
})
