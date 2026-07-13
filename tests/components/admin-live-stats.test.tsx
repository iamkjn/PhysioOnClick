import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

let authStateCallback: ((user: any) => void) | null = null

vi.mock('@/lib/firebase', () => ({
  auth: { /* mock auth object */ },
  db: null,
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth: any, callback: (user: any) => void) => {
    authStateCallback = callback
    // Don't call the callback immediately — force the test to resolve it
    return () => {}
  },
}))

import { AdminLiveStats } from '@/components/admin-live-stats'

describe('AdminLiveStats', () => {
  it('shows a SkeletonStatGrid instead of fake zeroed counts before auth resolves', async () => {
    const { container } = render(<AdminLiveStats />)

    // On initial render, before auth resolves, should show skeleton
    expect(container.querySelector('.skeleton-stat-grid')).toBeInTheDocument()
    expect(screen.queryByText('£520')).not.toBeInTheDocument()

    // Simulate auth resolving
    if (authStateCallback) {
      authStateCallback(null)
    }

    // After auth resolves, skeleton should disappear and real data should show
    await waitFor(() => {
      expect(container.querySelector('.skeleton-stat-grid')).not.toBeInTheDocument()
    })
  })
})
