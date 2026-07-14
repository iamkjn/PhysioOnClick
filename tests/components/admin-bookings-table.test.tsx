import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: null }))
vi.mock('@/app/admin/actions', () => ({ cancelCalBooking: vi.fn() }))

import { AdminBookingsTable } from '@/components/admin-bookings-table'

describe('AdminBookingsTable', () => {
  it('shows a SkeletonTable while loading', () => {
    const { container } = render(<AdminBookingsTable />)
    expect(container.querySelector('.skeleton-table')).toBeInTheDocument()
  })
})
