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
    expect(document.querySelector('.skeleton')).not.toBeInTheDocument()
  })
})
