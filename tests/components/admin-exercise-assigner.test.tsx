import { render, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getAssignedExercisesMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...args: unknown[]) => getAssignedExercisesMock(...args),
  assignExercise: vi.fn(),
  removeExercise: vi.fn(),
  setAssignedDosage: (...args: unknown[]) => setAssignedDosageMock(...args),
}))
const setAssignedDosageMock = vi.fn().mockResolvedValue(undefined)

import { AdminExerciseAssigner } from '@/components/admin-exercise-assigner'

describe('AdminExerciseAssigner', () => {
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

  it('groups the unassigned "Add exercise" list into category subheadings', async () => {
    // ex-1 is the catalogue's only "Lower limb" exercise (lib/site-data.ts) — assigning
    // it leaves every other bodyPart (Shoulder, Lumbar spine, Balance, Knee, Hip, Ankle,
    // Neck, Core, ...) unassigned, so the grouping spans multiple real categories.
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: 'ex-1', assignedAt: new Date(), assignedBy: 'admin-1', active: true },
    ])

    const { container } = render(
      <AdminExerciseAssigner adminUid="a1" patientUid="p1" personId="p1" />
    )
    await waitFor(() => {
      expect(container.querySelector('.skeleton-row-group')).not.toBeInTheDocument()
    })

    const groupLabels = Array.from(container.querySelectorAll('.assign-group-label')).map(
      (el) => el.textContent
    )
    expect(groupLabels).toEqual(expect.arrayContaining(['Shoulder', 'Knee', 'Balance']))
    // "Lower limb" has no unassigned exercises left (ex-1 is assigned), so it must
    // not get an empty subheading.
    expect(groupLabels).not.toContain('Lower limb')
    // Categories are sorted alphabetically (component contract).
    expect(groupLabels).toEqual([...groupLabels].sort((a, b) => (a as string).localeCompare(b as string)))
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
