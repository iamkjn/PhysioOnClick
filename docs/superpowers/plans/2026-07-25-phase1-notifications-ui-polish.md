# Phase 1 — Notifications fix + UI polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the emoji notification bell with a crisp SVG, make opening the notifications page clear the unread badge, and remove the ad-hoc inline styling that makes the patient/admin screens read as inconsistent.

**Architecture:** Small, self-contained edits to existing client components + `app/globals.css`. No new dependencies, no server/SSR changes. Read-state reuses the existing batched `markAllRead`; the polish pass replaces inline `style={{…}}` values with existing design tokens (`--text-*`, radii) plus a new spacing scale.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest + Testing Library (jsdom), plain CSS custom properties in `app/globals.css`.

## Global Constraints

- Type tokens already defined in `app/globals.css:73-81`: `--text-xs 0.75rem`, `--text-sm 0.875rem`, `--text-base 1rem`, `--text-md 1.125rem`, `--text-lg 1.35rem`, `--text-xl 1.7rem`, `--text-2xl 2.1rem`, `--text-3xl 2.7rem`, `--text-display 3.4rem`. Use these — do not invent new font sizes.
- Radius tokens: `--radius-panel 22px`, `--radius-card 15px`, `--radius-input 13px`, `--radius-chip 10px`, `--radius-pill 999px`.
- Touch targets stay ≥ 44px (existing convention, e.g. `admin-exercise-assigner.tsx` buttons).
- Colour comes from existing tokens only (`--color-*`, `--primary`, `--line`); no new hex values except pure `#fff` on accent (existing pattern).
- Tests: run with `npm run test:run` (single run) or `npx vitest run <file>`. jsdom + globals + `@/` alias are preconfigured in `vitest.config.ts`.
- Commit after each task. Verify branch is `feat/notifications-ui-motion` before committing (parallel-session hazard).
- Firebase mock idioms already used in the suite:
  - `vi.mock('@/lib/firebase', () => ({ auth: {} }))` / `({ db: {} })`
  - `vi.mock('firebase/firestore', () => ({ doc: vi.fn(), updateDoc: vi.fn(), … }))`
  - `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))`

---

## File Structure

- `components/icons.tsx` — **new**. Home for reusable inline-SVG icons. First export: `BellIcon`.
- `components/notification-bell.tsx` — **modify**. Render `<BellIcon>` instead of the emoji.
- `app/globals.css` — **modify**. Size the SVG in `.notification-bell-icon`; add a `--space-*` scale; polish rules as tokens replace inline styles.
- `app/patient/notifications/page.tsx` — **modify**. Auto-mark-all-read on open; replace the inline header style block with a class.
- `components/admin-exercise-assigner.tsx` — **modify**. Replace inline font-size/padding/min-height with tokens/classes.
- Tests: `tests/components/notification-bell.test.tsx` (new), `tests/app/notifications.test.tsx` (new). Existing `tests/components/admin-exercise-assigner.test.tsx` is the regression guard for the polish edits.

---

## Task 1: SVG bell icon replaces the emoji

**Files:**
- Create: `components/icons.tsx`
- Modify: `components/notification-bell.tsx:36` (the emoji span)
- Modify: `app/globals.css:2207-2210` (`.notification-bell-icon`)
- Test: `tests/components/notification-bell.test.tsx`

**Interfaces:**
- Produces: `export function BellIcon(props: { className?: string }): JSX.Element` in `components/icons.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/notification-bell.test.tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: { uid: string }) => void) => {
    cb({ uid: 'u1' })
    return () => {}
  },
}))
vi.mock('@/lib/notifications', () => ({
  subscribeNotifications: (_uid: string, cb: (items: unknown[]) => void) => {
    cb([])
    return () => {}
  },
}))

import { NotificationBell } from '@/components/notification-bell'

describe('NotificationBell', () => {
  it('renders an inline SVG bell (not an emoji) when signed in', () => {
    render(<NotificationBell />)
    const svg = document.querySelector('.notification-bell svg')
    expect(svg).toBeInTheDocument()
    expect(document.querySelector('.notification-bell')?.textContent).not.toContain('🔔')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/notification-bell.test.tsx`
