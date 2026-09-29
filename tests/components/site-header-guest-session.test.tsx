import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Guest checkout (lib/guest-booking.ts) leaves an anonymous Firebase session
// behind. The header must treat it as signed out: no "Sign out", and no
// poc-auth cookie (which would make `/` render the patient dashboard loader).

let authStateCallback: ((user: unknown) => void) | null = null

vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, callback: (user: unknown) => void) => {
    authStateCallback = callback
    return () => {}
  },
  signOut: vi.fn(),
}))
vi.mock('@/components/notification-bell', () => ({ NotificationBell: () => null }))
vi.mock('@/lib/gsap', () => ({
  gsap: { to: vi.fn() },
  ScrollTrigger: {},
  prefersReducedMotion: () => false,
}))
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

import { SiteHeader } from '@/components/site-header'

afterEach(() => {
  authStateCallback = null
  document.cookie = 'poc-auth=; path=/; max-age=0'
})

async function renderWithUser(user: unknown) {
  render(<SiteHeader />)
  await waitFor(() => expect(authStateCallback).not.toBeNull())
  act(() => authStateCallback!(user))
}

describe('SiteHeader with a guest-checkout session', () => {
  it('shows the signed-out header and sets no poc-auth cookie for an anonymous session', async () => {
    await renderWithUser({ uid: 'anon-1', isAnonymous: true })
    expect(screen.queryAllByText('Sign out')).toHaveLength(0)
    expect(document.cookie).not.toContain('poc-auth=1')
  })

  it('still shows the signed-in header and cookie for a real account', async () => {
    await renderWithUser({ uid: 'u-1', isAnonymous: false, email: 'pat@example.com' })
    expect((await screen.findAllByText('Sign out')).length).toBeGreaterThan(0)
    expect(document.cookie).toContain('poc-auth=1')
  })
})
