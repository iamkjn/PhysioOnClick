import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { User } from 'firebase/auth'

// CalEmbed reads NEXT_PUBLIC_CAL_USERNAME at render time; stub it so the real
// iframe renders (rather than the "not configured" fallback) and we can
// inspect the prefill query string it builds.
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_CAL_USERNAME', 'physio-on-click-test')
})
afterEach(() => {
  vi.unstubAllEnvs()
})

const authState: { callback?: (user: User | null) => void } = {}

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth: unknown, callback: (user: User | null) => void) => {
    authState.callback = callback
    return vi.fn()
  }),
}))
vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('@/components/auth-panel', () => ({ AuthPanel: () => <div data-testid="auth-panel" /> }))

import { BookAuthGate } from '@/components/book-auth-gate'

describe('BookAuthGate', () => {
  it('shows a SkeletonForm while checking the account', () => {
    const { container } = render(<BookAuthGate />)
    expect(container.querySelector('.skeleton-form')).toBeInTheDocument()
  })

  it('renders AuthPanel once auth resolves to signed-out', async () => {
    render(<BookAuthGate />)
    const authCallback = authState.callback
    if (!authCallback) {
      throw new Error('expected onAuthStateChanged callback to be captured')
    }
    authCallback(null)

    await waitFor(() => {
      expect(screen.getByTestId('auth-panel')).toBeInTheDocument()
    })
  })

  it('renders CalEmbed with the signed-in user prefilled into the iframe src', async () => {
    render(<BookAuthGate />)
    const authCallback = authState.callback
    if (!authCallback) {
      throw new Error('expected onAuthStateChanged callback to be captured')
    }
    authCallback({ displayName: 'Jane Doe', email: 'jane+test@example.com' } as User)

    await waitFor(() => {
      expect(document.querySelector('iframe')).toBeInTheDocument()
    })
    const iframe = document.querySelector('iframe') as HTMLIFrameElement
    const src = new URL(iframe.src)
    expect(src.searchParams.get('name')).toBe('Jane Doe')
    expect(src.searchParams.get('email')).toBe('jane+test@example.com')
  })

  it('omits the name param instead of sending "null" when displayName is null', async () => {
    render(<BookAuthGate />)
    const authCallback = authState.callback
    if (!authCallback) {
      throw new Error('expected onAuthStateChanged callback to be captured')
    }
    authCallback({ displayName: null, email: 'no-name@example.com' } as User)

    await waitFor(() => {
      expect(document.querySelector('iframe')).toBeInTheDocument()
    })
    const iframe = document.querySelector('iframe') as HTMLIFrameElement
    expect(iframe.src).not.toContain('null')
    const src = new URL(iframe.src)
    expect(src.searchParams.has('name')).toBe(false)
    expect(src.searchParams.get('email')).toBe('no-name@example.com')
  })
})
