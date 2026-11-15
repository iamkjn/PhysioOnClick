import { render, screen, waitFor } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

const getAssignedExercises = vi.fn()
const getRecoveryScoreSeries = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...a: unknown[]) => getAssignedExercises(...a),
  getRecoveryScoreSeries: (...a: unknown[]) => getRecoveryScoreSeries(...a),
}))
const getPatientBookings = vi.fn()
vi.mock('@/lib/patient-bookings', () => ({
  getPatientBookings: (...a: unknown[]) => getPatientBookings(...a),
}))
vi.mock('@/lib/dependents', () => ({ getDependents: vi.fn().mockResolvedValue([]) }))

const caredForMock = vi.fn((): unknown => [])
const verifyEmailMock = vi.fn(() => false)
vi.mock('@/hooks/use-cared-for-patients', () => ({
  useCaredForPatients: () => caredForMock(),
  useCarerLinks: () => {
    const patients = caredForMock()
    return patients === null ? null : { patients, verifyEmail: verifyEmailMock() }
  },
  resetCaredForCache: vi.fn(),
}))

const PatientDashboardMock = vi.fn((_p: unknown) => <div data-testid="patient-dashboard" />)
vi.mock('@/components/patient-dashboard', () => ({
  PatientDashboard: (p: unknown) => PatientDashboardMock(p),
}))
vi.mock('@/components/recovery-percent-card', () => ({ RecoveryPercentCard: () => null }))

import { HomeDashboard } from '@/components/home-dashboard'
import { PersonProvider } from '@/components/person-provider'

const carer = { uid: 'carer-1', displayName: 'Krunal Nayak', email: 'krunal@example.com' } as User
const MARY = { uid: 'patient-1', name: 'Mary Smith', relationship: 'Partner' }

beforeEach(() => {
  window.localStorage.clear()
  getAssignedExercises.mockReset()
  getRecoveryScoreSeries.mockReset().mockResolvedValue([])
  getPatientBookings.mockReset().mockResolvedValue([])
  caredForMock.mockReturnValue([MARY])
  verifyEmailMock.mockReturnValue(false)
  PatientDashboardMock.mockClear()
})

describe('HomeDashboard carer access', () => {
  it('opens a carer with no plan of their own on the patient they care for (first visit)', async () => {
    getAssignedExercises.mockImplementation(async (owner: string) =>
      owner === 'patient-1' ? [{ exerciseId: 'ex1', active: true }] : []
    )

    render(<PersonProvider><HomeDashboard user={carer} /></PersonProvider>)

    await waitFor(() => expect(screen.getByText("You're helping Mary Smith with their recovery.")).toBeInTheDocument())
    await waitFor(() =>
      expect(PatientDashboardMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ uid: 'patient-1', personId: 'patient-1', possessive: "Mary Smith's" })
      )
    )
    expect(getAssignedExercises).toHaveBeenCalledWith('patient-1', 'patient-1')
    expect(screen.getByRole('link', { name: /Mary Smith's recovery/ })).toHaveAttribute('href', '/patient/recovery')
    expect(screen.getByRole('link', { name: /Mary Smith's exercises/ })).toBeInTheDocument()
    // The carer's own account links are hidden while helping someone else…
    expect(screen.queryByRole('link', { name: /My appointments/ })).not.toBeInTheDocument()
    // …and the patient's bookings are never looked up.
    expect(getPatientBookings).not.toHaveBeenCalledWith(expect.anything(), 'patient-1')
  })

  it('keeps a carer who has their own plan on their own record', async () => {
    getAssignedExercises.mockResolvedValue([{ exerciseId: 'ex1', active: true }])

    render(<PersonProvider><HomeDashboard user={carer} /></PersonProvider>)

    await waitFor(() => expect(PatientDashboardMock).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 20))
    expect(PatientDashboardMock).toHaveBeenLastCalledWith(expect.objectContaining({ uid: 'carer-1', personId: 'carer-1' }))
    expect(screen.getByText("Here's how your recovery is tracking today.")).toBeInTheDocument()
  })

  it('never overrides a saved choice', async () => {
    window.localStorage.setItem('pooc:activePerson', JSON.stringify({ personId: null, personName: '' }))
    getAssignedExercises.mockResolvedValue([])

    render(<PersonProvider><HomeDashboard user={carer} /></PersonProvider>)

    await waitFor(() => expect(getAssignedExercises).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 20))
    expect(getAssignedExercises).not.toHaveBeenCalledWith('patient-1', 'patient-1')
    expect(screen.getByText("Here's how your recovery is tracking today.")).toBeInTheDocument()
  })

  it('says so when the cared-for patient has no exercises yet', async () => {
    window.localStorage.setItem(
      'pooc:activePerson',
      JSON.stringify({ personId: null, personName: '', careForUid: 'patient-1', careForName: 'Mary Smith', careForViewerUid: 'carer-1' })
    )
    getAssignedExercises.mockResolvedValue([])

    render(<PersonProvider><HomeDashboard user={carer} /></PersonProvider>)

    expect(await screen.findByText(/Mary Smith doesn.t have any exercises assigned yet/)).toBeInTheDocument()
  })

  it('prompts a carer with an unverified email to confirm it (and shows no patient)', async () => {
    caredForMock.mockReturnValue([])
    verifyEmailMock.mockReturnValue(true)
    getAssignedExercises.mockResolvedValue([])

    render(<PersonProvider><HomeDashboard user={carer} /></PersonProvider>)

    expect(await screen.findByText('Someone has given you access to help with their recovery.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Email me a confirmation link' })).toBeInTheDocument()
    expect(getAssignedExercises).not.toHaveBeenCalledWith('patient-1', 'patient-1')
  })

  it('shows no prompt to a verified carer', async () => {
    getAssignedExercises.mockResolvedValue([{ exerciseId: 'ex1', active: true }])
    render(<PersonProvider><HomeDashboard user={carer} /></PersonProvider>)
    await waitFor(() => expect(PatientDashboardMock).toHaveBeenCalled())
    expect(screen.queryByText('Someone has given you access to help with their recovery.')).not.toBeInTheDocument()
  })
})
