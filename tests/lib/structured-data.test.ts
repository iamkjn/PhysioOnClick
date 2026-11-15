import { describe, it, expect } from 'vitest'
import { conditions } from '@/lib/conditions'
import { exercises } from '@/lib/exercises'
import { selfTests } from '@/lib/self-tests'
import {
  exerciseWebPage,
  conditionWebPage,
  exerciseVideoObject,
  selfTestWebPage,
  personRef,
  personNode,
  onlinePhysioWebPage,
  practiceNode,
  priceCatalog,
} from '@/lib/structured-data'
import { pricing } from '@/lib/site-data'
import { serviceLabelFor } from '@/lib/cal-services'
import { homeVisitPricePence, sessionPricePence } from '@/lib/home-visit-pricing'
import { getOnlinePhysioPage } from '@/lib/online-physio-pages'

const ex = exercises.find((e) => e.slug === 'clam-shell')!
const condition = conditions.find((c) => c.slug === 'rotator-cuff-tendinopathy')!
const selfTest = selfTests.find((t) => t.slug === 'full-can-test')!

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

describe('structured-data: selfTestWebPage', () => {
  const node = selfTestWebPage(
    selfTest,
    '/exercises/tests/full-can-test',
  ) as Record<string, unknown>

  it('is a schema.org MedicalWebPage - never MedicalTest/MedicalGuideline', () => {
    expect(node['@context']).toBe('https://schema.org')
    expect(node['@type']).toBe('MedicalWebPage')
    const json = JSON.stringify(node)
    expect(json).not.toContain('"MedicalTest"')
    expect(json).not.toContain('"MedicalGuideline"')
    expect(json).not.toContain('"HowTo"')
    expect(json).not.toContain('"FAQPage"')
  })

  it('points at the page URL', () => {
    expect(String(node.url).endsWith('/exercises/tests/full-can-test')).toBe(true)
  })

  it('attributes and reviews via the shared person reference, with the record date', () => {
    expect(node.author).toEqual(personRef())
    expect(node.reviewedBy).toEqual(personRef())
    expect(node.lastReviewed).toBe(selfTest.reviewedOn)
  })

  it('describes the mapped condition via a nested MedicalCondition', () => {
    const about = node.about as Record<string, unknown>
    expect(about['@type']).toBe('MedicalCondition')
    expect(typeof about.name).toBe('string')
    expect((about.name as string).length).toBeGreaterThan(0)
  })

  it('has a concise, non-empty description', () => {
    expect(typeof node.description).toBe('string')
    expect((node.description as string).length).toBeGreaterThan(0)
    expect((node.description as string).length).toBeLessThanOrEqual(160)
  })
})

describe('structured-data: personNode', () => {
  it('links the practitioner to their independent LinkedIn and CSP profiles', () => {
    const node = personNode() as Record<string, unknown>
    expect(node.sameAs).toEqual([
      'https://www.linkedin.com/in/dr-shivaliba-zala/',
      'https://www.csp.org.uk/user/zalashivali1998gmailcom',
    ])
  })
})

describe('onlinePhysioWebPage about', () => {
  const about = (slug: string) =>
    (onlinePhysioWebPage(getOnlinePhysioPage(slug)!, `/online-physiotherapy-for/${slug}`) as { about: unknown }).about
  it('defaults to MedicalCondition with the page name', () => {
    const p = getOnlinePhysioPage('sciatica')!
    expect(about('sciatica')).toEqual({ '@type': 'MedicalCondition', name: p.name })
  })
  it('uses SurgicalProcedure for procedure pages', () => {
    expect(about('knee-replacement-rehab')).toEqual({ '@type': 'SurgicalProcedure', name: 'Knee replacement' })
    expect(about('hip-replacement-rehab')).toEqual({ '@type': 'SurgicalProcedure', name: 'Hip replacement' })
    expect(about('rotator-cuff-repair-rehab')).toEqual({ '@type': 'SurgicalProcedure', name: 'Rotator cuff repair' })
  })
  it('names stroke as a condition', () => {
    expect(about('stroke-rehabilitation')).toEqual({ '@type': 'MedicalCondition', name: 'Stroke' })
  })
})

describe('structured-data: priceCatalog', () => {
  // Google's AI answer (2026-11-15) showed "Follow-up: £40" and no £70 home
  // follow-up because the site published no machine-readable prices.
  const catalog = practiceNode().hasOfferCatalog as {
    '@type': string
    itemListElement: { name: string; itemListElement: { name: string; price: number; priceCurrency: string; url: string }[] }[]
  }
  const [homeList, videoList] = catalog.itemListElement
  const priceOf = (list: typeof homeList, name: string) => list.itemListElement.find((o) => o.name === name)?.price

  it('is attached to the sitewide practice node', () => {
    expect(catalog['@type']).toBe('OfferCatalog')
    expect(catalog).toEqual(priceCatalog())
  })

  it('lists every home-visit price, including the follow-up, from the checkout pricing', () => {
    expect(homeList.name).toMatch(/home visits/i)
    expect(homeList.itemListElement).toHaveLength(pricing.length)
    for (const item of pricing) {
      expect(priceOf(homeList, serviceLabelFor(item.id, 'home'))).toBe(sessionPricePence(item.id, 'home') / 100)
    }
    expect(priceOf(homeList, 'Follow-Up (home visit)')).toBe(homeVisitPricePence('follow-up') / 100)
  })

  it('lists the video prices separately, and never labels a video price as a home follow-up', () => {
    expect(videoList.name).toMatch(/video/i)
    expect(priceOf(videoList, 'Online Follow-Up')).toBe(sessionPricePence('follow-up') / 100)
    expect(priceOf(videoList, 'Initial Online Assessment')).toBe(sessionPricePence('initial-assessment') / 100)
    for (const offer of videoList.itemListElement) {
      expect(offer.name).not.toMatch(/home/i)
      expect(offer.url.endsWith('/book')).toBe(true)
    }
  })

  it('prices in GBP and links home offers to the home booking flow', () => {
    for (const offer of [...homeList.itemListElement, ...videoList.itemListElement]) {
      expect(offer.priceCurrency).toBe('GBP')
      expect(offer.price).toBeGreaterThan(0)
    }
    for (const offer of homeList.itemListElement) expect(offer.url.endsWith('/book?visit=home')).toBe(true)
  })
})
