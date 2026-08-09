import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getPainCheckinIntervalMock = vi.fn()
const getCurrentRunMock = vi.fn()
vi.mock('@/lib/goals', () => ({
  getPainCheckinInterval: (...args: unknown[]) => getPainCheckinIntervalMock(...args),
  getCurrentRun: (...args: unknown[]) => getCurrentRunMock(...args),
}))

const getPainCheckinsMock = vi.fn()
const logPainCheckinScoreMock = vi.fn()
vi.mock('@/lib/pain-checkins', async () => {
  const actual = await vi.importActual<typeof import('@/lib/pain-checkins')>('@/lib/pain-checkins')
  return {
    ...actual,
    getPainCheckins: (...args: unknown[]) => getPainCheckinsMock(...args),
    logPainCheckinScore: (...args: unknown[]) => logPainCheckinScoreMock(...args),
  }
})

import { PainCheckinCard } from '@/components/pain-checkin-card'

describe('PainCheckinCard', () => {
  it('renders nothing when the doctor has not enabled pain check-ins', async () => {
    getPainCheckinIntervalMock.mockResolvedValue(null)

    const { container } = render(<PainCheckinCard uid="u1" personId="p1" />)

    await waitFor(() => {
      expect(getPainCheckinIntervalMock).toHaveBeenCalledWith('u1', 'p1')
    })
    expect(container).toBeEmptyDOMElement()
    expect(getCurrentRunMock).not.toHaveBeenCalled()
    expect(getPainCheckinsMock).not.toHaveBeenCalled()
  })

  it('renders nothing when enabled but no check-in is currently due', async () => {
    getPainCheckinIntervalMock.mockResolvedValue(3)
    getCurrentRunMock.mockResolvedValue(0)
    getPainCheckinsMock.mockResolvedValue([])

    const { container } = render(<PainCheckinCard uid="u1" personId="p1" />)

    await waitFor(() => {
      expect(getPainCheckinsMock).toHaveBeenCalled()
    })
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the check-in form when a checkpoint is due', async () => {
    getPainCheckinIntervalMock.mockResolvedValue(3)
    getCurrentRunMock.mockResolvedValue(0)
    getPainCheckinsMock.mockResolvedValue([
      { id: 'c1', runNumber: 0, streakDay: 3, status: 'pending', score: null, note: '', loggedAt: null },
    ])

    render(<PainCheckinCard uid="u1" personId="p1" />)

    await waitFor(() => {
      expect(screen.getByText('Day 3 check-in')).toBeInTheDocument()
    })
    expect(screen.getByText(/optional/i)).toBeInTheDocument()
  })
})
