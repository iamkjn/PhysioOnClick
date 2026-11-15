import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const applyActionCode = vi.fn()
const resetCaredForCache = vi.fn()
let search = new URLSearchParams('oobCode=CODE1')

const user = {
  reload: vi.fn(async () => {}),
  getIdToken: vi.fn(async () => 'fresh'),
  emailVerified: true,
}
const authMock: { currentUser: typeof user | null; authStateReady: () => Promise<void> } = {
  currentUser: user,
  authStateReady: async () => {},
}

vi.mock('next/navigation', () => ({ useSearchParams: () => search }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))
vi.mock('firebase/auth', () => ({ applyActionCode: (...a: unknown[]) => applyActionCode(...a) }))
vi.mock('@/lib/firebase', () => ({ get auth() { return authMock } }))
vi.mock('@/hooks/use-cared-for-patients', () => ({ resetCaredForCache: () => resetCaredForCache() }))

import VerifyEmailPage from '@/app/auth/verify-email/page'

beforeEach(() => {
  search = new URLSearchParams('oobCode=CODE1')
  applyActionCode.mockReset().mockResolvedValue(undefined)
  resetCaredForCache.mockClear()
  user.reload.mockClear()
  user.getIdToken.mockClear()
  user.emailVerified = true
  authMock.currentUser = user
})

describe('/auth/verify-email', () => {
  it('applies the code and refreshes the signed-in user’s token so carer access unlocks now', async () => {
    render(<VerifyEmailPage />)
    expect(await screen.findByRole('heading', { name: 'Email confirmed' })).toBeInTheDocument()
    expect(applyActionCode).toHaveBeenCalledWith(authMock, 'CODE1')
    expect(user.reload).toHaveBeenCalled()
    expect(user.getIdToken).toHaveBeenCalledWith(true)
    expect(resetCaredForCache).toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Go to my home page' })).toHaveAttribute('href', '/')
  })

  it('confirms without a session too (link opened on another device) and offers sign-in', async () => {
    authMock.currentUser = null
    render(<VerifyEmailPage />)
    expect(await screen.findByRole('heading', { name: 'Email confirmed' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/patient')
  })

  it('treats a reused code as success when the account is already verified', async () => {
    applyActionCode.mockRejectedValue(new Error('auth/invalid-action-code'))
    render(<VerifyEmailPage />)
    expect(await screen.findByRole('heading', { name: 'Email confirmed' })).toBeInTheDocument()
  })

  it('shows an expired-link message for a bad code on an unverified account', async () => {
    applyActionCode.mockRejectedValue(new Error('auth/expired-action-code'))
    user.emailVerified = false
    render(<VerifyEmailPage />)
    expect(await screen.findByRole('heading', { name: 'This link has expired' })).toBeInTheDocument()
  })

  it('shows the expired message when there is no code at all', async () => {
    search = new URLSearchParams('')
    render(<VerifyEmailPage />)
    expect(await screen.findByRole('heading', { name: 'This link has expired' })).toBeInTheDocument()
    expect(applyActionCode).not.toHaveBeenCalled()
  })
})
