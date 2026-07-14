import { render, screen } from '@testing-library/react'
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
  it('shows a skeleton hero while auth is resolving, not the signed-out marketing hero', () => {
    render(<HomeHeroSection founderName="Jane" />)
    expect(screen.queryByText('Expert Physiotherapy,')).not.toBeInTheDocument()
    expect(document.querySelector('.skeleton-hero')).toBeInTheDocument()
  })
})
