import { describe, it, expect } from 'vitest'
import { resolveDosage, formatDosage, hasPrescribedDose, validateDosage, exercises, type Exercise } from '@/lib/exercises'

const base = (over: Partial<Exercise> = {}): Exercise => ({
  id: 'ex-test', slug: 'ex-test', title: 'Test', bodyPart: 'Knee', clinicalArea: 'lower_limb',
  tags: [], condition: '', stage: 'Early rehab', description: 'x', ...over,
})

describe('resolveDosage', () => {
  it('returns the exercise default when there is no override', () => {
    const ex = base({ defaultDosage: { sets: 3, reps: 10 } })
    expect(resolveDosage(ex)).toEqual({ sets: 3, reps: 10 })
  })
  it('merges per field — override wins, unspecified fields fall back', () => {
    const ex = base({ defaultDosage: { sets: 3, reps: 10, perDay: 1 } })
    expect(resolveDosage(ex, { dosage: { reps: 15 } })).toEqual({ sets: 3, reps: 15, perDay: 1 })
  })
  it('handles a missing default', () => {
    expect(resolveDosage(base(), { dosage: { holdSeconds: 30 } })).toEqual({ holdSeconds: 30 })
  })
  it('returns {} when neither side has anything', () => {
    expect(resolveDosage(base())).toEqual({})
  })
})

describe('formatDosage', () => {
  it('sets × reps', () => expect(formatDosage({ sets: 3, reps: 12 })).toBe('3 sets × 12 reps'))
  it('reps only', () => expect(formatDosage({ reps: 12 })).toBe('12 reps'))
  it('hold with sets', () => expect(formatDosage({ sets: 3, holdSeconds: 30 })).toBe('Hold 30s × 3'))
  it('hold only', () => expect(formatDosage({ holdSeconds: 30 })).toBe('Hold 30s'))
  it('repeated hold keeps the rep count and the hold time', () => {
    expect(formatDosage({ reps: 10, holdSeconds: 10 })).toBe('10 reps, 10s hold')
    expect(formatDosage({ sets: 2, reps: 5, holdSeconds: 5 })).toBe('2 sets × 5 reps, 5s hold')
  })
  it('adds once a day', () => expect(formatDosage({ sets: 3, reps: 12, perDay: 1 })).toBe('3 sets × 12 reps · once a day'))
  it('adds twice a day', () => expect(formatDosage({ reps: 10, perDay: 2 })).toBe('10 reps · twice a day'))
  it('adds N times a day', () => expect(formatDosage({ reps: 10, perDay: 3 })).toBe('10 reps · 3 times a day'))
  it('adds days a week', () => expect(formatDosage({ reps: 10, perWeek: 4 })).toBe('10 reps · 4 days a week'))
  it('combines per-day and per-week', () =>
    expect(formatDosage({ sets: 3, reps: 12, perDay: 1, perWeek: 5 })).toBe(
      '3 sets × 12 reps · once a day, 5 days a week',
    ))
  it('drops a redundant perWeek 7 when there is a daily count', () =>
    expect(formatDosage({ reps: 10, perDay: 2, perWeek: 7 })).toBe('10 reps · twice a day'))
  it('renders perWeek 7 alone as every day', () =>
    expect(formatDosage({ reps: 10, perWeek: 7 })).toBe('10 reps · every day'))
  it('renders minutes for time-based programmes', () =>
    expect(formatDosage({ minutes: 10, perDay: 1, perWeek: 5 })).toBe('10 minutes · once a day, 5 days a week'))
  it('pluralises singular reps/sets/minutes', () => {
    expect(formatDosage({ reps: 1 })).toBe('1 rep')
    expect(formatDosage({ sets: 1, reps: 1 })).toBe('1 set × 1 rep')
    expect(formatDosage({ minutes: 1 })).toBe('1 minute')
  })
  it('appends tempo after the core clause', () =>
    expect(formatDosage({ sets: 3, reps: 12, tempo: '3s down, 1s up' })).toBe('3 sets × 12 reps · 3s down, 1s up'))
  it('appends tempo after the frequency clause', () =>
    expect(formatDosage({ reps: 10, perDay: 2, tempo: 'slow' })).toBe('10 reps · twice a day · slow'))
  it('ignores a blank tempo', () => expect(formatDosage({ reps: 10, tempo: '  ' })).toBe('10 reps'))
  it('drops a zero frequency', () => expect(formatDosage({ reps: 10, perDay: 0 })).toBe('10 reps'))
  it('empty → As advised by your physio', () => expect(formatDosage({})).toBe('As advised by your physio'))
})

describe('hasPrescribedDose', () => {
  it('true when sets / reps / hold are set', () => {
    expect(hasPrescribedDose({ sets: 3 })).toBe(true)
    expect(hasPrescribedDose({ reps: 10 })).toBe(true)
    expect(hasPrescribedDose({ holdSeconds: 30 })).toBe(true)
  })
  it('false for the "as advised" placeholder (no load specified)', () => {
    expect(hasPrescribedDose({})).toBe(false)
    expect(hasPrescribedDose({ perDay: 2, tempo: 'slow', notes: 'go gently' })).toBe(false)
  })
})

describe('validateDosage', () => {
  it('accepts a normal dose', () => expect(validateDosage({ sets: 3, reps: 12, perDay: 2 })).toBeNull())
  it('rejects sets over 10', () => expect(validateDosage({ sets: 11 })).toMatch(/sets/i))
  it('rejects reps over 100', () => expect(validateDosage({ reps: 101 })).toMatch(/reps/i))
  it('rejects hold over 600', () => expect(validateDosage({ holdSeconds: 601 })).toMatch(/hold/i))
  it('rejects perWeek 0', () => expect(validateDosage({ perWeek: 0 })).toMatch(/week/i))
  it('rejects perWeek 8', () => expect(validateDosage({ perWeek: 8 })).toMatch(/week/i))
  it('rejects negative', () => expect(validateDosage({ reps: -1 })).toMatch(/whole number|negative/i))
  it('rejects non-integer', () => expect(validateDosage({ reps: 2.5 })).toMatch(/whole number/i))
  it('rejects a 301-char note', () => expect(validateDosage({ notes: 'a'.repeat(301) })).toMatch(/note/i))
  it('rejects a non-string tempo', () =>
    // @ts-expect-error — exercising the runtime type-guard against non-form data
    expect(validateDosage({ tempo: 42 })).toMatch(/tempo/i))
  it('rejects a non-string note', () =>
    // @ts-expect-error — exercising the runtime type-guard against non-form data
    expect(validateDosage({ notes: 123 })).toMatch(/note/i))
})

describe('catalogue move', () => {
  it('still exports the full catalogue with stable ids', () => {
    // 150 original ex-* entries (ex-1..ex-150) + 8 face-* entries = 158, plus
    // 17 competitive-pass MSK loading exercises (ex-151..ex-167) = 175.
    expect(exercises.length).toBe(175)
    expect(exercises[0].id).toBe('ex-1')
  })
})

describe('exercise slugs', () => {
  it('every exercise has a non-empty kebab-case slug', () => {
    for (const e of exercises) {
      expect(e.slug, e.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    }
  })
  it('slugs are unique', () => {
    const slugs = exercises.map((e) => e.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
  it('aka entries, when present, are non-empty strings', () => {
    for (const e of exercises) {
      for (const a of e.aka ?? []) expect(a.trim().length).toBeGreaterThan(0)
    }
  })
})
