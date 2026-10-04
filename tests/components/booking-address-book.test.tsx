import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Signed-in (non-anonymous) patients pick a saved address on step 1, or type a
// new one and optionally save it. Guests/anonymous users see the normal flow.

const mocks = vi.hoisted(() => ({
  authMock: { currentUser: null as unknown },
  onAuthStateChanged: vi.fn(),
  getAddresses: vi.fn(),
  getUsualAddressId: vi.fn(),
  addAddress: vi.fn(),
  timeProps: [] as Array<Record<string, unknown>>,
}))

vi.mock('@/lib/firebase', () => ({ auth: mocks.authMock, db: null, firebaseApp: null, firebaseMeasurementId: '' }))
vi.mock('@/lib/patient-account', () => ({ ensurePatientRecord: vi.fn() }))
vi.mock('@/lib/growth-tracking', () => ({ trackGrowthEvent: vi.fn() }))
vi.mock('@/lib/analytics', () => ({ track: vi.fn() }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mocks.onAuthStateChanged(...args),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
}))
vi.mock('@/lib/patient-addresses', async (orig) => ({
  ...(await orig<typeof import('@/lib/patient-addresses')>()),
  getAddresses: (...a: unknown[]) => mocks.getAddresses(...a),
  getUsualAddressId: (...a: unknown[]) => mocks.getUsualAddressId(...a),
  addAddress: (...a: unknown[]) => mocks.addAddress(...a),
}))
// Step 2 is out of scope here: capture what step 1 hands it.
vi.mock('@/components/booking-step-time', () => ({
  BookingStepTime: (props: Record<string, unknown>) => (
    mocks.timeProps.push(props),
    <button type="button" onClick={props.onBack as () => void}>Back to step one</button>
  ),
}))

import { BookingFlow } from '@/components/booking-flow'

const HOME = { id: 'a1', ownerUid: 'u1', label: 'Home', line: '7 Springfield Gardens', postcode: 'G31 4HS' }
const AWAY = { id: 'a2', ownerUid: 'u1', label: '', line: '1 High St', postcode: 'EH1 1AA' }

function signIn(user: unknown) {
  mocks.onAuthStateChanged.mockImplementation((_a: unknown, cb: (u: unknown) => void) => {
    cb(user)
    return () => {}
  })
}

beforeEach(() => {
  signIn({ uid: 'u1', isAnonymous: false, displayName: 'Pat', email: 'p@example.com' })
  mocks.getAddresses.mockResolvedValue([HOME, AWAY])
  mocks.getUsualAddressId.mockResolvedValue('a1')
  mocks.addAddress.mockResolvedValue('new-id')
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  mocks.timeProps.length = 0
})

async function chooseHome() {
  const user = userEvent.setup()
  render(<BookingFlow />)
  await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
  return user
}

function lastVisit() {
  return mocks.timeProps.at(-1)?.visit
}

