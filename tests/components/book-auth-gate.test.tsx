import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => () => {}),
}))
vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('@/components/auth-panel', () => ({ AuthPanel: () => null }))
vi.mock('@/components/cal-embed', () => ({ CalEmbed: () => null }))

import { BookAuthGate } from '@/components/book-auth-gate'

describe('BookAuthGate', () => {
  it('shows a SkeletonForm while checking the account', () => {
    const { container } = render(<BookAuthGate />)
    expect(container.querySelector('.skeleton-form')).toBeInTheDocument()
  })
})
