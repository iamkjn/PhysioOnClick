import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

// Use vi.hoisted so FirebaseError is available when vi.mock factories are hoisted
const { FirebaseError } = vi.hoisted(() => {
  class FirebaseError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  }
  return { FirebaseError }
})

// Must mock firebase/app BEFORE importing the page (component uses FirebaseError from firebase/app)
vi.mock('firebase/app', () => ({ FirebaseError }))

// Must mock firebase/auth BEFORE importing the page
vi.mock('firebase/auth', () => ({
  isSignInWithEmailLink: vi.fn(),
  signInWithEmailLink: vi.fn(),
  FirebaseError,
}))

vi.mock('@/lib/firebase', () => ({ auth: {} }))

vi.mock('@/lib/patient-account', () => ({
  ensurePatientRecord: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({
    get: (key: string) => key === 'email' ? 'jane@example.com' : null,
  }),
}))

// Mock fetch for /api/auth/link-bookings (non-blocking)
global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))

import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import VerifyPageWrapper from '@/app/auth/verify/page'

describe('Auth verify page', () => {
  it('shows error when link is not a valid sign-in link', async () => {
    vi.mocked(isSignInWithEmailLink).mockReturnValue(false)

    render(<VerifyPageWrapper />)

    await waitFor(() => {
      expect(screen.getByText(/not a valid sign-in link/i)).toBeInTheDocument()
    })
  })

  it('shows error when signInWithEmailLink rejects with expired code', async () => {
    vi.mocked(isSignInWithEmailLink).mockReturnValue(true)
    vi.mocked(signInWithEmailLink).mockRejectedValue(
      new FirebaseError('auth/expired-action-code', 'expired')
    )

    render(<VerifyPageWrapper />)

    await waitFor(() => {
      expect(screen.getByText(/expired or has already been used/i)).toBeInTheDocument()
    })
  })

  it('shows success when signInWithEmailLink resolves', async () => {
    vi.mocked(isSignInWithEmailLink).mockReturnValue(true)
    vi.mocked(signInWithEmailLink).mockResolvedValue({
      user: {
        displayName: 'Jane Smith',
        getIdToken: vi.fn().mockResolvedValue('mock-token'),
      },
    } as never)

    render(<VerifyPageWrapper />)

    await waitFor(() => {
      expect(screen.getByText(/you are in/i)).toBeInTheDocument()
    })
  })
})
