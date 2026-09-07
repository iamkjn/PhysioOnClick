import { describe, it, expect } from 'vitest'
import { buildExercisePlanPdf, type ExercisePlanCard } from '@/lib/exercise-plan-pdf'

const card = (over: Partial<ExercisePlanCard> = {}): ExercisePlanCard => ({
  index: 1, title: 'Bridge Progression', imageBytes: null, pose: 'pelvicTilt',
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
  it('draws a stick-figure diagram when a card has no image (pose key or name hint)', async () => {
    const withKey = await buildExercisePlanPdf({
      patientName: 'X', physioName: 'Y', sessionDateISO: null,
      cards: [card({ imageBytes: null, pose: 'heelRaise' })],
    })
    const byName = await buildExercisePlanPdf({
      patientName: 'X', physioName: 'Y', sessionDateISO: null,
      cards: [card({ imageBytes: null, pose: null, title: 'Calf Stretch (Gastrocnemius)' })],
    })
    for (const bytes of [withKey, byName]) {
      expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-')
      expect(bytes.byteLength).toBeGreaterThan(1000)
    }
  })
})
