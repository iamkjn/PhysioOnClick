import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getExerciseLogsMock = vi.fn()
const getAssignedExercisesMock = vi.fn()
const getPainLogsMock = vi.fn()
const getStreakGoalMock = vi.fn()

vi.mock('@/lib/recovery', async () => {
  const actual = await vi.importActual<typeof import('@/lib/recovery')>('@/lib/recovery')
  return {
    ...actual,
    getExerciseLogs: (...a: unknown[]) => getExerciseLogsMock(...a),
    getAssignedExercises: (...a: unknown[]) => getAssignedExercisesMock(...a),
    getPainLogs: (...a: unknown[]) => getPainLogsMock(...a),
  }
})
vi.mock('@/lib/goals', () => ({
  getStreakGoal: (...a: unknown[]) => getStreakGoalMock(...a),
}))
vi.mock('@/components/recovery-percent-card', () => ({
  RecoveryPercentCard: () => <div data-testid="ring" />,
}))

import { AdminRecoverySummary } from '@/components/admin-recovery-summary'
import { dateKeyDaysAgo } from '@/lib/recovery'

describe('AdminRecoverySummary', () => {
  it('prompts to assign exercises when none are assigned', async () => {
    getExerciseLogsMock.mockResolvedValue([])
    getAssignedExercisesMock.mockResolvedValue([])
    getPainLogsMock.mockResolvedValue([])
    getStreakGoalMock.mockResolvedValue(null)

    render(<AdminRecoverySummary patientUid="u1" personId="p1" />)

    await waitFor(() => {
      expect(screen.getByText(/no exercises assigned yet/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/no pain check-ins logged yet/i)).toBeInTheDocument()
  })

  it('counts adherence days and shows the latest self-reported pain', async () => {
    getExerciseLogsMock.mockResolvedValue([
      { date: dateKeyDaysAgo(0), completions: { e1: true }, loggedAt: new Date() },
      { date: dateKeyDaysAgo(1), completions: { e1: false }, loggedAt: new Date() },
      { date: dateKeyDaysAgo(2), completions: { e1: true }, loggedAt: new Date() },
    ])
    getAssignedExercisesMock.mockResolvedValue([{ exerciseId: 'e1', active: true }])
    getPainLogsMock.mockResolvedValue([{ date: '2026-09-08', score: 4, note: 'sore', loggedAt: new Date() }])
    getStreakGoalMock.mockResolvedValue(14)

    render(<AdminRecoverySummary patientUid="u1" personId="p1" />)

    await waitFor(() => {
      expect(screen.getByText(/2 of 7 days/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Last 4 weeks — 2 of 28 days/i)).toBeInTheDocument()
    expect(screen.getByText(/14-day goal/)).toBeInTheDocument()
    expect(screen.getByText(/4\/10/)).toBeInTheDocument()
  })
})
