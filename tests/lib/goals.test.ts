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

import { getStreakGoal, setStreakGoal } from '@/lib/goals'

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