Expected: FAIL — no `svg` found (emoji still rendered).

- [ ] **Step 3: Create the icon component**

```tsx
// components/icons.tsx
// Reusable inline-SVG icons. currentColor + viewBox 0 0 24 24 so every icon
// scales and inherits colour from its container.
export function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
```

- [ ] **Step 4: Swap the emoji in the bell**

In `components/notification-bell.tsx`, add the import at the top with the other imports:

```tsx
import { BellIcon } from "@/components/icons";
```

Replace line 36:

```tsx
        <span aria-hidden="true" className="notification-bell-icon">🔔</span>
```

with:

```tsx
        <span aria-hidden="true" className="notification-bell-icon"><BellIcon /></span>
```

- [ ] **Step 5: Size the SVG in CSS**

In `app/globals.css`, replace the `.notification-bell-icon` rule (lines 2207-2210):

```css
.notification-bell-icon {
  font-size: 18px;
  line-height: 1;
}
```

with:

```css
.notification-bell {
  color: var(--color-text-primary);
}
.notification-bell-icon {
  display: inline-flex;
  line-height: 1;
}
.notification-bell-icon svg {
  width: 20px;
  height: 20px;
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/components/notification-bell.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/icons.tsx components/notification-bell.tsx app/globals.css tests/components/notification-bell.test.tsx
git commit -m "feat(notifications): replace emoji bell with inline SVG icon"
```

---

## Task 2: Opening the notifications page clears the unread badge

**Files:**
- Modify: `app/patient/notifications/page.tsx` (add an auto-mark effect)
- Test: `tests/app/notifications.test.tsx`

**Interfaces:**
- Consumes: existing `markAllRead(uid, items)` and `subscribeNotifications(uid, cb)` from `@/lib/notifications`.

Behaviour: the first time the page has loaded notifications containing at least one unread item, it calls `markAllRead` once. Because the header bell subscribes to the same collection via `onSnapshot`, the badge clears live. New notifications that arrive while viewing are left for the manual "Mark all read" button (kept).

- [ ] **Step 1: Write the failing test**

```tsx
// tests/app/notifications.test.tsx
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: { uid: string }) => void) => {
    cb({ uid: 'u1' })
    return () => {}
  },
}))

const markAllRead = vi.fn().mockResolvedValue(undefined)
let emit: (items: unknown[]) => void = () => {}
vi.mock('@/lib/notifications', () => ({
  subscribeNotifications: (_uid: string, cb: (items: unknown[]) => void) => {
    emit = cb
    return () => {}
  },
  markAllRead: (...args: unknown[]) => markAllRead(...args),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import NotificationsPage from '@/app/patient/notifications/page'

const unread = {
  id: 'n1', title: 'Session summary', body: '...', kind: 'system', read: false, createdAt: new Date(),
}
const readItem = { ...unread, id: 'n2', read: true }

describe('NotificationsPage auto mark-read', () => {
  beforeEach(() => markAllRead.mockClear())

  it('marks all read once when the page opens with unread items', async () => {
    render(<NotificationsPage />)
    emit([unread, readItem])
    await waitFor(() => expect(markAllRead).toHaveBeenCalledTimes(1))
    expect(markAllRead).toHaveBeenCalledWith('u1', [unread, readItem])
  })

  it('does not mark read when everything is already read', async () => {
    render(<NotificationsPage />)
    emit([readItem])
    await new Promise((r) => setTimeout(r, 20))
    expect(markAllRead).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app/notifications.test.tsx`
Expected: FAIL — `markAllRead` never called (no auto-mark yet).

- [ ] **Step 3: Add the auto-mark effect**

In `app/patient/notifications/page.tsx`, add `useRef` to the React import:

```tsx
import { useEffect, useRef, useState } from "react";
```

Inside `NotificationsPage`, after the existing `subscribeNotifications` effect (around line 50), add:

