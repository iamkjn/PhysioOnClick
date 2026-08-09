import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))

const getDocsMock = vi.fn()
const updateDocMock = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  query: vi.fn((col) => col),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}))

import {
  getPainCheckins,
  findDueCheckin,
  currentRunCheckins,
  logPainCheckinScore,
  type PainCheckin,
} from '@/lib/pain-checkins'

function fakeDoc(id: string, data: Record<string, unknown>) {
  return { id, data: () => data }
}

describe('getPainCheckins', () => {
  beforeEach(() => {
    getDocsMock.mockReset()
  })

  it('maps Firestore docs into PainCheckin objects', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        fakeDoc('0_3', { runNumber: 0, streakDay: 3, status: 'logged', score: 4, note: 'ok', loggedAt: { toDate: () => new Date('2026-01-01') } }),
        fakeDoc('0_6', { runNumber: 0, streakDay: 6, status: 'pending' }),
      ],
    })
    const result = await getPainCheckins('uid-1', 'person-1')
    expect(result).toEqual([
      { id: '0_3', runNumber: 0, streakDay: 3, status: 'logged', score: 4, note: 'ok', loggedAt: new Date('2026-01-01') },
      { id: '0_6', runNumber: 0, streakDay: 6, status: 'pending', score: null, note: '', loggedAt: null },
    ])
  })

  it('returns an empty array when there are no checkpoints', async () => {
    getDocsMock.mockResolvedValue({ docs: [] })
    await expect(getPainCheckins('uid-1', 'person-1')).resolves.toEqual([])
  })
})

describe('currentRunCheckins', () => {
  it('filters to only the given run and sorts by streakDay ascending', () => {
    const checkins: PainCheckin[] = [
      { id: 'a', runNumber: 1, streakDay: 6, status: 'pending', score: null, note: '', loggedAt: null },
      { id: 'b', runNumber: 0, streakDay: 3, status: 'missed', score: null, note: '', loggedAt: null },
      { id: 'c', runNumber: 1, streakDay: 3, status: 'logged', score: 2, note: '', loggedAt: null },
    ]
    expect(currentRunCheckins(checkins, 1).map((c) => c.id)).toEqual(['c', 'a'])
  })
})

describe('findDueCheckin', () => {
  it('returns the pending checkpoint for the current run', () => {
    const checkins: PainCheckin[] = [
      { id: 'a', runNumber: 0, streakDay: 3, status: 'logged', score: 2, note: '', loggedAt: null },
      { id: 'b', runNumber: 0, streakDay: 6, status: 'pending', score: null, note: '', loggedAt: null },
    ]
    expect(findDueCheckin(checkins, 0)?.id).toBe('b')
  })

  it('returns null when there is no pending checkpoint for the current run', () => {
    const checkins: PainCheckin[] = [
      { id: 'a', runNumber: 0, streakDay: 3, status: 'logged', score: 2, note: '', loggedAt: null },
    ]
    expect(findDueCheckin(checkins, 0)).toBeNull()
  })

  it('ignores a pending checkpoint from a stale run', () => {
    const checkins: PainCheckin[] = [
      { id: 'a', runNumber: 0, streakDay: 3, status: 'pending', score: null, note: '', loggedAt: null },
    ]
    expect(findDueCheckin(checkins, 1)).toBeNull()
  })
})

describe('logPainCheckinScore', () => {
  beforeEach(() => {
    updateDocMock.mockReset()
    updateDocMock.mockResolvedValue(undefined)
  })

  it('calls updateDoc with status logged and the given score/note', async () => {
    await logPainCheckinScore('uid-1', 'person-1', '0_3', 4, 'twinge')
    expect(updateDocMock).toHaveBeenCalledTimes(1)
    const [, data] = updateDocMock.mock.calls[0]
    expect(data).toMatchObject({ status: 'logged', score: 4, note: 'twinge', loggedAt: 'SERVER_TIMESTAMP' })
  })

  it('defaults note to empty string', async () => {
    await logPainCheckinScore('uid-1', 'person-1', '0_3', 4)
    const [, data] = updateDocMock.mock.calls[0]
    expect(data.note).toBe('')
  })

  it('rejects a non-integer score and does not write', async () => {
    await expect(logPainCheckinScore('uid-1', 'person-1', '0_3', 4.5)).rejects.toThrow()
    expect(updateDocMock).not.toHaveBeenCalled()
  })

  it('rejects a score below 0', async () => {
    await expect(logPainCheckinScore('uid-1', 'person-1', '0_3', -1)).rejects.toThrow()
    expect(updateDocMock).not.toHaveBeenCalled()
  })

  it('rejects a score above 10', async () => {
    await expect(logPainCheckinScore('uid-1', 'person-1', '0_3', 11)).rejects.toThrow()
    expect(updateDocMock).not.toHaveBeenCalled()
  })
})
