import { describe, it, expect } from 'vitest'
import { exercises } from '@/lib/exercises'
import { POSE_NAMES } from '@/components/exercise-figure'

describe('exercise catalogue shape', () => {
  it('has no empty strings in steps/cues/mistakes/equipment', () => {
    const bad = exercises.filter((e) =>
      [e.steps, e.cues, e.mistakes, e.equipment].some(
        (arr) => arr && arr.some((s) => s.trim().length === 0),
      ),
    ).map((e) => e.id)
    expect(bad).toEqual([])
  })

  it('has 2–8 steps wherever steps are present', () => {
    const bad = exercises.filter((e) => e.steps && (e.steps.length < 2 || e.steps.length > 8)).map((e) => e.id)
    expect(bad).toEqual([])
  })

  it('has at most 5 cues and at most 5 mistakes wherever present', () => {
    const bad = exercises.filter((e) => (e.cues && e.cues.length > 5) || (e.mistakes && e.mistakes.length > 5)).map((e) => e.id)
    expect(bad).toEqual([])
  })

  it('has a usable defaultDosage (reps or holdSeconds) wherever one is set', () => {
    const bad = exercises.filter((e) => e.defaultDosage && e.defaultDosage.reps == null && e.defaultDosage.holdSeconds == null).map((e) => e.id)
    expect(bad).toEqual([])
  })

  it('uses a known SPECS pose wherever pose is set', () => {
    const bad = exercises.filter((e) => e.pose && !POSE_NAMES.includes(e.pose as never)).map((e) => e.id)
    expect(bad).toEqual([])
  })

  it('has stable unique ids', () => {
    const ids = exercises.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