```tsx
  // Opening the page clears the unread badge: mark the first loaded batch read
  // once. The header bell listens to the same collection, so it updates live.
  const autoMarked = useRef(false);
  useEffect(() => {
    if (!uid || items === null || autoMarked.current) return;
    if (items.some((n) => !n.read)) {
      autoMarked.current = true;
      void markAllRead(uid, items);
    }
  }, [uid, items]);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/app/notifications.test.tsx`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add app/patient/notifications/page.tsx tests/app/notifications.test.tsx
git commit -m "feat(notifications): clear unread badge when the page is opened"
```

---

## Task 3: Add a spacing scale to the design tokens

**Files:**
- Modify: `app/globals.css` (after line 84, the `--space-section` declaration)

There is a type scale and radius scale but no reusable spacing scale — only `--space-section`. Ad-hoc paddings/margins (`0.4rem`, `0.85rem`, `1.15rem`, …) are the main source of visual inconsistency. Add an 8px-based scale to replace them in Task 5.

- [ ] **Step 1: Add the tokens**

In `app/globals.css`, immediately after line 84 (`--space-section: 4.5rem;`), add:

```css
  /* Spacing scale (8px base) — use for gap / padding / margin so vertical
     rhythm is consistent. Replaces ad-hoc rem values across components. */
  --space-1: 0.25rem;  /* 4px  */
  --space-2: 0.5rem;   /* 8px  */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.5rem;   /* 24px */
  --space-6: 2rem;     /* 32px */
  --space-8: 3rem;     /* 48px */
```

- [ ] **Step 2: Verify the build still compiles and tests are green**

Run: `npm run test:run`
Expected: existing suite PASS (no CSS regressions).

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "chore(ui): add 8px-based spacing scale tokens"
```

---

## Task 4: Visual audit of the patient + admin screens

**Files:** none changed — this task produces a findings list + before screenshots that Task 5 acts on.

- [ ] **Step 1: Start the dev server and capture the current state**

