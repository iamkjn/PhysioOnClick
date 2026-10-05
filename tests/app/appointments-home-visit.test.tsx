import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The patient portal shows where a home visit happens; video bookings are unchanged.

const mocks = vi.hoisted(() => ({ getPatientBookings: vi.fn(), getBooking: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/patient',
  useParams: () => ({ id: 'b1' }),
}))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  onAuthStateChanged: vi.fn((_a: unknown, cb: (u: unknown) => void) => {
    cb({ uid: 'u1', email: '', displayName: 'Ada' })
    return () => {}
  }),
}))
vi.mock('@/components/person-provider', () => ({ usePerson: () => null }))
vi.mock('@/components/person-switcher', () => ({ PersonSwitcher: () => null }))
vi.mock('@/components/trustpilot-invitations', () => ({ TrustpilotInvitations: () => null }))
vi.mock('@/components/download-summary-button', () => ({ DownloadSummaryButton: () => null }))
vi.mock('@/components/recovery-percent-card', () => ({ RecoveryPercentCard: () => null }))
vi.mock('@/lib/follow-ups', () => ({ getFollowUps: vi.fn().mockResolvedValue([]) }))
vi.mock('@/lib/session-summaries', () => ({ getSessionSummary: vi.fn().mockResolvedValue(null) }))
vi.mock('@/lib/patient-bookings', () => ({
  getPatientBookings: mocks.getPatientBookings,
  getBooking: mocks.getBooking,
}))

import AppointmentsPage from '@/app/patient/appointments/page'
import AppointmentDetailPage from '@/app/patient/appointments/[id]/page'

const ADDRESS = '7 <b>Example</b> Street, G31 4HS'

function booking(extra: Record<string, unknown> = {}) {
  return {
    id: 'b1',
    patientName: 'Ada Lovelace',
    patientAvatarUrl: '',
    service: 'Initial Assessment (home visit)',
    sessionDate: new Date('2999-01-01T10:00:00.000Z'),
    status: 'upcoming',
    paid: true,
    assessmentCompletedAt: new Date(),
    ...extra,
  }
}

beforeEach(() => {
  mocks.getPatientBookings.mockReset()
  mocks.getBooking.mockReset()
})

describe('patient portal home-visit details', () => {
  it('lists a home visit with its address, as text', async () => {
    mocks.getPatientBookings.mockResolvedValue([booking({ visitType: 'home', homeVisitAddress: ADDRESS })])
    const { container } = render(<AppointmentsPage />)
    expect(await screen.findByText(`Home visit at ${ADDRESS}`)).toBeInTheDocument()
    expect(container.querySelector('b')).toBeNull()
  })

  it('lists a video booking without any home-visit line', async () => {
    mocks.getPatientBookings.mockResolvedValue([booking({ visitType: 'video', service: 'Initial Online Assessment' })])
    render(<AppointmentsPage />)
    await screen.findByText(/Initial Online Assessment/)
    expect(screen.queryByText(/Home visit at/)).toBeNull()
  })

  it('shows the home-visit address on the appointment detail page', async () => {
    mocks.getBooking.mockResolvedValue(booking({ visitType: 'home', homeVisitAddress: ADDRESS }))
    const { container } = render(<AppointmentDetailPage />)
    expect(await screen.findByText(`Home visit at ${ADDRESS}`)).toBeInTheDocument()
    expect(container.querySelector('b')).toBeNull()
  })

  it('shows no home-visit line on a video appointment detail page', async () => {
    mocks.getBooking.mockResolvedValue(booking({ visitType: 'video', service: 'Initial Online Assessment' }))
    render(<AppointmentDetailPage />)
    await screen.findByText('Initial Online Assessment')
    expect(screen.queryByText(/Home visit at/)).toBeNull()
  })
})
