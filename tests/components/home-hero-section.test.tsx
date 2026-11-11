import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

type MockUser = { uid: string; isAnonymous: boolean } | null
let authStateCallback: ((user: MockUser) => void) | null = null

vi.mock('@/lib/firebase', () => ({
  auth: { /* mock auth object */ },
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, callback: (user: MockUser) => void) => {
    authStateCallback = callback
    // Don't call the callback immediately — force the component to stay in resolving state
    return () => {}
  },
}))

vi.mock('@/components/toast-provider', () => ({ useToast: () => ({ show: vi.fn() }) }))
vi.mock('@/components/home-dashboard', () => ({ HomeDashboard: () => <div>Dashboard</div> }))

import { HomeHeroSection } from '@/components/home-hero-section'

const props = { founderName: 'Jane', homeVisitPrice: '£80', videoPrice: '£40' }

describe('HomeHeroSection', () => {
  it('shows the marketing hero immediately while auth is resolving (SSR-visible H1/CTAs)', () => {
    render(<HomeHeroSection {...props} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Physiotherapy at home in Glasgow')
    expect(document.querySelector('.skeleton-hero')).not.toBeInTheDocument()
  })

  it('leads with Glasgow home visits, including neurological rehabilitation', () => {
    render(<HomeHeroSection {...props} />)
    expect(screen.getByText('Home visits in Glasgow · Evenings & weekends')).toBeInTheDocument()
    const copy = document.querySelector('.home-hero-copy')?.textContent ?? ''
    expect(copy).toContain('Jane, an HCPC registered physiotherapist, comes to your home')
    expect(copy).toContain('neurological rehabilitation')
    expect(copy).toContain('Home assessment £80')
    expect(copy.indexOf('Home assessment £80')).toBeLessThan(copy.indexOf('£40 by video anywhere in the UK'))
  })

  it('books a home visit first and makes the home-visits page prominent', () => {
    render(<HomeHeroSection {...props} />)
    const book = screen.getByRole('link', { name: 'Book a home visit' })
    expect(book).toHaveAttribute('href', '/book?visit=home')
    expect(book).toHaveClass('button', 'primary')
    const homeVisits = screen.getByRole('link', { name: 'Check areas & prices' })
    expect(homeVisits).toHaveAttribute('href', '/physiotherapy-home-visits-glasgow')
    expect(homeVisits).toHaveClass('button')
  })

  it('offers video across the UK as the second option', () => {
    render(<HomeHeroSection {...props} />)
    expect(screen.getByRole('link', { name: 'Outside Glasgow? See how video appointments work' })).toHaveAttribute(
      'href',
      '/how-online-physiotherapy-works'
    )
  })

  it('never implies a clinic or premises', () => {
    render(<HomeHeroSection {...props} />)
    const hero = document.querySelector('.home-hero')?.textContent ?? ''
    expect(hero).not.toMatch(/clinic|premises|visit us/i)
  })

  // Guest checkout (lib/guest-booking.ts) leaves an anonymous Firebase session
  // behind; it must get the marketing hero, not an empty patient dashboard.
  it('keeps the marketing hero for an anonymous guest-checkout session', async () => {
    authStateCallback = null
    render(<HomeHeroSection {...props} />)
    await waitFor(() => expect(authStateCallback).not.toBeNull())
    act(() => authStateCallback!({ uid: 'anon-1', isAnonymous: true }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Physiotherapy at home in Glasgow')
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('still shows the dashboard for a real signed-in account', async () => {
    authStateCallback = null
    render(<HomeHeroSection {...props} />)
    await waitFor(() => expect(authStateCallback).not.toBeNull())
    act(() => authStateCallback!({ uid: 'u-1', isAnonymous: false }))
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
  })
})
