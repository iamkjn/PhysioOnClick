import { describe, it, expect, vi, beforeEach } from 'vitest'

const db = { collection: vi.fn() }
const uploadObject = vi.fn().mockResolvedValue({ ok: true })
const sendExercisePlanEmail = vi.fn().mockResolvedValue({ sent: true })
const buildExercisePlanPdf = vi.fn().mockResolvedValue(new Uint8Array([0x25,0x50,0x44,0x46]))

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => db, getAdminAuth: () => null, uploadObject: (...a: unknown[]) => uploadObject(...a),
  FieldValue: { serverTimestamp: () => 'server-ts', arrayUnion: (...v: unknown[]) => v },
}))
vi.mock('@/lib/exercise-plan-pdf', () => ({ buildExercisePlanPdf: (...a: unknown[]) => buildExercisePlanPdf(...a) }))
vi.mock('@/lib/emails/exercise-plan-email', () => ({ sendExercisePlanEmail: (...a: unknown[]) => sendExercisePlanEmail(...a) }))
vi.mock('@/lib/exercises', async (o) => ({ ...(await o<typeof import('@/lib/exercises')>()), }))

import { POST } from '@/app/api/exercise-plan/generate/route'

function makeDoc(data: unknown, exists = true) { return { exists, data: () => data, ref: { update: vi.fn().mockResolvedValue(undefined) } } }

let summaryDoc: ReturnType<typeof makeDoc>

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('CRON_SECRET', 'sekret')
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://dev.example')
  // summary -> booking -> assignedExercises
  summaryDoc = makeDoc({ bookingId: 'b1', patientName: 'Anish', patientId: 'p1' })
  const bookingDoc = makeDoc({ bookedBy: 'u1', patientId: 'p1', email: 'a@b.com', sessionDate: { toDate: () => new Date('2026-09-06') } })
  db.collection.mockImplementation((name: string) => ({
    doc: () => ({
      get: async () => (name === 'sessionSummaries' ? summaryDoc : bookingDoc),
      collection: () => ({ get: async () => ({ docs: [{ id: 'ex-3', data: () => ({ active: true }) }] }) }),
    }),
  }))
})

function req(body: unknown, secret = 'sekret') {
  return new Request('http://localhost/api/exercise-plan/generate', {
    method: 'POST', headers: { 'x-cron-secret': secret, 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

describe('POST /api/exercise-plan/generate', () => {
  it('401 without the cron secret', async () => {
    const res = await POST(req({ summaryId: 's1' }, 'wrong'))
    expect(res.status).toBe(401)
  })
  it('builds, uploads, emails and stamps on the happy path', async () => {
    const res = await POST(req({ summaryId: 's1' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, exercises: 1 })
    expect(buildExercisePlanPdf).toHaveBeenCalledOnce()
    expect(uploadObject).toHaveBeenCalledWith('exercise-plans/s1.pdf', expect.any(Uint8Array), 'application/pdf')
    expect(sendExercisePlanEmail).toHaveBeenCalledOnce()
    expect(summaryDoc.ref.update).toHaveBeenCalledWith(
      expect.objectContaining({ planEmailedAt: 'server-ts', planPdfPath: 'exercise-plans/s1.pdf' }),
    )
  })
  it('skips a summary already emailed unless force', async () => {
    summaryDoc = makeDoc({ bookingId: 'b1', patientName: 'A', patientId: 'p1', planEmailedAt: 'yes' })
    db.collection.mockImplementation((name: string) => ({ doc: () => ({
      get: async () => (name === 'sessionSummaries' ? summaryDoc : makeDoc({ bookedBy: 'u1', patientId: 'p1', email: 'a@b.com' })),
      collection: () => ({ get: async () => ({ docs: [] }) }),
    }) }))
    const res = await POST(req({ summaryId: 's1' }))
    expect(res.status).toBe(200)
    expect(sendExercisePlanEmail).not.toHaveBeenCalled()
  })
  it('still returns 200 when a downstream step throws (no retry-storm)', async () => {
    buildExercisePlanPdf.mockRejectedValueOnce(new Error('pdf boom'))
    const res = await POST(req({ summaryId: 's1' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: false })
    expect(sendExercisePlanEmail).not.toHaveBeenCalled()
  })
})
