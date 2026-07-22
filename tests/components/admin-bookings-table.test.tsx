import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {}, auth: null }))
vi.mock('@/app/admin/actions', () => ({ cancelCalBooking: vi.fn() }))
vi.mock('@/components/toast-provider', () => ({ useToast: () => ({ show: vi.fn() }) }))
vi.mock('@/components/summary-form', () => ({ SummaryForm: () => null }))

// Captures the callbacks handed to onSnapshot so each test can push its own
// snapshot (or an error) without touching Firestore.
let emit: ((snap: unknown) => void) | undefined
let fail: ((err: unknown) => void) | undefined

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: (_q: unknown, next: (s: unknown) => void, onError: (e: unknown) => void) => {
    emit = next
    fail = onError
    return () => {}
  },
}))

import { AdminBookingsTable } from '@/components/admin-bookings-table'

/** 25 upcoming bookings — enough for 3 pages at PAGE_SIZE 10. */
function makeDocs(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `b${i}`,
    data: () => ({
      fullName: `Patient ${String(i).padStart(2, '0')}`,
      email: `p${i}@example.com`,
      service: i % 2 === 0 ? 'Initial assessment' : 'Follow-up',
      appointmentDate: `2099-01-${String((i % 28) + 1).padStart(2, '0')}`,
      appointmentTime: '09:00',
      status: 'pending',
    }),
  }))
}

function pushDocs(count: number) {
  act(() => { emit?.({ docs: makeDocs(count) }) })
}

function bodyRowCount() {
  const table = screen.getByRole('table')
  return within(table).getAllByRole('row').length - 1 // minus the header row
}

beforeEach(() => {
  emit = undefined
  fail = undefined
})

describe('AdminBookingsTable', () => {
  it('shows a SkeletonTable while loading', () => {
    const { container } = render(<AdminBookingsTable />)
    expect(container.querySelector('.skeleton-table')).toBeInTheDocument()
  })

  it('surfaces an error instead of loading forever when the read is rejected', () => {
    const { container } = render(<AdminBookingsTable />)
    act(() => { fail?.(new Error('permission-denied')) })

    expect(container.querySelector('.skeleton-table')).not.toBeInTheDocument()
    expect(screen.getByText(/could not load bookings/i)).toBeInTheDocument()
  })

  it('paginates at 10 rows per page', async () => {
    render(<AdminBookingsTable />)
    pushDocs(25)

    expect(bodyRowCount()).toBe(10)
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    expect(bodyRowCount()).toBe(10)

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
    expect(bodyRowCount()).toBe(5) // 25 = 10 + 10 + 5
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('hides pagination when everything fits on one page', () => {
    render(<AdminBookingsTable />)
    pushDocs(6)

    expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument()
  })

  it('sorts by a column and reverses on a second click', async () => {
    render(<AdminBookingsTable />)
    pushDocs(25)

    await userEvent.click(screen.getByRole('button', { name: /^Patient/ }))
    const header = screen.getByRole('columnheader', { name: /patient/i })
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Patient 00')

    await userEvent.click(screen.getByRole('button', { name: /^Patient/ }))
    expect(header).toHaveAttribute('aria-sort', 'descending')
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Patient 24')
  })

  it('filters by search across patient, email and service', async () => {
    render(<AdminBookingsTable />)
    pushDocs(25)

    await userEvent.type(screen.getByRole('searchbox'), 'Patient 07')
    expect(bodyRowCount()).toBe(1)
    expect(screen.getByText('Patient 07')).toBeInTheDocument()
  })

  it('returns to page one when the search changes', async () => {
    render(<AdminBookingsTable />)
    pushDocs(25)

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox'), 'Follow-up')
    expect(screen.getByText(/^Page 1 of/)).toBeInTheDocument()
  })

  it('explains an empty result caused by the search term', async () => {
    render(<AdminBookingsTable />)
    pushDocs(25)

    await userEvent.type(screen.getByRole('searchbox'), 'nobody-by-this-name')
    expect(screen.getByText(/no bookings match/i)).toHaveTextContent('nobody-by-this-name')
  })
})
