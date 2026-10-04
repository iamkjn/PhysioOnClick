import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Home visits are booked through the same flow as video calls: step 1 starts
// with the visit choice, and a home visit needs a covered postcode (then an
// address) before services and Continue appear. Home prices include travel.

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
    // Address lookup is unavailable by default, so step 1 falls back to the
    // manual "Address" input (the dropdown has its own test below).
    if (String(url).includes('/api/address/')) {
      return { ok: false, status: 503, json: async () => ({ error: 'unavailable' }) }
    }
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
    expect(screen.getByRole('radio', { name: /Video consultation/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /Home visit in Glasgow/ })).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Postcode')).not.toBeInTheDocument()
  })

  it('lists the home visit card first, then video', () => {
    render(<BookingFlow />)
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAccessibleName(/Home visit in Glasgow/)
    expect(radios[1]).toHaveAccessibleName(/Video consultation/)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Book your appointment')
  })

  it('reveals required, length-capped address fields and the coverage status for a home visit', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))

    const postcode = screen.getByLabelText('Postcode')
    expect(postcode).toBeRequired()
    expect(postcode).toHaveAttribute('maxLength', '10')
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument()
    expect(screen.getByText('Enter your postcode to check we visit your area.')).toBeInTheDocument()

    await user.type(postcode, 'G31 4HS')
    expect(screen.getByText(/We visit G31\./)).toHaveTextContent(
      'We visit G31. Home visits cover Glasgow (G1–G53), Paisley (PA1–PA3) and Hamilton (ML3).',
    )
    const address = await screen.findByLabelText('Address')
    expect(address).toBeRequired()
    expect(address).toHaveAttribute('maxLength', '120')

    const { sessionPricePence, formatPounds } = await import('@/lib/home-visit-pricing')
    expect(document.querySelector('.book-rail-total-price')?.textContent).toBe(
      formatPounds(sessionPricePence('initial-assessment') + 1500),
    )
    expect(document.querySelector('.book-rail-travel')?.textContent).toContain('Travel fee (1 home visit × £15)')

    await user.click(screen.getByRole('radio', { name: /Video consultation/ }))
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Postcode')).not.toBeInTheDocument()
    expect(document.querySelector('.book-rail-travel')).toBeNull()
    expect(document.querySelector('.book-rail-total-price')?.textContent).toBe(
      formatPounds(sessionPricePence('initial-assessment')),
    )
  })

  it('will not continue to times until a covered home visit has an address', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), 'G31 4HS')
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/address/i)
    expect(screen.queryByText('Step 2 of 3')).not.toBeInTheDocument()
  })

  it('hides services and Continue until the postcode looks valid', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), '12345')
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Continue to times/ })).not.toBeInTheDocument()
    expect(document.querySelector('.book-service-card')).toBeNull()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('blocks an uncovered postcode and offers video instead', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), 'EH1 1AA')
    expect(await screen.findByRole('alert')).toHaveTextContent("We don't offer home visits in EH1 yet.")
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Continue to times/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Book a video consultation instead' }))
    expect(screen.getByRole('radio', { name: /Video consultation/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: /Continue to times/ })).toBeInTheDocument()
  })

  it('shows home prices including travel on the service cards', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), 'G31 4HS')
    const prices = [...document.querySelectorAll('.book-service-price')].map((n) => n.textContent)
    const { sessionPricePence, formatPounds } = await import('@/lib/home-visit-pricing')
    expect(prices).toEqual([
      formatPounds(sessionPricePence('initial-assessment') + 1500),
      formatPounds(sessionPricePence('follow-up') + 1500),
      formatPounds(sessionPricePence('bundle-4') + 6000),
      formatPounds(sessionPricePence('bundle-8') + 12000),
    ])
    expect([...document.querySelectorAll('.book-service-travel')].map((n) => n.textContent)).toEqual([
      'incl. £15 travel',
      'incl. £15 travel',
      'incl. £60 travel',
      'incl. £120 travel',
    ])
    expect(screen.getByRole('button', { name: /Initial Assessment \(home visit\)/ })).toBeInTheDocument()
  })

  it('moves between the visit cards with the arrow keys', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    const video = screen.getByRole('radio', { name: /Video consultation/ })
    video.focus()
    await user.keyboard('{ArrowLeft}')
    const home = screen.getByRole('radio', { name: /Home visit in Glasgow/ })
    expect(home).toHaveAttribute('aria-checked', 'true')
    expect(home).toHaveFocus()
  })

  it('preselects a home visit from ?visit=home', () => {
    window.history.replaceState(null, '', '/book?visit=home')
    render(<BookingFlow />)
    expect(screen.getByRole('radio', { name: /Home visit in Glasgow/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Postcode')).toBeInTheDocument()
  })

  it('sends the home visit to checkout but keeps the address out of analytics', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), 'g31 4hs')
    await user.type(await screen.findByLabelText('Address'), '7 Example Street')
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
    expect(analytics).not.toContain('G31')
    expect(window.location.href).not.toContain('Example')
  })

  it('fills the address from the postcode dropdown and sends it to checkout, not analytics', async () => {
    const base = fetchMock.getMockImplementation()!
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (String(url) === '/api/address/lookup') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            addresses: [
              { id: 'abc', label: '7 Example Street, Glasgow' },
              { id: 'def', label: '9 Example Street, Glasgow' },
            ],
          }),
        }
      }
      if (String(url) === '/api/address/resolve') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ addressLine: '7 Example Street, Glasgow', postcode: 'G31 4HS' }),
        }
      }
      return base(url, init)
    })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), 'g31 4hs')
    await user.selectOptions(await screen.findByLabelText('Select your address'), 'abc')
    await screen.findByText('7 Example Street, Glasgow', { selector: 'p' })
    expect(screen.getByLabelText('Postcode')).toHaveValue('G31 4HS')
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await payAsGuest(user)

    expect(checkoutBody()).toMatchObject({
      visitType: 'home',
      homeAddressLine: '7 Example Street, Glasgow',
      homePostcode: 'G31 4HS',
    })
    const analytics = JSON.stringify([...mocks.trackGrowthEvent.mock.calls, ...mocks.track.mock.calls])
    expect(analytics).not.toContain('Example')
    expect(analytics).not.toContain('G31')
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
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), 'g31 4hs')
    await user.type(await screen.findByLabelText('Address'), '7 Example Street')
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
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    expect(document.querySelector('.book-rail-title')?.textContent).toBe('Initial Assessment (home visit)')
    expect(document.querySelector('.book-rail-list')?.textContent).not.toMatch(/video/i)
  })

  it('shows the session price plus travel on the pay button for a home visit', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), 'G31 4HS')
    await user.type(await screen.findByLabelText('Address'), '7 Example Street')
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    const { sessionPricePence, formatPounds } = await import('@/lib/home-visit-pricing')
    const total = formatPounds(sessionPricePence('initial-assessment') + 1500)
    await waitFor(() => expect(screen.getByLabelText(/Thursday, 20 August 2026/)).toBeEnabled())
    await user.click(screen.getByLabelText(/Thursday, 20 August 2026/))
    await user.click(screen.getByRole('option', { name: '09:00' }))
    await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
    await user.type(screen.getByLabelText('Email'), 'alex@example.com')
    await user.click(screen.getByRole('checkbox', { name: /consent/i }))
    expect(screen.getByRole('button', { name: /Continue to payment/ })).toHaveTextContent(
      `Continue to payment · ${total}`,
    )
  })

  it('drops the chosen slot when the visit type changes (home and video use different events)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), 'G31 4HS')
    await user.type(await screen.findByLabelText('Address'), '7 Example Street')
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await waitFor(() => expect(screen.getByLabelText(/Thursday, 20 August 2026/)).toBeEnabled())
    await user.click(screen.getByLabelText(/Thursday, 20 August 2026/))
    await user.click(screen.getByRole('option', { name: '09:00' }))
    await user.click(screen.getByRole('button', { name: /Back/ }))
    expect(document.querySelector('.book-rail-physio')).not.toBeNull()
    await user.click(screen.getByRole('radio', { name: /Video consultation/ }))
    expect(document.querySelector('.book-rail-physio')).toBeNull()
  })

  it('keeps the chosen slot when the already-selected visit card is clicked again', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await waitFor(() => expect(screen.getByLabelText(/Thursday, 20 August 2026/)).toBeEnabled())
    await user.click(screen.getByLabelText(/Thursday, 20 August 2026/))
    await user.click(screen.getByRole('option', { name: '09:00' }))
    await user.click(screen.getByRole('button', { name: /Back/ }))
    await user.click(screen.getByRole('radio', { name: /Video consultation/ }))
    expect(document.querySelector('.book-rail-physio')).not.toBeNull()
  })

  it('clears a stale home-visit error when the postcode changes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    const postcode = screen.getByLabelText('Postcode')
    await user.type(postcode, 'G31 4HS')
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/address/i)
    await user.clear(postcode)
    await user.type(postcode, 'G32 1AA')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('leaves travel out of the rail until the postcode is covered', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { sessionPricePence, formatPounds } = await import('@/lib/home-visit-pricing')
    const video = formatPounds(sessionPricePence('initial-assessment'))
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    // Pending: nothing entered yet.
    expect(document.querySelector('.book-rail-travel')).toBeNull()
    expect(document.querySelector('.book-rail-total-price')?.textContent).toBe(video)
    // Uncovered.
    const postcode = screen.getByLabelText('Postcode')
    await user.type(postcode, 'EH1 1AA')
    expect(document.querySelector('.book-rail-travel')).toBeNull()
    expect(document.querySelector('.book-rail-total-price')?.textContent).toBe(video)
    // Covered.
    await user.clear(postcode)
    await user.type(postcode, 'G31 4HS')
    expect(document.querySelector('.book-rail-travel')?.textContent).toContain('Travel fee (1 home visit × £15)')
    expect(document.querySelector('.book-rail-total-price')?.textContent).toBe(
      formatPounds(sessionPricePence('initial-assessment') + 1500),
    )
  })

  it('moves focus to the video card after "Book a video consultation instead"', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), 'EH1 1AA')
    await user.click(screen.getByRole('button', { name: 'Book a video consultation instead' }))
    expect(screen.getByRole('radio', { name: /Video consultation/ })).toHaveFocus()
  })

  it('separates each visit card title from its subtitle in the accessible name', () => {
    render(<BookingFlow />)
    expect(screen.getByRole('radio', { name: /Home visit in Glasgow/ })).toHaveAccessibleName(
      'Home visit in Glasgow Your physiotherapist visits you',
    )
    expect(screen.getByRole('radio', { name: /Video consultation/ })).toHaveAccessibleName(
      'Video consultation Online, anywhere in the UK',
    )
  })

  it('describes the postcode with just the out-of-area message and links "contact us" to /contact', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { outOfAreaMessage } = await import('@/lib/home-visit-area')
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    const postcode = screen.getByLabelText('Postcode')
    await user.type(postcode, 'EH1 1AA')
    const described = document.getElementById(postcode.getAttribute('aria-describedby') ?? '')
    expect(described?.textContent).toBe(outOfAreaMessage('EH1 1AA'))
    expect(described?.querySelector('button')).toBeNull()
    expect(screen.getByRole('link', { name: 'contact us' })).toHaveAttribute('href', '/contact')
  })

  it('announces step 1 with the panel heading', () => {
    render(<BookingFlow />)
    expect(screen.getByText('Step 1 of 3: book your appointment.')).toBeInTheDocument()
    expect(screen.queryByText('Step 1 of 3: choose your service.')).not.toBeInTheDocument()
  })
})

describe("booking step 1 without focus-area chips", () => {
  it("has no focus-area chips (the assessment body chart collects the pain area)", () => {
    render(<BookingFlow />)
    expect(screen.queryByText(/Focus area/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Back & neck" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Shoulder" })).not.toBeInTheDocument()
  })

  it("sends no focus area by default", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole("button", { name: /Continue to times/ }))
    await payAsGuest(user)
    expect(checkoutBody().focusAreas).toEqual([])
  })

  it("still carries the area from an exercise link", async () => {
    window.history.replaceState(null, "", "/book?exercise=knee-extension&body_part=knee")
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole("button", { name: /Continue to times/ }))
    await payAsGuest(user)
    expect(checkoutBody().focusAreas).toEqual(["Sports injury"])
  })
})
