import { describe, it, expect } from 'vitest'
import { exercises } from '@/lib/site-data'

describe('exercises catalogue', () => {
  it('has unique ids', () => {
    const ids = exercises.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has at least 12 exercises', () => {
    expect(exercises.length).toBeGreaterThanOrEqual(12)
  })

  it('keeps ex-1..ex-4 unchanged with their known bodyParts', () => {
    const byId = new Map(exercises.map((e) => [e.id, e]))
    expect(byId.get('ex-1')?.bodyPart).toBe('Lower limb')
    expect(byId.get('ex-2')?.bodyPart).toBe('Shoulder')
    expect(byId.get('ex-3')?.bodyPart).toBe('Lumbar spine')
    expect(byId.get('ex-4')?.bodyPart).toBe('Balance')
  })

  it('spans at least 5 distinct bodyPart categories', () => {
    const categories = new Set(exercises.map((e) => e.bodyPart))
    expect(categories.size).toBeGreaterThanOrEqual(5)
  })

  it('gives every exercise the required fields, non-empty', () => {
    for (const e of exercises) {
      expect(e.id).toBeTruthy()
      expect(e.title).toBeTruthy()
      expect(e.bodyPart).toBeTruthy()
      expect(e.condition).toBeTruthy()
      expect(e.stage).toBeTruthy()
      expect(e.description).toBeTruthy()
      expect(e.videoUrl).toMatch(/^https:\/\/www\.youtube\.com\/embed\//)
    }
  })
})
