import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Home visits (Glasgow area) are booked through the same flow as video calls:
// a visit-type choice on step 1, with address + postcode only for home visits.

const mocks = vi.hoisted(() => ({
  authMock: { currentUser: null as unknown },
  onAuthStateChanged: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  trackGrowthEvent: vi.fn(),
  track: vi.fn(),
  wizardProps: [] as Array<Record<string, unknown>>,
}))

vi.mock('@/lib/firebase', () => ({
  auth: mocks.authMock,
  db: null,
  firebaseApp: null,
  firebaseMeasurementId: '',
}))
vi.mock('@/lib/patient-account', () => ({ ensurePatientRecord: vi.fn() }))
vi.mock('@/lib/growth-tracking', () => ({ trackGrowthEvent: mocks.trackGrowthEvent }))
vi.mock('@/lib/analytics', () => ({ track: mocks.track }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mocks.onAuthStateChanged(...args),
  signInAnonymously: (...args: unknown[]) => mocks.signInAnonymously(...args),
  signOut: (...args: unknown[]) => mocks.signOut(...args),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  updateProfile: (...args: unknown[]) => mocks.updateProfile(...args),
}))
vi.mock('@/components/assessment-wizard', () => ({
  AssessmentWizard: (props: { onSubmitted: (formId: string) => void }) => (
    mocks.wizardProps.push(props as unknown as Record<string, unknown>),
    <button type="button" onClick={() => props.onSubmitted('form-1')}>
      Submit assessment
    </button>
  ),
}))

import { BookingFlow } from '@/components/booking-flow'

const SLOTS = { '2026-08-20': ['2026-08-20T08:00:00.000Z'] }
const fetchMock = vi.fn()

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date('2026-08-01T09:00:00.000Z'))
  mocks.onAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
    cb(null)
    return () => {}
  })
  mocks.signInAnonymously.mockResolvedValue({ user: { uid: 'anon-1', isAnonymous: true, displayName: null } })
  mocks.updateProfile.mockResolvedValue(undefined)
  fetchMock.mockImplementation(async (url: string) => {
    if (String(url).includes('/api/checkout/create')) {
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
  mocks.wizardProps.length = 0
  window.history.replaceState(null, '', '/')
})

function checkoutBody() {
  const call = fetchMock.mock.calls.find(([url]) => String(url).includes('/api/checkout/create'))
  return call ? JSON.parse(String((call[1] as RequestInit).body)) : null
}

async function payAsGuest(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => expect(screen.getByLabelText(/Thursday, 20 August 2026/)).toBeEnabled())
  await user.click(screen.getByLabelText(/Thursday, 20 August 2026/))
  await user.click(screen.getByRole('option', { name: '09:00' }))
  await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
  await user.type(screen.getByLabelText('Email'), 'alex@example.com')
  await user.click(screen.getByRole('checkbox', { name: /consent/i }))
  await user.click(screen.getByRole('button', { name: /Continue to payment/ }))
  await user.click(await screen.findByRole('button', { name: 'Submit assessment' }))
  await waitFor(() => expect(checkoutBody()).not.toBeNull())
}

describe('booking visit type', () => {
  it('defaults to a video call with no address fields', () => {
    render(<BookingFlow />)
    expect(screen.getByRole('radio', { name: 'Video call (anywhere in the UK)' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Home visit (Glasgow area)' })).not.toBeChecked()
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Postcode')).not.toBeInTheDocument()
  })

  it('reveals required, length-capped address fields and the Glasgow hint for a home visit', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: 'Home visit (Glasgow area)' }))

    const address = screen.getByLabelText('Address')
    const postcode = screen.getByLabelText('Postcode')
    expect(address).toBeRequired()
    expect(postcode).toBeRequired()
    expect(address).toHaveAttribute('maxLength', '120')
    expect(postcode).toHaveAttribute('maxLength', '10')
    expect(
      screen.getByText("Home visits cover the Glasgow area. We'll confirm by email if your address is outside it."),
    ).toBeInTheDocument()
    // Price is unchanged by the visit type.
    expect(document.querySelector('.book-rail-total-price')?.textContent).toBe(
      document.querySelector('.book-service-card.is-selected .book-service-price')?.textContent,
    )

    await user.click(screen.getByRole('radio', { name: 'Video call (anywhere in the UK)' }))
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument()
  })

  it('will not continue to times until a home visit has an address and a valid postcode', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: 'Home visit (Glasgow area)' }))
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/address/i)
    expect(screen.queryByText('Step 2 of 3')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Address'), '7 Example Street')
    await user.type(screen.getByLabelText('Postcode'), '12345')
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/postcode/i)
    expect(screen.queryByText('Step 2 of 3')).not.toBeInTheDocument()
  })

  it('preselects a home visit from ?visit=home', () => {
    window.history.replaceState(null, '', '/book?visit=home')
    render(<BookingFlow />)
    expect(screen.getByRole('radio', { name: 'Home visit (Glasgow area)' })).toBeChecked()
    expect(screen.getByLabelText('Address')).toBeInTheDocument()
  })

  it('sends the home visit to checkout but keeps the address out of analytics', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: 'Home visit (Glasgow area)' }))
    await user.type(screen.getByLabelText('Address'), '7 Example Street')
    await user.type(screen.getByLabelText('Postcode'), 'g31 4hs')
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await payAsGuest(user)

    expect(checkoutBody()).toMatchObject({
      visitType: 'home',
      homeAddressLine: '7 Example Street',
      homePostcode: 'G31 4HS',
    })
    const analytics = JSON.stringify([...mocks.trackGrowthEvent.mock.calls, ...mocks.track.mock.calls])
    expect(analytics).toContain('"visit_type":"home"')
    expect(analytics).not.toContain('Example Street')
    expect(analytics).not.toContain('4HS')
    expect(window.location.href).not.toContain('Example')
  })

  it('sends a plain video booking with no address', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await payAsGuest(user)
    const body = checkoutBody()
    expect(body.visitType).toBe('video')
    expect(body).not.toHaveProperty('homeAddressLine')
    expect(body).not.toHaveProperty('homePostcode')
  })

  it('words the consent for the chosen visit and passes the visit to the assessment', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: 'Home visit (Glasgow area)' }))
    await user.type(screen.getByLabelText('Address'), '7 Example Street')
    await user.type(screen.getByLabelText('Postcode'), 'g31 4hs')
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    const consent = await screen.findByRole('checkbox', { name: /consent/i })
    expect(consent.closest('label')?.textContent).toMatch(/physiotherapy assessment and treatment at a home visit/)
    expect(consent.closest('label')?.textContent).not.toMatch(/online consultation/)
    await payAsGuest(user)
    expect(mocks.wizardProps.at(-1)?.visitType).toBe('home')
  })

  it('words the consent for a video call', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    const consent = await screen.findByRole('checkbox', { name: /consent/i })
    expect(consent.closest('label')?.textContent).toMatch(/physiotherapy assessment and treatment by video/)
    await payAsGuest(user)
    expect(mocks.wizardProps.at(-1)?.visitType).toBe('video')
  })

  it('shows a home-visit title and checklist in the rail', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    expect(document.querySelector('.book-rail-title')?.textContent).toBe('Initial Online Assessment')
    await user.click(screen.getByRole('radio', { name: 'Home visit (Glasgow area)' }))
    expect(document.querySelector('.book-rail-title')?.textContent).toBe('Initial Assessment (home visit)')
    expect(document.querySelector('.book-rail-list')?.textContent).not.toMatch(/video/i)
  })
})

