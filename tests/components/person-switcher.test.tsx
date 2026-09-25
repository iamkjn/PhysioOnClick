import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getDependentsMock = vi.fn()
vi.mock('@/lib/dependents', () => ({
  getDependents: (...args: unknown[]) => getDependentsMock(...args),
}))

import { PersonSwitcher } from '@/components/person-switcher'

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
})
