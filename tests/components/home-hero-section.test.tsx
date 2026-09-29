import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

let authStateCallback: ((user: any) => void) | null = null

vi.mock('@/lib/firebase', () => ({
  auth: { /* mock auth object */ },
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth: any, callback: (user: any) => void) => {
    authStateCallback = callback
    // Don't call the callback immediately — force the component to stay in resolving state
    return () => {}
  },
}))

vi.mock('@/components/toast-provider', () => ({ useToast: () => ({ show: vi.fn() }) }))
vi.mock('@/components/home-dashboard', () => ({ HomeDashboard: () => <div>Dashboard</div> }))

import { HomeHeroSection } from '@/components/home-hero-section'

describe('HomeHeroSection', () => {
  it('shows the marketing hero immediately while auth is resolving (SSR-visible H1/CTAs)', () => {
    render(<HomeHeroSection founderName="Jane" />)
    expect(screen.getByText('Expert Physiotherapy,')).toBeInTheDocument()
    expect(document.querySelector('.skeleton-hero')).not.toBeInTheDocument()
  })

  // Guest checkout (lib/guest-booking.ts) leaves an anonymous Firebase session
  // behind; it must get the marketing hero, not an empty patient dashboard.
  it('keeps the marketing hero for an anonymous guest-checkout session', async () => {
    authStateCallback = null
    render(<HomeHeroSection founderName="Jane" />)
    await waitFor(() => expect(authStateCallback).not.toBeNull())
    act(() => authStateCallback!({ uid: 'anon-1', isAnonymous: true }))
    expect(screen.getByText('Expert Physiotherapy,')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('still shows the dashboard for a real signed-in account', async () => {
    authStateCallback = null
    render(<HomeHeroSection founderName="Jane" />)
    await waitFor(() => expect(authStateCallback).not.toBeNull())
    act(() => authStateCallback!({ uid: 'u-1', isAnonymous: false }))
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
  })
})
