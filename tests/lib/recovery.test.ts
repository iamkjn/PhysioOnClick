import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))

import { computeStreakDays, dateKeyDaysAgo } from '@/lib/recovery'

describe('computeStreakDays', () => {
  it('returns 0 when no days are completed', () => {
    expect(computeStreakDays(new Set())).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    const done = new Set([dateKeyDaysAgo(0), dateKeyDaysAgo(1), dateKeyDaysAgo(2)])
    expect(computeStreakDays(done)).toBe(3)
  })

  it('counts consecutive days ending yesterday when today is not yet logged', () => {
    const done = new Set([dateKeyDaysAgo(1), dateKeyDaysAgo(2)])
    expect(computeStreakDays(done)).toBe(2)
  })

  it('stops counting at the first gap', () => {
    const done = new Set([dateKeyDaysAgo(0), dateKeyDaysAgo(1), dateKeyDaysAgo(3)])
    expect(computeStreakDays(done)).toBe(2)
  })

  it('returns 0 when today is not logged and yesterday is also missing', () => {
    const done = new Set([dateKeyDaysAgo(3)])
    expect(computeStreakDays(done)).toBe(0)
  })
})
