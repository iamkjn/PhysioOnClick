import { describe, it, expect } from 'vitest'
import { conditions } from '@/lib/conditions'
import { selfTests } from '@/lib/self-tests'
import {
  getSelfTest,
  allSelfTestSlugs,
  selfTestsForCondition,
  selfTestsByBodyArea,
} from '@/lib/exercise-library'

const condSlugs = new Set(conditions.map((c) => c.slug))
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const IMAGE_ID = /^test-[a-z0-9-]+-\d+$/

describe('self-tests: shape and launch set', () => {
  it('ships the 12-record launch set', () => {
    expect(selfTests.length).toBe(12)
  })

  it('every slug is unique and kebab-case', () => {
    const slugs = selfTests.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s, s).toMatch(KEBAB)
  })

  it('every conditionSlugs entry resolves to a real condition hub', () => {
    for (const t of selfTests) {
      expect(t.conditionSlugs.length).toBeGreaterThan(0)
      for (const cs of t.conditionSlugs) {
        expect(condSlugs.has(cs), `${t.slug} -> ${cs}`).toBe(true)
      }
    }
  })

  it('every record has 3 to 5 steps', () => {
    for (const t of selfTests) {
      expect(t.steps.length, t.slug).toBeGreaterThanOrEqual(3)
      expect(t.steps.length, t.slug).toBeLessThanOrEqual(5)
    }
  })

  it('every step has a label, at least one instruction bullet, and a valid imageId', () => {
    for (const t of selfTests) {
      t.steps.forEach((step, i) => {
        expect(step.label.trim().length, `${t.slug}#${i + 1} label`).toBeGreaterThan(0)
        expect(step.instruction.length, `${t.slug}#${i + 1} instruction`).toBeGreaterThanOrEqual(1)
        for (const bullet of step.instruction) {
          expect(bullet.trim().length, `${t.slug}#${i + 1} bullet`).toBeGreaterThan(0)
        }
        expect(step.imageId, `${t.slug}#${i + 1} imageId`).toMatch(IMAGE_ID)
        // imageId trailing number is the 1-based step position
        expect(step.imageId.endsWith(`-${i + 1}`), step.imageId).toBe(true)
      })
    }
  })

  it('every imageId is unique across all records', () => {
    const ids = selfTests.flatMap((t) => t.steps.map((s) => s.imageId))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every result / interpretation / narrative field is non-empty', () => {
    for (const t of selfTests) {
      expect(t.assesses.trim().length, `${t.slug} assesses`).toBeGreaterThan(0)
      expect(t.whatItChecks.trim().length, `${t.slug} whatItChecks`).toBeGreaterThan(0)
      expect(t.whoShouldNotDoThis.trim().length, `${t.slug} whoShouldNotDoThis`).toBeGreaterThan(0)
      expect(t.interpretation.trim().length, `${t.slug} interpretation`).toBeGreaterThan(0)
      expect(t.negativeResult.length, `${t.slug} negativeResult`).toBeGreaterThan(0)
      expect(t.positiveResult.length, `${t.slug} positiveResult`).toBeGreaterThan(0)
      expect(t.tips.length, `${t.slug} tips`).toBeGreaterThan(0)
      for (const bucket of ['negativeResult', 'positiveResult', 'tips'] as const) {
        for (const line of t[bucket]) {
          expect(line.trim().length, `${t.slug} ${bucket}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('interpretation is hedged, never assertive', () => {
    for (const t of selfTests) {
      expect(t.interpretation.toLowerCase(), t.slug).toContain('may point towards')
      // no bare diagnostic assertion
      expect(t.interpretation.toLowerCase(), t.slug).not.toMatch(/this means you have/)
    }
  })

  it('every contraindication opens with the imperative lead the page callout relies on', () => {
    // app/exercises/tests/[slug]/page.tsx strips this exact lead to build the
    // coral "Do not do this test if" heading; a differently-phrased record
    // would silently downgrade that heading to a soft advisory.
    for (const t of selfTests) {
      expect(t.whoShouldNotDoThis, t.slug).toMatch(/^Do not do this test if\s+/)
    }
  })

  it('every record carries the shared clinical-review placeholder', () => {
    for (const t of selfTests) {
      expect(t.reviewedBy, t.slug).toBe('Shivaliba Zala')
      expect(t.reviewedOn, t.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(t.reviewedOn)), t.slug).toBe(false)
    }
  })

  it('no smart punctuation or non-Latin-1 characters anywhere in the records', () => {
    const blob = JSON.stringify(selfTests)
    expect(blob).not.toMatch(/[‘’“”–—…]/)
    expect(blob).not.toMatch(/[^\x00-\xFF]/)
  })
})

describe('self-tests: exercise-library helpers', () => {
  it('getSelfTest returns the record on a hit and null on a miss', () => {
    const t = getSelfTest('full-can-test')
    expect(t).not.toBeNull()
    expect(t?.name).toBe('Full Can Test')
    expect(getSelfTest('no-such-test')).toBeNull()
    expect(getSelfTest('')).toBeNull()
  })

  it('allSelfTestSlugs mirrors the source array exactly', () => {
    expect(allSelfTestSlugs()).toEqual(selfTests.map((t) => t.slug))
    expect(allSelfTestSlugs().length).toBe(selfTests.length)
  })

  it('selfTestsForCondition returns exactly the tests mapped to that hub', () => {
    const sciatica = selfTestsForCondition('sciatica').map((t) => t.slug)
    expect(sciatica).toContain('slump-self-check')
    expect(sciatica).toContain('straight-leg-raise-self-check')
    for (const t of selfTestsForCondition('sciatica')) {
      expect(t.conditionSlugs).toContain('sciatica')
    }
    expect(selfTestsForCondition('tennis-elbow').map((t) => t.slug)).toEqual([
      'resisted-wrist-extension-test',
    ])
    expect(selfTestsForCondition('no-such-condition')).toEqual([])
  })

  it('selfTestsByBodyArea matches SelfTest.bodyArea case-insensitively', () => {
    const shoulder = selfTestsByBodyArea('Shoulder')
    expect(shoulder.length).toBe(3)
    expect(shoulder.every((t) => t.bodyArea === 'Shoulder')).toBe(true)
    expect(selfTestsByBodyArea('shoulder').length).toBe(shoulder.length)
    expect(selfTestsByBodyArea('nonsense')).toEqual([])
  })
})
