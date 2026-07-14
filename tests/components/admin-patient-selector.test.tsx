import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('@/lib/dependents', () => ({ getDependents: vi.fn().mockResolvedValue([]) }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
}))

import { AdminPatientSelector } from '@/components/admin-patient-selector'

describe('AdminPatientSelector', () => {
  it('shows SkeletonRow before the patient list has loaded, then the search input once resolved', async () => {
    const { container } = render(<AdminPatientSelector onSelect={vi.fn()} />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument()
    })
  })
})
