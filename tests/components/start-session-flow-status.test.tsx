import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

const { getBooking, getPatientAssessmentForms, getOrCreateSessionRecord, updateSessionRecordStep } = vi.hoisted(() => ({
  getBooking: vi.fn(),
  getPatientAssessmentForms: vi.fn(),
  getOrCreateSessionRecord: vi.fn(),
  updateSessionRecordStep: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({ auth: { currentUser: { uid: 'admin-1' } } }))
vi.mock('@/lib/patient-bookings', () => ({
  getBooking,
  displayBookingStatus: (booking: { status: string }) => booking.status,
}))
vi.mock('@/lib/assessment-forms', () => ({
  getPatientAssessmentForms,
  recordRedFlagChange: vi.fn(),
  updateAssessmentRiskPlan: vi.fn(),
  levelOfConcern: vi.fn(() => 'none'),
  defaultRedFlags: {},
  CONDITIONAL_RED_FLAG_FIELDS: {},
  CONDITION_GROUP_LABELS: {},
  RED_FLAG_FIELD_LABELS: {},
}))
vi.mock('@/lib/red-flag-groups', () => ({ regionToConditionGroups: vi.fn(() => []) }))
vi.mock('@/lib/session-records', () => ({
  getOrCreateSessionRecord,
  updateSessionRecordStep,
}))
vi.mock('@/lib/self-tests', () => ({ selfTests: [] }))
vi.mock('@/components/exercise-library/self-test-steps', () => ({ SelfTestSteps: () => null }))
vi.mock('@/lib/differential-diagnosis', () => ({ deriveDifferentialDiagnosis: vi.fn(() => []) }))
vi.mock('@/lib/exercise-suggestions', () => ({ suggestExercises: vi.fn(() => []) }))
vi.mock('@/lib/recovery', () => ({ getAssignedExercises: vi.fn(() => Promise.resolve([])) }))
vi.mock('@/lib/goals', () => ({
  getStreakGoal: vi.fn(() => Promise.resolve(0)),
  setStreakGoal: vi.fn(),
}))
vi.mock('@/app/admin/actions', () => ({ publishSummary: vi.fn() }))
vi.mock('@/components/toast-provider', () => ({ useToast: () => ({ show: vi.fn() }) }))
vi.mock('@/components/admin-exercise-assigner', () => ({ AdminExerciseAssigner: () => null }))
vi.mock('@/components/admin-self-test-selector', () => ({ AdminSelfTestSelector: () => null }))

import { StartSessionFlow } from '@/components/start-session-flow'

describe('StartSessionFlow booking status', () => {
  it('blocks a cancelled booking before creating a session record', async () => {
    getBooking.mockResolvedValue({
      id: 'booking-cancelled',
      patientName: 'Cancelled Patient',
      service: 'Initial assessment',
      sessionDate: new Date('2099-01-01T09:00:00Z'),
      status: 'cancelled',
      paid: true,
      assessmentCompletedAt: null,
      bookedBy: 'patient-1',
      patientId: 'patient-1',
    })

    render(<StartSessionFlow bookingId="booking-cancelled" />)

    expect(await screen.findByRole('heading', { name: 'This session cannot be started' })).toBeInTheDocument()
    expect(screen.getByText(/booking was cancelled/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View booking' })).toHaveAttribute(
      'href',
      '/admin/session/booking-cancelled',
    )
    await waitFor(() => expect(getOrCreateSessionRecord).not.toHaveBeenCalled())
  })

  it('opens with the self-assessment and allows direct access to every session section', async () => {
    getBooking.mockResolvedValue({
      id: 'booking-active',
      patientName: 'Active Patient',
      service: 'Initial assessment',
      sessionDate: new Date('2099-01-01T09:00:00Z'),
      status: 'upcoming',
      paid: true,
      assessmentCompletedAt: null,
      bookedBy: 'patient-1',
      patientId: 'patient-1',
    })
    getPatientAssessmentForms.mockResolvedValue([])
    getOrCreateSessionRecord.mockResolvedValue({
      bookingId: 'booking-active',
      workflowVersion: 2,
      redFlagsSnapshot: { flags: {}, conditionalFlags: {} },
      selectedSelfTestSlugs: [],
      selfTestSelectionSaved: true,
      selfTestResults: [],
      diagnosis: [],
      exercisesAssignedAtSession: [],
      currentStep: 1,
      createdAt: null,
      updatedAt: null,
    })

    render(<StartSessionFlow bookingId="booking-active" />)

    expect(await screen.findByRole('heading', { name: 'Self-assessment' })).toBeInTheDocument()
    expect(screen.getByText('No self-assessment submitted')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Open / })).toHaveLength(6)

    await userEvent.click(screen.getByRole('button', { name: /Open Session summary/i }))
    expect(screen.getByRole('heading', { name: 'Session summary' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Open Screening/i }))
    expect(screen.getByRole('heading', { name: 'Screening' })).toBeInTheDocument()
    expect(updateSessionRecordStep).toHaveBeenCalled()
  })
})
