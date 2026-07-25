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

const getExerciseVideosMock = vi.fn()
const setExerciseVideoMock = vi.fn()
const removeExerciseVideoMock = vi.fn()
vi.mock('@/lib/exercise-videos', () => ({
  getExerciseVideos: (...args: unknown[]) => getExerciseVideosMock(...args),
  setExerciseVideo: (...args: unknown[]) => setExerciseVideoMock(...args),
  removeExerciseVideo: (...args: unknown[]) => removeExerciseVideoMock(...args),
}))

import { AssignedExercises } from '@/components/assigned-exercises'
import { exercises } from '@/lib/site-data'

const EXERCISE = exercises[0]

function assignedExercise() {
  return { exerciseId: EXERCISE.id, assignedAt: new Date(), assignedBy: 'admin-1', active: true }
}

describe('AssignedExercises', () => {
  it('shows SkeletonRow while loading', async () => {
    getAssignedExercisesMock.mockResolvedValue([])
    getTodayExerciseLogMock.mockResolvedValue(null)
    getExerciseVideosMock.mockResolvedValue({})

    const { container } = render(<AssignedExercises uid="u1" personId="p1" />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(container.querySelector('.skeleton-row-group')).not.toBeInTheDocument()
    })
  })
})

describe('AssignedExercises — patient video link', () => {
  beforeEach(() => {
    getAssignedExercisesMock.mockReset()
    getTodayExerciseLogMock.mockReset()
    getExerciseVideosMock.mockReset()
    setExerciseVideoMock.mockReset()
    removeExerciseVideoMock.mockReset()

    getAssignedExercisesMock.mockResolvedValue([assignedExercise()])
    getTodayExerciseLogMock.mockResolvedValue(null)
  })

  it('shows "+ Add video link" when no link is saved', async () => {
    getExerciseVideosMock.mockResolvedValue({})
    render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => {
      expect(screen.getByText('+ Add video link')).toBeInTheDocument()
    })
    expect(screen.queryByText('▶ Watch my video')).not.toBeInTheDocument()
  })

  it('shows the watch link when a link is already saved', async () => {
    getExerciseVideosMock.mockResolvedValue({ [EXERCISE.id]: 'https://youtu.be/abc123' })
    render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => {
      expect(screen.getByText('▶ Watch my video')).toBeInTheDocument()
    })
    const link = screen.getByText('▶ Watch my video') as HTMLAnchorElement
    expect(link.href).toBe('https://youtu.be/abc123')
    expect(link.target).toBe('_blank')
    expect(link.rel).toContain('noopener')
    expect(link.rel).toContain('noreferrer')
  })

  it('reveals an inline input and saves a valid link', async () => {
    getExerciseVideosMock.mockResolvedValue({})
    setExerciseVideoMock.mockResolvedValue(undefined)
    render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => expect(screen.getByText('+ Add video link')).toBeInTheDocument())
    fireEvent.click(screen.getByText('+ Add video link'))

    const input = screen.getByLabelText(`YouTube link for ${EXERCISE.title}`)
    fireEvent.change(input, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(setExerciseVideoMock).toHaveBeenCalledWith('u1', 'p1', EXERCISE.id, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    })
    await waitFor(() => {
      expect(screen.getByText('▶ Watch my video')).toBeInTheDocument()
    })
  })

  it('shows an inline error and does not crash on an invalid url', async () => {
    getExerciseVideosMock.mockResolvedValue({})
    setExerciseVideoMock.mockRejectedValue(new Error('Please enter a valid YouTube link.'))
    render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => expect(screen.getByText('+ Add video link')).toBeInTheDocument())
    fireEvent.click(screen.getByText('+ Add video link'))

    const input = screen.getByLabelText(`YouTube link for ${EXERCISE.title}`)
    fireEvent.change(input, { target: { value: 'https://vimeo.com/12345' } })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid YouTube link.')).toBeInTheDocument()
    })
    // Still editable, no crash — the add flow is still on screen.
    expect(screen.getByLabelText(`YouTube link for ${EXERCISE.title}`)).toBeInTheDocument()
  })

  it('cancels the inline editor without saving', async () => {
    getExerciseVideosMock.mockResolvedValue({})
    render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => expect(screen.getByText('+ Add video link')).toBeInTheDocument())
    fireEvent.click(screen.getByText('+ Add video link'))
    expect(screen.getByLabelText(`YouTube link for ${EXERCISE.title}`)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByLabelText(`YouTube link for ${EXERCISE.title}`)).not.toBeInTheDocument()
    expect(screen.getByText('+ Add video link')).toBeInTheDocument()
    expect(setExerciseVideoMock).not.toHaveBeenCalled()
  })

  it('removes an existing link', async () => {
    getExerciseVideosMock.mockResolvedValue({ [EXERCISE.id]: 'https://youtu.be/abc123' })
    removeExerciseVideoMock.mockResolvedValue(undefined)
    render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => expect(screen.getByText('▶ Watch my video')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText(`Remove video link for ${EXERCISE.title}`))

    await waitFor(() => {
      expect(removeExerciseVideoMock).toHaveBeenCalledWith('u1', 'p1', EXERCISE.id)
    })
    await waitFor(() => {
      expect(screen.queryByText('▶ Watch my video')).not.toBeInTheDocument()
      expect(screen.getByText('+ Add video link')).toBeInTheDocument()
    })
  })

  it('keeps the completion toggle working alongside the video affordance', async () => {
    getExerciseVideosMock.mockResolvedValue({})
    render(<AssignedExercises uid="u1" personId="p1" />)

    await waitFor(() => expect(screen.getByText('+ Add video link')).toBeInTheDocument())
    const toggle = screen.getByLabelText(`Mark ${EXERCISE.title} done`)
    expect(toggle).toBeInTheDocument()
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(screen.getByLabelText(`Mark ${EXERCISE.title} not done`)).toBeInTheDocument()
    })
  })
})
