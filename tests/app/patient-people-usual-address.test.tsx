import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => '/patient' }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((_a, cb) => { cb({ uid: 'u1', displayName: 'Jane', email: 'j@example.com' }); return () => {} }),
}))
vi.mock('@/lib/dependents', () => ({
  getDependents: vi.fn(async () => [{ id: 'd1', name: 'Tom', dob: '2000-01-01', relationship: 'Son', notes: '', defaultAddressId: 'a1' }]),
  addDependent: vi.fn(), updateDependent: vi.fn(), deleteDependent: vi.fn(),
}))
const getAddresses = vi.fn()
const setUsualAddress = vi.fn(async () => {})
vi.mock('@/lib/patient-addresses', () => ({
  addressDisplay: (a: { label: string; line: string; postcode: string }) => `${a.label || a.line}, ${a.postcode}`,
  getAddresses: (...a: unknown[]) => getAddresses(...a),
  setUsualAddress: (...a: unknown[]) => setUsualAddress(...(a as [])),
  getUsualAddressId: vi.fn(async () => null),
}))

import PeoplePage from '@/app/patient/people/page'

beforeEach(() => vi.clearAllMocks())

describe('People usual address', () => {
  it('sets usual address for account holder and dependent', async () => {
    getAddresses.mockResolvedValue([{ id: 'a1', ownerUid: 'u1', label: 'Home', line: '1 St', postcode: 'G31 4HS' }])
    render(<PeoplePage />)
    const you = await screen.findByLabelText('Usual address for home visits (Jane)')
    fireEvent.change(you, { target: { value: 'a1' } })
    await waitFor(() => expect(setUsualAddress).toHaveBeenCalledWith('u1', null, 'a1'))
    const tom = await screen.findByLabelText('Usual address for home visits (Tom)')
    expect((tom as HTMLSelectElement).value).toBe('a1')
    fireEvent.change(tom, { target: { value: '' } })
    await waitFor(() => expect(setUsualAddress).toHaveBeenCalledWith('u1', 'd1', null))
  })

  it('links to the address book when none saved', async () => {
    getAddresses.mockResolvedValue([])
    render(<PeoplePage />)
    await screen.findByText('Tom')
    const links = await screen.findAllByRole('link', { name: 'Add an address' })
    expect(links).toHaveLength(2)
    for (const link of links) expect(link).toHaveAttribute('href', '/patient/account#addresses')
  })

  it('does not invite adding an address when loading them failed', async () => {
    getAddresses.mockRejectedValue(new Error('offline'))
    render(<PeoplePage />)
    expect((await screen.findAllByText(/Could not load your addresses/)).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: 'Add an address' })).not.toBeInTheDocument()
  })
})
