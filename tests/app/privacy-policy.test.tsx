import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import PrivacyPolicyPage from '@/app/privacy-policy/page'

describe('Privacy Policy page', () => {
  it('renders all 8 required section headings', () => {
    render(<PrivacyPolicyPage />)

    const headings = [
      'Who we are',
      'What data we collect',
      'Lawful basis for processing',
      'Third-party processors',
      'Data retention',
      'Your rights',
      'Cookies',
      'Complaints',
    ]

    for (const heading of headings) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
  })

  it('names all required third-party processors including Google Calendar', () => {
    render(<PrivacyPolicyPage />)

    // These text matches verify all required third-party processors are named
    expect(screen.getByText((content, element) =>
      element?.tagName === 'STRONG' && /Google Firebase/i.test(content)
    )).toBeInTheDocument()
    expect(screen.getByText((content, element) =>
      element?.tagName === 'STRONG' && /Stripe/i.test(content)
    )).toBeInTheDocument()
    expect(screen.getByText((content, element) =>
      element?.tagName === 'STRONG' && /Cal\.com/i.test(content)
    )).toBeInTheDocument()
    expect(screen.getByText((content, element) =>
      /Google Calendar/i.test(content) && /Google Meet/i.test(element?.textContent || '')
    )).toBeInTheDocument()
  })
})
