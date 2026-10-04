import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getAddresses = vi.fn()
const addAddress = vi.fn()
const updateAddress = vi.fn()
const deleteAddress = vi.fn()
vi.mock('@/lib/patient-addresses', async () => {
  const actual = await vi.importActual<typeof import('@/lib/patient-addresses')>('@/lib/patient-addresses')
  return {
    ADDRESS_LABEL_MAX: 40,
    addressDisplay: actual.addressDisplay,
    getAddresses: (...a: unknown[]) => getAddresses(...a),
    addAddress: (...a: unknown[]) => addAddress(...a),
    updateAddress: (...a: unknown[]) => updateAddress(...a),
    deleteAddress: (...a: unknown[]) => deleteAddress(...a),
  }
})
vi.mock('@/lib/firebase', () => ({ db: null, auth: null, storage: null }))
vi.mock('@/components/address-lookup', () => ({
  AddressLookup: (p: { inputId?: string; addressLine: string; onAddressLineChange: (v: string) => void }) => (
    <input data-testid="lookup" id={p.inputId} value={p.addressLine} onChange={(e) => p.onAddressLineChange(e.target.value)} />
  ),
}))

import { AddressBookManager } from '@/components/address-book-manager'

const home = { id: 'a1', ownerUid: 'u1', label: 'Home', line: '1 Main St', postcode: 'G31 4HS' }
const away = { id: 'a2', ownerUid: 'u1', label: '', line: '2 Far Rd', postcode: 'EH1 1AA' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AddressBookManager', () => {
  it('shows the empty state', async () => {
    getAddresses.mockResolvedValue([])
    render(<AddressBookManager uid="u1" />)
    expect(await screen.findByText('No saved addresses yet. Add one to book home visits faster.')).toBeInTheDocument()
  })

  it('lists addresses and badges ones outside the area', async () => {
    getAddresses.mockResolvedValue([home, away])
    render(<AddressBookManager uid="u1" />)
    expect(await screen.findByText('Home, G31 4HS')).toBeInTheDocument()
    expect(screen.getByText('2 Far Rd, EH1 1AA')).toBeInTheDocument()
    expect(screen.getAllByText('Outside our home-visit area')).toHaveLength(1)
  })

  it('adds an out-of-area address via the manual input', async () => {
    getAddresses.mockResolvedValue([])
    addAddress.mockResolvedValue('new')
    render(<AddressBookManager uid="u1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Add an address' }))
    fireEvent.change(screen.getByLabelText(/Label/), { target: { value: 'Mum' } })
    fireEvent.change(screen.getByLabelText(/Postcode/), { target: { value: 'eh1 1aa' } })
    fireEvent.change(screen.getByLabelText(/^Address/), { target: { value: '2 Far Rd' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save address' }))
    await waitFor(() => expect(addAddress).toHaveBeenCalledWith('u1', { label: 'Mum', line: '2 Far Rd', postcode: 'EH1 1AA' }))
  })

  it('uses AddressLookup for a covered postcode', async () => {
    getAddresses.mockResolvedValue([])
    render(<AddressBookManager uid="u1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Add an address' }))
    fireEvent.change(screen.getByLabelText(/Postcode/), { target: { value: 'G31 4HS' } })
    expect(screen.getByTestId('lookup')).toHaveAttribute('id', 'address-book-line')
  })

  it('shows validation errors from addAddress', async () => {
    getAddresses.mockResolvedValue([])
    addAddress.mockRejectedValue(new Error('Enter your address.'))
    render(<AddressBookManager uid="u1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Add an address' }))
    fireEvent.change(screen.getByLabelText(/Postcode/), { target: { value: 'EH1 1AA' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save address' }))
    expect(await screen.findByText('Enter your address.')).toBeInTheDocument()
  })

  it('edits through updateAddress', async () => {
    getAddresses.mockResolvedValue([away])
    updateAddress.mockResolvedValue(undefined)
    render(<AddressBookManager uid="u1" />)
    fireEvent.click(await screen.findByRole('button', { name: /Edit 2 Far Rd/ }))
    fireEvent.change(screen.getByLabelText(/^Address/), { target: { value: '3 Far Rd' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save address' }))
    await waitFor(() => expect(updateAddress).toHaveBeenCalledWith('a2', { label: '', line: '3 Far Rd', postcode: 'EH1 1AA' }))
  })

  it('deletes after confirmation', async () => {
    getAddresses.mockResolvedValue([home])
    deleteAddress.mockResolvedValue(undefined)
    render(<AddressBookManager uid="u1" />)
    fireEvent.click(await screen.findByRole('button', { name: /Delete Home/ }))
    expect(deleteAddress).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(deleteAddress).toHaveBeenCalledWith('u1', 'a1'))
  })
  it('keeps a load error visible while the add form is open', async () => {
    getAddresses.mockRejectedValue(new Error('offline'))
    render(<AddressBookManager uid="u1" />)
    expect(await screen.findByText('Could not load your addresses. Please try again.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add an address' }))
    expect(screen.getByText('Could not load your addresses. Please try again.')).toBeInTheDocument()
  })

  it('edits a covered address through the lookup', async () => {
    getAddresses.mockResolvedValue([home])
    updateAddress.mockResolvedValue(undefined)
    render(<AddressBookManager uid="u1" />)
    fireEvent.click(await screen.findByRole('button', { name: /Edit Home/ }))
    const lookup = screen.getByTestId('lookup')
    expect(lookup).toHaveValue('1 Main St')
    fireEvent.change(lookup, { target: { value: '5 Main St' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save address' }))
    await waitFor(() => expect(updateAddress).toHaveBeenCalledWith('a1', { label: 'Home', line: '5 Main St', postcode: 'G31 4HS' }))
  })

  it('caps the label input at 40 characters', async () => {
    getAddresses.mockResolvedValue([])
    render(<AddressBookManager uid="u1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Add an address' }))
    expect(screen.getByLabelText(/Label/)).toHaveAttribute('maxLength', '40')
  })
})
