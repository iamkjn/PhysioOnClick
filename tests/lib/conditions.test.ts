import { describe, it, expect } from 'vitest'
import { conditions } from '@/lib/conditions'
import { exercises } from '@/lib/exercises'
import { services } from '@/lib/site-data'

const slugSet = new Set(exercises.map((e) => e.slug))
const condSlugs = new Set(conditions.map((c) => c.slug))
const words = (s: string) => s.split(/\s+/).filter(Boolean)

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
  it('every intro has the depth a condition hub needs', () => {
    for (const c of conditions) {
      expect(words(c.intro).length, `${c.slug} intro word count`).toBeGreaterThanOrEqual(200)
      expect(words(c.intro).length, `${c.slug} intro word count`).toBeLessThanOrEqual(340)
      // 3+ paragraphs, split on a blank line, as the hub page renders them.
      const paras = c.intro.split('\n\n').filter((p) => p.trim().length > 0)
      expect(paras.length, `${c.slug} intro paragraphs`).toBeGreaterThanOrEqual(3)
      expect(words(c.whoItHelps).length, `${c.slug} whoItHelps word count`).toBeGreaterThanOrEqual(40)
    }
  })
  it('every seoTitle fits the SERP and keeps the brand suffix', () => {
    for (const c of conditions) {
      expect(c.seoTitle.length, `${c.slug} seoTitle length`).toBeLessThanOrEqual(60)
      expect(c.seoTitle.endsWith(' | PhysioOnClick'), `${c.slug} seoTitle suffix`).toBe(true)
    }
  })
  it('every seoDescription fits the SERP snippet', () => {
    for (const c of conditions) {
      expect(c.seoDescription.length, `${c.slug} seoDescription length`).toBeGreaterThanOrEqual(120)
      expect(c.seoDescription.length, `${c.slug} seoDescription length`).toBeLessThanOrEqual(158)
    }
  })
  it('the programmes are untouched by copy passes', () => {
    // Snapshot of the Task 6 programme wiring - copy edits must not disturb it.
    expect(conditions.length).toBe(25)
    expect(conditions.reduce((n, c) => n + c.program.length, 0)).toBe(82)
    expect(
      conditions.reduce((n, c) => n + c.program.reduce((m, s) => m + s.exerciseSlugs.length, 0), 0),
    ).toBe(289)
  })
  it('no smart punctuation or non-Latin-1 characters', () => {
    const blob = JSON.stringify(conditions)
    expect(blob).not.toMatch(/[‘’“”–—…]/)
    expect(blob).not.toMatch(/[^\x00-\xFF]/)
    for (const c of conditions) {
      for (const field of [c.intro, c.seoTitle, c.seoDescription, c.whoItHelps]) {
        expect(field, c.slug).not.toMatch(/[‘’“”–—…]/)
        expect(field, c.slug).not.toMatch(/[^\x00-\xFF]/)
      }
    }
  })
})
