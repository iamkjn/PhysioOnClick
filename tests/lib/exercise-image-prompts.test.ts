import { describe, it, expect } from 'vitest'
import { fullImagePrompt, hasImagePrompt, hasUploadedImage, uploadedImageIds, exerciseImagePrompts, IMAGE_STYLE_PREFIX } from '@/lib/exercise-image-prompts'
import { exercises } from '@/lib/exercises'

describe('exercise image prompts', () => {
  it('fullImagePrompt wraps the entry in the style prefix + suffix', () => {
    const p = fullImagePrompt('ex-3')
    expect(p).toContain(IMAGE_STYLE_PREFIX)
    expect(p).toContain(exerciseImagePrompts['ex-3'])
  })
  it('returns null for an id with no prompt', () => {
    expect(fullImagePrompt('ex-does-not-exist')).toBeNull()
    expect(hasImagePrompt('ex-does-not-exist')).toBe(false)
  })
  it('every prompt entry is a non-empty single-line string for a real exercise id', () => {
    const ids = new Set(exercises.map((e) => e.id))
    for (const [id, prompt] of Object.entries(exerciseImagePrompts)) {
      expect(ids.has(id)).toBe(true)
      expect(prompt.trim().length).toBeGreaterThan(10)
      expect(prompt).not.toContain('\n')
    }
  })
  it('covers batch 1 (the 13 lumbar/core exercises)', () => {
    for (const id of ['ex-3','ex-14','ex-15','ex-17','ex-18','ex-24','ex-25','ex-26','ex-27','ex-28','ex-31','ex-32','ex-34']) {
      expect(hasImagePrompt(id)).toBe(true)
    }
  })
  it('covers batch A (the 14 ankle/shoulder/neck exercises in the George test plan)', () => {
    for (const id of ['ex-2','ex-8','ex-12','ex-13','ex-35','ex-36','ex-37','ex-52','ex-59','ex-60','ex-61','ex-62','ex-63','ex-64']) {
      expect(hasImagePrompt(id)).toBe(true)
    }
  })

  it('hasUploadedImage is a strict subset of authored prompts (no image without a prompt)', () => {
    for (const id of uploadedImageIds) {
      expect(hasImagePrompt(id)).toBe(true)
      expect(hasUploadedImage(id)).toBe(true)
    }
  })

  it('does not claim an uploaded image before generation is unblocked', () => {
    // Guard: an authored prompt must NOT flip the web/PDF to expect a real
    // image until scripts/upload-exercise-images.ts has actually run for it.
    expect(hasUploadedImage('ex-12')).toBe(false)
  })
})
