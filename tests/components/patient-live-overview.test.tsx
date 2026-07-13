import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null }))
vi.mock('@/lib/firestore-helpers', () => ({
  subscribeUserCollection: vi.fn(() => () => {}),
}))

import { PatientLiveOverview } from '@/components/patient-live-overview'

describe('PatientLiveOverview', () => {
  it('shows a skeleton for each column before auth resolves, and the sign-in prompt after', async () => {
    render(<PatientLiveOverview />)
    expect(document.querySelectorAll('.skeleton-row-group').length).toBe(3)

    await waitFor(() => {
      expect(screen.getByText(/sign in to load your live bookings/i)).toBeInTheDocument()
    })
  })
})
