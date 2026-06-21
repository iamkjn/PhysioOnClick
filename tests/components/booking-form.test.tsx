import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock Next.js navigation (BookingForm uses no router, but firebase import chain may need it)
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
  usePathname: () => '/',
}))

// Prevent real Firebase connections
vi.mock('@/lib/firebase', () => ({
  auth: null,
  db: null,
  storage: null,
}))

import { BookingForm } from '@/components/booking-form'

describe('BookingForm consent checkbox', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('shows error and does not call fetch when consent is unchecked', async () => {
    const user = userEvent.setup()
    render(<BookingForm />)

    // Fill required fields
    await user.type(screen.getByPlaceholderText('Jane Smith'), 'Jane Smith')
    await user.type(screen.getByPlaceholderText('jane@example.com'), 'jane@example.com')
    // Service select has no label association — query by its default option value
    await user.selectOptions(screen.getByDisplayValue('Select a service…'), 'Musculoskeletal Physiotherapy')

    // Date input: query by type since there's no id/htmlFor association
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await user.type(dateInput, dateStr)

    // Time select has no label association — query by its default option value
    await user.selectOptions(screen.getByDisplayValue('Select a time…'), '09:00')

    // Submit without checking consent
    await user.click(screen.getByRole('button', { name: /request appointment/i }))

    expect(global.fetch).not.toHaveBeenCalled()
    expect(screen.getByText(/please confirm your consent/i)).toBeInTheDocument()
  })

  it('calls fetch with consent: true when consent is checked', async () => {
    const user = userEvent.setup()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, appointmentLabel: 'Mon 1 Jan 2026 09:00', meetLink: '' }), { status: 200 })
    )

    render(<BookingForm />)

    await user.type(screen.getByPlaceholderText('Jane Smith'), 'Jane Smith')
    await user.type(screen.getByPlaceholderText('jane@example.com'), 'jane@example.com')
    await user.selectOptions(screen.getByDisplayValue('Select a service…'), 'Musculoskeletal Physiotherapy')

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await user.type(dateInput, dateStr)

    await user.selectOptions(screen.getByDisplayValue('Select a time…'), '09:00')

    // Check consent
    await user.click(screen.getByRole('checkbox'))

    await user.click(screen.getByRole('button', { name: /request appointment/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/booking',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"consent":true'),
        })
      )
    })
  })

  it('resets consent to unchecked after booking another appointment', async () => {
    const user = userEvent.setup()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, appointmentLabel: 'Mon 1 Jan 2026 09:00', meetLink: '' }), { status: 200 })
    )

    render(<BookingForm />)

    await user.type(screen.getByPlaceholderText('Jane Smith'), 'Jane Smith')
    await user.type(screen.getByPlaceholderText('jane@example.com'), 'jane@example.com')
    await user.selectOptions(screen.getByDisplayValue('Select a service…'), 'Musculoskeletal Physiotherapy')

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await user.type(dateInput, dateStr)

    await user.selectOptions(screen.getByDisplayValue('Select a time…'), '09:00')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /request appointment/i }))

    // Wait for success state
    await waitFor(() => screen.getByRole('button', { name: /book another appointment/i }))

    await user.click(screen.getByRole('button', { name: /book another appointment/i }))

    // Consent checkbox should be unchecked again
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  it('renders consent checkbox with Privacy Policy link', () => {
    render(<BookingForm />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy-policy')
  })
})
