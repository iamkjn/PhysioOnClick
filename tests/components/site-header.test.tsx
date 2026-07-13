import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null }))
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

import { SiteHeader } from '@/components/site-header'

describe('SiteHeader', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
  })

  it('marks the Home link active on "/"', () => {
    render(<SiteHeader />)
    const primaryNav = screen.getByRole('navigation', { name: 'Primary' })
    const homeLink = primaryNav.querySelector('a[href="/"]')
    expect(homeLink?.className).toContain('active')
  })

  it('opens the mobile nav panel when the hamburger is clicked', () => {
    render(<SiteHeader />)
    const hamburger = screen.getByLabelText('Open menu')
    fireEvent.click(hamburger)
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument()
    expect(hamburger.className).toContain('hamburger--open')
    expect(document.querySelector('.mobile-nav-panel')?.className).toContain('open')
    expect(document.querySelector('.mobile-nav-backdrop')?.className).toContain('open')
  })

  it('adds header-wrap--scrolled after scrolling past 20px', () => {
    render(<SiteHeader />)
    Object.defineProperty(window, 'scrollY', { value: 40, writable: true })
    fireEvent.scroll(window)
    const header = document.querySelector('.header-wrap')
    expect(header?.className).toContain('header-wrap--scrolled')
  })
})
