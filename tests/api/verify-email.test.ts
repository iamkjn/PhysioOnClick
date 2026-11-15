import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const verifyIdToken = vi.fn()
const generateEmailVerificationLink = vi.fn()

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ verifyIdToken, generateEmailVerificationLink }),
}))

import { POST } from '@/app/api/auth/verify-email/route'

const fetchMock = vi.fn()
let n = 0

function req(token: string | null) {
  return new Request('http://localhost/api/auth/verify-email', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

beforeEach(() => {
  verifyIdToken.mockReset()
  generateEmailVerificationLink.mockReset().mockResolvedValue(
    'https://p.firebaseapp.com/__/auth/action?apiKey=k&mode=verifyEmail&oobCode=CODE123&lang=en'
  )
  fetchMock.mockReset().mockResolvedValue({ ok: true, text: async () => '' })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('RESEND_API_KEY', 're_test')
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://physioonclick.co.uk')
  n += 1
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

// Unique uid per test: the route rate-limits per uid in module memory.
const unverified = () => ({ uid: `u${n}`, email: 'Carer@Example.com', email_verified: false })

describe('POST /api/auth/verify-email', () => {
  it('401s without a token or with a bad one', async () => {
    expect((await POST(req(null))).status).toBe(401)
    verifyIdToken.mockRejectedValue(new Error('bad'))
    expect((await POST(req('t'))).status).toBe(401)
  })

  it('does nothing for an already-verified email', async () => {
    verifyIdToken.mockResolvedValue({ uid: `u${n}`, email: 'a@b.com', email_verified: true })
    const res = await POST(req('t'))
    expect(await res.json()).toEqual({ ok: true, alreadyVerified: true })
    expect(generateEmailVerificationLink).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('400s for an account without an email', async () => {
    verifyIdToken.mockResolvedValue({ uid: `u${n}` })
    expect((await POST(req('t'))).status).toBe(400)
  })

  it('emails a link to OUR confirm page (not the Firebase widget) via Resend', async () => {
    verifyIdToken.mockResolvedValue(unverified())
    const res = await POST(req('t'))
    expect(await res.json()).toEqual({ ok: true })
    expect(generateEmailVerificationLink).toHaveBeenCalledWith('carer@example.com')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    const body = JSON.parse(init.body)
    expect(body.to).toEqual(['carer@example.com'])
    expect(body.subject).toBe('Confirm your email for PhysioOnClick')
    expect(body.html).toContain('https://physioonclick.co.uk/auth/verify-email?oobCode=CODE123')
    expect(body.html).not.toContain('firebaseapp.com')
    expect(body.text).toContain('https://physioonclick.co.uk/auth/verify-email?oobCode=CODE123')
  })

  it('rate-limits a second request from the same user within a minute', async () => {
    verifyIdToken.mockResolvedValue(unverified())
    expect((await POST(req('t'))).status).toBe(200)
    expect((await POST(req('t'))).status).toBe(429)
  })

  it('500s (and does not rate-limit) when Resend fails', async () => {
    verifyIdToken.mockResolvedValue(unverified())
    fetchMock.mockResolvedValueOnce({ ok: false, status: 422, text: async () => 'bad' })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await POST(req('t'))).status).toBe(500)
    expect((await POST(req('t'))).status).toBe(200)
  })

  it('500s when Firebase returns no code', async () => {
    verifyIdToken.mockResolvedValue(unverified())
    generateEmailVerificationLink.mockResolvedValue('https://p.firebaseapp.com/__/auth/action?mode=verifyEmail')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await POST(req('t'))).status).toBe(500)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('logs the link instead of emailing in local dev without Resend', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    verifyIdToken.mockResolvedValue(unverified())
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    expect((await POST(req('t'))).status).toBe(200)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('/auth/verify-email?oobCode=CODE123'))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
