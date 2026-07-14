import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: null }))

import { AdminEnquiriesTable } from '@/components/admin-enquiries-table'

describe('AdminEnquiriesTable', () => {
  it('shows a SkeletonTable while loading', () => {
    const { container } = render(<AdminEnquiriesTable />)
    expect(container.querySelector('.skeleton-table')).toBeInTheDocument()
  })
})
