import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/lib/firebase', () => ({ db: {} }))
const getDoc = vi.fn(); const setDoc = vi.fn().mockResolvedValue(undefined); const addDoc = vi.fn().mockResolvedValue({ id: 'x' })
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((..._a) => ({ __doc: _a })),
  collection: vi.fn((..._a) => ({ __col: _a })),
  getDoc: (...a: unknown[]) => getDoc(...a),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  setDoc: (...a: unknown[]) => setDoc(...a),
  addDoc: (...a: unknown[]) => addDoc(...a),
  serverTimestamp: () => 'TS',
  query: vi.fn(), orderBy: vi.fn(), limit: vi.fn(),
}))
import { getMotionTarget, saveMotionSession } from '@/lib/motion'

beforeEach(() => { getDoc.mockReset(); setDoc.mockClear(); addDoc.mockClear() })

describe('getMotionTarget', () => {
  it('falls back to the code default when no Firestore doc', async () => {
    getDoc.mockResolvedValue({ exists: () => false })
    const t = await getMotionTarget('ex-1')
    expect(t?.exerciseId).toBe('ex-1'); expect(t?.repTarget).toBe(10)
  })
  it('returns null for an unknown exercise with no doc', async () => {
    getDoc.mockResolvedValue({ exists: () => false })
    expect(await getMotionTarget('ex-999')).toBeNull()
  })
})

describe('saveMotionSession', () => {
  it('writes the session and marks today\'s exercise log complete', async () => {
    await saveMotionSession('u1', 'p1', {
      exerciseId: 'ex-1', bodyPart: 'Lower limb', date: '2026-07-25',
      reps: 10, repTarget: 10, romMin: 85, romMax: 170, targetRomMin: 85, targetRomMax: 170,
      avgQuality: 88, passed: true, durationSec: 42,
    })
    expect(addDoc).toHaveBeenCalledTimes(1)
    // the exerciseLogs merge write:
    const mergeCall = setDoc.mock.calls.find(c => JSON.stringify(c[1]).includes('completions'))
    expect(mergeCall).toBeTruthy()
    expect(mergeCall![2]).toEqual({ merge: true })
  })
})
