import { describe, it, expect, vi, beforeEach } from 'vitest'

const setDoc = vi.fn().mockResolvedValue(undefined)
vi.mock('firebase/firestore', () => ({
  collection: (...a: unknown[]) => ({ __col: a }),
  doc: (...a: unknown[]) => ({ __doc: a }),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: (...a: unknown[]) => setDoc(...a),
  updateDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: () => '__ts',
}))
vi.mock('@/lib/firebase', () => ({ db: {} }))

import { assignExercise, setAssignedDosage } from '@/lib/recovery'

beforeEach(() => setDoc.mockClear())

describe('assignExercise', () => {
  it('does not write a dosage field when none is passed', async () => {
    await assignExercise('u', 'p', 'ex-1', 'admin')
    expect(setDoc.mock.calls[0][1]).not.toHaveProperty('dosage')
  })
  it('writes the dosage when passed', async () => {
    await assignExercise('u', 'p', 'ex-1', 'admin', { sets: 3, reps: 12 })
    expect(setDoc.mock.calls[0][1]).toMatchObject({ dosage: { sets: 3, reps: 12 } })
  })
})

describe('setAssignedDosage', () => {
  it('merges just the dosage field', async () => {
    await setAssignedDosage('u', 'p', 'ex-1', { reps: 15 })
    expect(setDoc.mock.calls[0][1]).toEqual({ dosage: { reps: 15 } })
    expect(setDoc.mock.calls[0][2]).toEqual({ merge: true })
  })
})
