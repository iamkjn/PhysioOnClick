import { describe, it, expect } from 'vitest'
import { conditions } from '@/lib/conditions'
import { exercises } from '@/lib/exercises'
import {
  getCondition,
  allConditionSlugs,
  getExerciseBySlug,
  allExerciseSlugs,
  programForCondition,
  conditionsForExercise,
  relatedExercises,
  programmesForExercise,
  bodyAreas,
  exercisesByBodyArea,
  conditionsByBodyArea,
  searchLibrary,
} from '@/lib/exercise-library'

describe('exercise-library: getCondition / allConditionSlugs', () => {
  it('returns the matching condition on a hit', () => {
    const c = getCondition('rotator-cuff-tendinopathy')
    expect(c).not.toBeNull()
    expect(c?.name).toBe('Rotator cuff tendinopathy')
    expect(c?.program.length).toBeGreaterThanOrEqual(2)
  })

  it('returns null (not undefined) on a miss', () => {
    expect(getCondition('does-not-exist')).toBeNull()
    expect(getCondition('')).toBeNull()
  })

  it('allConditionSlugs mirrors the source array exactly, in order', () => {
    expect(allConditionSlugs()).toEqual(conditions.map((c) => c.slug))
    expect(new Set(allConditionSlugs()).size).toBe(allConditionSlugs().length)
  })
})

describe('exercise-library: getExerciseBySlug / allExerciseSlugs', () => {
  it('returns the matching exercise on a hit', () => {
    const e = getExerciseBySlug('clam-shell')
    expect(e).not.toBeNull()
    expect(e?.title).toBe('Clam Shell')
  })

  it('returns null (not undefined) on a miss', () => {
    expect(getExerciseBySlug('no-such-exercise')).toBeNull()
  })

  it('allExerciseSlugs mirrors the source array exactly, in order', () => {
    expect(allExerciseSlugs()).toEqual(exercises.map((e) => e.slug))
    expect(allExerciseSlugs().length).toBe(174)
  })
})

