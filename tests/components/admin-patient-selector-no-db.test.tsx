import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: null }))
vi.mock('@/lib/dependents', () => ({ getDependents: vi.fn() }))

import { AdminPatientSelector } from '@/components/admin-patient-selector'

describe('AdminPatientSelector (db unavailable)', () => {
  it('resolves to the search UI immediately instead of getting stuck on SkeletonRow forever', async () => {
    const { container } = render(<AdminPatientSelector onSelect={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument()
    })
    expect(container.querySelector('.skeleton-row-group')).not.toBeInTheDocument()
  })
})
