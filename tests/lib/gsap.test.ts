import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('prefersReducedMotion', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns false when the OS has no motion preference', async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia

    const { prefersReducedMotion } = await import('@/lib/gsap')
    expect(prefersReducedMotion()).toBe(false)
  })

  it('returns true when the OS requests reduced motion', async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia

    const { prefersReducedMotion } = await import('@/lib/gsap')
    expect(prefersReducedMotion()).toBe(true)
  })

  it('re-exports gsap and ScrollTrigger', async () => {
    const mod = await import('@/lib/gsap')
    expect(mod.gsap).toBeDefined()
    expect(mod.ScrollTrigger).toBeDefined()
  })
})
