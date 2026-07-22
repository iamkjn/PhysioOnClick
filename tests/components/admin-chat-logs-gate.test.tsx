import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: {} }))

let authCallback: ((user: unknown) => void) | undefined
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth, cb) => {
    authCallback = cb
    return () => {}
  }),
  signOut: vi.fn(),
}))
vi.mock('@/lib/admin-auth', () => ({ isAdminUser: vi.fn() }))
vi.mock('@/components/admin-sign-in', () => ({ AdminSignIn: () => null }))
vi.mock('@/components/admin-chat-logs', () => ({ AdminChatLogs: () => <div>chat logs content</div> }))

import { AdminChatLogsGate } from '@/components/admin-chat-logs-gate'
import { isAdminUser } from '@/lib/admin-auth'

describe('AdminChatLogsGate', () => {
  it('shows a branded skeleton pulse instead of a spinner while resolving', () => {
    const { container } = render(<AdminChatLogsGate />)
    expect(container.querySelector('.skeleton-stat-grid')).toBeInTheDocument()
    expect(container.querySelector('[style*="border-top-color"]')).not.toBeInTheDocument()
  })

  it('shows forbidden state for a signed-in user who is not an admin', async () => {
    vi.mocked(isAdminUser).mockResolvedValue(false)
    render(<AdminChatLogsGate />)

    authCallback?.({ email: 'patient@example.com' })

    await waitFor(() => {
      expect(screen.getByText(/doesn't have admin access/i)).toBeInTheDocument()
    })
    expect(screen.queryByText('chat logs content')).not.toBeInTheDocument()
  })

  it('renders chat logs content for an admin user', async () => {
    vi.mocked(isAdminUser).mockResolvedValue(true)
    render(<AdminChatLogsGate />)

    authCallback?.({ email: 'hello@physioonclick.co.uk' })

    await waitFor(() => {
      expect(screen.getByText('chat logs content')).toBeInTheDocument()
    })
    expect(screen.queryByText(/doesn't have admin access/i)).not.toBeInTheDocument()
  })
})
