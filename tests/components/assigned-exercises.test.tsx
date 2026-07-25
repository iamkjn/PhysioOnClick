import { render, waitFor, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getAssignedExercisesMock = vi.fn()
const getTodayExerciseLogMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...args: unknown[]) => getAssignedExercisesMock(...args),
  getTodayExerciseLog: (...args: unknown[]) => getTodayExerciseLogMock(...args),
  toggleExerciseCompletion: vi.fn(),
  todayKey: () => '2026-07-25',
}))

const getMotionSessionsMock = vi.fn()
vi.mock('@/lib/motion', () => ({
  // getMotionTarget is used by the embedded MotionCheckButton — null keeps it
  // from rendering (and away from camera APIs) in jsdom.
  getMotionTarget: vi.fn().mockResolvedValue(null),
  getMotionSessions: (...args: unknown[]) => getMotionSessionsMock(...args),
}))

import { AssignedExercises } from '@/components/assigned-exercises'
import { exercises } from '@/lib/site-data'

const EXERCISE = exercises[0]

function assignedExercise() {
  return { exerciseId: EXERCISE.id, assignedAt: new Date(), assignedBy: 'admin-1', active: true }
}

describe('AssignedExercises', () => {
  beforeEach(() => {
    getAssignedExercisesMock.mockReset()
    getTodayExerciseLogMock.mockReset()
    getMotionSessionsMock.mockReset()
    getMotionSessionsMock.mockResolvedValue([])
  })

  it('shows SkeletonRow while loading', async () => {
    getAssignedExercisesMock.mockResolvedValue([])
    getTodayExerciseLogMock.mockResolvedValue(null)

    const { container } = render(<AssignedExercises uid="u1" personId="p1" />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()
    await waitFor(() => {
      expect(container.querySelector('.skeleton-row-group')).not.toBeInTheDocument()
    })
  })

  it('renders an assigned exercise with a read-only demo link (no patient add-link)', async () => {
    getAssignedExercisesMock.mockResolvedValue([assignedExercise()])
    getTodayExerciseLogMock.mockResolvedValue(null)
    render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => expect(screen.getByText(EXERCISE.title)).toBeInTheDocument())
    // The patient can no longer add links.
    expect(screen.queryByText('+ Add video link')).not.toBeInTheDocument()
    // The physio's demo video is watchable (embed url converted to a watch url).
    const demo = screen.getByText('▶ Watch demo') as HTMLAnchorElement
    expect(demo.href).toBe(EXERCISE.videoUrl.replace('/embed/', '/watch?v='))
    expect(demo.target).toBe('_blank')
    expect(demo.rel).toContain('noopener')
  })

  it('shows the latest motion result when one exists', async () => {
    getAssignedExercisesMock.mockResolvedValue([assignedExercise()])
    getTodayExerciseLogMock.mockResolvedValue(null)
    getMotionSessionsMock.mockResolvedValue([
      { exerciseId: EXERCISE.id, bodyPart: EXERCISE.bodyPart, date: '2026-07-25', reps: 10, romMax: 165, avgQuality: 88 },
    ])
    render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => {
      expect(screen.getByText(/Last motion check: 165° range · 88% \(10 reps\)/)).toBeInTheDocument()
    })
  })

  it('keeps the completion toggle working', async () => {
    getAssignedExercisesMock.mockResolvedValue([assignedExercise()])
    getTodayExerciseLogMock.mockResolvedValue(null)
    render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => expect(screen.getByText(EXERCISE.title)).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText(`Mark ${EXERCISE.title} done`))
    await waitFor(() => {
      expect(screen.getByLabelText(`Mark ${EXERCISE.title} not done`)).toBeInTheDocument()
    })
  })
})
