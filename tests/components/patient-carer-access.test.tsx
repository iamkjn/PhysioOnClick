import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getDocMock = vi.fn()
const updateDocMock = vi.fn()
const showMock = vi.fn()

vi.mock('@/lib/firebase', () => ({ db: {}, auth: null }))
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  getDoc: (...a: unknown[]) => getDocMock(...a),
  updateDoc: (...a: unknown[]) => updateDocMock(...a),
  arrayRemove: (...values: unknown[]) => ({ __arrayRemove: values }),
}))
vi.mock('@/components/toast-provider', () => ({ useToast: () => ({ show: showMock }) }))

import { PatientCarerAccess } from '@/components/patient-carer-access'

function patientSnap(data: Record<string, unknown>) {
  return { exists: () => true, data: () => data }
}

beforeEach(() => {
  getDocMock.mockReset()
  updateDocMock.mockReset().mockResolvedValue(undefined)
  showMock.mockReset()
})

describe('PatientCarerAccess', () => {
  it('says only the patient can see their recovery when there are no carers', async () => {
    getDocMock.mockResolvedValue(patientSnap({ email: 'pat@example.com' }))
    render(<PatientCarerAccess uid="u1" />)

    expect(await screen.findByText(/Only you can see your recovery\./)).toBeInTheDocument()
    expect(screen.getByText(/ask your physio to give them access/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove access/i })).not.toBeInTheDocument()
    expect(getDocMock).toHaveBeenCalledWith({ path: 'patients/u1' })
  })

  it('treats a missing patient doc as no carers', async () => {
    getDocMock.mockResolvedValue({ exists: () => false, data: () => undefined })
    render(<PatientCarerAccess uid="u1" />)
    expect(await screen.findByText(/Only you can see your recovery\./)).toBeInTheDocument()
  })

  it('lists carers and removes one with arrayRemove after confirmation', async () => {
    getDocMock.mockResolvedValue(
      patientSnap({
        email: 'pat@example.com',
        carerEmails: ['john@example.com', 'sam@example.com'],
        carerContact: { name: 'John', email: 'john@example.com', relationship: 'Husband' },
      })
    )
    const user = userEvent.setup()
    render(<PatientCarerAccess uid="u1" />)

    expect(await screen.findByText('John · Husband')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('sam@example.com')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove access for sam@example.com' }))
    const dialog = await screen.findByRole('dialog')
    expect(updateDocMock).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: 'Remove access' }))

    await waitFor(() =>
      expect(updateDocMock).toHaveBeenCalledWith(
        { path: 'patients/u1' },
        { carerEmails: { __arrayRemove: ['sam@example.com'] } }
      )
    )
    await waitFor(() => expect(screen.queryByText('sam@example.com')).not.toBeInTheDocument())
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(showMock).toHaveBeenCalledWith('Access removed.', 'success')
  })

  it('keeps the carer listed and shows an error toast when removal fails', async () => {
    getDocMock.mockResolvedValue(patientSnap({ carerEmails: ['sam@example.com'] }))
    updateDocMock.mockRejectedValue(new Error('permission-denied'))
    const user = userEvent.setup()
    render(<PatientCarerAccess uid="u1" />)

    await user.click(await screen.findByRole('button', { name: 'Remove access for sam@example.com' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Remove access' }))

    await waitFor(() => expect(showMock).toHaveBeenCalledWith('Could not remove access. Try again.', 'error'))
    expect(screen.getByText('sam@example.com')).toBeInTheDocument()
  })

  it('does nothing when the patient keeps the carer', async () => {
    getDocMock.mockResolvedValue(patientSnap({ carerEmails: ['sam@example.com'] }))
    const user = userEvent.setup()
    render(<PatientCarerAccess uid="u1" />)

    await user.click(await screen.findByRole('button', { name: 'Remove access for sam@example.com' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Keep' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(updateDocMock).not.toHaveBeenCalled()
  })
})
