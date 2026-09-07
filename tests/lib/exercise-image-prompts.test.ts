import { describe, it, expect } from 'vitest'
import { fullImagePrompt, hasImagePrompt, exerciseImagePrompts, IMAGE_STYLE_PREFIX } from '@/lib/exercise-image-prompts'
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
})
