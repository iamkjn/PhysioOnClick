import { describe, it, expect, vi, beforeEach } from 'vitest'

const buildExercisePlanPdf = vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]))
const sendConditionPlanEmail = vi.fn().mockResolvedValue({ sent: true })
const getCondition = vi.fn()
const programForCondition = vi.fn()

vi.mock('@/lib/exercise-plan-pdf', () => ({
  buildExercisePlanPdf: (...a: unknown[]) => buildExercisePlanPdf(...a),
}))
vi.mock('@/lib/emails/condition-plan-email', () => ({
  sendConditionPlanEmail: (...a: unknown[]) => sendConditionPlanEmail(...a),
}))
vi.mock('@/lib/exercise-library', () => ({
  getCondition: (...a: unknown[]) => getCondition(...a),
  programForCondition: (...a: unknown[]) => programForCondition(...a),
}))

import { POST } from '@/app/api/exercise-plan/condition-pdf/route'

function req(body: unknown, ip = '10.0.0.1') {
  return new Request('http://localhost/api/exercise-plan/condition-pdf', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  buildExercisePlanPdf.mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]))
  sendConditionPlanEmail.mockResolvedValue({ sent: true })
  getCondition.mockReturnValue({ slug: 'rotator-cuff-tendinopathy', name: 'Rotator cuff tendinopathy' })
  // Two stages; real exercise ids so the un-mocked buildPlanCards keeps them all.
  programForCondition.mockReturnValue([
    { exercises: [{ id: 'ex-1' }, { id: 'ex-2' }] },
    { exercises: [{ id: 'ex-3' }] },
  ])
})

describe('POST /api/exercise-plan/condition-pdf', () => {
  it('400 when email is missing', async () => {
    const res = await POST(req({ conditionSlug: 'rotator-cuff-tendinopathy' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toHaveProperty('error')
    expect(sendConditionPlanEmail).not.toHaveBeenCalled()
  })

  it('400 when email is malformed', async () => {
    const res = await POST(req({ conditionSlug: 'rotator-cuff-tendinopathy', email: 'notanemail' }))
    expect(res.status).toBe(400)
    expect(sendConditionPlanEmail).not.toHaveBeenCalled()
  })

  it('404 when the condition slug is unknown', async () => {
    getCondition.mockReturnValueOnce(null)
    const res = await POST(req({ conditionSlug: 'not-a-condition', email: 'a@b.com' }))
    expect(res.status).toBe(404)
    expect(await res.json()).toHaveProperty('error')
    expect(sendConditionPlanEmail).not.toHaveBeenCalled()
  })

  it('honeypot: a filled website field returns 200 and sends nothing', async () => {
    const res = await POST(
      req({ conditionSlug: 'rotator-cuff-tendinopathy', email: 'a@b.com', website: 'x' }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(sendConditionPlanEmail).not.toHaveBeenCalled()
    expect(buildExercisePlanPdf).not.toHaveBeenCalled()
  })

  it('happy path: builds the whole-program PDF and emails it', async () => {
    const res = await POST(
      req({ conditionSlug: 'rotator-cuff-tendinopathy', email: 'patient@example.com' }, '10.1.1.1'),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(buildExercisePlanPdf).toHaveBeenCalledOnce()
    const pdfArg = buildExercisePlanPdf.mock.calls[0][0] as { cards: unknown[] }
    expect(pdfArg.cards).toHaveLength(3) // every stage: ex-1 + ex-2 + ex-3
    expect(sendConditionPlanEmail).toHaveBeenCalledOnce()
    expect(sendConditionPlanEmail.mock.calls[0][0]).toMatchObject({ to: 'patient@example.com' })
  })

  it('a downstream failure still returns 200 { ok: false } with no unhandled rejection', async () => {
    buildExercisePlanPdf.mockRejectedValueOnce(new Error('pdf boom'))
    const res = await POST(
      req({ conditionSlug: 'rotator-cuff-tendinopathy', email: 'a@b.com' }, '10.2.2.2'),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: false })
    expect(sendConditionPlanEmail).not.toHaveBeenCalled()
  })

  it('rate limit: the 4th request from one IP inside the window is 429', async () => {
    const body = { conditionSlug: 'rotator-cuff-tendinopathy', email: 'a@b.com' }
    expect((await POST(req(body, '10.9.9.9'))).status).toBe(200)
    expect((await POST(req(body, '10.9.9.9'))).status).toBe(200)
    expect((await POST(req(body, '10.9.9.9'))).status).toBe(200)
    expect((await POST(req(body, '10.9.9.9'))).status).toBe(429)
  })
})
