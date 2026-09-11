import { render, waitFor, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const { FIXTURE_EX } = vi.hoisted(() => ({
  FIXTURE_EX: {
    id: 'ex-fix', slug: 'shoulder-external-rotation-band', title: 'Fixture Rotation',
    bodyPart: 'Shoulder', clinicalArea: 'upper_limb', tags: [] as string[],
    condition: '', stage: 'Build strength', description: 'A fixture exercise.',
  },
}))
vi.mock('@/lib/exercises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/exercises')>()
  return { ...actual, exercises: [FIXTURE_EX] }
})

const getAssignedExercisesMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...args: unknown[]) => getAssignedExercisesMock(...args),
}))

import { PatientSelfTests } from '@/components/patient-self-tests'

describe('PatientSelfTests', () => {
  it('renders nothing while there is no match', async () => {
    getAssignedExercisesMock.mockResolvedValue([])
    const { container } = render(<PatientSelfTests uid="u1" personId="p1" />)
    await waitFor(() => expect(getAssignedExercisesMock).toHaveBeenCalledWith('u1', 'p1'))
    await waitFor(() => expect(container.querySelector('.exercise-card-list')).toBeNull())
  })

  it('shows a matching self-test with its assesses line', async () => {
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: 'ex-fix', assignedAt: new Date(), assignedBy: 'physio', active: true },
    ])
    render(<PatientSelfTests uid="u1" personId="p1" />)
    await waitFor(() => expect(screen.getByText('Full Can Test')).toBeTruthy())
    expect(screen.getByText(/supraspinatus/i)).toBeTruthy()
  })

  it('expands to show steps and results on "How to check"', async () => {
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: 'ex-fix', assignedAt: new Date(), assignedBy: 'physio', active: true },
    ])
    render(<PatientSelfTests uid="u1" personId="p1" />)
    const heading = await screen.findByText('Full Can Test')
    const card = heading.closest('.exercise-card') as HTMLElement
    const toggle = within(card).getByRole('button', { name: /how to check/i })
    expect(screen.queryByText('Likely normal')).toBeNull()
    fireEvent.click(toggle)
    expect(within(card).getByText('Likely normal')).toBeTruthy()
  })

  it('links to the public self-test page', async () => {
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: 'ex-fix', assignedAt: new Date(), assignedBy: 'physio', active: true },
    ])
    render(<PatientSelfTests uid="u1" personId="p1" />)
    const heading = await screen.findByText('Full Can Test')
    const card = heading.closest('.exercise-card') as HTMLElement
    const link = within(card).getByRole('link', { name: /full guide/i })
    expect(link.getAttribute('href')).toBe('/exercises/tests/full-can-test')
  })
})
