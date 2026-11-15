import { beforeEach, describe, expect, it, vi } from 'vitest'

const verifyIdToken = vi.fn()
const queryGet = vi.fn()
const where = vi.fn(() => ({ get: queryGet }))
const collection = vi.fn(() => ({ where }))

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ verifyIdToken }),
  getAdminDb: () => ({ collection }),
}))

import { GET } from '@/app/api/patient/carer-links/route'

function req(token: string | null) {
  return new Request('http://localhost/api/patient/carer-links', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

function docSnap(id: string, data: Record<string, unknown>) {
  return { id, data: () => data }
}

beforeEach(() => {
  verifyIdToken.mockReset()
  queryGet.mockReset()
  where.mockClear()
  collection.mockClear()
})

describe('GET /api/patient/carer-links', () => {
  it('401s without a token', async () => {
    expect((await GET(req(null))).status).toBe(401)
  })

  it('401s for a bad token', async () => {
    verifyIdToken.mockRejectedValue(new Error('bad'))
    expect((await GET(req('t'))).status).toBe(401)
  })

  it('returns nothing (and never queries) for an unverified email', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'c1', email: 'carer@example.com', email_verified: false })
    const res = await GET(req('t'))
    expect(await res.json()).toEqual({ patients: [] })
    expect(collection).not.toHaveBeenCalled()
  })

  it('returns nothing for a token without an email', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'c1', email_verified: true })
    expect(await (await GET(req('t'))).json()).toEqual({ patients: [] })
    expect(collection).not.toHaveBeenCalled()
  })

  it('queries carerEmails with the lower-cased email and returns only uid, name and relationship', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'c1', email: 'Carer@Example.com', email_verified: true })
    queryGet.mockResolvedValue({
      docs: [
        docSnap('p2', {
          displayName: 'zoe adams',
          phoneNumber: '07123 456789',
          dob: '1940-01-01',
          carerEmails: ['carer@example.com'],
        }),
        docSnap('p1', {
          displayName: 'mary smith',
          email: 'mary@example.com',
          carerEmails: ['carer@example.com'],
          carerContact: { name: 'Carer', email: 'carer@example.com', relationship: 'Partner' },
        }),
      ],
    })

    const res = await GET(req('t'))
    expect(res.status).toBe(200)
    expect(collection).toHaveBeenCalledWith('patients')
    expect(where).toHaveBeenCalledWith('carerEmails', 'array-contains', 'carer@example.com')
    const body = await res.json()
    expect(body).toEqual({
      patients: [
        { uid: 'p1', name: 'Mary Smith', relationship: 'Partner' },
        { uid: 'p2', name: 'Zoe Adams', relationship: '' },
      ],
    })
    // Nothing else from the patient doc leaks to the carer.
    expect(JSON.stringify(body)).not.toMatch(/07123|1940|mary@example/)
  })

  it('never lists the caller’s own record', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'p1', email: 'carer@example.com', email_verified: true })
    queryGet.mockResolvedValue({ docs: [docSnap('p1', { displayName: 'Me', carerEmails: ['carer@example.com'] })] })
    expect(await (await GET(req('t'))).json()).toEqual({ patients: [] })
  })

  it('500s when the lookup fails', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'c1', email: 'carer@example.com', email_verified: true })
    queryGet.mockRejectedValue(new Error('down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await GET(req('t'))).status).toBe(500)
  })
})
