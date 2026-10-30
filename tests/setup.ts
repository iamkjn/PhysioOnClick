import '@testing-library/jest-dom'
import { vi } from 'vitest'

// jsdom does not implement matchMedia; GSAP's matchMedia() and reduced-motion
// checks need it. Default: no reduced-motion preference. Override matches
// per-test with `window.matchMedia = vi.fn().mockImplementation(...)`.
// Guarded: the Firestore rules suite runs in the node environment, where there
// is no window to patch.
if (typeof window !== 'undefined') {
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

// jsdom has no canvas: getContext() logs "Not implemented" and returns null.
// Return null quietly; components then fall back to their non-WebGL paths.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
}
