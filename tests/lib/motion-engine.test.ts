import { describe, it, expect } from 'vitest'
import { computeAngle, type Landmark, MotionJudge } from '@/lib/motion-engine'
import { DEFAULT_MOTION_TARGETS } from '@/lib/motion-targets'

const p = (x: number, y: number): Landmark => ({ x, y })

describe('computeAngle', () => {
  it('is 90° for a right angle', () => {
    // vertex at origin, one arm along +x, one along +y
    expect(computeAngle(p(1, 0), p(0, 0), p(0, 1))).toBeCloseTo(90, 1)
  })
  it('is 180° for a straight line', () => {
    expect(computeAngle(p(-1, 0), p(0, 0), p(1, 0))).toBeCloseTo(180, 1)
  })
  it('is ~0° when arms overlap', () => {
    expect(computeAngle(p(1, 0), p(0, 0), p(1, 0))).toBeCloseTo(0, 1)
  })
})

// Build a 33-length landmark array where the knee angle (hip 24, knee 26, ankle 28)
// resolves to `deg`, everything else zeroed. hip above knee, ankle below.
function kneeFrame(deg: number) {
  const lm = Array.from({ length: 33 }, () => ({ x: 0, y: 0 }))
  const rad = (deg * Math.PI) / 180
  lm[26] = { x: 0, y: 0 }                       // knee (vertex)
  lm[24] = { x: 0, y: -1 }                      // hip straight up from knee
  lm[28] = { x: Math.sin(rad), y: -Math.cos(rad) } // ankle at `deg` from the hip arm
  return lm
}

describe('MotionJudge (sit-to-stand knee)', () => {
  it('counts a rep on an extend-then-return cycle and tracks ROM', () => {
    const j = new MotionJudge(DEFAULT_MOTION_TARGETS['ex-1'])
    j.update(kneeFrame(85))     // seated (below exit)
    j.update(kneeFrame(170))    // stood (above enter) -> phase up
    const r = j.update(kneeFrame(85)) // sat back (below exit) -> +1 rep
    expect(r.reps).toBe(1)
    expect(r.romMax).toBeGreaterThanOrEqual(169)
    expect(r.romMin).toBeLessThanOrEqual(86)
  })
  it('does not double-count while staying extended', () => {
    const j = new MotionJudge(DEFAULT_MOTION_TARGETS['ex-1'])
    j.update(kneeFrame(85)); j.update(kneeFrame(170)); j.update(kneeFrame(175))
    expect(j.summary().reps).toBe(0) // never returned below exit
  })
})

// Straight-leg-raise style flex exercise: hip angle (shoulder 12, hip 24, knee
// 26) DROPS during the lift, then returns. Build a frame resolving that angle.
function hipFlexFrame(deg: number) {
  const lm = Array.from({ length: 33 }, () => ({ x: 0, y: 0 }))
  const rad = (deg * Math.PI) / 180
  lm[24] = { x: 0, y: 0 }                          // hip (vertex)
  lm[12] = { x: 0, y: -1 }                         // shoulder straight up
  lm[26] = { x: Math.sin(rad), y: -Math.cos(rad) } // knee at `deg` from the trunk
  return lm
}

describe('MotionJudge (flex direction — straight leg raise ex-5)', () => {
  it('counts a rep on a bend-then-return cycle', () => {
    const j = new MotionJudge(DEFAULT_MOTION_TARGETS['ex-5']) // flex, enter 150, exit 165
    j.update(hipFlexFrame(175))       // extended rest (above exit)
    j.update(hipFlexFrame(110))       // lifted (below enter) -> effort
    const r = j.update(hipFlexFrame(175)) // returned (above exit) -> +1 rep
    expect(r.reps).toBe(1)
    expect(r.romMin).toBeLessThanOrEqual(111) // deepest lift captured
  })
  it('does not count while the leg stays lifted', () => {
    const j = new MotionJudge(DEFAULT_MOTION_TARGETS['ex-5'])
    j.update(hipFlexFrame(175)); j.update(hipFlexFrame(110)); j.update(hipFlexFrame(115))
    expect(j.summary().reps).toBe(0) // never returned above exit
  })
})