describe('booking address book', () => {
  it('lists saved addresses and preselects the usual one', async () => {
    await chooseHome()
    const group = await screen.findByRole('radiogroup', { name: 'Your saved addresses' })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Home, G31 4HS/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /1 High St, EH1 1AA/ })).toHaveAccessibleName(/Outside our home-visit area/)
    expect(screen.getByRole('radio', { name: 'Use a different address' })).not.toBeChecked()
    expect(screen.queryByLabelText('Postcode')).not.toBeInTheDocument()
    expect(mocks.getUsualAddressId).toHaveBeenCalledWith('u1', null)
  })

  it('continues with the chosen saved address', async () => {
    const user = await chooseHome()
    await screen.findByRole('radiogroup', { name: 'Your saved addresses' })
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await screen.findByRole('button', { name: 'Back to step one' })
    expect(lastVisit()).toEqual({ visitType: 'home', homeAddressLine: '7 Springfield Gardens', homePostcode: 'G31 4HS' })
    expect(mocks.addAddress).not.toHaveBeenCalled()
  })

  it('blocks an uncovered saved address with the out-of-area message', async () => {
    const user = await chooseHome()
    await user.click(await screen.findByRole('radio', { name: /1 High St/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(/EH1/)
    expect(screen.getByRole('button', { name: 'Book a video consultation instead' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Continue to times/ })).not.toBeInTheDocument()
  })

  it('saves a new address once on Continue when the box is ticked', async () => {
    const user = await chooseHome()
    await user.click(await screen.findByRole('radio', { name: 'Use a different address' }))
    await user.type(screen.getByLabelText('Postcode'), 'G12 8QQ')
    await user.type(await screen.findByLabelText('Address'), '2 University Ave')
    expect(screen.getByRole('checkbox', { name: 'Save to my address book' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await screen.findByRole('button', { name: 'Back to step one' })
    expect(mocks.addAddress).toHaveBeenCalledTimes(1)
    expect(mocks.addAddress).toHaveBeenCalledWith('u1', { line: '2 University Ave', postcode: 'G12 8QQ' })
    expect(lastVisit()).toMatchObject({ homeAddressLine: '2 University Ave', homePostcode: 'G12 8QQ' })
  })

  it('does not save when unticked', async () => {
    const user = await chooseHome()
    await user.click(await screen.findByRole('radio', { name: 'Use a different address' }))
    await user.type(screen.getByLabelText('Postcode'), 'G12 8QQ')
    await user.type(await screen.findByLabelText('Address'), '2 University Ave')
    await user.click(screen.getByRole('checkbox', { name: 'Save to my address book' }))
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await screen.findByRole('button', { name: 'Back to step one' })
    expect(mocks.addAddress).not.toHaveBeenCalled()
  })

  it('a failed save still continues', async () => {
    mocks.addAddress.mockRejectedValue(new Error('nope'))
    const user = await chooseHome()
    await user.click(await screen.findByRole('radio', { name: 'Use a different address' }))
    await user.type(screen.getByLabelText('Postcode'), 'G12 8QQ')
    await user.type(await screen.findByLabelText('Address'), '2 University Ave')
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await screen.findByRole('button', { name: 'Back to step one' })
    expect(mocks.addAddress).toHaveBeenCalledTimes(1)
  })

  it('defaults to "Use a different address" when there is no usual address', async () => {
    mocks.getUsualAddressId.mockResolvedValue(null)
    await chooseHome()
    expect(await screen.findByRole('radio', { name: 'Use a different address' })).toBeChecked()
    expect(screen.getByLabelText('Postcode')).toBeInTheDocument()
  })

  it('signed-in user with no saved addresses gets the postcode flow and the save box', async () => {
    mocks.getAddresses.mockResolvedValue([])
    mocks.getUsualAddressId.mockResolvedValue(null)
    const user = await chooseHome()
    await waitFor(() => expect(mocks.getAddresses).toHaveBeenCalled())
    expect(screen.queryByRole('radiogroup', { name: 'Your saved addresses' })).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Postcode'), 'G12 8QQ')
    await user.type(await screen.findByLabelText('Address'), '2 University Ave')
    expect(screen.getByRole('checkbox', { name: 'Save to my address book' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await screen.findByRole('button', { name: 'Back to step one' })
    expect(mocks.addAddress).toHaveBeenCalledTimes(1)
  })

  it('after saving, Back shows the new address selected and Continue does not save again', async () => {
    const user = await chooseHome()
    await user.click(await screen.findByRole('radio', { name: 'Use a different address' }))
    await user.type(screen.getByLabelText('Postcode'), 'G12 8QQ')
    await user.type(await screen.findByLabelText('Address'), '2 University Ave')
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await user.click(await screen.findByRole('button', { name: 'Back to step one' }))
    expect(await screen.findByRole('radio', { name: /2 University Ave, G12 8QQ/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    await screen.findByRole('button', { name: 'Back to step one' })
    expect(mocks.addAddress).toHaveBeenCalledTimes(1)
    expect(lastVisit()).toMatchObject({ homeAddressLine: '2 University Ave', homePostcode: 'G12 8QQ' })
  })

  it('anonymous users see no saved list or save box', async () => {
    signIn({ uid: 'anon', isAnonymous: true, displayName: null })
    const user = await chooseHome()
    await user.type(screen.getByLabelText('Postcode'), 'G12 8QQ')
    await screen.findByLabelText('Address')
    expect(screen.queryByRole('radiogroup', { name: 'Your saved addresses' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Save to my address book' })).not.toBeInTheDocument()
    await waitFor(() => expect(mocks.getAddresses).not.toHaveBeenCalled())
  })
})
