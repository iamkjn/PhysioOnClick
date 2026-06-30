import { describe, it, expect } from 'vitest'
import { computeRecoveryPercent, type PainLog } from '@/lib/recovery'

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