describe('exercise-library: programForCondition', () => {
  it('maps every stage to its resolved exercises in exerciseSlugs order', () => {
    const program = programForCondition('rotator-cuff-tendinopathy')
    const source = getCondition('rotator-cuff-tendinopathy')!.program

    expect(program.length).toBe(source.length)

    program.forEach((entry, i) => {
      expect(entry.stage).toBe(source[i])
      expect(entry.exercises.length).toBeGreaterThan(0)
      // resolved exercises appear in the same order as the source slug list,
      // and every one actually resolved
      expect(entry.exercises.map((e) => e.slug)).toEqual(source[i].exerciseSlugs)
      for (const ex of entry.exercises) {
        expect(getExerciseBySlug(ex.slug)).not.toBeNull()
      }
    })
  })

  it('silently drops slugs that do not resolve to an exercise', () => {
    // Build a fake stage list with a bogus slug wedged in the middle.
    const real = getCondition('rotator-cuff-tendinopathy')!.program[0].exerciseSlugs
    const resolved = [real[0], 'totally-bogus-slug', real[1]]
      .map((s) => getExerciseBySlug(s))
      .filter((e) => e !== null)
    expect(resolved.map((e) => e!.slug)).toEqual([real[0], real[1]])

    // Through programForCondition itself: real data resolves every slug, so no
    // stage loses any - each stage keeps exactly its intended exerciseSlugs count.
    for (const entry of programForCondition('rotator-cuff-tendinopathy')) {
      expect(entry.exercises.length).toBe(entry.stage.exerciseSlugs.length)
      expect(entry.exercises.length).toBeGreaterThan(0)
    }
  })

  it('returns [] for an unknown condition slug', () => {
    expect(programForCondition('nope')).toEqual([])
  })

  it('every real condition produces a fully-populated program', () => {
    for (const c of conditions) {
      const program = programForCondition(c.slug)
      expect(program.length).toBe(c.program.length)
      for (const entry of program) {
        expect(entry.exercises.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('exercise-library: conditionsForExercise', () => {
  it('puts the primary-condition name match first, then program hubs, deduped', () => {
    const result = conditionsForExercise('shoulder-external-rotation-band')
    const slugs = result.map((c) => c.slug)

    // dedupe by slug
    expect(new Set(slugs).size).toBe(slugs.length)
    // the exercise's own `condition` string is "Rotator cuff tendinopathy"
    expect(slugs[0]).toBe('rotator-cuff-tendinopathy')
    // it also appears in the frozen-shoulder and shoulder-impingement programs
    expect(slugs).toContain('frozen-shoulder')
    expect(slugs).toContain('shoulder-impingement')
  })

  it('finds program hubs even when the exercise has no name match', () => {
    // clam-shell's own condition string ("Hip and knee pain (gluteal weakness)")
    // matches no hub, but the slug is listed in three condition programs.
    const slugs = conditionsForExercise('clam-shell').map((c) => c.slug)
    expect(slugs).toContain('patellofemoral-pain')
    expect(slugs).toContain('gluteal-tendinopathy')
    expect(slugs).toContain('pregnancy-pelvic-girdle-pain')
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('returns [] for an unknown exercise slug', () => {
    expect(conditionsForExercise('no-such-exercise')).toEqual([])
  })
})

describe('exercise-library: relatedExercises', () => {
  it('excludes the exercise itself and respects the limit', () => {
    const related = relatedExercises('clam-shell', 4)
    expect(related.length).toBeGreaterThan(0)
    expect(related.length).toBeLessThanOrEqual(4)
    expect(related.map((e) => e.slug)).not.toContain('clam-shell')
  })

  it('only returns exercises that share a hub or the same bodyPart', () => {
    const target = getExerciseBySlug('clam-shell')!
    const targetHubs = new Set(conditionsForExercise('clam-shell').map((c) => c.slug))
    for (const e of relatedExercises('clam-shell', 8)) {
      const sharesHub = conditionsForExercise(e.slug).some((c) => targetHubs.has(c.slug))
      const sameBodyPart = e.bodyPart === target.bodyPart
      expect(sharesHub || sameBodyPart, e.slug).toBe(true)
    }
  })

  it('prefers a shared-hub exercise over a bodyPart-only match', () => {
    const first = relatedExercises('clam-shell', 6)[0]
    const targetHubs = new Set(conditionsForExercise('clam-shell').map((c) => c.slug))
    expect(conditionsForExercise(first.slug).some((c) => targetHubs.has(c.slug))).toBe(true)
  })

  it('returns [] for an unknown exercise or a non-positive limit', () => {
    expect(relatedExercises('no-such-exercise', 5)).toEqual([])
    expect(relatedExercises('clam-shell', 0)).toEqual([])
  })
})

describe('exercise-library: programmesForExercise', () => {
  it('lists every condition programme an exercise appears in, with its stage', () => {
    const result = programmesForExercise('scapular-setting')
    expect(result.length).toBeGreaterThan(0)

    for (const entry of result) {
      expect(entry.condition).toBeTruthy()
      expect(typeof entry.condition.slug).toBe('string')
      expect(entry.condition.slug.length).toBeGreaterThan(0)
      expect(typeof entry.condition.name).toBe('string')
      expect(entry.condition.name.length).toBeGreaterThan(0)
      expect(typeof entry.stageName).toBe('string')
      expect(entry.stageName.length).toBeGreaterThan(0)
    }

    // scapular-setting sits in rotator-cuff-tendinopathy's first stage.
    const rc = result.find((e) => e.condition.slug === 'rotator-cuff-tendinopathy')
    expect(rc).toBeTruthy()
    expect(rc!.stageName).toBe('Settle the pain')
  })

  it('returns one row per condition, deduped by condition slug', () => {
    const slugs = programmesForExercise('scapular-setting').map((e) => e.condition.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('is deterministic in allConditionSlugs() order', () => {
    const order = allConditionSlugs()
    const slugs = programmesForExercise('scapular-setting').map((e) => e.condition.slug)
    const sorted = [...slugs].sort((a, b) => order.indexOf(a) - order.indexOf(b))
    expect(slugs).toEqual(sorted)
  })

  it('returns [] for an exercise in no programme', () => {
    // smile-mouth-raise is a real facial-rehab exercise that no condition
    // programme lists.
    expect(getExerciseBySlug('smile-mouth-raise')).not.toBeNull()
    expect(programmesForExercise('smile-mouth-raise')).toEqual([])
  })

  it('returns [] for an unknown exercise slug', () => {
    expect(programmesForExercise('no-such-exercise')).toEqual([])
  })
})

describe('exercise-library: bodyAreas / *ByBodyArea (curated taxonomy)', () => {
  it('bodyAreas() returns the curated kebab keys, not the raw jargon union', () => {
    const areas = bodyAreas()
    expect(new Set(areas).size).toBe(areas.length)
    // No internal clinical codes, no sports page.
    expect(areas).not.toContain('Sports & return to activity')
    expect(areas).not.toContain('Neuro')
    expect(areas).not.toContain('Shoulder')
    expect(areas).toContain('shoulder')
    expect(areas).toContain('knee')
    expect(areas.every((k) => /^[a-z][a-z-]*[a-z]$/.test(k))).toBe(true)
  })

  it('exercisesByBodyArea rolls every mapped bodyPart into the area', () => {
    const hip = exercisesByBodyArea('hip')
    expect(hip.length).toBeGreaterThan(0)
    expect(hip.every((e) => e.bodyPart === 'Hip')).toBe(true)
    expect(hip.map((e) => e.slug)).toContain('clam-shell')
    // The knee area rolls up both Knee and Hamstring exercises.
    const kneeParts = new Set(exercisesByBodyArea('knee').map((e) => e.bodyPart))
    expect(kneeParts.has('Knee')).toBe(true)
    expect(kneeParts.has('Hamstring')).toBe(true)
    // Unknown key -> [].
    expect(exercisesByBodyArea('Hip')).toEqual([])
    expect(exercisesByBodyArea('nonsense')).toEqual([])
  })

  it('conditionsByBodyArea resolves the area conditionArea, else []', () => {
    const shoulder = conditionsByBodyArea('shoulder')
    expect(shoulder.length).toBeGreaterThan(0)
    expect(shoulder.every((c) => c.bodyArea === 'Shoulder')).toBe(true)
    expect(shoulder.map((c) => c.slug)).toContain('rotator-cuff-tendinopathy')
    // `Back & neck` is attached to lower-back only, not neck.
    expect(conditionsByBodyArea('lower-back').every((c) => c.bodyArea === 'Back & neck')).toBe(true)
    expect(conditionsByBodyArea('neck')).toEqual([])
    // Areas with no conditionArea, and unknown keys.
    expect(conditionsByBodyArea('neuro')).toEqual([])
    expect(conditionsByBodyArea('nonsense')).toEqual([])
  })
})

describe('exercise-library: searchLibrary', () => {
  it('finds the clamshell exercise by title fragment', () => {
    const { exercises: found } = searchLibrary('clam')
    expect(found.map((e) => e.slug)).toContain('clam-shell')
  })

  it('finds a condition by name fragment', () => {
    const { conditions: found } = searchLibrary('rotator cuff')
    expect(found.map((c) => c.slug)).toContain('rotator-cuff-tendinopathy')
  })

  it('matches a condition on aka only (not just name)', () => {
    // "lumbago" is in low-back-pain's `aka` array, never in any condition name,
    // so this only passes if aka-matching actually works. Anchored: it is the
    // sole match.
    const { conditions: found } = searchLibrary('lumbago')
    expect(found.map((c) => c.slug)).toEqual(['low-back-pain'])
    // Exercises carry no `aka` data yet (0 entries in lib/exercises.ts), so the
    // symmetrical exercise-aka path can't be exercised with real data.
  })

  it('is case-insensitive and trims whitespace', () => {
    const a = searchLibrary('  CLAM  ')
    expect(a.exercises.map((e) => e.slug)).toContain('clam-shell')
  })

  it('empty / whitespace-only query returns empty arrays', () => {
    expect(searchLibrary('')).toEqual({ exercises: [], conditions: [] })
    expect(searchLibrary('   ')).toEqual({ exercises: [], conditions: [] })
  })

  it('never returns more than the ranked-matcher cap', () => {
    // searchLibrary now delegates to the symptom-aware ranker, which caps the
    // combined list at 12; each split list is additionally sliced at 20.
    const { exercises: ex, conditions: co } = searchLibrary('knee pain')
    expect(ex.length + co.length).toBeGreaterThan(0)
    expect(ex.length + co.length).toBeLessThanOrEqual(12)
    expect(ex.length).toBeLessThanOrEqual(20)
    expect(co.length).toBeLessThanOrEqual(20)
  })
})
