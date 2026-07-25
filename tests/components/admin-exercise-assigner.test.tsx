import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getAssignedExercisesMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...args: unknown[]) => getAssignedExercisesMock(...args),
  assignExercise: vi.fn(),
  removeExercise: vi.fn(),
}))

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
})
