import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { PatientAssessmentFormRecord } from '@/lib/assessment-forms'

const getPatientAssessmentFormsMock = vi.fn()
vi.mock('@/lib/assessment-forms', async () => {
  const actual = await vi.importActual<typeof import('@/lib/assessment-forms')>('@/lib/assessment-forms')
  return {
    ...actual,
    getPatientAssessmentForms: (...args: unknown[]) => getPatientAssessmentFormsMock(...args),
    updateAssessmentReview: vi.fn(),
  }
})

const getAssignedExercisesMock = vi.fn()
const assignExerciseMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...args: unknown[]) => getAssignedExercisesMock(...args),
  assignExercise: (...args: unknown[]) => assignExerciseMock(...args),
}))

import { AdminAssessmentReview } from '@/components/admin-assessment-review'

function makeForm(overrides: Partial<PatientAssessmentFormRecord> = {}): PatientAssessmentFormRecord {
  return {
    id: 'form-1',
    formType: 'initial',
    consultationMode: 'online',
    completedVia: 'online_form',
    patientName: 'Jane Doe',
    completedBy: 'Jane Doe',
    relationshipToPatient: '',
    presentingComplaint: 'Persistent lower back pain after lifting',
    bodyArea: 'Lower back',
    symptomStartDate: '2026-07-01',
    onsetPattern: 'sudden',
    painScore: 6,
    subjective: {
      clinicalArea: 'spine',
      symptomBehaviour: '',
      irritability: 5,
      severity: 6,
      yellowFlags: '',
    },
    outcomes: {
      psfsActivity1: '',
      psfsScore1: 5,
      psfsActivity2: '',
      psfsScore2: 5,
      psfsActivity3: '',
      psfsScore3: 5,
      painBest: 3,
      painWorst: 8,
      confidenceScore: 5,
      conditionMeasureName: '',
      conditionMeasureScore: 0,
      conditionMeasureMax: 0,
    },
    objectiveVideo: {
      consent: false,
      taskId: '',
      taskLabel: '',
      metricName: '',
      metricValue: 0,
      metricUnit: '',
      reps: 0,
      durationSeconds: 0,
      qualityNotes: '',
      videoUrl: '',
      storagePath: '',
      recordedAt: '',
    },
    goalsPlan: {
      meaningfulGoal: '',
      baseline: '',
      target: '',
      timeframeWeeks: 4,
      confidenceScore: 5,
      barriers: '',
      supportPlan: '',
      reviewDate: '',
    },
    symptoms: 'Sharp pain when bending forward',
    aggravatingFactors: '',
    easingFactors: '',
    functionalImpact: 'Struggling to bend and lift',
    goals: 'Return to gardening',
    medicalHistory: '',
    medications: '',
    allergies: '',
    previousTreatment: '',
    communicationNeeds: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    redFlags: {
      majorTrauma: false,
      chestPainBreathlessness: false,
      bladderBowelSaddle: false,
      progressiveWeakness: false,
      unexplainedFeverWeightLoss: false,
      nightPain: false,
      none: true,
    },
    onlineReadiness: {
      privateSpace: true,
      safeSpace: true,
      cameraAvailable: true,
      emergencyContactAvailable: true,
    },
    consent: {
      careConsent: true,
      dataConsent: true,
      privacyConsent: true,
      safetySharing: true,
      videoConsent: true,
    },
    signature: 'Jane Doe',
    completedAt: '2026-07-02T10:00:00.000Z',
    submittedByUid: 'patient-1',
    version: '2026-07-csp-hcpc-v2',
    reviewStatus: 'awaiting_review',
    reviewedBy: '',
    reviewedAt: '',
    clinicianNotes: '',
    riskPlan: '',
    nextCheckupDate: '',
    createdAt: new Date('2026-07-02T10:00:00.000Z'),
    updatedAt: null,
    ...overrides,
  }
}

describe('AdminAssessmentReview suggested exercises', () => {
  it('shows a suggestions panel reflecting the record clinical area', async () => {
    getPatientAssessmentFormsMock.mockResolvedValue([makeForm()])
    getAssignedExercisesMock.mockResolvedValue([])

    const { container } = render(
      <AdminAssessmentReview patientUid="patient-1" personId="patient-1" />
    )

    await waitFor(() => {
      expect(container.querySelector('.suggested-exercises')).toBeInTheDocument()
    })

    expect(container.querySelectorAll('.suggested-exercise-row').length).toBeGreaterThan(0)
    expect(container.querySelector('.suggested-exercise-badge')?.textContent).toBe('spine')
  })
})
