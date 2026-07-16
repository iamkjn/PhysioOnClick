import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { User } from 'firebase/auth'

const authState: { callback?: (user: User | null) => void } = {}

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth: unknown, callback: (user: User | null) => void) => {
    authState.callback = callback
    return vi.fn()
  }),
}))

vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('@/lib/firestore-helpers', () => ({
  subscribeUserCollection: vi.fn(() => () => {}),
}))

import { PatientLiveOverview } from '@/components/patient-live-overview'

describe('PatientLiveOverview', () => {
  it('shows a skeleton for each column before auth resolves, and the sign-in prompt after', async () => {
    render(<PatientLiveOverview />)
    expect(document.querySelectorAll('.skeleton-row-group').length).toBe(2)

    const authCallback = authState.callback
    if (!authCallback) {
      throw new Error('expected onAuthStateChanged callback to be captured')
    }
    authCallback(null)

    await waitFor(() => {
      expect(screen.getByText(/sign in to see your bookings and enquiries/i)).toBeInTheDocument()
    })
    expect(document.querySelectorAll('.skeleton-row-group').length).toBe(0)
  })
})
