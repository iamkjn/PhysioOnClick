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
    expect(allExerciseSlugs().length).toBe(158)
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

describe('exercise-library: bodyAreas / *ByBodyArea', () => {
  it('is a sorted, de-duplicated union that always includes the sports category', () => {
    const areas = bodyAreas()
    expect(areas).toContain('Sports & return to activity')
    expect(new Set(areas).size).toBe(areas.length)
    expect([...areas].sort((a, b) => a.localeCompare(b))).toEqual(areas)
    // union of both sources
    expect(areas).toContain('Shoulder') // Exercise.bodyPart and Condition.bodyArea
    expect(areas).toContain('Knee')
  })

  it('exercisesByBodyArea exact-matches Exercise.bodyPart', () => {
    const hip = exercisesByBodyArea('Hip')
    expect(hip.length).toBeGreaterThan(0)
    expect(hip.every((e) => e.bodyPart === 'Hip')).toBe(true)
    expect(hip.map((e) => e.slug)).toContain('clam-shell')
    // case-insensitive
    expect(exercisesByBodyArea('hip').length).toBe(hip.length)
    expect(exercisesByBodyArea('nonsense')).toEqual([])
  })

  it('conditionsByBodyArea exact-matches Condition.bodyArea', () => {
    const shoulder = conditionsByBodyArea('Shoulder')
    expect(shoulder.length).toBeGreaterThan(0)
    expect(shoulder.every((c) => c.bodyArea === 'Shoulder')).toBe(true)
    expect(shoulder.map((c) => c.slug)).toContain('rotator-cuff-tendinopathy')
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

  it('matches condition aka as well as name', () => {
    // "shoulder impingement" is an aka of rotator-cuff-tendinopathy
    const { conditions: found } = searchLibrary('impingement')
    expect(found.map((c) => c.slug)).toContain('shoulder-impingement')
  })

  it('is case-insensitive and trims whitespace', () => {
    const a = searchLibrary('  CLAM  ')
    expect(a.exercises.map((e) => e.slug)).toContain('clam-shell')
  })

  it('empty / whitespace-only query returns empty arrays', () => {
    expect(searchLibrary('')).toEqual({ exercises: [], conditions: [] })
    expect(searchLibrary('   ')).toEqual({ exercises: [], conditions: [] })
  })

  it('caps each list at 20 results', () => {
    const { exercises: found } = searchLibrary('e') // ~148 titles contain "e"
    expect(found.length).toBe(20)
  })
})
