import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getTodayPainLogMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getTodayPainLog: (...args: unknown[]) => getTodayPainLogMock(...args),
  logPainScore: vi.fn(),
}))

import { PainCheckIn } from '@/components/pain-check-in'

describe('PainCheckIn', () => {
  it('shows a SkeletonStatGrid while loading, then the form once resolved', async () => {
    getTodayPainLogMock.mockResolvedValue(null)

    const { container } = render(<PainCheckIn uid="u1" personId="p1" />)
    expect(container.querySelector('.skeleton-stat-grid')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/how is your pain right now/i)).toBeInTheDocument()
    })
    expect(container.querySelector('.skeleton-stat-grid')).not.toBeInTheDocument()
  })
})
