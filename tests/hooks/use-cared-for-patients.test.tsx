import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resetCaredForCache, useCaredForPatients } from '@/hooks/use-cared-for-patients'

const fetchMock = vi.fn()

beforeEach(() => {
  resetCaredForCache()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const user = { uid: 'carer-1', getIdToken: vi.fn(async () => 'tok') }

describe('useCaredForPatients', () => {
  it('fetches once per uid with the ID token and shares the result', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ patients: [{ uid: 'p1', name: 'Mary', relationship: 'Partner' }] }),
    })

    const a = renderHook(() => useCaredForPatients(user))
    const b = renderHook(() => useCaredForPatients(user))
    expect(a.result.current).toBeNull()

    await waitFor(() => expect(a.result.current).toEqual([{ uid: 'p1', name: 'Mary', relationship: 'Partner' }]))
    await waitFor(() => expect(b.result.current).toHaveLength(1))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/patient/carer-links',
      expect.objectContaining({ headers: { Authorization: 'Bearer tok' } })
    )
  })

  it('a failed lookup reads as "cares for nobody" and is retried next time', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
    const first = renderHook(() => useCaredForPatients(user))
    await waitFor(() => expect(first.result.current).toEqual([]))

    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ patients: [] }) })
    const second = renderHook(() => useCaredForPatients(user))
    await waitFor(() => expect(second.result.current).toEqual([]))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('is null and does not fetch when signed out or disabled', () => {
    expect(renderHook(() => useCaredForPatients(null)).result.current).toBeNull()
    expect(renderHook(() => useCaredForPatients(user, false)).result.current).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
