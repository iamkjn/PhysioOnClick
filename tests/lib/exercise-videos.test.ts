import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))

const getDocsMock = vi.fn()
const setDocMock = vi.fn()
const deleteDocMock = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  deleteDoc: (...args: unknown[]) => deleteDocMock(...args),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}))

import { isYouTubeUrl, getExerciseVideos, setExerciseVideo, removeExerciseVideo } from '@/lib/exercise-videos'

describe('isYouTubeUrl', () => {
  it('accepts a standard watch url', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
  })

  it('accepts a youtu.be short link', () => {
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
  })

  it('accepts an embed url', () => {
    expect(isYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true)
  })

  it('accepts plain http', () => {
    expect(isYouTubeUrl('http://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
  })

  it('rejects a non-YouTube domain', () => {
    expect(isYouTubeUrl('https://vimeo.com/12345')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isYouTubeUrl('')).toBe(false)
  })

  it('rejects a javascript: url', () => {
    expect(isYouTubeUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects a bare domain with no video id', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch')).toBe(false)
  })

  it('rejects a malformed url', () => {
    expect(isYouTubeUrl('not a url')).toBe(false)
  })

  it('rejects a lookalike domain', () => {
    expect(isYouTubeUrl('https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ')).toBe(false)
  })
})

describe('getExerciseVideos', () => {
  beforeEach(() => {
    getDocsMock.mockReset()
  })

  it('maps the exerciseVideos subcollection to an id -> url record', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        { id: 'ex-1', data: () => ({ url: 'https://youtu.be/abc' }) },
        { id: 'ex-2', data: () => ({ url: 'https://youtu.be/def' }) },
      ],
    })
    await expect(getExerciseVideos('uid-1', 'person-1')).resolves.toEqual({
      'ex-1': 'https://youtu.be/abc',
      'ex-2': 'https://youtu.be/def',
    })
  })

  it('returns an empty record when there are no saved links', async () => {
    getDocsMock.mockResolvedValue({ docs: [] })
    await expect(getExerciseVideos('uid-1', 'person-1')).resolves.toEqual({})
  })
})

describe('setExerciseVideo', () => {
  beforeEach(() => {
    setDocMock.mockReset()
    setDocMock.mockResolvedValue(undefined)
  })

  it('rejects an invalid url and never calls setDoc', async () => {
    await expect(setExerciseVideo('uid-1', 'person-1', 'ex-1', 'https://vimeo.com/12345')).rejects.toThrow()
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('saves a valid url with a merge write', async () => {
    await setExerciseVideo('uid-1', 'person-1', 'ex-1', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(setDocMock).toHaveBeenCalledTimes(1)
    const [, data, options] = setDocMock.mock.calls[0]
    expect(data).toMatchObject({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', updatedAt: 'SERVER_TIMESTAMP' })
    expect(options).toEqual({ merge: true })
  })
})

describe('removeExerciseVideo', () => {
  beforeEach(() => {
    deleteDocMock.mockReset()
    deleteDocMock.mockResolvedValue(undefined)
  })

  it('deletes the video doc', async () => {
    await removeExerciseVideo('uid-1', 'person-1', 'ex-1')
    expect(deleteDocMock).toHaveBeenCalledTimes(1)
  })
})
