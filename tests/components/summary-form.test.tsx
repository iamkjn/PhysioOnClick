import { render, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/app/admin/actions', () => ({
  publishSummary: vi.fn(),
}))

vi.mock('@/lib/goals', () => ({
  getStreakGoal: vi.fn().mockResolvedValue(0),
  setStreakGoal: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: { uid: 'admin-1', getIdToken: vi.fn().mockResolvedValue('token') } },
}))

vi.mock('@/components/admin-exercise-assigner', () => ({
  AdminExerciseAssigner: () => <div data-testid="admin-exercise-assigner" />,
}))

const getPatientAssessmentFormsMock = vi.fn()
vi.mock('@/lib/assessment-forms', async () => {
  const actual = await vi.importActual<typeof import('@/lib/assessment-forms')>('@/lib/assessment-forms')
  return {
    ...actual,
    getPatientAssessmentForms: (...args: unknown[]) => getPatientAssessmentFormsMock(...args),
  }
})

const getAssignedExercisesMock = vi.fn()
const assignExerciseMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...args: unknown[]) => getAssignedExercisesMock(...args),
  assignExercise: (...args: unknown[]) => assignExerciseMock(...args),
}))

import { SummaryForm } from '@/components/summary-form'

const booking = {
  id: 'booking-1',
  patientId: 'patient-1',
  patientType: 'adult',
  patientName: 'Jane Doe',
  service: 'Physiotherapy',
  bookedBy: 'patient-1',
}

describe('SummaryForm suggested exercises', () => {
  beforeEach(() => {
    getPatientAssessmentFormsMock.mockReset().mockResolvedValue([])
    getAssignedExercisesMock.mockReset().mockResolvedValue([])
    assignExerciseMock.mockReset().mockResolvedValue(undefined)
  })

  it('shows a suggestions panel when session notes mention a matching exercise keyword', async () => {
    getAssignedExercisesMock.mockResolvedValue([])
    getPatientAssessmentFormsMock.mockResolvedValue([])

    const { container, getByPlaceholderText } = render(<SummaryForm booking={booking} />)

    fireEvent.click(container.querySelector('.summary-trigger') as Element)

    await waitFor(() => {
      expect(getAssignedExercisesMock).toHaveBeenCalled()
    })

    const workedOn = getByPlaceholderText(/Lower back mobility/i)
    fireEvent.change(workedOn, { target: { value: 'lower back mobility and hip flexor stretching' } })

    await waitFor(() => {
      expect(container.querySelector('.suggested-exercises')).toBeInTheDocument()
    })

    expect(container.querySelectorAll('.suggested-exercise-row').length).toBeGreaterThan(0)
  })
})
