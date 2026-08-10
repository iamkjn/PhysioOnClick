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

  it('creates a checkpoint under the new run when the post-reset streak already lands on a multiple', () => {
    // streak dropped from 6 straight to 3 (never touched 0) — a reset, and 3
    // is itself a fresh multiple of the interval. The new run's day-3
    // checkpoint must still be created, not silently skipped.
    const result = computeCheckinActions(3, 3, 0, [{ streakDay: 6, status: 'pending' }], 6)
    expect(result).toContainEqual({ type: 'expire', streakDay: 6 })
    expect(result).toContainEqual({ type: 'bumpRun' })
    expect(result).toContainEqual({ type: 'create', runNumber: 1, streakDay: 3 })
  })

  it('does not create a checkpoint on a reset straight to zero', () => {
    // streak dropped to 0 — a reset, but 0 is not a valid checkpoint day.
    const result = computeCheckinActions(0, 3, 0, [], 3)
    expect(result.some((a) => a.type === 'create')).toBe(false)
  })
})
