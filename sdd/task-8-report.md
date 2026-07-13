# Task 8 Report: Add GSAP Entrance/Exit Animation to ConfirmDialog

**Status:** DONE

## Summary

Successfully implemented GSAP entrance animation for `ConfirmDialog` component, following the established pattern from Tasks 5-7. The component now features:
- Scrim fade-in (0.18s, power1.out)
- Dialog scale-up + fade-in (0.22s, back.out(1.7))
- Reduced motion support via `gsap.matchMedia()`
- No conflicting CSS animations/transitions

## Implementation Details

### Files Modified

1. **`components/confirm-dialog.tsx`**
   - Added imports: `useRef`, `useGSAP`, `gsap`
   - Added refs: `overlayRef`, `dialogRef`
   - Implemented `useGSAP` hook with `matchMedia()` detection for reduced motion
   - Attached refs to overlay and dialog DOM elements
   - Maintained existing prop signature and keyboard escape handler

2. **`tests/components/confirm-dialog.test.tsx`** (new file)
   - 3 tests covering: closed state, rendering/callbacks, Escape key handling
   - All tests pass before and after animation implementation

### CSS Verification

Verified `app/globals.css` lines 2441-2521 (`.confirm-overlay`, `.confirm-dialog`, and related rules):
- No `transition` or `animation` declarations on opacity, transform, or scale
- Only button hover transitions on `border-color` and `background` (safe from conflicts)
- Color tokens verified to use `var(--color-*)` references (Task 1 already completed)

## Test Results

### TDD Verification

**Before animation code:**
```
Test Files  1 passed (1)
Tests  3 passed (3)
```

**After animation code:**
```
Test Files  1 passed (1)
Tests  3 passed (3)
```

**Full suite:**
```
Test Files  13 passed (13)
Tests  41 passed (41)
```

All 13 test files pass, confirming no regression from prior tasks.

## Self-Review Checklist

- [x] ConfirmDialog prop signature matches spec (`isOpen, title, body, confirmLabel, confirmVariant?, onConfirm, onCancel`)
- [x] Reduced motion respected via `gsap.matchMedia()` with `(prefers-reduced-motion: reduce)` query
- [x] CSS conflict check completed: NO conflicting transition/animation on `.confirm-overlay`/`.confirm-dialog` opacity/transform/scale
- [x] Test suite fully passes (13 files, 41 tests)
- [x] Output pristine (no console errors, warnings, or type errors in modified files)
- [x] Commit created with co-author attribution

## Animation Behavior

- **Motion enabled:** Overlay fades 0→1 (0.18s), dialog scales 0.94→1 and fades 0→1 (0.22s)
- **Motion reduced:** Both opacity and scale set to final values immediately (no animation)
- **Departure:** Cleanup via `mm.revert()` on dependency changes

## Commit

- SHA: `4ebf588`
- Subject: `feat: add GSAP entrance animation to ConfirmDialog`
- Files: `components/confirm-dialog.tsx`, `tests/components/confirm-dialog.test.tsx`

## Next Steps

Task 8 complete. Phase 3 final task done. Ready to proceed to Task 9 (skeleton primitives).

## Fix round

**Finding:** GSAP context never reverted between `isOpen` toggles, only on full component unmount. `useGSAP`'s dependencies-array form (`useGSAP(fn, [isOpen])`) defers cleanup to unmount unless `revertOnUpdate: true` is set. Since `ConfirmDialog` typically stays mounted for the parent's whole lifetime (parent toggles `isOpen` rather than mounting/unmounting the component), every open/close cycle created a new `gsap.matchMedia()` scope and native `matchMedia()` listener that was never torn down — a `matchMedia` listener + dead tween closures leaked on every dialog open.

**Fix:** Changed the second argument of `useGSAP` in `components/confirm-dialog.tsx` from the plain dependency array `[isOpen]` to the options object `{ dependencies: [isOpen], revertOnUpdate: true }`. No changes to the effect body — the existing `gsap.matchMedia()` / `mm.add()` / `gsap.set()` / `gsap.fromTo()` logic is untouched.

**Verification:**
- `npx vitest run tests/components/confirm-dialog.test.tsx` → 1 file, 3 tests passed, unchanged.
- `npm run test:run` → 13 files, 41 tests passed, no regressions.
- Confirmed in `node_modules/@gsap/react/README.md`: "If you define `dependencies`, the GSAP-related objects (animations, ScrollTriggers, etc.) will only get reverted when the hook gets torn down but if you want them to get reverted **every time the hook updates** (when any dependency changes), you can set `revertOnUpdate: true` in the `config` object." Also confirmed in `node_modules/@gsap/react/src/index.js`: `deferCleanup = dependencies && dependencies.length && !revertOnUpdate;` — i.e. cleanup is deferred to unmount only when `revertOnUpdate` is falsy.

**Commit:** `fix: revert GSAP context on every ConfirmDialog isOpen change, not just unmount`
