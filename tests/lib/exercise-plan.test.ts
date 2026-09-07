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

  it('falls back to the description when an exercise has no setup/steps yet', () => {
    const source = ex('ex-1') // Sit to Stand Control — catalogue stub, no setup/steps
    expect(source.setup).toBeUndefined()
    expect(source.steps).toBeUndefined()
    const [card] = buildPlanCards([{ exerciseId: 'ex-1' }], {})
    expect(card.setup).toBe(source.description)
    expect(card.steps).toEqual([])
  })

  it('derives safetyLine from a "Stop"/physio mistake, and null when there is none', () => {
    const withSafety = buildPlanCards([{ exerciseId: 'ex-3' }], {})[0]
    expect(withSafety.safetyLine).toBe(
      ex('ex-3').mistakes!.find((m) => m.startsWith('Stop') || m.includes('physio')),
    )
    expect(withSafety.safetyLine).toMatch(/^Stop/)

    const noSafety = buildPlanCards([{ exerciseId: 'ex-1' }], {})[0]
    expect(noSafety.safetyLine).toBeNull()
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

  it('always sets a pose (explicit key or name-inferred)', () => {
    for (const c of buildPlanCards(exercises.map((e) => ({ exerciseId: e.id })), {})) {
      expect(typeof c.pose).toBe('string')
      expect(c.pose).not.toBe('')
    }
    // ex-12 Heel Raises has an explicit pose authored in the catalogue.
    expect(buildPlanCards([{ exerciseId: 'ex-12' }], {})[0].pose).toBe(ex('ex-12').pose)
  })

  it('caps cues at 3', () => {
    for (const c of buildPlanCards(exercises.map((e) => ({ exerciseId: e.id })), {})) {
      expect(c.cues.length).toBeLessThanOrEqual(3)
    }
    // ex-3 has exactly three authored cues — all are carried through.
    expect(buildPlanCards([{ exerciseId: 'ex-3' }], {})[0].cues).toEqual(ex('ex-3').cues)
  })
})
