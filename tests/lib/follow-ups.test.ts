import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))

const getDocsMock = vi.fn()
const whereMock = vi.fn()
const orderByMock = vi.fn()
const collectionMock = vi.fn(() => ({}))

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  query: (...args: unknown[]) => args,
  where: (...args: unknown[]) => whereMock(...args),
  orderBy: (...args: unknown[]) => orderByMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
}))

import { getFollowUps } from '@/lib/follow-ups'

describe('getFollowUps', () => {
  beforeEach(() => {
    getDocsMock.mockReset()
    whereMock.mockClear()
    orderByMock.mockClear()
    collectionMock.mockClear()
  })

  it('returns mapped follow-ups, soonest due date first', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        {
          id: 'f1',
          data: () => ({
            dueDate: '2026-08-12',
            note: 'Check knee progress',
            service: 'Physiotherapy',
            personId: 'person-1',
            createdAt: { toDate: () => new Date('2026-07-20T10:00:00.000Z') },
          }),
        },
        {
          id: 'f2',
          data: () => ({
            dueDate: '2026-09-01',
            note: '',
            createdAt: undefined,
          }),
        },
      ],
    })

    const result = await getFollowUps('uid-1')

    expect(result).toEqual([
      {
        id: 'f1',
        dueDate: '2026-08-12',
        note: 'Check knee progress',
        service: 'Physiotherapy',
        personId: 'person-1',
        createdAt: new Date('2026-07-20T10:00:00.000Z'),
      },
      {
        id: 'f2',
        dueDate: '2026-09-01',
        note: '',
        service: undefined,
        personId: undefined,
        createdAt: null,
      },
    ])
  })

  it('queries patients/{uid}/followUps, filtered to upcoming, ordered by dueDate ascending', async () => {
    getDocsMock.mockResolvedValue({ docs: [] })

    await getFollowUps('uid-1')

    expect(collectionMock).toHaveBeenCalledWith({}, 'patients', 'uid-1', 'followUps')
    expect(whereMock).toHaveBeenCalledWith('dueDate', '>=', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
    expect(orderByMock).toHaveBeenCalledWith('dueDate', 'asc')
  })

  it('returns an empty array when there are none', async () => {
    getDocsMock.mockResolvedValue({ docs: [] })
    await expect(getFollowUps('uid-1')).resolves.toEqual([])
  })
})
