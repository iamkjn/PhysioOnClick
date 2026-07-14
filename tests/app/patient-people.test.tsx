import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((_auth, cb) => {
    cb({ uid: 'u1', displayName: 'Jane', email: 'jane@example.com' });
    return () => {};
  }),
}))

const getDependentsMock = vi.fn()
vi.mock('@/lib/dependents', () => ({
  getDependents: (...args: unknown[]) => getDependentsMock(...args),
  addDependent: vi.fn(),
  updateDependent: vi.fn(),
  deleteDependent: vi.fn(),
}))

import PeoplePage from '@/app/patient/people/page'

describe('PeoplePage', () => {
  it('shows skeleton person cards while dependents are loading', async () => {
    let resolveDeps: (v: unknown[]) => void = () => {}
    getDependentsMock.mockReturnValue(new Promise((resolve) => { resolveDeps = resolve }))

    const { container } = render(<PeoplePage />)
    expect(container.querySelectorAll('.skeleton-person-card').length).toBeGreaterThan(0)

    resolveDeps([])
    await waitFor(() => {
      expect(container.querySelectorAll('.skeleton-person-card').length).toBe(0)
    })
  })
})
