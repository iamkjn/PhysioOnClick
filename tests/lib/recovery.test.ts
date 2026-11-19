import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))

import {
  computeStreakDays,
  computeRecoveryPercent,
  dateKeyDaysAgo,
  exerciseTickSource,
  latestPainReading,
  type PainLog,
} from '@/lib/recovery'

function log(score: number, date = '2026-01-01'): PainLog {
  return { date, score, note: '', loggedAt: new Date(date) }
}

describe('computeRecoveryPercent', () => {
  it('returns null when there are no logs', () => {
    expect(computeRecoveryPercent([])).toBeNull()
  })

  it('returns null when the baseline score is zero', () => {
    expect(computeRecoveryPercent([log(0), log(2)])).toBeNull()
  })

  it('returns 0 when there is only one log (baseline equals current)', () => {
    expect(computeRecoveryPercent([log(6)])).toBe(0)
  })

  it('computes improvement as a percentage of the baseline', () => {
    const logs = [log(8, '2026-01-01'), log(6, '2026-01-08'), log(4, '2026-01-15'), log(4, '2026-01-22')]
    expect(computeRecoveryPercent(logs)).toBe(42)
  })

  it('clamps at 0 when pain has gotten worse than baseline', () => {
    const logs = [log(3, '2026-01-01'), log(6, '2026-01-08'), log(6, '2026-01-15'), log(6, '2026-01-22')]
    expect(computeRecoveryPercent(logs)).toBe(0)
  })

  it('clamps at 100 when current pain is zero', () => {
    const logs = [log(5, '2026-01-01'), log(0, '2026-01-08'), log(0, '2026-01-15'), log(0, '2026-01-22')]
    expect(computeRecoveryPercent(logs)).toBe(100)
  })

  it('averages only the last 3 entries when more exist', () => {
    const logs = [
      log(10, '2026-01-01'),
      log(10, '2026-01-08'),
      log(10, '2026-01-15'),
      log(2, '2026-01-22'),
      log(2, '2026-01-29'),
      log(2, '2026-02-05'),
    ]
    expect(computeRecoveryPercent(logs)).toBe(80)
  })
})

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

describe('exerciseTickSource', () => {
  it('is the patient when nothing else marked the tick (older logs too)', () => {
    expect(exerciseTickSource('ex1', {})).toBe('patient')
    expect(exerciseTickSource('ex1', { carerMarked: { ex1: false } })).toBe('patient')
  })

  it('is the carer when the latest portal tick came from a carer', () => {
    expect(exerciseTickSource('ex1', { carerMarked: { ex1: true } })).toBe('carer')
  })

  it('is the physio when the physio marked it, even if a carer also did', () => {
    expect(exerciseTickSource('ex1', { physioMarked: { ex1: true }, carerMarked: { ex1: true } })).toBe('physio')
  })

  it('reads each exercise on its own', () => {
    const log = { physioMarked: { ex2: true }, carerMarked: { ex1: true } }
    expect(exerciseTickSource('ex1', log)).toBe('carer')
    expect(exerciseTickSource('ex2', log)).toBe('physio')
    expect(exerciseTickSource('ex3', log)).toBe('patient')
  })
})

describe('latestPainReading', () => {
  it('is null with neither an assessment nor a pain log', () => {
    expect(latestPainReading(undefined, null)).toBeNull()
  })

  it('uses a carer or patient pain log when there is no physio assessment', () => {
    expect(latestPainReading(undefined, { date: '2026-11-18', score: 3 })).toEqual({ score: 3, date: '2026-11-18', source: 'self' })
  })

  it('uses the physio assessment when there is no pain log', () => {
    expect(latestPainReading({ date: '2026-11-10', painScore: 6 }, null)).toEqual({ score: 6, date: '2026-11-10', source: 'physio' })
  })

  it('picks whichever is more recent', () => {
    const assessment = { date: '2026-11-10', painScore: 6 }
    expect(latestPainReading(assessment, { date: '2026-11-18', score: 3 })?.source).toBe('self')
    expect(latestPainReading(assessment, { date: '2026-11-02', score: 8 })?.source).toBe('physio')
  })

  it('prefers the physio on the same day', () => {
    expect(latestPainReading({ date: '2026-11-18', painScore: 5 }, { date: '2026-11-18', score: 2 })).toEqual({
      score: 5,
      date: '2026-11-18',
      source: 'physio',
    })
  })

  it('treats a score of 0 as a real reading', () => {
    expect(latestPainReading(undefined, { date: '2026-11-18', score: 0 })?.score).toBe(0)
  })

  it('ignores a malformed score', () => {
    expect(latestPainReading({ date: '2026-11-10', painScore: Number.NaN }, { date: '2026-11-01', score: 4 })?.source).toBe('self')
  })
})
