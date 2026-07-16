import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Guest by default: onAuthStateChanged reports null and never fires again.
const onAuthStateChanged = vi.fn((_auth: unknown, cb: (u: unknown) => void) => {
  cb(null)
  return () => {}
})

vi.mock('@/lib/firebase', () => ({ auth: {}, db: null }))
vi.mock('@/lib/patient-account', () => ({ ensurePatientRecord: vi.fn() }))
const signInWithEmailAndPassword = vi.fn()
const createUserWithEmailAndPassword = vi.fn()
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: [unknown, (u: unknown) => void]) => onAuthStateChanged(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => createUserWithEmailAndPassword(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => signInWithEmailAndPassword(...args),
  updateProfile: vi.fn()
}))

import { BookingFlow, formatSlotChip } from '@/components/booking-flow'

// Two free times on the 20th, one on the 21st. 09:00 appears on the 20th only,
// so on the 21st it must render as a struck-through unavailable slot.
const SLOTS = {
  '2026-08-20': ['2026-08-20T08:00:00.000Z', '2026-08-20T13:00:00.000Z'],
  '2026-08-21': ['2026-08-21T13:00:00.000Z']
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date('2026-08-01T09:00:00.000Z'))
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ slots: SLOTS }) }))
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('formatSlotChip', () => {
  it('renders the rail chip in London time', () => {
    // 13:00 UTC in August is 14:00 BST.
    expect(formatSlotChip('2026-08-20T13:00:00.000Z')).toBe('Thu 20 Aug 2026 · 14:00 · GMT (UK)')
  })
})

describe('BookingFlow', () => {
  it('defaults to Initial Assessment and mirrors the price in the rail', () => {
    render(<BookingFlow />)
    expect(screen.getByRole('button', { name: /Initial Online Assessment/ })).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('.book-rail-total-price')).toHaveTextContent('£50')
  })

  it('updates the rail live when a different service is picked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)

    await user.click(screen.getByRole('button', { name: /8 Session Bundle/ }))

    expect(document.querySelector('.book-rail-total-price')).toHaveTextContent('£340')
    expect(document.querySelector('.book-rail-title')).toHaveTextContent('8 Session Bundle')
  })

  it('walks to step 2 and asks a guest for a password', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)

    await user.click(screen.getByRole('button', { name: /Continue to times/ }))

    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    expect(screen.getByLabelText('Create a password')).toBeInTheDocument()
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(String((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain(
      'service=initial-assessment'
    )
  })

  it('lets a returning patient sign in instead of creating a password', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    signInWithEmailAndPassword.mockResolvedValue({
      user: { displayName: 'Existing Patient', email: 'pat@example.com' }
    })
    ;(fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      if (String(url).includes('/api/cal/book')) {
        return { ok: true, json: async () => ({ ok: true, uid: 'u1' }) }
      }
      return { ok: true, json: async () => ({ slots: SLOTS }) }
    })

    render(<BookingFlow />)
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))

    // Switching to sign in drops the name field and relabels the password.
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByLabelText(/Thursday, 20 August 2026/)).toBeEnabled())
    await user.click(screen.getByLabelText(/Thursday, 20 August 2026/))
    await user.click(screen.getByRole('option', { name: '09:00' }))

    await user.type(screen.getByLabelText('Email'), 'pat@example.com')
    await user.type(screen.getByLabelText('Password'), 'hunter2')
    await user.click(screen.getByRole('checkbox', { name: /consent/i }))
    await user.click(screen.getByRole('button', { name: /Confirm booking/ }))

    await waitFor(() => expect(signInWithEmailAndPassword).toHaveBeenCalled())
    expect(signInWithEmailAndPassword.mock.calls[0][1]).toBe('pat@example.com')
    await waitFor(() => expect(screen.getByText(/booking confirmed/i)).toBeInTheDocument())
  })

  it('disables days with no availability and marks busy times unavailable', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await waitFor(() => expect(screen.getByLabelText(/Thursday, 20 August 2026/)).toBeEnabled())

    // The 19th has no slots at all.
    expect(screen.getByLabelText(/Wednesday, 19 August 2026/)).toBeDisabled()

    // The 21st is free at 14:00 but busy at 09:00 — 09:00 must still show, disabled.
    await user.click(screen.getByLabelText(/Friday, 21 August 2026/))
    const slots = document.querySelector('.book-slots')!
    expect(within(slots as HTMLElement).getByRole('option', { name: '14:00' })).toBeEnabled()
    const busy = within(slots as HTMLElement).getByRole('option', { name: /09:00/ })
    expect(busy).toBeDisabled()
    expect(busy).toHaveClass('is-unavailable')
  })

  it('keeps the service choice when going back, and clears a stale slot', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)

    await user.click(screen.getByRole('button', { name: /Online Follow-Up/ }))
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await waitFor(() => expect(screen.getByLabelText(/Thursday, 20 August 2026/)).toBeEnabled())
    await user.click(screen.getByLabelText(/Thursday, 20 August 2026/))
    await user.click(screen.getByRole('option', { name: '09:00' }))

    // Slot chosen -> CTA enabled and the rail shows the physio card.
    expect(document.querySelector('.book-rail-physio')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Back/ }))
    expect(screen.getByRole('button', { name: /Online Follow-Up/ })).toHaveAttribute('aria-pressed', 'true')

    // Switching service must drop the slot -- it belongs to another event type.
    await user.click(screen.getByRole('button', { name: /Initial Online Assessment/ }))
    expect(document.querySelector('.book-rail-physio')).not.toBeInTheDocument()
  })

  it('will not submit without a chosen time', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))

    expect(screen.getByRole('button', { name: /Confirm booking/ })).toBeDisabled()
  })

  it('keeps confirm disabled until consent is checked, even with a time chosen', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await waitFor(() => expect(screen.getByLabelText(/Thursday, 20 August 2026/)).toBeEnabled())
    await user.click(screen.getByLabelText(/Thursday, 20 August 2026/))
    await user.click(screen.getByRole('option', { name: '09:00' }))

    const confirmButton = screen.getByRole('button', { name: /Confirm booking/ })
    expect(confirmButton).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: /consent/i }))
    expect(confirmButton).toBeEnabled()
  })

  it('blocks booking submission without consent and allows it once checked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    createUserWithEmailAndPassword.mockResolvedValue({
      user: { displayName: null, email: null }
    })
    ;(fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      if (String(url).includes('/api/cal/book')) {
        return { ok: true, json: async () => ({ ok: true, uid: 'u1' }) }
      }
      return { ok: true, json: async () => ({ slots: SLOTS }) }
    })

    render(<BookingFlow />)
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await waitFor(() => expect(screen.getByLabelText(/Thursday, 20 August 2026/)).toBeEnabled())
    await user.click(screen.getByLabelText(/Thursday, 20 August 2026/))
    await user.click(screen.getByRole('option', { name: '09:00' }))

    await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
    await user.type(screen.getByLabelText('Email'), 'alex@example.com')
    await user.type(screen.getByLabelText('Create a password'), 'hunter22')

    // Confirm stays disabled without consent -- clicking it (were it enabled)
    // must not be reachable, so assert the disabled state directly.
    const confirmButton = screen.getByRole('button', { name: /Confirm booking/ })
    expect(confirmButton).toBeDisabled()
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/cal/book'), expect.anything())

    await user.click(screen.getByRole('checkbox', { name: /consent/i }))
    expect(confirmButton).toBeEnabled()

    await user.click(confirmButton)
    await waitFor(() => expect(screen.getByText(/booking confirmed/i)).toBeInTheDocument())
  })
})
