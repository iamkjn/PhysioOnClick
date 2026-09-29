import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// /book/success: a guest-checkout booking (anonymous session, see
// lib/guest-booking.ts) is offered the existing magic link to claim an
// account; everyone else sees the page exactly as before.

const authMock = vi.hoisted(() => ({
  authStateReady: () => Promise.resolve(),
  currentUser: null as unknown,
}))

vi.mock('@/lib/firebase', () => ({
  auth: authMock,
  db: null,
  firebaseApp: null,
  firebaseMeasurementId: '',
}))
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => (key === 'session_id' ? 'cs_1' : null) }),
}))

import BookingSuccessPage from '@/app/book/success/page'

let magicLinkResponse: { status: number; body: Record<string, unknown> }
const fetchMock = vi.fn(async (url: string) => {
  if (String(url).startsWith('/api/checkout/status')) {
    return new Response(JSON.stringify({ status: 'paid' }), { status: 200 })
  }
  if (String(url) === '/api/auth/magic-link') {
    return new Response(JSON.stringify(magicLinkResponse.body), { status: magicLinkResponse.status })
  }
  return new Response('{}', { status: 404 })
})

beforeEach(() => {
  authMock.currentUser = null
  magicLinkResponse = { status: 200, body: { ok: true } }
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockClear()
  window.localStorage.clear()
})

function asGuest() {
  authMock.currentUser = { uid: 'anon-1', isAnonymous: true }
  window.localStorage.setItem('poc-guest-booking', JSON.stringify({ uid: 'anon-1', email: 'alex@example.com' }))
}

describe('Booking success page', () => {
  it('offers a guest the magic link to save their booking to an account', async () => {
    asGuest()
    render(<BookingSuccessPage />)

    expect(await screen.findByRole('heading', { name: 'Save your booking to an account' })).toBeInTheDocument()
    expect(screen.getByText('alex@example.com')).toBeInTheDocument()
    // No portal link a guest can't use yet; receipt is still there.
    expect(screen.queryByRole('link', { name: 'View my appointments' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View / print your receipt' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }))

    const call = fetchMock.mock.calls.find(([url]) => url === '/api/auth/magic-link')
    expect(call).toBeDefined()
    expect(JSON.parse(String((call![1] as RequestInit).body))).toEqual({
      email: 'alex@example.com',
      returnTo: '/patient',
    })
    expect(await screen.findByRole('status')).toHaveTextContent(/Open the link in this browser/)
  })

  it('shows the magic-link error and lets the guest retry', async () => {
    asGuest()
    magicLinkResponse = { status: 429, body: { error: 'Please wait a moment before requesting another link.' } }
    render(<BookingSuccessPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Email me a sign-in link' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Please wait a moment')
    expect(screen.getByRole('button', { name: 'Email me a sign-in link' })).toBeEnabled()
  })

  it('is unchanged for a signed-in account holder', async () => {
    authMock.currentUser = { uid: 'u-1', isAnonymous: false }
    render(<BookingSuccessPage />)

    expect(await screen.findByRole('link', { name: 'View my appointments' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveClass('book-result-btn')
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Save your booking to an account' })).not.toBeInTheDocument(),
    )
  })

  it('does not offer the claim to an anonymous session with no guest booking record', async () => {
    authMock.currentUser = { uid: 'anon-2', isAnonymous: true }
    render(<BookingSuccessPage />)

    expect(await screen.findByRole('link', { name: 'View my appointments' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Save your booking to an account' })).not.toBeInTheDocument()
  })
})
