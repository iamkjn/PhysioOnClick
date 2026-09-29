import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { UserCredential } from 'firebase/auth'

let searchParamsMap: Record<string, string> = { email: 'jane@example.com' }
const push = vi.fn()

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
  linkWithCredential: vi.fn(),
  signOut: vi.fn(),
  EmailAuthProvider: {
    credentialWithLink: vi.fn((email: string, link: string) => ({ kind: 'emailLink', email, link })),
  },
  FirebaseError,
}))

// The page waits for the persisted session (authStateReady) so it can tell
// whether this browser holds a guest-checkout session to upgrade.
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

vi.mock('@/lib/patient-account', () => ({
  ensurePatientRecord: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => ({
    get: (key: string) => searchParamsMap[key] ?? null,
  }),
}))

import { isSignInWithEmailLink, linkWithCredential, signInWithEmailLink, signOut } from 'firebase/auth'
import { ensurePatientRecord } from '@/lib/patient-account'
import VerifyPageWrapper from '@/app/auth/verify/page'

describe('Auth verify page', () => {
  beforeEach(() => {
    vi.mocked(isSignInWithEmailLink).mockReset()
    vi.mocked(signInWithEmailLink).mockReset()
    vi.mocked(linkWithCredential).mockReset()
    vi.mocked(signOut).mockReset()
    authMock.currentUser = null
    window.localStorage.clear()
    global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    searchParamsMap = { email: 'jane@example.com' }
    push.mockClear()
  })

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
    } as unknown as UserCredential)

    render(<VerifyPageWrapper />)

    await waitFor(() => {
      expect(screen.getByText(/you are in/i)).toBeInTheDocument()
    })
  })

  describe('post sign-in redirect destination', () => {
    beforeEach(() => {
      vi.mocked(isSignInWithEmailLink).mockReturnValue(true)
      vi.mocked(signInWithEmailLink).mockResolvedValue({
        user: {
          displayName: 'Jane Smith',
          getIdToken: vi.fn().mockResolvedValue('mock-token'),
        },
      } as unknown as UserCredential)
    })

    it('redirects to /patient by default when the link carries no returnTo', async () => {
      render(<VerifyPageWrapper />)

      await waitFor(() => {
        expect(screen.getByText(/you are in/i)).toBeInTheDocument()
      })

      await waitFor(
        () => {
          expect(push).toHaveBeenCalledWith('/patient')
        },
        { timeout: 3000 },
      )
    })

    it('redirects back to /book when the link carries an allowlisted returnTo of /book', async () => {
      searchParamsMap = { email: 'jane@example.com', returnTo: '/book' }
      render(<VerifyPageWrapper />)

      await waitFor(() => {
        expect(screen.getByText(/you are in/i)).toBeInTheDocument()
      })

      await waitFor(
        () => {
          expect(push).toHaveBeenCalledWith('/book')
        },
        { timeout: 3000 },
      )
    })

    it('redirects to /patient/assessment when the link carries an allowlisted returnTo of /patient/assessment', async () => {
      // Regression test: the assessment-link email (app/api/payments/webhook and
      // app/api/assessment/reminder-email) sets returnTo=/patient/assessment, but
      // this page's allowlist had drifted out of sync with the server-side one in
      // app/api/auth/magic-link/route.ts and silently dropped patients onto the
      // generic /patient dashboard instead of the assessment form.
      searchParamsMap = { email: 'jane@example.com', returnTo: '/patient/assessment' }
      render(<VerifyPageWrapper />)

      await waitFor(() => {
        expect(screen.getByText(/you are in/i)).toBeInTheDocument()
      })

      await waitFor(
        () => {
          expect(push).toHaveBeenCalledWith('/patient/assessment')
        },
        { timeout: 3000 },
      )
    })

    it('falls back to /patient when returnTo is a hostile protocol-relative URL', async () => {
      searchParamsMap = { email: 'jane@example.com', returnTo: '//evil.com' }
      render(<VerifyPageWrapper />)

      await waitFor(() => {
        expect(screen.getByText(/you are in/i)).toBeInTheDocument()
      })

      await waitFor(
        () => {
          expect(push).toHaveBeenCalledWith('/patient')
        },
        { timeout: 3000 },
      )
      expect(push).not.toHaveBeenCalledWith('//evil.com')
    })

    it('falls back to /patient when returnTo is a hostile absolute URL', async () => {
      searchParamsMap = { email: 'jane@example.com', returnTo: 'https://evil.com' }
      render(<VerifyPageWrapper />)

      await waitFor(() => {
        expect(screen.getByText(/you are in/i)).toBeInTheDocument()
      })

      await waitFor(
        () => {
          expect(push).toHaveBeenCalledWith('/patient')
        },
        { timeout: 3000 },
      )
      expect(push).not.toHaveBeenCalledWith('https://evil.com')
    })
  })

  // Guest checkout (lib/guest-booking.ts): the claim link must upgrade this
  // browser's anonymous booking session in place (same uid) rather than sign
  // in fresh, so the pre-payment assessment stays attached.
  describe('claiming a guest booking', () => {
    const guest = {
      uid: 'anon-1',
      isAnonymous: true,
      displayName: 'Jane Smith',
    }
    const upgradedCredential = {
      user: {
        uid: 'anon-1',
        displayName: 'Jane Smith',
        getIdToken: vi.fn().mockResolvedValue('upgraded-token'),
      },
    } as unknown as UserCredential

    beforeEach(() => {
      vi.mocked(isSignInWithEmailLink).mockReturnValue(true)
      authMock.currentUser = guest
      window.localStorage.setItem('poc-guest-booking', JSON.stringify({ uid: 'anon-1', email: 'jane@example.com' }))
    })

    it('links the email to the existing guest session instead of signing in fresh', async () => {
      vi.mocked(linkWithCredential).mockResolvedValue(upgradedCredential)

      render(<VerifyPageWrapper />)

      await waitFor(() => {
        expect(screen.getByText(/you are in/i)).toBeInTheDocument()
      })
      expect(linkWithCredential).toHaveBeenCalledWith(
        guest,
        expect.objectContaining({ kind: 'emailLink', email: 'jane@example.com' }),
      )
      expect(signInWithEmailLink).not.toHaveBeenCalled()
      // The upgraded (same-uid) account gets its records and its bookings linked,
      // exactly as a normal magic-link sign-in does.
      expect(ensurePatientRecord).toHaveBeenCalledWith(upgradedCredential.user, 'Jane Smith')
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/link-bookings',
        expect.objectContaining({ headers: { Authorization: 'Bearer upgraded-token' } }),
      )
      expect(window.localStorage.getItem('poc-guest-booking')).toBeNull()
    })

    it('signs in normally when the guest session was started for a different email', async () => {
      window.localStorage.setItem('poc-guest-booking', JSON.stringify({ uid: 'anon-1', email: 'someone@else.com' }))
      vi.mocked(signInWithEmailLink).mockResolvedValue(upgradedCredential)

      render(<VerifyPageWrapper />)

      await waitFor(() => {
        expect(screen.getByText(/you are in/i)).toBeInTheDocument()
      })
      expect(linkWithCredential).not.toHaveBeenCalled()
      expect(signInWithEmailLink).toHaveBeenCalledWith(authMock, 'jane@example.com', expect.any(String))
    })

    it('falls back to signing in to the existing account when the email already has one', async () => {
      vi.mocked(linkWithCredential).mockRejectedValue(
        new FirebaseError('auth/email-already-in-use', 'exists'),
      )
      vi.mocked(signInWithEmailLink).mockResolvedValue(upgradedCredential)

      render(<VerifyPageWrapper />)

      await waitFor(() => {
        expect(screen.getByText(/you are in/i)).toBeInTheDocument()
      })
      expect(signOut).toHaveBeenCalledWith(authMock)
      expect(signInWithEmailLink).toHaveBeenCalledWith(authMock, 'jane@example.com', expect.any(String))
      expect(window.localStorage.getItem('poc-guest-booking')).toBeNull()
    })

    it('shows the normal expired-link error if linking fails for another reason', async () => {
      vi.mocked(linkWithCredential).mockRejectedValue(
        new FirebaseError('auth/expired-action-code', 'expired'),
      )

      render(<VerifyPageWrapper />)

      await waitFor(() => {
        expect(screen.getByText(/expired or has already been used/i)).toBeInTheDocument()
      })
      expect(signInWithEmailLink).not.toHaveBeenCalled()
    })
  })
})
