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
  FirebaseError,
}))

vi.mock('@/lib/firebase', () => ({ auth: {} }))

vi.mock('@/lib/patient-account', () => ({
  ensurePatientRecord: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => ({
    get: (key: string) => searchParamsMap[key] ?? null,
  }),
}))

import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import VerifyPageWrapper from '@/app/auth/verify/page'

describe('Auth verify page', () => {
  beforeEach(() => {
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
})
