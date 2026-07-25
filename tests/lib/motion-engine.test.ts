import { describe, it, expect } from 'vitest'
import { computeAngle, type Landmark } from '@/lib/motion-engine'

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
