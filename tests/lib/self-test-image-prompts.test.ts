import { describe, it, expect } from 'vitest'
import { selfTests } from '@/lib/self-tests'
import {
  SELF_TEST_IMAGE_STYLE_PREFIX,
  SELF_TEST_IMAGE_STYLE_SUFFIX,
  selfTestImagePrompts,
  hasSelfTestImagePrompt,
  fullSelfTestImagePrompt,
  uploadedSelfTestImageIds,
  hasUploadedSelfTestImage,
} from '@/lib/self-test-image-prompts'

const allImageIds = selfTests.flatMap((t) => t.steps.map((s) => s.imageId))

describe('self-test image prompts', () => {
  it('has a prompt for every step.imageId across all self-tests', () => {
    for (const id of allImageIds) {
      expect(hasSelfTestImagePrompt(id), id).toBe(true)
    }
  })

  it('has no extra keys - the prompt set is exactly the id set', () => {
    const idSet = new Set(allImageIds)
    const keySet = new Set(Object.keys(selfTestImagePrompts))
    expect(keySet.size).toBe(idSet.size)
    for (const key of keySet) {
      expect(idSet.has(key), `extra key: ${key}`).toBe(true)
    }
    // sanity: the spec fixes this at 45 step images
    expect(idSet.size).toBe(45)
  })

  it('the style contract is a photograph brief, not an illustration', () => {
    const contract = (
      SELF_TEST_IMAGE_STYLE_PREFIX + SELF_TEST_IMAGE_STYLE_SUFFIX
    ).toLowerCase()
    expect(contract).toMatch(/photo/)
  })

  it('every core is a non-empty single line with no smart punctuation or non-Latin-1', () => {
    for (const [id, core] of Object.entries(selfTestImagePrompts)) {
      expect(core.trim().length, id).toBeGreaterThan(10)
      expect(core, id).not.toMatch(/\n/)
      expect(core, id).not.toMatch(/[‘’“”–—…]/)
      expect(core, id).not.toMatch(/[^\x00-\xFF]/)
    }
  })

  it('the assembled prefix and suffix are Latin-1 only', () => {
    const blob = SELF_TEST_IMAGE_STYLE_PREFIX + SELF_TEST_IMAGE_STYLE_SUFFIX
    expect(blob).not.toMatch(/[‘’“”–—…]/)
    expect(blob).not.toMatch(/[^\x00-\xFF]/)
  })

  it('fullSelfTestImagePrompt wraps the core in the prefix + suffix', () => {
    const p = fullSelfTestImagePrompt('test-full-can-1')
    expect(p).not.toBeNull()
    expect(p!.startsWith(SELF_TEST_IMAGE_STYLE_PREFIX)).toBe(true)
    expect(p!.endsWith(SELF_TEST_IMAGE_STYLE_SUFFIX)).toBe(true)
    expect(p).toContain(selfTestImagePrompts['test-full-can-1'])
  })

  it('fullSelfTestImagePrompt / hasSelfTestImagePrompt return null / false for an unknown id', () => {
    expect(fullSelfTestImagePrompt('nope')).toBeNull()
    expect(hasSelfTestImagePrompt('nope')).toBe(false)
  })

  it('uploadedSelfTestImageIds is the empty go-live gate', () => {
    expect(uploadedSelfTestImageIds.size).toBe(0)
    for (const id of allImageIds) {
      expect(hasUploadedSelfTestImage(id), id).toBe(false)
    }
  })

  it('uploadedSelfTestImageIds is a strict subset of authored prompts', () => {
    for (const id of uploadedSelfTestImageIds) {
      expect(hasSelfTestImagePrompt(id), id).toBe(true)
      expect(hasUploadedSelfTestImage(id), id).toBe(true)
    }
  })
})
