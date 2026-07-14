import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useGSAP } from '@/hooks/use-gsap-timeline'

describe('useGSAP re-export', () => {
  it('runs the provided callback on mount without throwing', () => {
    let ran = false
    const { unmount } = renderHook(() =>
      useGSAP(() => {
        ran = true
      })
    )
    expect(ran).toBe(true)
    unmount()
  })
})
