// Draft gate for the 2026-11-22 expansion (ex-172..ex-187).
//
// Drafts must never reach a prod build: tests run with
// NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS unset (= prod), and the "dev build"
// block re-imports the modules with the flag on (= dev.physioonclick.co.uk).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { allExercises, exercises } from '@/lib/exercises'
import { EXPANSION_2026_11_22 } from '@/lib/exercises-expansion-2026-11-22'
import { ALL_BODY_AREAS, BODY_AREAS, getBodyArea } from '@/lib/body-areas'
import { areasForRegion } from '@/lib/exercise-library-3d-areas'
import { EXERCISE_ANATOMY } from '@/lib/exercise-anatomy'
import { exerciseImagePrompts, hasUploadedImage } from '@/lib/exercise-image-prompts'
import { exerciseWebPage } from '@/lib/structured-data'
import { getExerciseBySlug, allExerciseSlugs, searchLibrary } from '@/lib/exercise-library'
import { buildSearchItems } from '@/lib/library-search'
import { validateDosage, hasPrescribedDose, resolveDosage } from '@/lib/exercises'
import { POSE_NAMES } from '@/components/exercise-figure'

const EXPECTED_IDS = Array.from({ length: 16 }, (_, i) => `ex-${172 + i}`)
const draftSlugs = EXPANSION_2026_11_22.map((e) => e.slug)

describe('2026-11-22 expansion records', () => {
  it('adds exactly ex-172..ex-187, all drafts, none claiming a review', () => {
    expect(EXPANSION_2026_11_22.map((e) => e.id)).toEqual(EXPECTED_IDS)
    for (const e of EXPANSION_2026_11_22) {
      expect(e.draft, e.id).toBe(true)
      expect(e.reviewedOn, e.id).toBeUndefined()
      expect(e.videoUrl, e.id).toBeUndefined()
    }
  })

  it('keeps ids and slugs unique across the whole catalogue, drafts included', () => {
    const ids = allExercises.map((e) => e.id)
    const slugs = allExercises.map((e) => e.slug)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('leaves the published catalogue exactly as it was (178 records, same order)', () => {
    const published = allExercises.filter((e) => !e.draft)
    expect(published).toHaveLength(178)
    expect(published[0].id).toBe('ex-1')
    expect(published.at(-1)!.id).toBe('ex-171')
  })

  it('gives every draft a draft anatomy entry, an image prompt and its illustration', () => {
    for (const e of EXPANSION_2026_11_22) {
      expect(EXERCISE_ANATOMY[e.slug]?.status, e.slug).toBe('draft')
      expect(exerciseImagePrompts[e.id], e.id).toBeTruthy()
      expect(hasUploadedImage(e.id), e.id).toBe(true)
    }
  })

  it('never claims a reviewer or review date in a draft page\'s structured data', () => {
    const page = exerciseWebPage(EXPANSION_2026_11_22[0], '/exercises/x') as Record<string, unknown>
    expect(page.reviewedBy).toBeUndefined()
    expect(page.lastReviewed).toBeUndefined()
    const published = exerciseWebPage(exercises[0], '/exercises/y') as Record<string, unknown>
    expect(published.reviewedBy).toBeDefined()
    expect(published.lastReviewed).toBe('2026-09-08')
  })
})

// The catalogue-wide content tests read `exercises`, which hides drafts in a
// prod-like run, so the same per-record rules are applied to the drafts here.
describe('draft records follow the catalogue content rules', () => {
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
    for (const s of [...e.steps!, ...e.cues!, ...e.mistakes!, ...(e.equipment ?? []), ...(e.aka ?? [])]) {
      expect(s.trim().length).toBeGreaterThan(0)
    }
    expect(e.helpsWith).toHaveLength(3)
    const d = e.defaultDosage!
    expect(validateDosage(d)).toBeNull()
    expect(hasPrescribedDose(resolveDosage(e)) || Boolean(d.notes?.trim())).toBe(true)
    expect(JSON.stringify(e)).not.toMatch(/[\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/)
    expect(JSON.stringify(e)).not.toMatch(/\b(cure[sd]?|guarantee[sd]?|will heal|will fix)\b/i)
    const owners = ALL_BODY_AREAS.filter((a) => a.bodyParts.includes(e.bodyPart))
    expect(owners).toHaveLength(1)
  })
})

describe('prod build (drafts hidden)', () => {
  it('serves no draft exercise anywhere in the catalogue', () => {
    expect(exercises.some((e) => e.draft)).toBe(false)
    expect(exercises).toHaveLength(178)
  })

  it('has no draft page, search hit or area', () => {
    const slugs = new Set(allExerciseSlugs())
    for (const slug of draftSlugs) {
      expect(slugs.has(slug), slug).toBe(false)
      expect(getExerciseBySlug(slug), slug).toBeNull()
    }
    const hits = ['jaw', 'toe yoga', 'pursed lip breathing', 'gaze stabilisation'].flatMap((q) =>
      searchLibrary(q).exercises.map((r) => r.slug),
    )
    for (const slug of draftSlugs) expect(hits, slug).not.toContain(slug)
    const indexed = new Set(buildSearchItems().filter((i) => i.kind === 'exercise').map((i) => i.slug))
    for (const slug of draftSlugs) expect(indexed.has(slug), slug).toBe(false)
    expect(BODY_AREAS.map((a) => a.key)).not.toContain('jaw')
    expect(getBodyArea('jaw')).toBeNull()
    expect(areasForRegion('head-jaw')).toEqual([])
    expect(ALL_BODY_AREAS.find((a) => a.key === 'jaw')?.draft).toBe(true)
  })
})

describe('dev build (drafts visible)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  async function devModules() {
    vi.stubEnv('NEXT_PUBLIC_EXERCISE_ANATOMY_DRAFTS', '1')
    vi.resetModules()
    return {
      catalogue: await import('@/lib/exercises'),
      areas: await import('@/lib/body-areas'),
      region: await import('@/lib/exercise-library-3d-areas'),
      library: await import('@/lib/exercise-library'),
    }
  }

  it('serves the drafts alongside the published catalogue', async () => {
    const { catalogue, library } = await devModules()
    expect(catalogue.exercises).toHaveLength(178 + 16)
    for (const slug of draftSlugs) expect(library.getExerciseBySlug(slug)?.slug, slug).toBe(slug)
  })

  it('rolls every served exercise into exactly one served area, jaw included', async () => {
    const { catalogue, areas, region } = await devModules()
    for (const e of catalogue.exercises) {
      const owners = areas.BODY_AREAS.filter((a) => a.bodyParts.includes(e.bodyPart))
      expect(owners.map((a) => a.key), `${e.id} ${e.bodyPart}`).toHaveLength(1)
    }
    expect(areas.getBodyArea('jaw')?.label).toBe('Jaw')
    expect(region.areasForRegion('head-jaw').map((a) => a.key)).toEqual(['jaw'])
  })
})
