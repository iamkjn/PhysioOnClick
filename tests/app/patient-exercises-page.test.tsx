import { render, waitFor, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const authCallback = vi.fn()
vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
    authCallback.mockImplementation(cb)
    cb({ uid: 'u1', displayName: 'Pat Patient', email: 'pat@example.com' })
    return () => {}
  },
}))
vi.mock('@/components/person-provider', () => ({
  usePerson: () => ({ personId: 'u1' }),
}))
vi.mock('@/lib/session-summaries', () => ({
  getLatestSummaryId: vi.fn().mockResolvedValue(undefined),
}))

const AssignedExercisesMock = vi.fn(() => <div data-testid="assigned-exercises" />)
vi.mock('@/components/assigned-exercises', () => ({
  AssignedExercises: (props: unknown) => AssignedExercisesMock(props),
}))

const PatientSelfTestsMock = vi.fn(() => <div data-testid="patient-self-tests" />)
vi.mock('@/components/patient-self-tests', () => ({
  PatientSelfTests: (props: unknown) => PatientSelfTestsMock(props),
}))

import ExercisesPage from '@/app/patient/exercises/page'

describe('ExercisesPage', () => {
  it('renders PatientSelfTests below AssignedExercises with the same uid/personId', async () => {
    render(<ExercisesPage />)
    await waitFor(() => expect(screen.getByTestId('patient-self-tests')).toBeTruthy())
    expect(PatientSelfTestsMock).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'u1', personId: 'u1' })
    )
  })
})
