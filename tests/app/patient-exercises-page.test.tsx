import { render, waitFor, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const authCallback = vi.fn()
vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
    authCallback.mockImplementation(cb)
    cb({ uid: 'u1', displayName: 'Pat Patient', email: 'pat@example.com', getIdToken: async () => 't' })
    return () => {}
  },
}))
const caredForMock = vi.fn((): unknown => [])
vi.mock('@/hooks/use-cared-for-patients', () => ({
  useCaredForPatients: () => caredForMock(),
}))
vi.mock('@/lib/session-summaries', () => ({
  getLatestSummaryId: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/dependents', () => ({
  getDependents: vi.fn().mockResolvedValue([]),
}))

const AssignedExercisesMock = vi.fn((_props: unknown) => <div data-testid="assigned-exercises" />)
vi.mock('@/components/assigned-exercises', () => ({
  AssignedExercises: (props: unknown) => AssignedExercisesMock(props),
}))

const PatientSelfTestsMock = vi.fn((_props: unknown) => <div data-testid="patient-self-tests" />)
vi.mock('@/components/patient-self-tests', () => ({
  PatientSelfTests: (props: unknown) => PatientSelfTestsMock(props),
}))

import ExercisesPage from '@/app/patient/exercises/page'
import { PersonProvider } from '@/components/person-provider'
import { getLatestSummaryId } from '@/lib/session-summaries'

beforeEach(() => {
  window.localStorage.clear()
  caredForMock.mockReturnValue([])
})

describe('ExercisesPage', () => {
  it('renders PatientSelfTests below AssignedExercises with the same uid/personId', async () => {
    render(<PersonProvider><ExercisesPage /></PersonProvider>)
    await waitFor(() => expect(screen.getByTestId('patient-self-tests')).toBeTruthy())
    expect(PatientSelfTestsMock).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'u1', personId: 'u1' })
    )
    expect(AssignedExercisesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ uid: 'u1', personId: 'u1', allowMotionCheck: true })
    )
  })

  it('in carer mode reads and writes the cared-for patient’s own record, not the carer’s', async () => {
    window.localStorage.setItem(
      'pooc:activePerson',
      JSON.stringify({ personId: null, personName: '', careForUid: 'patient-1', careForName: 'Mary Smith', careForViewerUid: 'u1' })
    )
    caredForMock.mockReturnValue([{ uid: 'patient-1', name: 'Mary Smith', relationship: 'Partner' }])
    vi.mocked(getLatestSummaryId).mockClear()

    render(<PersonProvider><ExercisesPage /></PersonProvider>)

    await waitFor(() =>
      expect(AssignedExercisesMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ uid: 'patient-1', personId: 'patient-1', allowMotionCheck: false })
      )
    )
    expect(PatientSelfTestsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ uid: 'patient-1', personId: 'patient-1' })
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Mary Smith's rehab plan.")
    expect(screen.getByRole('status')).toHaveTextContent('You’re helping Mary Smith.')
    // The plan PDF hangs off the patient's booking, which a carer can't read.
    expect(getLatestSummaryId).not.toHaveBeenCalledWith('patient-1', 'patient-1')
  })
})
