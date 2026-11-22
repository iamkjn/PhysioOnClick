// 2026-11-22 expansion (ex-172..ex-187): built as dev-only drafts, signed off
// by Shivaliba the same day and published. These pin that the release is
// complete and honest, and that the per-record content rules hold.
import { describe, expect, it } from 'vitest'
import { allExercises, exercises, validateDosage, hasPrescribedDose, resolveDosage } from '@/lib/exercises'
import { EXPANSION_2026_11_22 } from '@/lib/exercises-expansion-2026-11-22'
import { BODY_AREAS, getBodyArea } from '@/lib/body-areas'
import { areasForRegion } from '@/lib/exercise-library-3d-areas'
import { EXERCISE_ANATOMY, visibleAnatomy } from '@/lib/exercise-anatomy'
import { exerciseImagePrompts, hasUploadedImage } from '@/lib/exercise-image-prompts'
import { exerciseWebPage } from '@/lib/structured-data'
import { getExerciseBySlug, allExerciseSlugs, exercisesByBodyArea } from '@/lib/exercise-library'
import { buildSearchItems } from '@/lib/library-search'
import { POSE_NAMES } from '@/components/exercise-figure'

const EXPECTED_IDS = Array.from({ length: 16 }, (_, i) => `ex-${172 + i}`)

describe('2026-11-22 expansion release', () => {
  it('publishes exactly ex-172..ex-187 with their real sign-off date', () => {
    expect(EXPANSION_2026_11_22.map((e) => e.id)).toEqual(EXPECTED_IDS)
    for (const e of EXPANSION_2026_11_22) {
      expect(e.draft, e.id).toBeUndefined()
      expect(e.reviewedOn, e.id).toBe('2026-11-22')
      expect(e.videoUrl, e.id).toBeUndefined()
    }
  })

  it('serves every record in a prod build, with the original 178 unchanged in front', () => {
    expect(exercises).toHaveLength(194)
    expect(allExercises).toEqual(exercises)
    expect(exercises.slice(0, 178).at(-1)!.id).toBe('ex-171')
    expect(new Set(exercises.map((e) => e.id)).size).toBe(194)
    expect(new Set(exercises.map((e) => e.slug)).size).toBe(194)
  })

  it('gives each a page, a search entry, an approved anatomy entry and its uploaded image', () => {
    const slugs = new Set(allExerciseSlugs())
    const indexed = new Set(buildSearchItems().filter((i) => i.kind === 'exercise').map((i) => i.slug))
    for (const e of EXPANSION_2026_11_22) {
      expect(slugs.has(e.slug), e.slug).toBe(true)
      expect(getExerciseBySlug(e.slug)?.id, e.slug).toBe(e.id)
      expect(indexed.has(e.slug), e.slug).toBe(true)
      expect(EXERCISE_ANATOMY[e.slug]?.status, e.slug).toBe('approved')
      expect(visibleAnatomy(e.slug), e.slug).not.toBeNull()
      expect(exerciseImagePrompts[e.id], e.id).toBeTruthy()
      expect(hasUploadedImage(e.id), e.id).toBe(true)
    }
  })

  it('dates the structured data with the real review, not the library-wide one', () => {
    const page = exerciseWebPage(EXPANSION_2026_11_22[0], '/exercises/x') as Record<string, unknown>
    expect(page.reviewedBy).toBeDefined()
    expect(page.lastReviewed).toBe('2026-11-22')
    const older = exerciseWebPage(exercises[0], '/exercises/y') as Record<string, unknown>
    expect(older.lastReviewed).toBe('2026-09-08')
  })

  it('opens the Jaw area, linked from the 3D head/jaw region', () => {
    expect(BODY_AREAS.map((a) => a.key)).toContain('jaw')
    expect(getBodyArea('jaw')?.label).toBe('Jaw')
    expect(areasForRegion('head-jaw').map((a) => a.key)).toEqual(['jaw'])
    expect(exercisesByBodyArea('jaw').map((e) => e.slug)).toEqual(['controlled-jaw-opening'])
  })
})

describe('expansion records follow the catalogue content rules', () => {
  const STAGES = ['Early rehab', 'Mobility phase', 'Strength phase', 'Return to function', 'Facial rehab']

  it.each(EXPANSION_2026_11_22.map((e) => [e.id, e] as const))('%s', (_id, e) => {
    expect(e.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    expect(STAGES).toContain(e.stage)
    if (e.pose) expect(POSE_NAMES).toContain(e.pose)
    expect(e.setup?.trim()).toBeTruthy()
    expect(e.steps!.length).toBeGreaterThanOrEqual(2)
    expect(e.steps!.length).toBeLessThanOrEqual(8)
    expect(e.cues!.length).toBeGreaterThanOrEqual(1)
    expect(e.cues!.length).toBeLessThanOrEqual(5)
    expect(e.mistakes!.length).toBeGreaterThanOrEqual(1)
    expect(e.mistakes!.length).toBeLessThanOrEqual(5)
    expect(e.mistakes!.at(-1)).toMatch(/^Stop and message your physio if /)
    expect(e.helpsWith).toHaveLength(3)
    const d = e.defaultDosage!
    expect(validateDosage(d)).toBeNull()
    expect(hasPrescribedDose(resolveDosage(e)) || Boolean(d.notes?.trim())).toBe(true)
    expect(JSON.stringify(e)).not.toMatch(/[–—‘’“”…]/)
    expect(JSON.stringify(e)).not.toMatch(/\b(cure[sd]?|guarantee[sd]?|will heal|will fix)\b/i)
    expect(BODY_AREAS.filter((a) => a.bodyParts.includes(e.bodyPart))).toHaveLength(1)
  })
})
