import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn((_query, callback) => {
    callback({ size: 2 })
    return () => {}
  }),
}))
vi.mock('@/components/admin-shell', () => ({
  AdminShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/admin-bookings-table', () => ({ AdminBookingsTable: () => <div>Bookings table</div> }))
vi.mock('@/components/admin-enquiries-table', () => ({ AdminEnquiriesTable: () => <div>Enquiries table</div> }))
vi.mock('@/components/admin-live-stats', () => ({ AdminLiveStats: () => <div>Live statistics</div> }))

import { AdminDashboard } from '@/components/admin-dashboard'

describe('AdminDashboard', () => {
  it('shows primary actions and switches operational views', async () => {
    render(<AdminDashboard />)

    expect(screen.getByRole('heading', { name: 'Your clinical workspace' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /upcoming sessions/i })).toHaveAttribute('href', '/admin/sessions')
    expect(screen.getByRole('link', { name: /patient records/i })).toHaveAttribute('href', '/admin/patients')
    expect(screen.getByText('Bookings table')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: /enquiries/i }))
    expect(screen.getByText('Enquiries table')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: /live stats/i }))
    expect(screen.getByText('Live statistics')).toBeInTheDocument()
  })
})
