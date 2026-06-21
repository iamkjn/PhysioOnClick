import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

// Next.js Link renders as <a> in tests — no mock needed
import TermsPage from '@/app/terms/page'

describe('Terms & Conditions page', () => {
  it('renders all 9 required section headings', () => {
    render(<TermsPage />)

    const headings = [
      'Who we are',
      'Nature of the service',
      'Geographic scope',
      'Limitations of online assessment',
      'Payment & cancellation',
      'Data & privacy',
      'Emergency situations',
      'Governing law',
      'Changes to these terms',
    ]

    for (const heading of headings) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
  })

  it('contains contact email and links to policy pages', () => {
    render(<TermsPage />)

    expect(screen.getByRole('link', { name: /hello@physioonclick\.co\.uk/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cancellation policy/i })).toHaveAttribute('href', '/cancellation-policy')
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy-policy')
  })
})
