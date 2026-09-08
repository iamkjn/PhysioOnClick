import { describe, it, expect } from 'vitest'
import { conditions } from '@/lib/conditions'
import { exercises } from '@/lib/exercises'
import { services } from '@/lib/site-data'

const slugSet = new Set(exercises.map((e) => e.slug))
const condSlugs = new Set(conditions.map((c) => c.slug))

describe('conditions', () => {
  it('has 12+ conditions, all with unique kebab-case slugs', () => {
    expect(conditions.length).toBeGreaterThanOrEqual(12)
    expect(new Set(conditions.map((c) => c.slug)).size).toBe(conditions.length)
    for (const c of conditions) expect(c.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })
  it('every program stage references only real exercise slugs and is non-empty', () => {
    for (const c of conditions) {
      expect(c.program.length).toBeGreaterThanOrEqual(2)
      for (const st of c.program) {
        expect(st.exerciseSlugs.length).toBeGreaterThan(0)
        for (const s of st.exerciseSlugs) expect(slugSet.has(s), `${c.slug}/${s}`).toBe(true)
      }
    }
  })
  it('serviceSlug and relatedConditionSlugs resolve', () => {
    const svc = new Set(services.map((s) => s.slug))
    for (const c of conditions) {
      if (c.serviceSlug) expect(svc.has(c.serviceSlug), c.slug).toBe(true)
      for (const r of c.relatedConditionSlugs ?? []) expect(condSlugs.has(r), `${c.slug}->${r}`).toBe(true)
    }
  })
  it('every condition has intro, redFlags, recoveryTimeline, 3+ faqs, reviewedBy, reviewedOn', () => {
    for (const c of conditions) {
      expect(c.intro.trim().length).toBeGreaterThan(60)
      expect(c.redFlags.length).toBeGreaterThan(0)
      expect(c.recoveryTimeline.trim().length).toBeGreaterThan(10)
      expect(c.faqs.length).toBeGreaterThanOrEqual(3)
      expect(c.reviewedBy).toBe('Shivaliba Zala')
      expect(c.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
  it('no smart punctuation or non-Latin-1 characters', () => {
    const blob = JSON.stringify(conditions)
    expect(blob).not.toMatch(/[‘’“”–—…]/)
    expect(blob).not.toMatch(/[^\x00-\xFF]/)
  })
})
