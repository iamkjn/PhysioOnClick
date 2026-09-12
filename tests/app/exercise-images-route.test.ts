import { describe, it, expect, vi, beforeEach } from 'vitest'

const downloadObject = vi.fn()
vi.mock('@/lib/firebase-admin', () => ({ downloadObject: (...a: unknown[]) => downloadObject(...a) }))
vi.mock('@/lib/exercises', () => ({ exercises: [{ id: 'ex-3', title: 'Bridge' }] }))

import { GET } from '@/app/exercise-images/[id]/route'

function req() { return new Request('http://localhost/exercise-images/ex-3') }
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => downloadObject.mockReset())

describe('GET /exercise-images/[id]', () => {
  it('404s an unknown exercise id', async () => {
    const res = await GET(req(), ctx('ex-does-not-exist'))
    expect(res.status).toBe(404)
  })
  it('serves the 960 webp when Storage has it (default/full size)', async () => {
    downloadObject.mockResolvedValue(new Uint8Array([0x52, 0x49, 0x46, 0x46]))
    const res = await GET(req(), ctx('ex-3'))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/webp')
    expect(downloadObject).toHaveBeenCalledWith('exercise-images/ex-3-960.webp')
    // Not immutable/1-year: an un-reviewed medical image must be able to clear
    // within a day.
    expect(res.headers.get('cache-control')).toBe('public, max-age=86400, stale-while-revalidate=604800')
    expect(res.headers.get('cache-control')).not.toContain('immutable')
  })
  it('serves the 320 webp when ?size=thumb', async () => {
    downloadObject.mockResolvedValue(new Uint8Array([0x52, 0x49, 0x46, 0x46]))
    const res = await GET(new Request('http://localhost/exercise-images/ex-3?size=thumb'), ctx('ex-3'))
    expect(res.status).toBe(200)
    expect(downloadObject).toHaveBeenCalledWith('exercise-images/ex-3-320.webp')
  })
  it('falls back to the PNG when the webp is missing', async () => {
    downloadObject.mockImplementation(async (...args: unknown[]) =>
      typeof args[0] === 'string' && args[0].endsWith('.png')
        ? new Uint8Array([0x89, 0x50, 0x4e, 0x47])
        : null,
    )
    const res = await GET(req(), ctx('ex-3'))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
  })
  it('serves a placeholder SVG when Storage misses entirely', async () => {
    downloadObject.mockResolvedValue(null)
    const res = await GET(req(), ctx('ex-3'))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/svg+xml')
    expect(await res.text()).toContain('<svg')
  })
})
