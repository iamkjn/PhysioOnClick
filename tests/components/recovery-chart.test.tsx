import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getPainLogsMock = vi.fn()
const getClinicalAssessmentsMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getPainLogs: (...args: unknown[]) => getPainLogsMock(...args),
  getClinicalAssessments: (...args: unknown[]) => getClinicalAssessmentsMock(...args),
}))

import { RecoveryChart } from '@/components/recovery-chart'

describe('RecoveryChart', () => {
  it('shows a SkeletonChart while loading, then removes it once resolved', async () => {
    getPainLogsMock.mockResolvedValue([])
    getClinicalAssessmentsMock.mockResolvedValue([])

    render(<RecoveryChart uid="u1" personId="p1" />)
    expect(document.querySelector('.skeleton-chart')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/log your first pain check-in/i)).toBeInTheDocument()
    })
    expect(document.querySelector('.skeleton-chart')).not.toBeInTheDocument()
  })
})
