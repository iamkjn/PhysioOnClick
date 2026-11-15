import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getDependentsMock = vi.fn()
vi.mock('@/lib/dependents', () => ({
  getDependents: (...args: unknown[]) => getDependentsMock(...args),
}))

import { PersonSwitcher } from '@/components/person-switcher'
import { PersonProvider, usePatientTarget } from '@/components/person-provider'

function TargetProbe({ uid }: { uid: string }) {
  const t = usePatientTarget(uid, 'Krunal')
  return <output data-testid="target">{t ? `${t.mode}:${t.ownerUid}/${t.personId}` : ''}</output>
}

describe('PersonSwitcher', () => {
  it('shows a skeleton pill while loading, then the select once resolved', async () => {
    let resolveDeps: (v: unknown[]) => void = () => {}
    getDependentsMock.mockReturnValue(new Promise((resolve) => { resolveDeps = resolve }))

    render(<PersonSwitcher uid="u1" displayName="Jane" onSelect={vi.fn()} alwaysShow />)
    expect(document.querySelector('.skeleton')).toBeInTheDocument()

    resolveDeps([])

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    expect(screen.getByText('Booking session for:')).toBeInTheDocument()
    expect(document.querySelector('.skeleton')).not.toBeInTheDocument()
  })

  it('resolves an admin deep-linked dependent after dependents finish loading', async () => {
    const onSelect = vi.fn()
    let resolveDeps: (v: unknown[]) => void = () => {}
    getDependentsMock.mockReturnValue(new Promise((resolve) => { resolveDeps = resolve }))

    render(
      <PersonSwitcher
        uid="owner-1"
        displayName="Seena Nayak"
        initialPersonId="dep-anish"
        onSelect={onSelect}
        alwaysShow
      />
    )

    resolveDeps([{ id: 'dep-anish', name: 'anish nayak', relationship: 'Husband' }])

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('dep-anish', 'Anish Nayak')
    })
    expect(screen.getByRole('combobox')).toHaveValue('dep-anish')
  })

  describe('carer access', () => {
    beforeEach(() => window.localStorage.clear())

    it('offers a "Caring for" option and switches the shared target to the patient’s record', async () => {
      getDependentsMock.mockResolvedValue([])
      const onSelect = vi.fn()
      render(
        <PersonProvider>
          <PersonSwitcher
            uid="carer-1"
            displayName="Krunal"
            label="Viewing recovery for:"
            onSelect={onSelect}
            caredFor={[{ uid: 'patient-1', name: 'Mary Smith', relationship: 'Partner' }]}
          />
          <TargetProbe uid="carer-1" />
        </PersonProvider>
      )

      const select = await screen.findByRole('combobox')
      expect(screen.getByRole('group', { name: 'Caring for' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Mary Smith (Partner)' })).toBeInTheDocument()

      fireEvent.change(select, { target: { value: 'carer:patient-1' } })

      expect(onSelect).toHaveBeenCalledWith('patient-1', 'Mary Smith')
      expect(screen.getByTestId('target')).toHaveTextContent('carer:patient-1/patient-1')

      fireEvent.change(select, { target: { value: 'carer-1' } })
      expect(screen.getByTestId('target')).toHaveTextContent('self:carer-1/carer-1')
    })

    it('shows even with no dependents when the user cares for someone', async () => {
      getDependentsMock.mockResolvedValue([])
      render(
        <PersonProvider>
          <PersonSwitcher uid="carer-1" displayName="Krunal" onSelect={vi.fn()} caredFor={[{ uid: 'p1', name: 'Mary', relationship: '' }]} />
        </PersonProvider>
      )
      expect(await screen.findByRole('combobox')).toBeInTheDocument()
    })

    it('leaves carer mode when the stored patient is no longer in the cared-for list', async () => {
      window.localStorage.setItem(
        'pooc:activePerson',
        JSON.stringify({ personId: null, personName: '', careForUid: 'revoked', careForName: 'Old', careForViewerUid: 'carer-1' })
      )
      getDependentsMock.mockResolvedValue([])
      render(
        <PersonProvider>
          <PersonSwitcher uid="carer-1" displayName="Krunal" onSelect={vi.fn()} alwaysShow caredFor={[]} />
          <TargetProbe uid="carer-1" />
        </PersonProvider>
      )
      await waitFor(() => expect(screen.getByTestId('target')).toHaveTextContent('self:carer-1/carer-1'))
      expect(JSON.parse(window.localStorage.getItem('pooc:activePerson')!).careForUid).toBeNull()
    })

    it('pages without carer support never show carer options (booking, admin)', async () => {
      getDependentsMock.mockResolvedValue([{ id: 'dep-1', name: 'kid', relationship: 'Child' }])
      render(
        <PersonProvider>
          <PersonSwitcher uid="carer-1" displayName="Krunal" onSelect={vi.fn()} />
        </PersonProvider>
      )
      await screen.findByRole('combobox')
      expect(screen.queryByRole('group', { name: 'Caring for' })).not.toBeInTheDocument()
    })
  })
})
