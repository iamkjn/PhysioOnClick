import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {}, auth: null }))
vi.mock('@/components/toast-provider', () => ({ useToast: () => ({ show: vi.fn() }) }))
vi.mock('@/components/admin-add-patient', () => ({ AdminAddPatient: () => null }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))

type Doc = { id: string; data: () => Record<string, unknown> }
let patients: Doc[] = []
let dependents: Doc[] = []

vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => name,
  getDocs: async (name: string) => ({ docs: name === 'patients' ? patients : dependents }),
}))

import { AdminPatientsList } from '@/components/admin-patients-list'

function doc(id: string, data: Record<string, unknown>): Doc {
  return { id, data: () => data }
}

beforeEach(() => {
  dependents = []
  patients = [
    doc('edwin', {
      displayName: 'Edwin Argo', email: 'edwin@example.com', dob: '1963-05-14',
      carerEmails: ['thomas@example.com'],
      carerContact: { name: 'Thomas Cisecki', email: 'thomas@example.com', relationship: 'Partner' },
    }),
    // The carer signed in with their own email, which writes a bare patients doc.
    doc('thomas', { displayName: '', email: 'Thomas@Example.com', dob: '2000-01-01' }),
    doc('placeholder', { displayName: 'Pat Placeholder', email: 'pat@example.com', dob: '2000-01-01' }),
  ]
})

describe('AdminPatientsList', () => {
  it('lists a carer as the carer of their patient, named from the patient record, not as a primary account', async () => {
    render(<AdminPatientsList />)
    const list = await screen.findByRole('list', { name: 'Patients' })
    const carerRow = within(list).getByText('Thomas Cisecki').closest('a')!
    expect(carerRow).toHaveTextContent('Partner of Edwin Argo')
    expect(carerRow).toHaveTextContent('Carer')
    expect(carerRow).toHaveAttribute('href', '/admin/patients/edwin')
    expect(within(list).queryByText('Unnamed')).toBeNull()

    const metrics = screen.getByLabelText('Patient counts')
    expect(metrics).toHaveTextContent('2 primary')
    expect(metrics).toHaveTextContent('1 carer')
  })

  it('shows no age when only the placeholder date of birth is on file', async () => {
    render(<AdminPatientsList />)
    const row = (await screen.findByText('Pat Placeholder')).closest('a')!
    expect(row).not.toHaveTextContent('yrs')
    const edwin = screen.getByText('Edwin Argo', { selector: 'strong' }).closest('a')!
    expect(edwin).toHaveTextContent('yrs')
  })
})
