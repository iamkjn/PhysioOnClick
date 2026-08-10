import { describe, it, expect } from 'vitest'
import { computeCheckinActions } from '../../functions/src/pain-checkin-logic'

describe('computeCheckinActions', () => {
  it('bumps run on reset even when nothing was pending', () => {
    // streak dropped from 3 to 0, nothing pending
    const result = computeCheckinActions(0, 3, 0, [], 3)
    expect(result).toContainEqual({ type: 'bumpRun' })
    expect(result.some((a) => a.type === 'expire')).toBe(false)
  })

  it('detects a reset that drops without hitting exactly zero', () => {
    // streak dropped from 3 to 1 (never touched 0), with a checkpoint still pending from the old run
    const result = computeCheckinActions(1, 3, 0, [{ streakDay: 3, status: 'pending' }], 3)
    expect(result).toContainEqual({ type: 'expire', streakDay: 3 })
    expect(result).toContainEqual({ type: 'bumpRun' })
  })

  it('does not bump when streak is steady or growing', () => {
    // streak went from 3 to 4, normal progress, day 4 isn't a multiple of 3
    const result = computeCheckinActions(4, 3, 0, [], 3)
    expect(result).toEqual([])
  })
})
