import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: null }))

import { SavedBlogsSection } from '@/components/saved-blogs-section'

describe('SavedBlogsSection', () => {
  it('shows SkeletonRow while loading, then the empty-state copy once resolved', async () => {
    const { container } = render(<SavedBlogsSection uid="" />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/no saved articles yet/i)).toBeInTheDocument()
    })
  })
})
