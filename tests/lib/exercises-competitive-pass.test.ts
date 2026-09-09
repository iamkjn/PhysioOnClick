import { describe, it, expect } from 'vitest'
import { exercises, hasPrescribedDose, validateDosage } from '@/lib/exercises'
import { conditions } from '@/lib/conditions'
import { getExerciseBySlug } from '@/lib/exercise-library'
import { POSE_NAMES } from '@/components/exercise-figure'
import { hasImagePrompt } from '@/lib/exercise-image-prompts'

// Task 6 (Competitive Pass): the new MSK loading exercises for the thin regions.
// #18 `isometric-quad-wall-sit` was dropped as a functional duplicate of the
// existing `wall-squat-hold` (ex-65), which was already wired into
// `patellar-tendinopathy`. `banded-neck-isometrics` (ex-162) was then dropped
// pre-publication too: it duplicated the already-reviewed `isometric-neck-hold`
// (ex-23) and named a band it never used. Its id is deliberately left as a gap
// rather than renumbering ex-163..ex-167, so the target is 16 new records
// across ex-151..ex-167.
const NEW_SLUGS = [
  'eccentric-wrist-flexion',
  'resisted-wrist-flexion',
  'forearm-pronation-supination',
  'wrist-extension-isotonic',
  'tyler-twist-flexbar',
  'hip-hitch',
  'banded-hip-external-rotation',
  'copenhagen-adductor',
  'single-leg-glute-bridge',
  'standing-banded-hip-abduction',
  'deep-neck-flexor-hold',
  'prone-neck-extension',
  'heavy-slow-calf-raise',
  'seated-calf-raise',
  'spanish-squat',
  'reverse-nordic',
]

// The id ex-162 is intentionally absent - see the note above.
const NEW_IDS = [
  ...Array.from({ length: 11 }, (_, i) => `ex-${151 + i}`),
  ...Array.from({ length: 5 }, (_, i) => `ex-${163 + i}`),
]

// A safety line is an instruction, not merely a scary word: require an actual
// "stop and/if ...", or a route back to the clinician.
const SAFETY_RE = /stop (and|if)|seek|message your physio|get it checked|get (it |this )?assessed/i

