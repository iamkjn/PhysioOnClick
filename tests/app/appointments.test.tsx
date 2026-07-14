import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => () => {}),
}))
vi.mock('@/lib/patient-bookings', () => ({ getPatientBookings: vi.fn() }))

import AppointmentsPage from '@/app/patient/appointments/page'

describe('AppointmentsPage', () => {
  it('shows SkeletonRow while loading', () => {
    const { container } = render(<AppointmentsPage />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()
  })
})
