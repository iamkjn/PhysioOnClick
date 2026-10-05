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

  it('covers the home-visit address: what, why, retention', () => {
    const { container } = render(<PrivacyPolicyPage />)
    const text = container.textContent ?? ''
    expect(text).toMatch(/Home address \(home visits only\)/)
    expect(text).toMatch(/address line and postcode/)
    expect(text).toMatch(/attend your appointment/)
    expect(text).toMatch(/Home visit address:.*12 months after the last interaction/)
    expect(text).toMatch(/Cal\.com:.*includes the visit address/)
    expect(text).toMatch(/visit address is also recorded against your payment/)
    expect(text).toMatch(/Resend:.*payment receipt email includes the visit address/)
    // The assessment-link email has no live caller (assessment is collected
    // before payment), so the policy must not list it.
    expect(text).not.toMatch(/assessment link and reminder/)
    expect(text).toMatch(/booking record and payment record/)
    expect(text).toMatch(/October 2026/)
  })

  it('covers Ideal Postcodes processor and saved addresses retention', () => {
    const { container } = render(<PrivacyPolicyPage />)
    const text = container.textContent ?? ''
    expect(text).toMatch(/Ideal Postcodes.*when you look up a home-visit address.*postcode you enter.*address you choose.*sent to Ideal Postcodes/)
    expect(text).toMatch(/Saved addresses.*addresses you save to your address book.*kept until you delete them or close your account.*Past bookings keep their own copy/)
  })
})
