import { render, waitFor, fireEvent, within } from '@testing-library/react'
import { beforeEach, describe, it, expect, vi } from 'vitest'

const getAssignedExercisesMock = vi.fn()
const assignExerciseMock = vi.fn().mockResolvedValue(undefined)
const removeExerciseMock = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...args: unknown[]) => getAssignedExercisesMock(...args),
  assignExercise: (...args: unknown[]) => assignExerciseMock(...args),
  removeExercise: (...args: unknown[]) => removeExerciseMock(...args),
  setAssignedDosage: (...args: unknown[]) => setAssignedDosageMock(...args),
}))
const setAssignedDosageMock = vi.fn().mockResolvedValue(undefined)

import { AdminExerciseAssigner } from '@/components/admin-exercise-assigner'
import { exercises } from '@/lib/site-data'

describe('AdminExerciseAssigner', () => {
  beforeEach(() => {
    getAssignedExercisesMock.mockReset()
    assignExerciseMock.mockClear()
    removeExerciseMock.mockClear()
    setAssignedDosageMock.mockClear()
  })

  it('shows SkeletonRow while the assigned list loads', async () => {
    let resolveAssigned: (v: unknown[]) => void = () => {}
    getAssignedExercisesMock.mockReturnValue(new Promise((resolve) => { resolveAssigned = resolve }))

    const { container } = render(
      <AdminExerciseAssigner adminUid="a1" patientUid="p1" personId="p1" />
    )
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()

    resolveAssigned([])
    await waitFor(() => {
      expect(container.querySelector('.skeleton-row-group')).not.toBeInTheDocument()
    })
  })

  it('shows selected exercises and the complete assignable gallery together', async () => {
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: 'ex-1', assignedAt: new Date(), assignedBy: 'admin-1', active: true },
    ])

    const { container, getByText, getByRole } = render(
      <AdminExerciseAssigner adminUid="a1" patientUid="p1" personId="p1" />
    )
    await waitFor(() => {
      expect(container.querySelector('.skeleton-row-group')).not.toBeInTheDocument()
    })

    expect(getByText('Exercise plan')).toBeInTheDocument()
    expect(getByText('All assignable exercises')).toBeInTheDocument()
    expect(getByRole('button', { name: /remove sit to stand control/i })).toBeInTheDocument()
    expect(getByRole('button', { name: /assign scapular setting/i })).toBeInTheDocument()
  })

  it('can cancel a suggestion while keeping it available in the full gallery', async () => {
    getAssignedExercisesMock.mockResolvedValue([])
    const suggestion = { exercise: exercises[0], reason: 'Suggested: matches lower limb', score: 3 }
    const { getByRole, getByText, queryByText } = render(
      <AdminExerciseAssigner
        adminUid="a1"
        patientUid="p1"
        personId="p1"
        suggestions={[suggestion]}
      />
    )

    await waitFor(() => expect(getByText('Suggested exercises')).toBeInTheDocument())
    fireEvent.click(getByRole('button', { name: /cancel sit to stand control suggestion/i }))

    await waitFor(() => expect(queryByText('Suggested exercises')).not.toBeInTheDocument())
    const card = getByText('Sit to Stand Control').closest('article')
    expect(card).not.toBeNull()
    expect(within(card as HTMLElement).getByRole('button', { name: /assign sit to stand control/i })).toBeInTheDocument()
  })

  it('assigns an exercise from the unified gallery', async () => {
    getAssignedExercisesMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { exerciseId: 'ex-1', assignedAt: new Date(), assignedBy: 'a1', active: true },
      ])
    const onAssignmentChange = vi.fn()
    const { getByRole } = render(
      <AdminExerciseAssigner
        adminUid="a1"
        patientUid="p1"
        personId="p1"
        onAssignmentChange={onAssignmentChange}
      />
    )

    await waitFor(() => expect(getByRole('button', { name: /assign sit to stand control/i })).toBeInTheDocument())
    fireEvent.click(getByRole('button', { name: /assign sit to stand control/i }))

    await waitFor(() => expect(assignExerciseMock).toHaveBeenCalledWith('p1', 'p1', 'ex-1', 'a1'))
    expect(onAssignmentChange).toHaveBeenCalledWith('ex-1', 'assigned')
  })

  it('shows the effective dose on an assigned row and opens an edit form', async () => {
    // pick a catalogue exercise and give it a default in a spy, or use one that will get a default in Plan 2.
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: 'ex-1', assignedAt: new Date(), assignedBy: 'a1', active: true, dosage: { sets: 3, reps: 10 } },
    ])
    const { getByText, getByRole, findByLabelText } = render(
      <AdminExerciseAssigner adminUid="a1" patientUid="p1" personId="p1" />
    )
    await waitFor(() => expect(getByText(/3 sets × 10 reps/)).toBeInTheDocument())
    fireEvent.click(getByRole('button', { name: /edit dose/i }))
    const reps = await findByLabelText(/reps/i)
    fireEvent.change(reps, { target: { value: '12' } })
    fireEvent.click(getByRole('button', { name: /save dose/i }))
    await waitFor(() =>
      expect(setAssignedDosageMock).toHaveBeenCalledWith('p1', 'p1', 'ex-1', expect.objectContaining({ reps: 12 })),
    )
  })

  it('persists only the fields that differ from the catalogue default', async () => {
    // Only @/lib/recovery is mocked — resolveDosage / formatDosage run for real.
    // ex-1 has no catalogue defaultDosage, so a { reps: 15 } dose left unchanged
    // must be saved verbatim, not as the full effective object.
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: 'ex-1', assignedAt: new Date(), assignedBy: 'a1', active: true, dosage: { reps: 15 } },
    ])
    const { getByRole, findByLabelText } = render(
      <AdminExerciseAssigner adminUid="a1" patientUid="p1" personId="p1" />
    )
    await waitFor(() => expect(getByRole('button', { name: /edit dose/i })).toBeInTheDocument())
    fireEvent.click(getByRole('button', { name: /edit dose/i }))
    await findByLabelText(/reps/i)
    fireEvent.click(getByRole('button', { name: /save dose/i }))
    await waitFor(() =>
      expect(setAssignedDosageMock).toHaveBeenCalledWith('p1', 'p1', 'ex-1', { reps: 15 }),
    )
  })

  it('readOnly mode lists assigned exercises with no add / remove / edit controls', async () => {
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: 'ex-1', assignedAt: new Date(), assignedBy: 'a1', active: true },
    ])
    const { container, queryByRole, queryByText, findByText } = render(
      <AdminExerciseAssigner
        adminUid="a1"
        patientUid="p1"
        personId="p1"
        readOnly
        readOnlyReason="Read-only — no online assessment has been submitted yet."
      />
    )
    await waitFor(() => expect(container.querySelector('.skeleton-row-group')).not.toBeInTheDocument())
    await findByText(/Read-only — no online assessment/i)
    expect(queryByRole('button', { name: /assign/i })).not.toBeInTheDocument()
    expect(queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
    expect(queryByRole('button', { name: /edit dose/i })).not.toBeInTheDocument()
    expect(queryByText(/Add exercise from library/i)).not.toBeInTheDocument()
  })

  it('blocks a save that fails validation', async () => {
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: 'ex-1', assignedAt: new Date(), assignedBy: 'a1', active: true },
    ])
    const { getByRole, findByLabelText, getByText } = render(
      <AdminExerciseAssigner adminUid="a1" patientUid="p1" personId="p1" />
    )
    await waitFor(() => expect(getByRole('button', { name: /edit dose/i })).toBeInTheDocument())
    fireEvent.click(getByRole('button', { name: /edit dose/i }))
    fireEvent.change(await findByLabelText(/^sets/i), { target: { value: '11' } })
    fireEvent.click(getByRole('button', { name: /save dose/i }))
    expect(getByText(/Sets cannot be more than 10/i)).toBeInTheDocument()
    expect(setAssignedDosageMock).not.toHaveBeenCalled()
  })
})
