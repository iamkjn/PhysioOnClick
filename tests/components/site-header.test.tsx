import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null }))
vi.mock('@/lib/gsap', () => ({
  gsap: { to: vi.fn() },
  ScrollTrigger: {},
  prefersReducedMotion: () => false,
}))
const nav = vi.hoisted(() => ({ pathname: '/' }))
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

import { SiteHeader } from '@/components/site-header'

describe('SiteHeader', () => {
  beforeEach(() => {
    nav.pathname = '/'
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

  it('renders a real nav-underline element inside the active link', () => {
    render(<SiteHeader />)
    const primaryNav = screen.getByRole('navigation', { name: 'Primary' })
    const homeLink = primaryNav.querySelector('a[href="/"]')
    expect(homeLink?.querySelector('.nav-underline')).toBeInTheDocument()
  })

  it('does not throw when hovering a non-active nav link', () => {
    render(<SiteHeader />)
    const primaryNav = screen.getByRole('navigation', { name: 'Primary' })
    const aboutLink = primaryNav.querySelector('a[href="/about"]')
    expect(aboutLink).toBeInTheDocument()
    expect(() => {
      fireEvent.mouseEnter(aboutLink!)
      fireEvent.mouseLeave(aboutLink!)
    }).not.toThrow()
    expect(aboutLink).toBeInTheDocument()
  })

  it('has a Self-checks link to /exercises/tests directly after Exercises', () => {
    render(<SiteHeader />)
    const primaryNav = screen.getByRole('navigation', { name: 'Primary' })
    const hrefs = Array.from(primaryNav.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    const i = hrefs.indexOf('/exercises')
    expect(hrefs[i + 1]).toBe('/exercises/tests')
    expect(primaryNav.querySelector('a[href="/exercises/tests"]')?.textContent).toContain('Self-checks')
  })

  it('highlights only Self-checks on /exercises/tests/full-can-test', () => {
    nav.pathname = '/exercises/tests/full-can-test'
    render(<SiteHeader />)
    const primaryNav = screen.getByRole('navigation', { name: 'Primary' })
    expect(primaryNav.querySelector('a[href="/exercises/tests"]')?.className).toContain('active')
    expect(primaryNav.querySelector('a[href="/exercises"]')?.className).not.toContain('active')
  })

  it('highlights only Exercises on /exercises/wall-slide', () => {
    nav.pathname = '/exercises/wall-slide'
    render(<SiteHeader />)
    const primaryNav = screen.getByRole('navigation', { name: 'Primary' })
    expect(primaryNav.querySelector('a[href="/exercises"]')?.className).toContain('active')
    expect(primaryNav.querySelector('a[href="/exercises/tests"]')?.className).not.toContain('active')
  })
})
