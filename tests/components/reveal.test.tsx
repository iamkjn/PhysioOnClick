import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Reveal } from '@/components/reveal'

describe('Reveal', () => {
  it('renders its children', () => {
    render(<Reveal>Hello reveal</Reveal>)
    expect(screen.getByText('Hello reveal')).toBeInTheDocument()
  })

  it('applies the reveal class and forwards a custom className', () => {
    render(<Reveal className="custom">Content</Reveal>)
    const el = screen.getByText('Content')
    expect(el.className).toContain('reveal')
    expect(el.className).toContain('custom')
  })

  it('does not throw when the OS requests reduced motion', () => {
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

    expect(() => render(<Reveal direction="left">Reduced</Reveal>)).not.toThrow()
  })
})
