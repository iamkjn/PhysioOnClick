import { describe, it, expect, vi } from 'vitest'
import { buildExercisePlanPdf, type ExercisePlanCard } from '@/lib/exercise-plan-pdf'

const card = (over: Partial<ExercisePlanCard> = {}): ExercisePlanCard => ({
  index: 1, title: 'Bridge Progression', imageBytes: null,
  setup: 'Lie on your back, knees bent.', steps: ['Tighten your tummy', 'Lift your hips'],
  cues: ['Hips stay level'], safetyLine: 'Stop if pain spreads down your leg.',
  doseText: '2 sets × 10 reps · once a day', physioNote: null, ...over,
})

describe('buildExercisePlanPdf', () => {
  it('returns a non-empty PDF', async () => {
    const bytes = await buildExercisePlanPdf({
      patientName: 'Anish George', physioName: 'Shivaliba Zala',
      sessionDateISO: '2026-09-06T18:00:00.000Z', cards: [card()],
    })
    expect(bytes.byteLength).toBeGreaterThan(1000)
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-')
  })
  it('paginates — 6 full cards produce more than one page', async () => {
    const bytes = await buildExercisePlanPdf({
      patientName: 'X', physioName: 'Y', sessionDateISO: null,
      cards: Array.from({ length: 6 }, (_, i) => card({ index: i + 1 })),
    })
    const { PDFDocument } = await import('pdf-lib')
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBeGreaterThan(1)
  })
  it('tolerates a card with no steps/cues/setup', async () => {
    const bytes = await buildExercisePlanPdf({
      patientName: 'X', physioName: 'Y', sessionDateISO: null,
      cards: [card({ setup: null, steps: [], cues: [], safetyLine: null })],
    })
    expect(bytes.byteLength).toBeGreaterThan(1000)
  })
  it('renders fine with no illustration — no stick-figure fallback, text reclaims full width', async () => {
    const bytes = await buildExercisePlanPdf({
      patientName: 'X', physioName: 'Y', sessionDateISO: null,
      cards: [card({ imageBytes: null, title: 'Calf Stretch (Gastrocnemius)' })],
    })
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-')
    expect(bytes.byteLength).toBeGreaterThan(1000)
  })
})

describe('buildExercisePlanPdf general (public) plan', () => {
  async function drawnText(input: Parameters<typeof buildExercisePlanPdf>[0]) {
    const { PDFPage } = await import('pdf-lib')
    const texts: string[] = []
    const spy = vi.spyOn(PDFPage.prototype, 'drawText').mockImplementation(function (this: unknown, text: string) {
      texts.push(text)
    } as never)
    try {
      await buildExercisePlanPdf(input)
    } finally {
      spy.mockRestore()
    }
    return texts
  }

  it('prints neutral authorship and the reference-only note on the cover and every page', async () => {
    const { REFERENCE_ONLY_NOTE } = await import('@/lib/exercise-disclaimer')
    const { PDFDocument } = await import('pdf-lib')
    const input = {
      patientName: '', physioName: 'Shivaliba Zala', sessionDateISO: null, generalPlan: true,
      cards: Array.from({ length: 6 }, (_, i) => card({ index: i + 1 })),
    }
    const pages = (await PDFDocument.load(await buildExercisePlanPdf(input))).getPageCount()
    const texts = await drawnText(input)
    expect(texts.some((t) => /General exercise plan .* written by Shivaliba Zala, HCPC-registered physiotherapist/.test(t))).toBe(true)
    expect(texts.some((t) => /from your session/.test(t))).toBe(false)
    expect(texts.some((t) => /^For you\b/.test(t))).toBe(false)
    // once on the cover plus once in every page footer
    expect(texts.filter((t) => t === REFERENCE_ONLY_NOTE).length).toBe(pages + 1)
  })

  it('a patient session plan keeps its session wording and no reference-only footer', async () => {
    const { REFERENCE_ONLY_NOTE } = await import('@/lib/exercise-disclaimer')
    const texts = await drawnText({
      patientName: 'Anish George', physioName: 'Shivaliba Zala',
      sessionDateISO: '2026-09-06T18:00:00.000Z', cards: [card()],
    })
    expect(texts.some((t) => /For Anish George .* from your session on/.test(t))).toBe(true)
    expect(texts.includes(REFERENCE_ONLY_NOTE)).toBe(false)
  })
})
