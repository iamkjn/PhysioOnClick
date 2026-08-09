import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))

const getDocMock = vi.fn()
const setDocMock = vi.fn()

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}))

import {
  getStreakGoal,
  setStreakGoal,
  getValidCheckinIntervals,
  getPainCheckinInterval,
  getCurrentRun,
} from '@/lib/goals'

describe('getStreakGoal', () => {
  beforeEach(() => {
    getDocMock.mockReset()
  })

  it('returns streakTarget when the goal doc exists', async () => {
    getDocMock.mockResolvedValue({ exists: () => true, data: () => ({ streakTarget: 14 }) })
    await expect(getStreakGoal('uid-1', 'person-1')).resolves.toBe(14)
  })

  it('returns null when the goal doc does not exist', async () => {
    getDocMock.mockResolvedValue({ exists: () => false, data: () => undefined })
    await expect(getStreakGoal('uid-1', 'person-1')).resolves.toBeNull()
  })

  it('returns null when streakTarget is not a number', async () => {
    getDocMock.mockResolvedValue({ exists: () => true, data: () => ({ streakTarget: 'oops' }) })
    await expect(getStreakGoal('uid-1', 'person-1')).resolves.toBeNull()
  })
})

describe('setStreakGoal', () => {
  beforeEach(() => {
    setDocMock.mockReset()
    setDocMock.mockResolvedValue(undefined)
  })

  it('calls setDoc with streakTarget, updatedBy and merge: true', async () => {
    await setStreakGoal('uid-1', 'person-1', 21, 'admin-1')
    expect(setDocMock).toHaveBeenCalledTimes(1)
    const [, data, options] = setDocMock.mock.calls[0]
    expect(data).toMatchObject({ streakTarget: 21, updatedBy: 'admin-1', updatedAt: 'SERVER_TIMESTAMP' })
    expect(options).toEqual({ merge: true })
  })

  it('rejects a non-integer target and does not write', async () => {
    await expect(setStreakGoal('uid-1', 'person-1', 3.5, 'admin-1')).rejects.toThrow()
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('rejects a target below 1 and does not write', async () => {
    await expect(setStreakGoal('uid-1', 'person-1', 0, 'admin-1')).rejects.toThrow()
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('rejects NaN and does not write', async () => {
    await expect(setStreakGoal('uid-1', 'person-1', NaN, 'admin-1')).rejects.toThrow()
    expect(setDocMock).not.toHaveBeenCalled()
  })
})

describe('getValidCheckinIntervals', () => {
  it('returns divisors of the target excluding 1 and the target itself', () => {
    expect(getValidCheckinIntervals(18)).toEqual([2, 3, 6, 9])
  })

  it('returns an empty array when the target has no valid divisor', () => {
    expect(getValidCheckinIntervals(7)).toEqual([])
  })

  it('returns an empty array for a target below 2', () => {
    expect(getValidCheckinIntervals(1)).toEqual([])
    expect(getValidCheckinIntervals(0)).toEqual([])
  })

  it('returns an empty array for a non-integer target', () => {
    expect(getValidCheckinIntervals(4.5)).toEqual([])
  })
})

describe('getPainCheckinInterval', () => {
  beforeEach(() => {
    getDocMock.mockReset()
  })

  it('returns painCheckinInterval when the goal doc exists and has a valid interval', async () => {
    getDocMock.mockResolvedValue({ exists: () => true, data: () => ({ streakTarget: 18, painCheckinInterval: 3 }) })
    await expect(getPainCheckinInterval('uid-1', 'person-1')).resolves.toBe(3)
  })

  it('returns null when no interval is set', async () => {
    getDocMock.mockResolvedValue({ exists: () => true, data: () => ({ streakTarget: 18 }) })
    await expect(getPainCheckinInterval('uid-1', 'person-1')).resolves.toBeNull()
  })

  it('returns null when the goal doc does not exist', async () => {
    getDocMock.mockResolvedValue({ exists: () => false, data: () => undefined })
    await expect(getPainCheckinInterval('uid-1', 'person-1')).resolves.toBeNull()
  })
})

describe('getCurrentRun', () => {
  beforeEach(() => {
    getDocMock.mockReset()
  })

  it('returns currentRun when set', async () => {
    getDocMock.mockResolvedValue({ exists: () => true, data: () => ({ currentRun: 2 }) })
    await expect(getCurrentRun('uid-1', 'person-1')).resolves.toBe(2)
  })

  it('defaults to 0 when currentRun is not set', async () => {
    getDocMock.mockResolvedValue({ exists: () => true, data: () => ({}) })
    await expect(getCurrentRun('uid-1', 'person-1')).resolves.toBe(0)
  })

  it('defaults to 0 when the goal doc does not exist', async () => {
    getDocMock.mockResolvedValue({ exists: () => false, data: () => undefined })
    await expect(getCurrentRun('uid-1', 'person-1')).resolves.toBe(0)
  })
})

describe('setStreakGoal with painCheckinInterval', () => {
  beforeEach(() => {
    setDocMock.mockReset()
    setDocMock.mockResolvedValue(undefined)
  })

  it('writes painCheckinInterval when a valid divisor is passed', async () => {
    await setStreakGoal('uid-1', 'person-1', 18, 'admin-1', 3)
    const [, data] = setDocMock.mock.calls[0]
    expect(data).toMatchObject({ streakTarget: 18, painCheckinInterval: 3 })
  })

  it('writes painCheckinInterval: null when explicitly cleared', async () => {
    await setStreakGoal('uid-1', 'person-1', 18, 'admin-1', null)
    const [, data] = setDocMock.mock.calls[0]
    expect(data).toMatchObject({ streakTarget: 18, painCheckinInterval: null })
  })

  it('omits painCheckinInterval entirely when the parameter is not passed', async () => {
    await setStreakGoal('uid-1', 'person-1', 18, 'admin-1')
    const [, data] = setDocMock.mock.calls[0]
    expect(data).not.toHaveProperty('painCheckinInterval')
  })

  it('rejects an interval of 1', async () => {
    await expect(setStreakGoal('uid-1', 'person-1', 18, 'admin-1', 1)).rejects.toThrow()
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('rejects an interval equal to the target', async () => {
    await expect(setStreakGoal('uid-1', 'person-1', 18, 'admin-1', 18)).rejects.toThrow()
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('rejects an interval that does not evenly divide the target', async () => {
    await expect(setStreakGoal('uid-1', 'person-1', 18, 'admin-1', 5)).rejects.toThrow()
    expect(setDocMock).not.toHaveBeenCalled()
  })
})
