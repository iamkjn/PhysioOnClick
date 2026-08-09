import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getPainCheckinIntervalMock = vi.fn()
const getCurrentRunMock = vi.fn()
vi.mock('@/lib/goals', () => ({
  getPainCheckinInterval: (...args: unknown[]) => getPainCheckinIntervalMock(...args),
  getCurrentRun: (...args: unknown[]) => getCurrentRunMock(...args),
}))

const getPainCheckinsMock = vi.fn()
vi.mock('@/lib/pain-checkins', async () => {
  const actual = await vi.importActual<typeof import('@/lib/pain-checkins')>('@/lib/pain-checkins')
  return {
    ...actual,
    getPainCheckins: (...args: unknown[]) => getPainCheckinsMock(...args),
  }
})

import { PainCheckinTimeline } from '@/components/pain-checkin-timeline'

describe('PainCheckinTimeline', () => {
  it('renders nothing when the doctor has not enabled pain check-ins', async () => {
    getPainCheckinIntervalMock.mockResolvedValue(null)

    const { container } = render(<PainCheckinTimeline uid="u1" personId="p1" />)

    await waitFor(() => {
      expect(getPainCheckinIntervalMock).toHaveBeenCalledWith('u1', 'p1')
    })
    expect(container).toBeEmptyDOMElement()
    expect(getPainCheckinsMock).not.toHaveBeenCalled()
  })

  it('shows an empty-state message when enabled but no checkpoints exist yet', async () => {
    getPainCheckinIntervalMock.mockResolvedValue(3)
    getCurrentRunMock.mockResolvedValue(0)
    getPainCheckinsMock.mockResolvedValue([])

    render(<PainCheckinTimeline uid="u1" personId="p1" />)

    await waitFor(() => {
      expect(screen.getByText('Pain check-ins')).toBeInTheDocument()
    })
    expect(screen.getByText(/first check-in will appear/i)).toBeInTheDocument()
  })

  it('renders check-in markers for the current run', async () => {
    getPainCheckinIntervalMock.mockResolvedValue(3)
    getCurrentRunMock.mockResolvedValue(0)
    getPainCheckinsMock.mockResolvedValue([
      { id: 'c1', runNumber: 0, streakDay: 3, status: 'logged', score: 4, note: '', loggedAt: new Date() },
    ])

    render(<PainCheckinTimeline uid="u1" personId="p1" />)

    await waitFor(() => {
      expect(screen.getByText('Day 3')).toBeInTheDocument()
    })
    expect(screen.getByText('4/10')).toBeInTheDocument()
  })
})