Use the browser preview tools (not a raw `npm run dev` in Bash):
- Start the dev server (`preview_start` with the project's dev config).
- Screenshot each of: `/` (signed-in home), `/patient/exercises`, `/patient/notifications`, `/patient/recovery`, `/admin/recovery`.
- Save screenshots to the scratchpad dir as `before-<screen>.png`.

- [ ] **Step 2: List the concrete offenders**

Grep for ad-hoc inline styles on the target screens and write the list into the plan's Task 5 checklist (file:line → token to use):

Run: `grep -rnE "fontSize:|padding:|margin:|minHeight:|gap:" components/admin-exercise-assigner.tsx app/patient/notifications/page.tsx components/assigned-exercises.tsx components/patient-dashboard.tsx`
Expected: a list like `admin-exercise-assigner.tsx:103 fontSize: 14 → var(--text-sm)`.

- [ ] **Step 3: Commit the screenshots reference (optional)**

No code commit needed; carry the findings into Task 5. (If desired: `git add docs/... && git commit` a short audit note.)

---

## Task 5: Replace ad-hoc inline styles with tokens (known offenders)

**Files:**
- Modify: `components/admin-exercise-assigner.tsx`
- Modify: `app/patient/notifications/page.tsx` (the inline header style block, lines 68-71)
- Modify: `app/globals.css` (add the small classes referenced below)
- Regression guard: `tests/components/admin-exercise-assigner.test.tsx` must stay green.

**Transformation rule (apply everywhere on the touched files):**
- `fontSize: 14` → drop the inline size, use `var(--text-sm)` (via a class).
- `fontSize: <n>` → nearest `--text-*` token.
- hard-coded `padding` / `gap` / `margin` rem values → nearest `--space-*` token.
- keep `minHeight: 44` (touch target) but move it into the class.
- Prefer a semantic class in `app/globals.css` over inline `style` objects.

- [ ] **Step 1: Add the helper classes to CSS**

In `app/globals.css`, near the other admin/list rules, add:

```css
/* Assigned-exercise rows (admin) + generic list row rhythm. */
.assign-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}
.assign-row-label { font-size: var(--text-sm); color: var(--color-text-primary); }
.assign-row-sub   { font-size: var(--text-sm); color: var(--color-text-secondary); }
.assign-remove {
  background: none; border: none; color: var(--color-error);
  font-size: var(--text-sm); font-weight: 600; min-height: 44px;
  padding: 0 var(--space-2); cursor: pointer;
}
.assign-remove:disabled { opacity: 0.6; cursor: not-allowed; }
.assign-add-btn {
  background: var(--primary); color: #fff; border: none;
  border-radius: var(--radius-chip); padding: 0 var(--space-3);
  min-height: 44px; font-size: var(--text-sm); font-weight: 600; cursor: pointer;
}
.assign-add-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.notifications-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--space-4); flex-wrap: wrap; margin: var(--space-4) 0 var(--space-5);
}
```

- [ ] **Step 2: Apply classes in `admin-exercise-assigner.tsx`**

Replace the assigned-row block (lines 93-124) `style={{…}}` usages with the classes: the row container uses `className="assign-row"`, the title span `className="assign-row-label"`, the Remove button `className="assign-remove"` (drop its inline `style`). Replace the "Add exercise" row (lines 131-166): container `className="assign-row"`, the label span `className="assign-row-sub"`, the Assign button `className="assign-add-btn"` (drop its inline `style`). Keep all `disabled`, `aria-label`, `onClick` props unchanged.

- [ ] **Step 3: Apply the header class in the notifications page**

In `app/patient/notifications/page.tsx`, replace the inline-styled header `<div>` (lines 68-82) opening tag:

```tsx
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", margin: "1rem 0 1.5rem" }}>
```

with:

```tsx
      <div className="notifications-head">
```

- [ ] **Step 4: Run the regression + full suite**

Run: `npx vitest run tests/components/admin-exercise-assigner.test.tsx`
Expected: PASS (assign/remove behaviour unchanged).

Run: `npm run test:run`
Expected: full suite PASS.

- [ ] **Step 5: Capture after screenshots and eyeball**

Re-screenshot the same screens as Task 4 (`after-<screen>.png`). Confirm consistent spacing/type; no layout breakage in light/dark.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css components/admin-exercise-assigner.tsx app/patient/notifications/page.tsx
git commit -m "refactor(ui): replace ad-hoc inline styles with design tokens"
```

---

## Self-Review

**Spec coverage (against the Phase-1 portion of the design):**
- 1A "better icon" → Task 1 (SVG bell). ✔
- 1A "icon not changing after opening / mark as read" → Task 2 (auto-mark-on-open). ✔ (Per-item tap deferred to Phase 2 per the YAGNI note — no link targets exist yet.)
- 1B "lock tokens" → Task 3 (spacing scale; type scale already exists). ✔
- 1B "replace ad-hoc inline styles / tighten rhythm" → Tasks 4-5. ✔
- 1B "before/after visual audit, ui-ux-pro-max" → Task 4 (screenshots); apply ui-ux-pro-max judgement in Task 5. ✔

**Placeholder scan:** every code/CSS step shows the actual content; no TBD/TODO. Task 5 lists a mechanical rule + the exact known offenders; Task 4 surfaces any additional lines before Task 5 runs.

**Type consistency:** `BellIcon({ className? })` defined in Task 1, consumed in Task 1 only. `markAllRead(uid, items)` / `subscribeNotifications(uid, cb)` used as already exported by `lib/notifications.ts`. New CSS classes (`assign-row`, `assign-row-label`, `assign-row-sub`, `assign-remove`, `assign-add-btn`, `notifications-head`) are defined in Task 5 Step 1 and consumed in Steps 2-3.

## Notes for the implementer

- This is Phase 1 only. Phase 2 (camera motion-check, motion DB, admin motion targets) is specified in `docs/superpowers/specs/2026-07-25-notifications-ui-motion-design.md` and gets its own plan.
- ui-ux-pro-max skill: load it before Task 5 to sanity-check the spacing/type decisions against its guidance.
- Do not restructure files beyond the listed edits; the goal is consistency, not a rewrite.
