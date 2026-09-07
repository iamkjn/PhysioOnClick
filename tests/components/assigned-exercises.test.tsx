import { render, waitFor, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoisted so the vi.mock factory below (which vitest lifts to the top of the
// file) can reference it without a temporal-dead-zone error.
const { FIXTURE_EX, FIXTURE_EX_NOIMG } = vi.hoisted(() => ({
  FIXTURE_EX: {
    id: 'ex-fix', title: 'Fixture Raise', bodyPart: 'Ankle', clinicalArea: 'lower_limb',
    tags: [] as string[], condition: '', stage: 'Strength phase',
    description: 'A fixture exercise.', videoUrl: 'https://www.youtube.com/embed/abc',
    setup: 'Stand tall.', steps: ['Rise onto your toes', 'Lower slowly'],
    cues: ['Keep knees soft'], mistakes: ['Do not rush'],
    defaultDosage: { sets: 3, reps: 12, perDay: 1 },
  },
  FIXTURE_EX_NOIMG: {
    id: 'ex-noimg', title: 'Unillustrated Move', bodyPart: 'Ankle', clinicalArea: 'lower_limb',
    tags: [] as string[], condition: '', stage: 'Strength phase',
    description: 'A fixture with no authored image prompt.',
    videoUrl: 'https://www.youtube.com/embed/def',
    setup: 'Sit tall.', steps: ['Press down'], cues: ['Breathe'], mistakes: ['Do not hold breath'],
    defaultDosage: { sets: 2, reps: 10, perDay: 1 },
  },
}))
vi.mock('@/lib/exercises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/exercises')>()
  return { ...actual, exercises: [FIXTURE_EX, FIXTURE_EX_NOIMG] }
})

// Keep the card's <ExerciseImage> off a real network fetch and give it a
// predictable src to assert on.
vi.mock('@/lib/exercise-images', () => ({
  exerciseImageUrl: (id: string) => '/exercise-images/' + id,
  EXERCISE_IMAGE_PLACEHOLDER_SVG: '<svg/>',
}))

// <ExerciseImage> only reaches for an <img> when a pose-specific illustration
// has been authored — mock the registry so exactly one fixture qualifies.
vi.mock('@/lib/exercise-image-prompts', () => ({
  hasImagePrompt: (id: string) => id === 'ex-fix',
}))

const getAssignedExercisesMock = vi.fn()
const getTodayExerciseLogMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...args: unknown[]) => getAssignedExercisesMock(...args),
  getTodayExerciseLog: (...args: unknown[]) => getTodayExerciseLogMock(...args),
  toggleExerciseCompletion: vi.fn(),
  setExercisesCompletion: vi.fn(),
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
import { exercises } from '@/lib/exercises'

const EXERCISE = exercises[0]

function assignedExercise() {
  return { exerciseId: FIXTURE_EX.id, assignedAt: new Date(), assignedBy: 'admin-1', active: true }
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
    expect(demo.href).toBe(EXERCISE.videoUrl!.replace('/embed/', '/watch?v='))
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
    fireEvent.click(screen.getByRole('button', { name: `${EXERCISE.title}: mark as done` }))
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: `${EXERCISE.title}: done today, tap to undo` }),
      ).toBeInTheDocument()
    })
  })

  it('renders the exercise description and a "mark all as done" shortcut', async () => {
    getAssignedExercisesMock.mockResolvedValue([assignedExercise()])
    getTodayExerciseLogMock.mockResolvedValue(null)
    render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => expect(screen.getByText(EXERCISE.title)).toBeInTheDocument())
    expect(screen.getByText(EXERCISE.description)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark all as done' })).toBeInTheDocument()
  })

  it('shows the effective dose line', async () => {
    getAssignedExercisesMock.mockResolvedValue([{ ...assignedExercise(), dosage: { reps: 15 } }])
    getTodayExerciseLogMock.mockResolvedValue(null)
    render(<AssignedExercises uid="u1" personId="p1" />)
    await waitFor(() => expect(screen.getByText('3 sets × 15 reps · once a day')).toBeInTheDocument())
  })

  it('renders the exercise illustration as an <img> pointing at the image route', async () => {
    getAssignedExercisesMock.mockResolvedValue([assignedExercise()])
    getTodayExerciseLogMock.mockResolvedValue(null)
    const { container } = render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => expect(screen.getByText(FIXTURE_EX.title)).toBeInTheDocument())
    const img = container.querySelector('.exercise-card-head img') as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toBe('/exercise-images/' + FIXTURE_EX.id)
  })

  it('falls back to the <ExerciseFigure> stick figure when no image prompt is authored', async () => {
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: FIXTURE_EX_NOIMG.id, assignedAt: new Date(), assignedBy: 'admin-1', active: true },
    ])
    getTodayExerciseLogMock.mockResolvedValue(null)
    const { container } = render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => expect(screen.getByText(FIXTURE_EX_NOIMG.title)).toBeInTheDocument())
    expect(container.querySelector('.exercise-card-head .exercise-figure-tile svg')).toBeInTheDocument()
    expect(container.querySelector('.exercise-card-head img')).not.toBeInTheDocument()
  })

  it('reveals setup / steps / cues / mistakes on "How to do it"', async () => {
    getAssignedExercisesMock.mockResolvedValue([assignedExercise()])
    getTodayExerciseLogMock.mockResolvedValue(null)
    render(<AssignedExercises uid="u1" personId="p1" />)
    await waitFor(() => expect(screen.getByText('Fixture Raise')).toBeInTheDocument())
    expect(screen.queryByText('Rise onto your toes')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /how to do it/i }))
    expect(screen.getByText('Stand tall.')).toBeInTheDocument()
    expect(screen.getByText('Rise onto your toes')).toBeInTheDocument()
    expect(screen.getByText('Keep knees soft')).toBeInTheDocument()
    expect(screen.getByText('Do not rush')).toBeInTheDocument()
  })
})
