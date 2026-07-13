# Task 3: Create the shared `useGSAP` hook module — Report

## What Was Implemented

Created a thin wrapper module that:
1. Imports `useGSAP` from `@gsap/react`
2. Imports `gsap` from `@/lib/gsap` (Task 2)
3. Registers the GSAP `useGSAP` plugin once at import time
4. Re-exports `useGSAP` for use throughout the component tree

This centralizes the GSAP plugin registration and ensures every component using GSAP animations imports from `@/hooks/use-gsap-timeline`, not directly from `@gsap/react`.

## TDD Evidence

### Step 1: RED (failing test)
```bash
$ npx vitest run tests/hooks/use-gsap-timeline.test.tsx
Error: Failed to resolve import "@/hooks/use-gsap-timeline" from "tests/hooks/use-gsap-timeline.test.tsx". Does the file exist?
```
✓ Test fails as expected — module does not exist.

### Step 2: GREEN (test passes)
```bash
$ npx vitest run tests/hooks/use-gsap-timeline.test.tsx
Test Files  1 passed (1)
     Tests  1 passed (1)
```
✓ Test passes immediately after module creation.

## Files Changed

| File | Status | Lines |
|---|---|---|
| `hooks/use-gsap-timeline.ts` | Created | 7 |
| `tests/hooks/use-gsap-timeline.test.tsx` | Created | 14 |

## Full Test Suite Result

```
Test Files  8 passed (8)
     Tests  24 passed (24)
Duration  3.55s
```

✓ All existing tests continue to pass. No regressions.

## Module Content (Exact Match to Brief)

**File: `hooks/use-gsap-timeline.ts`**
```ts
"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

gsap.registerPlugin(useGSAP);

export { useGSAP };
```

✓ Exactly matches the 6-line requirement from brief.

**File: `tests/hooks/use-gsap-timeline.test.tsx`**
```tsx
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
```

✓ Exactly matches the test from brief.

## Commit

```
ae9d6ff feat: add shared useGSAP hook module
```

## Self-Review

- ✓ Module exports exactly `useGSAP` as specified
- ✓ Uses "use client" directive for client-side rendering
- ✓ Imports from `@/lib/gsap` (Task 2 prerequisite)
- ✓ Registers GSAP plugin once at module load
- ✓ Test is pristine and passes
- ✓ Full suite passes (no regressions)
- ✓ Both files match brief requirements exactly
- ✓ TDD workflow complete (RED → GREEN)

## Concerns

None. Task completed successfully.

## Next Steps

- Task 4: Rewrite Reveal on GSAP + ScrollTrigger
- All components implementing GSAP animations (Reveal, SiteHeader, Toast, ToastProvider, ConfirmDialog) will import `useGSAP` from this module rather than directly from `@gsap/react`.
