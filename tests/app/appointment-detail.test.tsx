import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'b1' }) }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => () => {}),
}))
vi.mock('@/lib/patient-bookings', () => ({ getBooking: vi.fn() }))
vi.mock('@/lib/session-summaries', () => ({ getSessionSummary: vi.fn() }))

import AppointmentDetailPage from '@/app/patient/appointments/[id]/page'

describe('AppointmentDetailPage', () => {
  it('shows a skeleton row while loading instead of plain "Loading…" text', () => {
    const { container } = render(<AppointmentDetailPage />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()
  })
})
