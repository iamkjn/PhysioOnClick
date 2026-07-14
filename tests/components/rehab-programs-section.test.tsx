import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: null }))

import { RehabProgramsSection } from '@/components/rehab-programs-section'

describe('RehabProgramsSection', () => {
  it('shows SkeletonRow while loading, then the empty-state copy once resolved', async () => {
    const { container } = render(<RehabProgramsSection email="" />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/no rehab programme assigned yet/i)).toBeInTheDocument()
    })
  })
})
