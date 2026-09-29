import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FirebaseError } from 'firebase/app'

// Guest checkout (lib/guest-booking.ts): a new visitor can leave the password
// blank and book under an anonymous Firebase session. The existing "create an
// account" and "sign in" paths must behave exactly as before.

const mocks = vi.hoisted(() => ({
  authMock: { currentUser: null as unknown },
  onAuthStateChanged: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  ensurePatientRecord: vi.fn(),
  wizardProps: { current: null as null | Record<string, unknown> },
}))

vi.mock('@/lib/firebase', () => ({
  auth: mocks.authMock,
  db: null,
  firebaseApp: null,
  firebaseMeasurementId: '',
}))
vi.mock('@/lib/patient-account', () => ({ ensurePatientRecord: mocks.ensurePatientRecord }))
vi.mock('@/lib/growth-tracking', () => ({ trackGrowthEvent: vi.fn() }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mocks.onAuthStateChanged(...args),
  signInAnonymously: (...args: unknown[]) => mocks.signInAnonymously(...args),
  signOut: (...args: unknown[]) => mocks.signOut(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => mocks.createUserWithEmailAndPassword(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => mocks.signInWithEmailAndPassword(...args),
  updateProfile: (...args: unknown[]) => mocks.updateProfile(...args),
}))
// Stand-in for the real wizard: records the uid/personId it would write the
// assessment under, and lets the test "submit" it to reach checkout.
vi.mock('@/components/assessment-wizard', () => ({
  AssessmentWizard: (props: Record<string, unknown> & { onSubmitted: (formId: string) => void }) => {
    mocks.wizardProps.current = props
    return (
      <div>
        <h2>Assessment for {String(props.displayName)}</h2>
        <button type="button" onClick={() => props.onSubmitted('form-1')}>
          Submit assessment
        </button>
      </div>
    )
  },
}))

import { BookingFlow } from '@/components/booking-flow'

const SLOTS = { '2026-08-20': ['2026-08-20T08:00:00.000Z'] }
const fetchMock = vi.fn()

function reportAuthUser(user: unknown) {
  mocks.onAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
    cb(user)
    return () => {}
  })
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date('2026-08-01T09:00:00.000Z'))
  mocks.authMock.currentUser = null
  mocks.wizardProps.current = null
  reportAuthUser(null)
  mocks.signInAnonymously.mockResolvedValue({ user: { uid: 'anon-1', isAnonymous: true, displayName: null } })
  mocks.signOut.mockResolvedValue(undefined)
  mocks.updateProfile.mockResolvedValue(undefined)
  mocks.ensurePatientRecord.mockResolvedValue(undefined)
  fetchMock.mockImplementation(async (url: string) => {
    if (String(url).includes('/api/checkout/create')) {
      // A hash-only URL so jsdom treats the Stripe redirect as a no-op.
      return { ok: true, json: async () => ({ ok: true, url: `${window.location.origin}/#stripe-checkout` }) }
    }
    return { ok: true, json: async () => ({ slots: SLOTS }) }
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  window.localStorage.clear()
})

async function reachDetailsWithSlot() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(<BookingFlow />)
  await user.click(screen.getByRole('button', { name: /Continue to times/ }))
  await waitFor(() => expect(screen.getByLabelText(/Thursday, 20 August 2026/)).toBeEnabled())
  await user.click(screen.getByLabelText(/Thursday, 20 August 2026/))
  await user.click(screen.getByRole('option', { name: '09:00' }))
  return user
}

function checkoutBody() {
  const call = fetchMock.mock.calls.find(([url]) => String(url).includes('/api/checkout/create'))
  return call ? JSON.parse(String((call[1] as RequestInit).body)) : null
}

