import '@testing-library/jest-dom'
import { vi } from 'vitest'

// jsdom does not implement matchMedia; GSAP's matchMedia() and reduced-motion
// checks need it. Default: no reduced-motion preference. Override matches
// per-test with `window.matchMedia = vi.fn().mockImplementation(...)`.
window.matchMedia = window.matchMedia || vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))