describe('competitive pass: new MSK exercises', () => {
  it('adds exactly 16 new records across ex-151..ex-167 (ex-162 withdrawn)', () => {
    const added = exercises.filter((e) => NEW_SLUGS.includes(e.slug))
    expect(added.map((e) => e.slug).sort()).toEqual([...NEW_SLUGS].sort())
    expect(added.map((e) => e.id)).toEqual(NEW_IDS)
    expect(exercises.some((e) => e.id === 'ex-162')).toBe(false)
    expect(exercises.some((e) => e.slug === 'banded-neck-isometrics')).toBe(false)
  })

  it('keeps the reviewed isometric-neck-hold (ex-23) in the neck-pain programme', () => {
    const neck = conditions.find((c) => c.slug === 'neck-pain')!
    const refs = neck.program.flatMap((st) => st.exerciseSlugs)
    expect(refs).toContain('isometric-neck-hold')
    expect(refs).not.toContain('banded-neck-isometrics')
  })

  it('every new slug is unique, kebab-case and resolves via getExerciseBySlug', () => {
    expect(new Set(NEW_SLUGS).size).toBe(NEW_SLUGS.length)
    for (const slug of NEW_SLUGS) {
      expect(slug, slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(getExerciseBySlug(slug), slug).not.toBeNull()
    }
  })

  it('every new record has a full, safe write-up', () => {
    for (const slug of NEW_SLUGS) {
      const e = getExerciseBySlug(slug)!
      expect(e.setup && e.setup.trim().length, `${slug} setup`).toBeGreaterThan(10)
      expect(e.steps?.length ?? 0, `${slug} steps`).toBeGreaterThanOrEqual(3)
      expect(e.steps?.length ?? 0, `${slug} steps`).toBeLessThanOrEqual(5)
      expect(e.cues?.length ?? 0, `${slug} cues`).toBeGreaterThanOrEqual(3)
      expect(e.cues?.length ?? 0, `${slug} cues`).toBeLessThanOrEqual(4)
      expect(e.mistakes?.length ?? 0, `${slug} mistakes`).toBeGreaterThanOrEqual(3)
      expect(e.mistakes?.length ?? 0, `${slug} mistakes`).toBeLessThanOrEqual(4)

      const last = e.mistakes![e.mistakes!.length - 1]
      expect(last, `${slug} safety line`).toMatch(SAFETY_RE)

      expect(e.defaultDosage, `${slug} dosage`).toBeTruthy()
      expect(hasPrescribedDose(e.defaultDosage!), `${slug} prescribed dose`).toBe(true)
      expect(validateDosage(e.defaultDosage!), `${slug} dosage valid`).toBeNull()
      expect(
        e.defaultDosage!.perDay != null || e.defaultDosage!.perWeek != null,
        `${slug} frequency`,
      ).toBe(true)

      expect(e.helpsWith?.length ?? 0, `${slug} helpsWith`).toBeGreaterThanOrEqual(1)
      for (const item of e.helpsWith ?? []) expect(item.trim().length).toBeGreaterThan(0)

      if (e.pose != null) {
        expect(POSE_NAMES.includes(e.pose as never), `${slug} pose ${e.pose}`).toBe(true)
      }

      expect(hasImagePrompt(e.id), `${slug} image prompt`).toBe(true)
    }
  })

  it('new records are ASCII / Latin-1 only (no smart punctuation)', () => {
    const added = exercises.filter((e) => NEW_SLUGS.includes(e.slug))
    const blob = JSON.stringify(added)
    expect(blob).not.toMatch(/[–—‘’“”…]/)
    expect(blob).not.toMatch(/[^\x00-\xFF]/)
  })
})

// Kept in sync by hand with STAGE_ORDER in lib/exercise-suggestions.ts, which is
// module-private. Anything outside this set sorts last in the suggestion ranking
// and renders as a spurious badge, so pin the whole catalogue - not just the new
// records - against it.
const ALLOWED_STAGES = [
  'Early rehab',
  'Mobility phase',
  'Strength phase',
  'Return to function',
  'Facial rehab',
]

describe('catalogue-wide invariants', () => {
  it('every exercise stage is one of the five catalogue values', () => {
    for (const e of exercises) {
      expect(ALLOWED_STAGES, `${e.id} ${e.slug} stage "${e.stage}"`).toContain(e.stage)
    }
  })
})

describe('competitive pass: thin condition hubs wired to the new exercises', () => {
  const hubReferences = (slug: string) => {
    const c = conditions.find((x) => x.slug === slug)!
    return new Set(c.program.flatMap((st) => st.exerciseSlugs))
  }

  it.each([
    ['golfers-elbow'],
    ['tennis-elbow'],
    ['gluteal-tendinopathy'],
    ['neck-pain'],
    ['achilles-tendinopathy'],
  ])('%s references at least one new slug', (slug) => {
    const refs = hubReferences(slug)
    expect(NEW_SLUGS.some((s) => refs.has(s)), slug).toBe(true)
  })

  it('every hub stage still resolves and is never empty (existing invariant)', () => {
    for (const c of conditions) {
      for (const st of c.program) {
        expect(st.exerciseSlugs.length, `${c.slug}/${st.stage}`).toBeGreaterThan(0)
        for (const s of st.exerciseSlugs) {
          expect(getExerciseBySlug(s), `${c.slug}/${st.stage}/${s}`).not.toBeNull()
        }
      }
    }
  })

  it('stages that reference a new slug stay within 3..6 exercises', () => {
    for (const c of conditions) {
      for (const st of c.program) {
        if (!st.exerciseSlugs.some((s) => NEW_SLUGS.includes(s))) continue
        expect(st.exerciseSlugs.length, `${c.slug}/${st.stage}`).toBeGreaterThanOrEqual(3)
        expect(st.exerciseSlugs.length, `${c.slug}/${st.stage}`).toBeLessThanOrEqual(6)
      }
    }
  })
})