describe('guest checkout', () => {
  it('offers the password as optional to a new visitor', async () => {
    await reachDetailsWithSlot()
    const password = screen.getByLabelText('Create a password')
    expect(password).not.toBeRequired()
    expect(screen.getByText('Optional')).toBeInTheDocument()
    expect(password).toHaveAccessibleDescription(/Skip it to book as a guest/)
    // The existing returning-patient entry point is still right there.
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('books under an anonymous session when the password is left blank', async () => {
    const user = await reachDetailsWithSlot()
    await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
    await user.type(screen.getByLabelText('Email'), 'Alex@Example.com')
    await user.click(screen.getByRole('checkbox', { name: /consent/i }))
    await user.click(screen.getByRole('button', { name: /Continue to payment/ }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Assessment for Alex Morgan' })).toBeInTheDocument())
    expect(mocks.signInAnonymously).toHaveBeenCalledTimes(1)
    expect(mocks.createUserWithEmailAndPassword).not.toHaveBeenCalled()
    expect(mocks.signInWithEmailAndPassword).not.toHaveBeenCalled()
    // No users/patients doc for a guest — it must never compete with a real
    // account in cal-webhook's email lookup.
    expect(mocks.ensurePatientRecord).not.toHaveBeenCalled()
    expect(mocks.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'anon-1' }),
      { displayName: 'Alex Morgan' },
    )
    // The assessment is written under the anonymous uid, like any account's.
    expect(mocks.wizardProps.current).toMatchObject({ uid: 'anon-1', personId: 'anon-1' })
    expect(JSON.parse(window.localStorage.getItem('poc-guest-booking')!)).toEqual({
      uid: 'anon-1',
      email: 'alex@example.com',
    })

    await user.click(screen.getByRole('button', { name: 'Submit assessment' }))
    await waitFor(() => expect(checkoutBody()).not.toBeNull())
    expect(checkoutBody()).toMatchObject({
      name: 'Alex Morgan',
      email: 'Alex@Example.com',
      assessmentFormId: 'form-1',
      assessmentUid: 'anon-1',
      assessmentPersonId: 'anon-1',
    })
  })

  it('validates the name exactly as account creation does', async () => {
    const user = await reachDetailsWithSlot()
    await user.type(screen.getByLabelText('Full name'), 'A')
    await user.type(screen.getByLabelText('Email'), 'alex@example.com')
    await user.click(screen.getByRole('checkbox', { name: /consent/i }))
    await user.click(screen.getByRole('button', { name: /Continue to payment/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your full name.')
    expect(mocks.signInAnonymously).not.toHaveBeenCalled()
  })

  it('falls back to the password path when anonymous sign-in is disabled', async () => {
    mocks.signInAnonymously.mockRejectedValue(new FirebaseError('auth/operation-not-allowed', 'disabled'))
    mocks.createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'u-1', displayName: null, email: 'alex@example.com' },
    })
    const user = await reachDetailsWithSlot()
    await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
    await user.type(screen.getByLabelText('Email'), 'alex@example.com')
    await user.click(screen.getByRole('checkbox', { name: /consent/i }))
    await user.click(screen.getByRole('button', { name: /Continue to payment/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/isn't available just now/)
    // Form is back to exactly the pre-guest-checkout behaviour.
    expect(screen.queryByText('Optional')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Create a password')).toBeRequired()

    await user.type(screen.getByLabelText('Create a password'), 'hunter22')
    await user.click(screen.getByRole('button', { name: /Continue to payment/ }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Assessment for Alex Morgan' })).toBeInTheDocument())
    expect(mocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(mocks.authMock, 'alex@example.com', 'hunter22')
    expect(mocks.wizardProps.current).toMatchObject({ uid: 'u-1' })
  })

  it('keeps the guest option on a network blip instead of dropping it', async () => {
    mocks.signInAnonymously.mockRejectedValue(new FirebaseError('auth/network-request-failed', 'offline'))
    const user = await reachDetailsWithSlot()
    await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
    await user.type(screen.getByLabelText('Email'), 'alex@example.com')
    await user.click(screen.getByRole('checkbox', { name: /consent/i }))
    await user.click(screen.getByRole('button', { name: /Continue to payment/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/check your connection/)
    expect(screen.getByText('Optional')).toBeInTheDocument()
  })

  it('still creates an account when a password is entered (unchanged path)', async () => {
    mocks.createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'u-2', displayName: null, email: 'alex@example.com' },
    })
    const user = await reachDetailsWithSlot()
    await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
    await user.type(screen.getByLabelText('Email'), 'alex@example.com')
    await user.type(screen.getByLabelText('Create a password'), 'hunter22')
    await user.click(screen.getByRole('checkbox', { name: /consent/i }))
    await user.click(screen.getByRole('button', { name: /Continue to payment/ }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Assessment for Alex Morgan' })).toBeInTheDocument())
    expect(mocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(mocks.authMock, 'alex@example.com', 'hunter22')
    expect(mocks.ensurePatientRecord).toHaveBeenCalledWith(expect.objectContaining({ uid: 'u-2' }), 'Alex Morgan')
    expect(mocks.signInAnonymously).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('poc-guest-booking')).toBeNull()
  })

  it('never offers the guest option in sign-in mode', async () => {
    const user = await reachDetailsWithSlot()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByLabelText('Password')).toBeRequired()
    expect(screen.queryByText('Optional')).not.toBeInTheDocument()
  })

  it("reuses this browser's guest session when the same email books again", async () => {
    mocks.authMock.currentUser = { uid: 'anon-9', isAnonymous: true, displayName: 'Alex Morgan' }
    window.localStorage.setItem('poc-guest-booking', JSON.stringify({ uid: 'anon-9', email: 'alex@example.com' }))
    const user = await reachDetailsWithSlot()
    await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
    await user.type(screen.getByLabelText('Email'), 'alex@example.com')
    await user.click(screen.getByRole('checkbox', { name: /consent/i }))
    await user.click(screen.getByRole('button', { name: /Continue to payment/ }))

    await waitFor(() => expect(mocks.wizardProps.current).toMatchObject({ uid: 'anon-9' }))
    expect(mocks.signInAnonymously).not.toHaveBeenCalled()
    expect(mocks.signOut).not.toHaveBeenCalled()
  })

  it("starts a fresh guest session when the browser holds someone else's", async () => {
    mocks.authMock.currentUser = { uid: 'anon-9', isAnonymous: true, displayName: 'Sam' }
    window.localStorage.setItem('poc-guest-booking', JSON.stringify({ uid: 'anon-9', email: 'sam@example.com' }))
    const user = await reachDetailsWithSlot()
    await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
    await user.type(screen.getByLabelText('Email'), 'alex@example.com')
    await user.click(screen.getByRole('checkbox', { name: /consent/i }))
    await user.click(screen.getByRole('button', { name: /Continue to payment/ }))

    await waitFor(() => expect(mocks.wizardProps.current).toMatchObject({ uid: 'anon-1' }))
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
    expect(mocks.signInAnonymously).toHaveBeenCalledTimes(1)
    expect(JSON.parse(window.localStorage.getItem('poc-guest-booking')!)).toEqual({
      uid: 'anon-1',
      email: 'alex@example.com',
    })
  })

  it('treats a lingering anonymous session as signed out, not "Booking as"', async () => {
    reportAuthUser({ uid: 'anon-9', isAnonymous: true, displayName: 'Alex Morgan', email: null })
    await reachDetailsWithSlot()
    expect(screen.getByLabelText('Full name')).toBeInTheDocument()
    expect(screen.getByLabelText('Create a password')).toBeInTheDocument()
    expect(screen.queryByText(/Booking as/)).not.toBeInTheDocument()
  })
})
