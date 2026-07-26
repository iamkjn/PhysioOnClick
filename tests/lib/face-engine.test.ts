import { describe, it, expect } from 'vitest'
import {
  FACE,
  FaceJudge,
  normalisedSignal,
  symmetryScore,
  type FaceLandmark,
} from '@/lib/face-engine'
import { DEFAULT_FACE_TARGETS } from '@/lib/face-targets'

// Build a face-landmark array where the smile signal (mouth-corner ↔ nose-tip,
// normalised by inter-ocular width) resolves to a chosen raw distance per side.
// Eyes are placed 1.0 apart so the normaliser is 1 and raw distance == signal.
function smileFrame(dLeft: number, dRight: number): FaceLandmark[] {
  const lm: FaceLandmark[] = Array.from({ length: 468 }, () => ({ x: 0, y: 0 }))
  lm[FACE.L_EYE_OUTER] = { x: -0.5, y: 0 }
  lm[FACE.R_EYE_OUTER] = { x: 0.5, y: 0 } // interocular = 1
  lm[FACE.NOSE_TIP] = { x: 0, y: 1 }
  lm[FACE.L_MOUTH_CORNER] = { x: 0, y: 1 + dLeft }
  lm[FACE.R_MOUTH_CORNER] = { x: 0, y: 1 + dRight }
  return lm
}

describe('symmetryScore', () => {
  it('is 100 when both sides match', () => {
    expect(symmetryScore(70, 70)).toBe(100)
  })
  it('is 100 when both sides are zero (nothing to compare)', () => {
    expect(symmetryScore(0, 0)).toBe(100)
  })
  it('drops as the sides diverge', () => {
    expect(symmetryScore(90, 40)).toBe(62) // 1 - 50/130
    expect(symmetryScore(100, 0)).toBe(0)
  })
})

describe('normalisedSignal', () => {
  it('is scale-invariant via inter-ocular normalisation', () => {
    const f = smileFrame(0.9, 0.9)
    expect(normalisedSignal(f, [FACE.L_MOUTH_CORNER, FACE.NOSE_TIP])).toBeCloseTo(0.9, 3)
  })
  it('returns 0 when a required point is missing', () => {
    const f = smileFrame(0.9, 0.9)
    f[FACE.NOSE_TIP] = undefined as unknown as FaceLandmark
    expect(normalisedSignal(f, [FACE.L_MOUTH_CORNER, FACE.NOSE_TIP])).toBe(0)
  })
})

describe('FaceJudge (smile)', () => {
  const target = DEFAULT_FACE_TARGETS['face-smile'] // rest 0.9, active 1.15, enter 55, exit 25

  it('counts a gentle rep on activate-then-relax and stays even', () => {
    const j = new FaceJudge(target)
    j.update(smileFrame(0.9, 0.9)) // rest → activation 0
    const held = j.update(smileFrame(1.075, 1.075)) // ~70% both sides → hold
    expect(held.phase).toBe('hold')
    expect(held.symmetry).toBe(100)
    const done = j.update(smileFrame(0.9, 0.9)) // relax → +1 rep
    expect(done.reps).toBe(1)
    const s = j.summary()
    expect(s.reps).toBe(1)
    expect(s.weakerSide).toBe('even')
    expect(s.symmetryAvg).toBeGreaterThanOrEqual(90)
  })

  it('flags the weaker side when one side lags', () => {
    const j = new FaceJudge(target)
    j.update(smileFrame(0.9, 0.9))
    // left ~90%, right ~40% → asymmetric but ratio 65 still enters hold
    j.update(smileFrame(1.125, 1.0))
    j.update(smileFrame(0.9, 0.9))
    const s = j.summary()
    expect(s.reps).toBe(1)
    expect(s.weakerSide).toBe('right')
    expect(s.symmetryAvg).toBeLessThan(75)
  })

  it('does not count a rep that never relaxes below the exit threshold', () => {
    const j = new FaceJudge(target)
    j.update(smileFrame(0.9, 0.9))
    j.update(smileFrame(1.075, 1.075))
    j.update(smileFrame(1.15, 1.15)) // stays fully active
    expect(j.summary().reps).toBe(0)
  })
})
