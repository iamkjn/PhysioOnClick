import { describe, it, expect, vi, beforeEach } from 'vitest'
const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

import { buildExercisePlanEmailHtml, sendExercisePlanEmail } from '@/lib/emails/exercise-plan-email'

beforeEach(() => { fetchMock.mockReset(); fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) }) })

describe('exercise plan email', () => {
  it('HTML greets the patient and links to the plan', () => {
    const html = buildExercisePlanEmailHtml({ patientName: 'Anish', planUrl: 'https://x/p', exerciseCount: 5 })
    expect(html).toContain('Hi Anish')
    expect(html).toContain('https://x/p')
    expect(html).toContain('5')
  })
  it('sendExercisePlanEmail posts to Resend with the PDF attached', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    await sendExercisePlanEmail({
      to: 'a@b.com', patientName: 'Anish', planUrl: 'https://x/p', exerciseCount: 5,
      pdf: { filename: 'exercise-plan.pdf', base64: 'AAAA' },
    })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.resend.com/emails')
    expect(body.to).toEqual(['a@b.com'])
    expect(body.attachments).toEqual([{ filename: 'exercise-plan.pdf', content: 'AAAA' }])
  })
  it('no-ops without RESEND_API_KEY', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const r = await sendExercisePlanEmail({ to: 'a@b.com', patientName: 'A', planUrl: 'u', exerciseCount: 1, pdf: { filename: 'p.pdf', base64: 'A' } })
    expect(r.sent).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
