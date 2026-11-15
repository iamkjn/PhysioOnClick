import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getDocMock = vi.fn()
const getIdTokenMock = vi.fn()
const setPatientCarerEmailsMock = vi.fn()
const showMock = vi.fn()

vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { getIdToken: () => getIdTokenMock() } },
}))
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  getDoc: (...a: unknown[]) => getDocMock(...a),
}))
vi.mock('@/app/admin/carer-actions', () => ({
  setPatientCarerEmails: (...a: unknown[]) => setPatientCarerEmailsMock(...a),
}))
vi.mock('@/components/toast-provider', () => ({ useToast: () => ({ show: showMock }) }))

import { AdminCarerAccess } from '@/components/admin-carer-access'

function patientSnap(data: Record<string, unknown>) {
  return { exists: () => true, data: () => data }
}

beforeEach(() => {
  getDocMock.mockReset()
  getIdTokenMock.mockReset().mockResolvedValue('tok')
  setPatientCarerEmailsMock.mockReset().mockImplementation(async (_uid: string, emails: string[]) => emails)
  showMock.mockReset()
})

describe('AdminCarerAccess', () => {
  it('lists the carers on the patient doc, with the saved contact name when it matches', async () => {
    getDocMock.mockResolvedValue(
      patientSnap({
        email: 'pat@example.com',
        carerEmails: ['Carer@Example.com', 'other@example.com'],
        carerContact: { name: 'John', email: 'carer@example.com', relationship: 'Husband' },
      })
    )
    render(<AdminCarerAccess patientUid="p1" patientName="Pat Smith" />)

    const list = await screen.findByRole('list', { name: /carers with access/i })
    expect(within(list).getByText('carer@example.com')).toBeInTheDocument()
    expect(within(list).getByText('John · Husband')).toBeInTheDocument()
    expect(within(list).getByText('other@example.com')).toBeInTheDocument()
    expect(screen.getByText('2 of 5')).toBeInTheDocument()
    expect(screen.getByText(/see Pat Smith's exercises and progress/)).toBeInTheDocument()
    // The saved contact already has access, so no "On file" suggestion.
    expect(screen.queryByText(/On file:/)).not.toBeInTheDocument()
    expect(getDocMock).toHaveBeenCalledWith({ path: 'patients/p1' })
  })

  it('shows the empty state when nobody has access', async () => {
    getDocMock.mockResolvedValue(patientSnap({ email: 'pat@example.com' }))
    render(<AdminCarerAccess patientUid="p1" patientName="Pat Smith" />)
    expect(await screen.findByText('No carers yet.')).toBeInTheDocument()
  })

  it('quick-adds the saved carer contact with the merged list', async () => {
    getDocMock.mockResolvedValue(
      patientSnap({
        email: 'pat@example.com',
        carerEmails: ['other@example.com'],
        carerContact: { name: 'John', email: 'John@Example.com', relationship: 'Husband' },
      })
    )
    const user = userEvent.setup()
    render(<AdminCarerAccess patientUid="p1" patientName="Pat Smith" />)

    expect(await screen.findByText('On file: John (Husband) · john@example.com')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /give carer access to john@example.com/i }))

    await waitFor(() =>
      expect(setPatientCarerEmailsMock).toHaveBeenCalledWith('p1', ['other@example.com', 'john@example.com'], 'tok')
    )
    const list = await screen.findByRole('list', { name: /carers with access/i })
    await waitFor(() => expect(within(list).getByText('john@example.com')).toBeInTheDocument())
    expect(screen.queryByText(/On file:/)).not.toBeInTheDocument()
    expect(showMock).toHaveBeenCalledWith('Carer access given.', 'success')
  })

  it('validates a bad email without calling the action', async () => {
    getDocMock.mockResolvedValue(patientSnap({ email: 'pat@example.com', carerEmails: [] }))
    const user = userEvent.setup()
    render(<AdminCarerAccess patientUid="p1" patientName="Pat Smith" />)

    const input = await screen.findByLabelText("Carer's email")
    await user.type(input, 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Add carer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/not a valid email/)

    await user.clear(input)
    await user.type(input, 'PAT@example.com')
    await user.click(screen.getByRole('button', { name: 'Add carer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/patient's own email/)

    expect(setPatientCarerEmailsMock).not.toHaveBeenCalled()
  })

  it('adds a typed email, lower-cased, and clears the input', async () => {
    getDocMock.mockResolvedValue(patientSnap({ email: 'pat@example.com', carerEmails: ['other@example.com'] }))
    const user = userEvent.setup()
    render(<AdminCarerAccess patientUid="p1" patientName="Pat Smith" />)

    const input = await screen.findByLabelText("Carer's email")
    await user.type(input, ' New.Carer@Example.com ')
    await user.click(screen.getByRole('button', { name: 'Add carer' }))

    await waitFor(() =>
      expect(setPatientCarerEmailsMock).toHaveBeenCalledWith('p1', ['other@example.com', 'new.carer@example.com'], 'tok')
    )
    await waitFor(() => expect(input).toHaveValue(''))
    expect(screen.getByText('new.carer@example.com')).toBeInTheDocument()
  })

  it('asks for confirmation before removing, then saves the list without that email', async () => {
    getDocMock.mockResolvedValue(
      patientSnap({ email: 'pat@example.com', carerEmails: ['carer@example.com', 'other@example.com'] })
    )
    const user = userEvent.setup()
    render(<AdminCarerAccess patientUid="p1" patientName="Pat Smith" />)

    await user.click(await screen.findByRole('button', { name: /remove carer access for other@example.com/i }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('other@example.com will no longer be able to see')
    expect(setPatientCarerEmailsMock).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: 'Remove access' }))

    await waitFor(() => expect(setPatientCarerEmailsMock).toHaveBeenCalledWith('p1', ['carer@example.com'], 'tok'))
    await waitFor(() => expect(screen.queryByText('other@example.com')).not.toBeInTheDocument())
    expect(showMock).toHaveBeenCalledWith('Carer access removed.', 'success')
  })

  it('shows an error toast when the save fails', async () => {
    getDocMock.mockResolvedValue(patientSnap({ email: 'pat@example.com', carerEmails: [] }))
    setPatientCarerEmailsMock.mockRejectedValue(new Error('Unauthorized'))
    const user = userEvent.setup()
    render(<AdminCarerAccess patientUid="p1" patientName="Pat Smith" />)

    await user.type(await screen.findByLabelText("Carer's email"), 'carer@example.com')
    await user.click(screen.getByRole('button', { name: 'Add carer' }))

    await waitFor(() => expect(showMock).toHaveBeenCalledWith('Could not update carer access. Try again.', 'error'))
    expect(screen.getByText('No carers yet.')).toBeInTheDocument()
  })

  it('hides the add form once the maximum is reached', async () => {
    getDocMock.mockResolvedValue(
      patientSnap({
        email: 'pat@example.com',
        carerEmails: Array.from({ length: 5 }, (_, i) => `carer${i}@example.com`),
      })
    )
    render(<AdminCarerAccess patientUid="p1" patientName="Pat Smith" />)

    expect(await screen.findByText(/maximum of 5 carers/)).toBeInTheDocument()
    expect(screen.queryByLabelText("Carer's email")).not.toBeInTheDocument()
  })
})
