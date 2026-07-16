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
    expect(screen.getAllByText(/Google Firebase/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Cal\.com/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Google Calendar \/ Google Meet/)).toBeInTheDocument()
  })
})
