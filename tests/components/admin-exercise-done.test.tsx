import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getAssigned, getLog, setByPhysio } = vi.hoisted(() => ({
  getAssigned: vi.fn(),
  getLog: vi.fn(),
  setByPhysio: vi.fn(),
}))
vi.mock('@/lib/recovery', async (orig) => ({
  ...(await orig<typeof import('@/lib/recovery')>()),
  getAssignedExercises: getAssigned,
  getExerciseLogForDate: getLog,
  setExerciseCompletionByPhysio: setByPhysio,
}))
vi.mock('@/components/toast-provider', () => ({ useToast: () => ({ show: vi.fn() }) }))

import { AdminExerciseDone } from '@/components/admin-exercise-done'
import { exercises, } from '@/lib/site-data'
import { todayKey } from '@/lib/recovery'

const [a, b] = exercises.filter((e) => !e.retired)

beforeEach(() => {
  getAssigned.mockResolvedValue([
    { exerciseId: a.id, assignedAt: new Date(), assignedBy: 'admin', active: true },
    { exerciseId: b.id, assignedAt: new Date(), assignedBy: 'admin', active: true },
  ])
  getLog.mockResolvedValue({ completions: { [b.id]: true }, physioMarked: {} })
  setByPhysio.mockResolvedValue(undefined)
})

describe('AdminExerciseDone', () => {
  it('shows the day, who ticked each one, and saves a physio tick for that day', async () => {
    render(<AdminExerciseDone patientUid="patientUid123" personId="patientUid123" />)
    await screen.findByText(a.title)
    expect(screen.getByText(/1/, { selector: 'strong' }).parentElement?.textContent).toContain('1 of 2 done')
    expect(screen.getByText('by patient')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: new RegExp(a.title) }))
    await waitFor(() =>
      expect(setByPhysio).toHaveBeenCalledWith('patientUid123', 'patientUid123', todayKey(), { [a.id]: true }),
    )
    expect(await screen.findByText('with physio')).toBeInTheDocument()
  })

  it('mark all done ticks every assigned exercise', async () => {
    render(<AdminExerciseDone patientUid="patientUid123" personId="patientUid123" />)
    await screen.findByText(a.title)
    await userEvent.click(screen.getByRole('button', { name: 'Mark all done' }))
    await waitFor(() =>
      expect(setByPhysio).toHaveBeenCalledWith('patientUid123', 'patientUid123', todayKey(), { [a.id]: true, [b.id]: true }),
    )
  })
})
