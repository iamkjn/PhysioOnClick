import { describe, it, expect } from 'vitest'
import { conditions } from '@/lib/conditions'
import { exercises } from '@/lib/exercises'
import {
  exerciseWebPage,
  conditionWebPage,
  exerciseVideoObject,
  personRef,
} from '@/lib/structured-data'

const ex = exercises.find((e) => e.slug === 'clam-shell')!
const condition = conditions.find((c) => c.slug === 'rotator-cuff-tendinopathy')!

describe('structured-data: exerciseWebPage', () => {
  const node = exerciseWebPage(ex, '/exercises/clam-shell') as Record<string, unknown>

  it('is a schema.org MedicalWebPage', () => {
    expect(node['@context']).toBe('https://schema.org')
    expect(node['@type']).toBe('MedicalWebPage')
  })

  it('points at the page URL', () => {
    expect(String(node.url).endsWith('/exercises/clam-shell')).toBe(true)
  })

  it('attributes and reviews via the shared person reference', () => {
    expect(node.author).toEqual(personRef())
    expect(node.reviewedBy).toEqual(personRef())
  })

  it('carries an ISO review date', () => {
    expect(node.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('has a concise, non-empty description', () => {
    expect(typeof node.description).toBe('string')
    expect((node.description as string).length).toBeGreaterThan(0)
    expect((node.description as string).length).toBeLessThanOrEqual(160)
  })

  it('describes the condition it helps with', () => {
    expect(node.about).toEqual({ '@type': 'MedicalCondition', name: ex.condition })
  })

  it('emits no retired rich-result types', () => {
    const json = JSON.stringify(node)
    expect(json).not.toContain('"HowTo"')
    expect(json).not.toContain('"FAQPage"')
  })
})

describe('structured-data: conditionWebPage', () => {
  const node = conditionWebPage(
    condition,
    '/exercises/for/rotator-cuff-tendinopathy',
  ) as Record<string, unknown>

  it('is a schema.org MedicalWebPage', () => {
    expect(node['@context']).toBe('https://schema.org')
    expect(node['@type']).toBe('MedicalWebPage')
  })

  it('uses the condition SEO copy verbatim', () => {
    expect(node.name).toBe(condition.seoTitle)
    expect(node.description).toBe(condition.seoDescription)
  })

  it('points at the page URL', () => {
    expect(String(node.url).endsWith('/exercises/for/rotator-cuff-tendinopathy')).toBe(true)
  })

  it('attributes, reviews and dates from the shared person + condition record', () => {
    expect(node.author).toEqual(personRef())
    expect(node.reviewedBy).toEqual(personRef())
    expect(node.lastReviewed).toBe(condition.reviewedOn)
  })

  it('carries the FAQ as Question/Answer mainEntity nodes', () => {
    const mainEntity = node.mainEntity as Array<Record<string, unknown>>
    expect(mainEntity).toHaveLength(condition.faqs.length)
    mainEntity.forEach((q, i) => {
      expect(q['@type']).toBe('Question')
      expect(q.name).toBe(condition.faqs[i].q)
      const answer = q.acceptedAnswer as Record<string, unknown>
      expect(answer['@type']).toBe('Answer')
      expect(answer.text).toBe(condition.faqs[i].a)
    })
  })

  it('emits no retired rich-result types', () => {
    const json = JSON.stringify(node)
    expect(json).not.toContain('"HowTo"')
    expect(json).not.toContain('"FAQPage"')
  })
})

describe('structured-data: exerciseVideoObject', () => {
  it('is null for every current exercise (no structured video field yet)', () => {
    for (const e of exercises) {
      expect(exerciseVideoObject(e)).toBeNull()
    }
  })
})
