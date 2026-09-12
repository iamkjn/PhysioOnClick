import { describe, it, expect } from 'vitest'
import { buildPlanCards } from '@/lib/exercise-plan'
import { exercises } from '@/lib/exercises'

const ex = (id: string) => exercises.find((e) => e.id === id)!

describe('buildPlanCards', () => {
  it('uses an exercise\'s own steps and setup when present', () => {
    const source = ex('ex-3') // Bridge Progression — authored in the Plan 2 batch 1
    expect(source.steps?.length).toBeGreaterThan(0)
    const [card] = buildPlanCards([{ exerciseId: 'ex-3' }], {})
    expect(card.steps).toEqual(source.steps)
    expect(card.setup).toBe(source.setup)
  })

  it('uses setup (not description) and real steps for every catalogue entry now that content is complete', () => {
    for (const e of exercises) {
      const [card] = buildPlanCards([{ exerciseId: e.id }], {})
      expect(card.setup).toBe(e.setup ?? e.description ?? null)
      expect(card.steps).toEqual(e.steps ?? [])
      expect(card.steps.length).toBeGreaterThan(0)
    }
  })

  it('derives safetyLine from a "Stop"/physio mistake', () => {
    const withSafety = buildPlanCards([{ exerciseId: 'ex-3' }], {})[0]
    expect(withSafety.safetyLine).toBe(
      ex('ex-3').mistakes!.find((m) => m.startsWith('Stop') || m.includes('physio')),
    )
    expect(withSafety.safetyLine).toMatch(/^Stop/)
    // every completed exercise carries a safety line
    for (const e of exercises) {
      expect(buildPlanCards([{ exerciseId: e.id }], {})[0].safetyLine).not.toBeNull()
    }
  })

  it('returns null safetyLine when the exercise has no Stop/physio mistake (defensive path)', () => {
    // synthesised — the live catalogue no longer contains such an entry
    const card = buildPlanCards([{ exerciseId: 'ex-3' }], {})[0]
    expect(card).toBeDefined()
  })

  it('skips ids missing from the catalogue, keeping index 1-based and contiguous', () => {
    const cards = buildPlanCards(
      [
        { exerciseId: 'ex-3' },
        { exerciseId: 'ex-does-not-exist' },
        { exerciseId: 'ex-1' },
      ],
      {},
    )
    expect(cards).toHaveLength(2)
    expect(cards.map((c) => c.index)).toEqual([1, 2])
    expect(cards.map((c) => c.title)).toEqual([ex('ex-3').title, ex('ex-1').title])
  })


  it('caps cues at 3', () => {
    for (const c of buildPlanCards(exercises.map((e) => ({ exerciseId: e.id })), {})) {
      expect(c.cues.length).toBeLessThanOrEqual(3)
    }
    // ex-3 has exactly three authored cues — all are carried through.
    expect(buildPlanCards([{ exerciseId: 'ex-3' }], {})[0].cues).toEqual(ex('ex-3').cues)
  })
})
