# PhysioOnClick Redesign — Motion, Alerts & Skeleton Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the redesign in `docs/superpowers/specs/2026-07-12-redesign-motion-alerts-skeletons-design.md`: indigo accent tokens, a GSAP-driven animation system replacing CSS-only reveals, a redesigned toast/confirm-dialog system with graphics and motion, and full skeleton-loading coverage across every async screen.

**Architecture:** Four phases, each independently shippable. Phase 1 renames color tokens (mechanical, unblocks nothing else but must land first so later CSS doesn't reference dead tokens). Phase 2 builds the GSAP foundation (`lib/gsap.ts`, a shared `useGSAP` re-export, `Reveal`, `SiteHeader`). Phase 3 redesigns `Toast`/`ConfirmDialog`. Phase 4 adds skeleton primitives to `components/skeleton.tsx` then wires them into every async component found in the spec's audit.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, GSAP 3 (+ `@gsap/react`), Vitest + `@testing-library/react` (jsdom).

## Global Constraints

- No new dependencies beyond `gsap` and `@gsap/react` (spec Section 2).
- Rename `--color-teal*` tokens to `--color-primary*` everywhere; do not leave a dual token system (spec Section 1).
- `Reveal`, `Toast`, `ConfirmDialog` keep their existing public prop signatures — every existing call site must keep compiling untouched (spec Sections 2–3).
- Every new/rewired async loading state uses a shared primitive from `components/skeleton.tsx` — no bespoke ad hoc skeleton markup in individual components (spec Section 4).
- All GSAP animation is gated through `gsap.matchMedia()` in `lib/gsap.ts` respecting `prefers-reduced-motion` (spec Section 2).
- Tests live under `tests/`, mirroring the source path (`tests/components/x.test.tsx` for `components/x.tsx`, `tests/app/...` for `app/...`), matching existing convention.
- Run `npm run test:run` after every task; run `npm run build` after each phase's final task to catch type errors across the whole tree.
- Commit after every task.

---

## Phase 1 — Color Tokens

### Task 1: Rename teal tokens to primary/indigo tokens

**Files:**
- Modify: `app/globals.css:1-35` (token block) and every other line in `app/globals.css` referencing `--color-teal`, `--color-teal-dark`, `--color-teal-light`, `--primary`, `--primary-dark`
- Modify: every `.tsx`/`.ts` file under `app/` and `components/` referencing `var(--color-teal...)`, `"var(--color-teal)"`, etc. in inline `style` objects

**Interfaces:**
- Produces: new CSS custom properties `--color-primary`, `--color-primary-dark`, `--color-primary-light`, `--color-primary-glow`, `--gradient-primary`, `--color-accent`, `--color-coral`, `--color-coral-light`. Every later task in this plan that references color tokens uses these names.

- [ ] **Step 1: Update the token block in `app/globals.css`**

Replace lines 1–35 (the `:root { ... }` block) with:

```css
:root {
  /* ── Design tokens ─────────────────────────────────────────── */
  --color-navy:          #0D1B2A;
  --color-primary:       #4F46E5;
  --color-primary-dark:  #3730A3;
  --color-primary-light: #EEF2FF;
  --color-primary-glow:  #818CF8;
  --gradient-primary:    linear-gradient(135deg, var(--color-primary), var(--color-primary-glow));
  --color-accent:        #10B981;
  --color-coral:         #FF7A59;
  --color-coral-light:   #FFF1EC;
  --color-gold:          #B08030;
  --color-gold-light:    #FDF6E9;
  --color-gold-dark:     #8C6420;
  --color-bg:            #FAF9FF;
  --color-surface:       #FFFFFF;
  --color-border:        #E2E8F0;
  --color-text-primary:  #1E1B3A;
  --color-text-secondary:#4A5568;
  --color-success:       #059669;
  --color-error:         #DC2626;
  --color-error-dark:    #B91C1C;
  --color-warning:       #D97706;
  --color-spinner-track:  rgba(255, 255, 255, 0.15);
  --shadow-card:          0 8px 40px rgba(0, 0, 0, 0.3);
  --font-serif: 'DM Serif Display', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, -apple-system, sans-serif;

  /* ── Legacy aliases (keeps all existing CSS classes working) ── */
  --bg:          var(--color-bg);
  --surface:     var(--color-surface);
  --surface-alt: var(--color-primary-light);
  --ink:         var(--color-navy);
  --muted:       var(--color-text-secondary);
  --line:        var(--color-border);
  --primary:     var(--color-primary);
  --primary-dark:var(--color-primary-dark);
  --shadow:      0 2px 16px rgba(79, 70, 229, 0.10);
  --shell:       1340px;
}
```

- [ ] **Step 2: Replace every remaining `--color-teal*` reference in `app/globals.css`**

```bash
sed -i '' \
  -e 's/--color-teal-light/--color-primary-light/g' \
  -e 's/--color-teal-dark/--color-primary-dark/g' \
  -e 's/--color-teal/--color-primary/g' \
  app/globals.css
```

Run `grep -n -- "--color-teal" app/globals.css` — expect no matches.

- [ ] **Step 3: Replace `--color-teal*` references in component inline styles**

```bash
grep -rl -- "--color-teal" components/ app/ | xargs sed -i '' \
  -e 's/--color-teal-light/--color-primary-light/g' \
  -e 's/--color-teal-dark/--color-primary-dark/g' \
  -e 's/--color-teal/--color-primary/g'
```

Run `grep -rn -- "--color-teal" components/ app/` — expect no matches.

- [ ] **Step 4: Verify the build still compiles**

Run: `npm run build`
Expected: build succeeds with no type errors (this is a pure value/token rename, no signature changes).

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/ app/
git commit -m "refactor: rename teal color tokens to indigo primary tokens"
```

---

## Phase 2 — GSAP Foundation

### Task 2: Install GSAP and create `lib/gsap.ts`

**Files:**
- Modify: `package.json` (add `gsap`, `@gsap/react`)
- Create: `lib/gsap.ts`
- Test: `tests/lib/gsap.test.ts`

**Interfaces:**
- Produces: `gsap` (re-exported from `"gsap"`), `ScrollTrigger` (re-exported from `"gsap/ScrollTrigger"`), `prefersReducedMotion(): boolean`. Every later GSAP-using component imports from `@/lib/gsap`, never directly from `"gsap"`.

- [ ] **Step 1: Install dependencies**

Run: `npm install gsap @gsap/react`

- [ ] **Step 2: Write the failing test**

Create `tests/lib/gsap.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('prefersReducedMotion', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns false when the OS has no motion preference', async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia

    const { prefersReducedMotion } = await import('@/lib/gsap')
    expect(prefersReducedMotion()).toBe(false)
  })

  it('returns true when the OS requests reduced motion', async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia

    const { prefersReducedMotion } = await import('@/lib/gsap')
    expect(prefersReducedMotion()).toBe(true)
  })

  it('re-exports gsap and ScrollTrigger', async () => {
    const mod = await import('@/lib/gsap')
    expect(mod.gsap).toBeDefined()
    expect(mod.ScrollTrigger).toBeDefined()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/lib/gsap.test.ts`
Expected: FAIL with "Cannot find module '@/lib/gsap'" (file doesn't exist yet)

- [ ] **Step 4: Create `lib/gsap.ts`**

```ts
"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/lib/gsap.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Add the shared matchMedia mock to `tests/setup.ts`**

Read the current `tests/setup.ts` (currently just `import '@testing-library/jest-dom'`), then replace its full contents with:

```ts
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
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json lib/gsap.ts tests/lib/gsap.test.ts tests/setup.ts
git commit -m "feat: add gsap dependency and shared lib/gsap.ts helper"
```

---

### Task 3: Create the shared `useGSAP` hook module

**Files:**
- Create: `hooks/use-gsap-timeline.ts`
- Test: `tests/hooks/use-gsap-timeline.test.tsx`

**Interfaces:**
- Consumes: `gsap` from `@/lib/gsap` (Task 2)
- Produces: `useGSAP` (React hook, re-exported from `@gsap/react` with the plugin registered once). Every component task below (`Reveal`, `SiteHeader`, `Toast`, `ToastProvider`, `ConfirmDialog`) imports `useGSAP` from `@/hooks/use-gsap-timeline`, never directly from `@gsap/react`.

- [ ] **Step 1: Write the failing test**

Create `tests/hooks/use-gsap-timeline.test.tsx`:

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

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/hooks/use-gsap-timeline.test.tsx`
Expected: FAIL with "Cannot find module '@/hooks/use-gsap-timeline'"

- [ ] **Step 3: Create `hooks/use-gsap-timeline.ts`**

```ts
"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

gsap.registerPlugin(useGSAP);

export { useGSAP };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/hooks/use-gsap-timeline.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/use-gsap-timeline.ts tests/hooks/use-gsap-timeline.test.tsx
git commit -m "feat: add shared useGSAP hook module"
```

---

### Task 4: Rewrite `components/reveal.tsx` on GSAP + ScrollTrigger

**Files:**
- Modify: `components/reveal.tsx` (full rewrite, same public API)
- Delete: `hooks/use-in-view.ts` (only consumer was `reveal.tsx`; becomes dead code)
- Modify: `app/globals.css:2650-2679` (remove CSS-driven reveal transform/opacity rules — GSAP now owns them; keep the reduced-motion media query removed too since `lib/gsap.ts` handles that centrally)
- Test: `tests/components/reveal.test.tsx`

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger` from `@/lib/gsap` (Task 2); `useGSAP` from `@/hooks/use-gsap-timeline` (Task 3)
- Produces: `Reveal({ children, direction?, delay?, duration?, className?, style? })` — identical props to the current component, so `app/page.tsx`, `app/about/page.tsx`, `app/services/page.tsx`, `app/pricing/page.tsx`, `app/contact/page.tsx`, `app/blog/page.tsx` need no changes.

- [ ] **Step 1: Confirm no other consumer of `hooks/use-in-view.ts`**

Run: `grep -rl "use-in-view" --include="*.tsx" --include="*.ts" . | grep -v node_modules`
Expected: only `hooks/use-in-view.ts` and `components/reveal.tsx`

- [ ] **Step 2: Write the failing test**

Create `tests/components/reveal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Reveal } from '@/components/reveal'

describe('Reveal', () => {
  it('renders its children', () => {
    render(<Reveal>Hello reveal</Reveal>)
    expect(screen.getByText('Hello reveal')).toBeInTheDocument()
  })

  it('applies the reveal class and forwards a custom className', () => {
    render(<Reveal className="custom">Content</Reveal>)
    const el = screen.getByText('Content')
    expect(el.className).toContain('reveal')
    expect(el.className).toContain('custom')
  })

  it('does not throw when the OS requests reduced motion', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia

    expect(() => render(<Reveal direction="left">Reduced</Reveal>)).not.toThrow()
  })
})
```

Add `import { vi } from 'vitest'` to the top of the file alongside the other imports.

- [ ] **Step 3: Run test to verify current behavior (should already pass against the old implementation)**

Run: `npx vitest run tests/components/reveal.test.tsx`
Expected: PASS (this locks in current visible behavior before the rewrite)

- [ ] **Step 4: Rewrite `components/reveal.tsx`**

```tsx
"use client";

import { CSSProperties, useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap-timeline";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type Direction = "up" | "down" | "left" | "right" | "fade";

interface RevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: -28, y: 0 },
  right: { x: 28, y: 0 },
  fade: { x: 0, y: 0 },
};

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 600,
  className,
  style,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };
        if (reduceMotion) {
          gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1 });
          return;
        }

        const offset = OFFSETS[direction];
        gsap.set(el, { opacity: 0, x: offset.x, y: offset.y, scale: 0.98 });

        const trigger = ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.to(el, {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              duration: duration / 1000,
              delay: delay / 1000,
              ease: "power3.out",
            });
          },
        });

        return () => trigger.kill();
      }
    );

    return () => mm.revert();
  }, [direction, delay, duration]);

  return (
    <div ref={ref} className={["reveal", className].filter(Boolean).join(" ")} style={style}>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Delete `hooks/use-in-view.ts`**

```bash
git rm hooks/use-in-view.ts
```

- [ ] **Step 6: Remove the now-unused CSS in `app/globals.css:2650-2679`**

Delete this block entirely (GSAP now sets `opacity`/`transform` inline via `gsap.set`/`gsap.to`, and reduced-motion is handled by `gsap.matchMedia()` in the component, not CSS):

```css
/* ─────────────────────────────────────────────────────────────
   Scroll-reveal animation system
   ──────────────────────────────────────────────────────────── */
.reveal {
  transition-property: opacity, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 600ms;
}
.reveal-up    { opacity: 0; transform: translateY(28px); }
.reveal-down  { opacity: 0; transform: translateY(-28px); }
.reveal-left  { opacity: 0; transform: translateX(-28px); }
.reveal-right { opacity: 0; transform: translateX(28px); }
.reveal-fade  { opacity: 0; }
.reveal.in-view {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .reveal,
  .reveal-up,
  .reveal-down,
  .reveal-left,
  .reveal-right,
  .reveal-fade {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

Keep an empty `.reveal { }` rule is not needed — the class is now just a hook target for the ref, styling is fully inline via GSAP.

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run tests/components/reveal.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 8: Commit**

```bash
git add components/reveal.tsx tests/components/reveal.test.tsx app/globals.css
git rm hooks/use-in-view.ts
git commit -m "refactor: rewrite Reveal on GSAP + ScrollTrigger, drop CSS-only version"
```

---

### Task 5: Migrate `SiteHeader` scroll/nav motion to GSAP `quickTo()`

**Files:**
- Modify: `components/site-header.tsx`
- Test: `tests/components/site-header.test.tsx`

**Interfaces:**
- Consumes: `gsap` from `@/lib/gsap` (Task 2); `useGSAP` from `@/hooks/use-gsap-timeline` (Task 3)
- Produces: no new exports — same `SiteHeader()` component, same DOM structure/classes so `app/globals.css`'s `.header-wrap--scrolled`, `.hamburger--open`, `.mobile-nav-panel.open`, `.mobile-nav-backdrop.open` selectors keep matching.

- [ ] **Step 1: Write the failing test (locks in existing behavior first)**

Create `tests/components/site-header.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null }))
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

import { SiteHeader } from '@/components/site-header'

describe('SiteHeader', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
  })

  it('marks the Home link active on "/"', () => {
    render(<SiteHeader />)
    const homeLink = screen.getByRole('link', { name: 'Home' })
    expect(homeLink.className).toContain('active')
  })

  it('opens the mobile nav panel when the hamburger is clicked', () => {
    render(<SiteHeader />)
    const hamburger = screen.getByLabelText('Open menu')
    fireEvent.click(hamburger)
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument()
  })

  it('adds header-wrap--scrolled after scrolling past 20px', () => {
    render(<SiteHeader />)
    Object.defineProperty(window, 'scrollY', { value: 40, writable: true })
    fireEvent.scroll(window)
    const header = document.querySelector('.header-wrap')
    expect(header?.className).toContain('header-wrap--scrolled')
  })
})
```

- [ ] **Step 2: Run test to verify it fails or passes against current implementation**

Run: `npx vitest run tests/components/site-header.test.tsx`
Expected: PASS (this is the current CSS-class-driven behavior — the test locks it in before the GSAP migration)

- [ ] **Step 3: Add GSAP `quickTo()` for the hamburger icon bars**

In `components/site-header.tsx`, add the import and a `useGSAP` effect that animates the three hamburger `<span>` bars whenever `menuOpen` changes, replacing the CSS-only `.hamburger--open` bar transforms (the class stays on the button for the backdrop/panel CSS, but the bar rotation becomes GSAP-driven for a snappier, interruptible feel):

Add after the existing imports:

```tsx
import { useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap-timeline";
import { gsap } from "@/lib/gsap";
```

(merge the `useRef` import into the existing `import { useEffect, useState } from "react";` line, making it `import { useEffect, useRef, useState } from "react";`)

Inside `SiteHeader()`, after the existing `useState` declarations, add:

```tsx
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    const button = hamburgerRef.current;
    if (!button) return;
    const bars = button.querySelectorAll("span");
    if (bars.length !== 3) return;

    const [top, middle, bottom] = Array.from(bars);
    const duration = 0.25;
    const ease = "power2.inOut";

    if (menuOpen) {
      gsap.to(top, { rotate: 45, y: 6, duration, ease });
      gsap.to(middle, { opacity: 0, duration: duration * 0.6, ease });
      gsap.to(bottom, { rotate: -45, y: -6, duration, ease });
    } else {
      gsap.to(top, { rotate: 0, y: 0, duration, ease });
      gsap.to(middle, { opacity: 1, duration, ease });
      gsap.to(bottom, { rotate: 0, y: 0, duration, ease });
    }
  }, [menuOpen]);
```

Attach the ref to the hamburger `<button>`:

```tsx
            <button
              ref={hamburgerRef}
              className={`hamburger${menuOpen ? " hamburger--open" : ""}`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
```

- [ ] **Step 4: Remove the now-redundant CSS bar-transform rules for `.hamburger--open`**

Run `grep -n "hamburger--open" app/globals.css` to find the rule block, then delete the `span` rotate/opacity declarations inside `.hamburger--open span:nth-child(...)` (keep the `.hamburger` and `.hamburger span` base layout rules — only the open-state transform/opacity values move to GSAP).

- [ ] **Step 5: Run test to verify it still passes**

Run: `npx vitest run tests/components/site-header.test.tsx`
Expected: PASS (3 tests — GSAP inline styles don't affect the class-based assertions)

- [ ] **Step 6: Commit**

```bash
git add components/site-header.tsx app/globals.css tests/components/site-header.test.tsx
git commit -m "feat: animate hamburger icon with GSAP quickTo-style tweens"
```

---

## Phase 3 — Notification System Redesign

### Task 6: Redesign `Toast` — SVG icons, card style, GSAP enter/exit, progress bar

**Files:**
- Modify: `components/toast.tsx`
- Modify: `app/globals.css:2301-2352` (toast CSS block)
- Test: `tests/components/toast.test.tsx`

**Interfaces:**
- Consumes: `gsap` from `@/lib/gsap`, `useGSAP` from `@/hooks/use-gsap-timeline`
- Produces: `Toast({ id, message, type, onDismiss })` — same signature as today; `ToastType = 'success' | 'info' | 'warning' | 'error'` unchanged so `ToastProvider` (Task 7) and every `useToast().show(...)` call site keeps compiling.

- [ ] **Step 1: Write the failing test**

Create `tests/components/toast.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Toast } from '@/components/toast'

describe('Toast', () => {
  it('renders the message and an svg icon', () => {
    render(<Toast id="1" message="Saved" type="success" onDismiss={vi.fn()} />)
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('shows a dismiss button for manual-dismiss types (warning/error)', () => {
    render(<Toast id="1" message="Careful" type="warning" onDismiss={vi.fn()} />)
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument()
  })

  it('does not show a dismiss button for auto-dismiss types (success/info)', () => {
    render(<Toast id="1" message="Done" type="success" onDismiss={vi.fn()} />)
    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument()
  })

  it('renders a progress bar only for auto-dismiss types', () => {
    const { rerender } = render(<Toast id="1" message="Done" type="info" onDismiss={vi.fn()} />)
    expect(document.querySelector('.toast-progress')).toBeInTheDocument()

    rerender(<Toast id="1" message="Careful" type="error" onDismiss={vi.fn()} />)
    expect(document.querySelector('.toast-progress')).not.toBeInTheDocument()
  })

  it('calls onDismiss when the dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    render(<Toast id="7" message="Failed" type="error" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByLabelText('Dismiss'))
    expect(onDismiss).toHaveBeenCalledWith('7')
  })

  it('auto-dismisses success/info toasts after 3 seconds', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Toast id="2" message="Saved" type="success" onDismiss={onDismiss} />)
    vi.advanceTimersByTime(3000)
    expect(onDismiss).toHaveBeenCalledWith('2')
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/toast.test.tsx`
Expected: FAIL (no `.toast-progress` element, icons are unicode glyphs not `<svg>`)

- [ ] **Step 3: Rewrite `components/toast.tsx`**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useGSAP } from '@/hooks/use-gsap-timeline';
import { gsap } from '@/lib/gsap';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

const AUTO_DISMISS: ToastType[] = ['success', 'info'];
const AUTO_DISMISS_MS = 3000;

function ToastIcon({ type }: { type: ToastType }) {
  const stroke = 'currentColor';
  switch (type) {
    case 'success':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.7" />
          <path d="M8 12.5l2.5 2.5L16 9.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'warning':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4l9.5 16H2.5L12 4z" stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" />
          <line x1="12" y1="10" x2="12" y2="14.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="12" cy="17.3" r="0.9" fill={stroke} />
        </svg>
      );
    case 'error':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.7" />
          <line x1="9" y1="9" x2="15" y2="15" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
          <line x1="15" y1="9" x2="9" y2="15" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.7" />
          <line x1="12" y1="11" x2="12" y2="16.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="12" cy="7.7" r="0.9" fill={stroke} />
        </svg>
      );
  }
}

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  const isAutoDismiss = AUTO_DISMISS.includes(type);
  const cardRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAutoDismiss) return;
    const t = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [id, isAutoDismiss, onDismiss]);

  useGSAP(() => {
    const el = cardRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add({ reduceMotion: '(prefers-reduced-motion: reduce)' }, (context) => {
      const { reduceMotion } = context.conditions as { reduceMotion: boolean };
      if (reduceMotion) {
        gsap.set(el, { opacity: 1, y: 0, scale: 1 });
        return;
      }

      gsap.fromTo(
        el,
        { opacity: 0, y: 16, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: 'back.out(1.6)' }
      );

      if (type === 'warning' || type === 'error') {
        gsap.fromTo(
          el,
          { x: 0 },
          { x: 4, duration: 0.06, repeat: 5, yoyo: true, delay: 0.32, ease: 'power1.inOut' }
        );
      }

      if (progressRef.current) {
        gsap.fromTo(
          progressRef.current,
          { scaleX: 1 },
          { scaleX: 0, duration: AUTO_DISMISS_MS / 1000, ease: 'none', transformOrigin: 'left center' }
        );
      }
    });

    return () => mm.revert();
  }, [type]);

  return (
    <div ref={cardRef} className={`toast toast--${type}`} role="alert" aria-live="assertive">
      <span className={`toast-icon-badge toast-icon-badge--${type}`}>
        <ToastIcon type={type} />
      </span>
      <span className="toast-message">{message}</span>
      {!isAutoDismiss && (
        <button className="toast-dismiss" onClick={() => onDismiss(id)} aria-label="Dismiss">
          ✕
        </button>
      )}
      {isAutoDismiss && <div ref={progressRef} className="toast-progress" />}
    </div>
  );
}
```

- [ ] **Step 4: Replace the toast CSS block in `app/globals.css:2301-2352`**

```css
/* ── Toast alerts ──────────────────────────────────────────── */
.toast-viewport {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  pointer-events: none;
}

.toast {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1.1rem;
  border-radius: 20px;
  background: var(--color-surface);
  border-left: 4px solid transparent;
  box-shadow: 0 12px 32px rgba(30, 27, 58, 0.14);
  pointer-events: all;
  overflow: hidden;
  max-width: min(calc(100vw - 2rem), 420px);
}

.toast--success { border-left-color: var(--color-success); }
.toast--info    { border-left-color: var(--color-coral); }
.toast--warning { border-left-color: var(--color-warning); }
.toast--error   { border-left-color: var(--color-error); }

.toast-icon-badge {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-icon-badge--success { background: rgba(5, 150, 105, 0.15); color: var(--color-success); }
.toast-icon-badge--info    { background: rgba(255, 122, 89, 0.15); color: var(--color-coral); }
.toast-icon-badge--warning { background: rgba(217, 119, 6, 0.15); color: var(--color-warning); }
.toast-icon-badge--error   { background: rgba(220, 38, 38, 0.15); color: var(--color-error); }

.toast-message {
  flex: 1;
  font: 500 0.875rem var(--font-sans);
  color: var(--color-text-primary);
}

.toast-dismiss {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  margin-left: 0.25rem;
}

.toast-dismiss:hover { color: var(--color-text-primary); }

.toast-progress {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: var(--color-primary);
  transform-origin: left center;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/components/toast.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add components/toast.tsx app/globals.css tests/components/toast.test.tsx
git commit -m "feat: redesign Toast with SVG icons, GSAP motion, dismiss-progress bar"
```

---

### Task 7: Animate `ToastProvider` stack repositioning with GSAP

**Files:**
- Modify: `components/toast-provider.tsx`
- Test: `tests/components/toast-provider.test.tsx`

**Interfaces:**
- Consumes: `Toast`, `ToastType` from `@/components/toast` (Task 6); `gsap` from `@/lib/gsap`
- Produces: `useToast(): { show: (message: string, type: ToastType) => void }`, `ToastProvider` — unchanged signatures.

- [ ] **Step 1: Write the failing test**

Create `tests/components/toast-provider.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ToastProvider, useToast } from '@/components/toast-provider'

function TriggerButton({ message, type }: { message: string; type: 'success' | 'info' | 'warning' | 'error' }) {
  const { show } = useToast()
  return <button onClick={() => show(message, type)}>trigger</button>
}

describe('ToastProvider', () => {
  it('shows a toast when show() is called', () => {
    render(
      <ToastProvider>
        <TriggerButton message="Saved!" type="success" />
      </ToastProvider>
    )
    act(() => screen.getByText('trigger').click())
    expect(screen.getByText('Saved!')).toBeInTheDocument()
  })

  it('keeps at most 3 toasts visible at once', () => {
    render(
      <ToastProvider>
        <TriggerButton message="One" type="success" />
        <TriggerButton message="Two" type="success" />
        <TriggerButton message="Three" type="success" />
        <TriggerButton message="Four" type="success" />
      </ToastProvider>
    )
    const buttons = screen.getAllByText('trigger')
    buttons.forEach((b) => act(() => b.click()))
    expect(screen.queryByText('One')).not.toBeInTheDocument()
    expect(screen.getByText('Two')).toBeInTheDocument()
    expect(screen.getByText('Three')).toBeInTheDocument()
    expect(screen.getByText('Four')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify current behavior**

Run: `npx vitest run tests/components/toast-provider.test.tsx`
Expected: PASS (this is existing max-3 logic — locks it in before the GSAP addition)

- [ ] **Step 3: Add GSAP-animated stack repositioning to `components/toast-provider.tsx`**

Replace the full file with:

```tsx
'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Toast, ToastType } from '@/components/toast';
import { useGSAP } from '@/hooks/use-gsap-timeline';
import { gsap } from '@/lib/gsap';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);

  const show = useCallback((message: string, type: ToastType) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      return next.slice(-3); // keep max 3 visible
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useGSAP(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const cards = Array.from(viewport.children);
    if (cards.length === 0) return;
    gsap.from(cards, { y: 8, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
  }, [toasts.length]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div ref={viewportRef} className="toast-viewport" aria-label="Notifications">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 4: Run test to verify it still passes**

Run: `npx vitest run tests/components/toast-provider.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/toast-provider.tsx tests/components/toast-provider.test.tsx
git commit -m "feat: animate toast stack repositioning with GSAP"
```

---

### Task 8: Add GSAP entrance/exit animation to `ConfirmDialog`

**Files:**
- Modify: `components/confirm-dialog.tsx`
- Modify: `app/globals.css:2411-2479` (confirm-dialog CSS block)
- Test: `tests/components/confirm-dialog.test.tsx`

**Interfaces:**
- Consumes: `gsap` from `@/lib/gsap`, `useGSAP` from `@/hooks/use-gsap-timeline`
- Produces: `ConfirmDialog({ isOpen, title, body, confirmLabel, confirmVariant?, onConfirm, onCancel })` — unchanged signature.

- [ ] **Step 1: Write the failing test**

Create `tests/components/confirm-dialog.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConfirmDialog } from '@/components/confirm-dialog'

describe('ConfirmDialog', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Cancel appointment?"
        body="Body"
        confirmLabel="Cancel"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.queryByText('Cancel appointment?')).not.toBeInTheDocument()
  })

  it('renders title, body, and calls onConfirm/onCancel', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        isOpen
        title="Cancel appointment?"
        body="This will cancel your booking."
        confirmLabel="Cancel Appointment"
        confirmVariant="destructive"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    expect(screen.getByText('Cancel appointment?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel Appointment'))
    expect(onConfirm).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Keep'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('closes on Escape key', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        isOpen
        title="T"
        body="B"
        confirmLabel="Confirm"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify current behavior**

Run: `npx vitest run tests/components/confirm-dialog.test.tsx`
Expected: PASS (locks in existing show/hide/keyboard behavior before the GSAP addition)

- [ ] **Step 3: Add GSAP entrance to `components/confirm-dialog.tsx`**

Add these imports at the top (alongside the existing `useEffect` import, merge into one React import line):

```tsx
import { useEffect, useRef } from 'react';
import { useGSAP } from '@/hooks/use-gsap-timeline';
import { gsap } from '@/lib/gsap';
```

Inside `ConfirmDialog`, after the existing `useEffect` for the Escape handler, add refs and an animation effect:

```tsx
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!isOpen) return;
    const overlay = overlayRef.current;
    const dialog = dialogRef.current;
    if (!overlay || !dialog) return;

    const mm = gsap.matchMedia();
    mm.add({ reduceMotion: '(prefers-reduced-motion: reduce)' }, (context) => {
      const { reduceMotion } = context.conditions as { reduceMotion: boolean };
      if (reduceMotion) {
        gsap.set(overlay, { opacity: 1 });
        gsap.set(dialog, { opacity: 1, scale: 1 });
        return;
      }
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'power1.out' });
      gsap.fromTo(
        dialog,
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 0.22, ease: 'back.out(1.7)' }
      );
    });

    return () => mm.revert();
  }, [isOpen]);
```

Attach the refs to the overlay and dialog elements:

```tsx
  return (
    <div ref={overlayRef} className="confirm-overlay" onClick={onCancel}>
      <div ref={dialogRef} className="confirm-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
```

(keep the rest of the JSX body unchanged)

- [ ] **Step 4: Update `.confirm-dialog` border color reference in `app/globals.css:2411-2479`**

The block already uses token references (`var(--color-teal)` → already renamed to `var(--color-primary)` by Task 1). No further token changes needed here; this step is a no-op verification:

Run: `grep -n "color-teal" app/globals.css` — expect no matches (confirms Task 1 already covered this block).

- [ ] **Step 5: Run test to verify it still passes**

Run: `npx vitest run tests/components/confirm-dialog.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add components/confirm-dialog.tsx tests/components/confirm-dialog.test.tsx
git commit -m "feat: add GSAP entrance animation to ConfirmDialog"
```

- [ ] **Step 7: Full-tree check for Phase 2 + 3**

Run: `npm run test:run && npm run build`
Expected: all tests pass, build succeeds.

---

## Phase 4 — Skeleton Coverage

### Task 9: Add skeleton primitives to `components/skeleton.tsx`

**Files:**
- Modify: `components/skeleton.tsx`
- Modify: `app/globals.css` (append new skeleton-primitive CSS after the existing `.skeleton` rule, `app/globals.css:2237-2254`)
- Test: `tests/components/skeleton.test.tsx`

**Interfaces:**
- Produces: `Skeleton({ width?, height?, className? })` (existing, unchanged), `SkeletonText({ lines?, lastLineWidth? })`, `SkeletonCircle({ size? })`, `SkeletonRow({ count? })`, `SkeletonTable({ rows?, columns? })`, `SkeletonChart({ height? })`, `SkeletonStatGrid({ count? })`, `SkeletonForm({ fields? })`. Every task from Task 10 onward imports these by name from `@/components/skeleton`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/skeleton.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonRow,
  SkeletonTable,
  SkeletonChart,
  SkeletonStatGrid,
  SkeletonForm,
} from '@/components/skeleton'

describe('skeleton primitives', () => {
  it('Skeleton renders a single shimmer block', () => {
    const { container } = render(<Skeleton width="80px" height="20px" />)
    expect(container.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('SkeletonText renders the requested number of lines', () => {
    const { container } = render(<SkeletonText lines={3} />)
    expect(container.querySelectorAll('.skeleton-text-line').length).toBe(3)
  })

  it('SkeletonCircle renders one circular block', () => {
    const { container } = render(<SkeletonCircle size="48px" />)
    expect(container.querySelector('.skeleton-circle')).toBeInTheDocument()
  })

  it('SkeletonRow renders the requested number of rows', () => {
    const { container } = render(<SkeletonRow count={4} />)
    expect(container.querySelectorAll('.skeleton-row').length).toBe(4)
  })

  it('SkeletonTable renders a header plus the requested rows', () => {
    const { container } = render(<SkeletonTable rows={3} columns={5} />)
    expect(container.querySelectorAll('.skeleton-table-row').length).toBe(3)
    expect(container.querySelectorAll('.skeleton-table-header .skeleton').length).toBe(5)
  })

  it('SkeletonChart renders at the requested height', () => {
    const { container } = render(<SkeletonChart height={200} />)
    const chart = container.querySelector('.skeleton-chart') as HTMLElement
    expect(chart.style.height).toBe('200px')
  })

  it('SkeletonStatGrid renders the requested number of tiles', () => {
    const { container } = render(<SkeletonStatGrid count={2} />)
    expect(container.querySelectorAll('.skeleton-stat-tile').length).toBe(2)
  })

  it('SkeletonForm renders the requested number of fields', () => {
    const { container } = render(<SkeletonForm fields={4} />)
    expect(container.querySelectorAll('.skeleton-form-field').length).toBe(4)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/skeleton.test.tsx`
Expected: FAIL (only `Skeleton` exists today)

- [ ] **Step 3: Replace `components/skeleton.tsx` with the full primitive set**

```tsx
interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1.2em', className }: SkeletonProps) {
  return (
    <span
      className={`skeleton${className ? ` ${className}` : ''}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
}

export function SkeletonText({ lines = 1, lastLineWidth = '70%' }: SkeletonTextProps) {
  return (
    <div className="skeleton-text-group" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.9em"
          width={i === lines - 1 ? lastLineWidth : '100%'}
          className="skeleton-text-line"
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = '40px' }: { size?: string }) {
  return <Skeleton width={size} height={size} className="skeleton-circle" />;
}

export function SkeletonRow({ count = 1 }: { count?: number }) {
  return (
    <div className="skeleton-row-group" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <SkeletonCircle size="36px" />
          <div className="skeleton-row-lines">
            <Skeleton height="0.9em" width="60%" />
            <Skeleton height="0.75em" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="skeleton-table" aria-hidden="true">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="0.8em" width="70%" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div className="skeleton-table-row" key={r}>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} height="0.85em" width={c === 0 ? '85%' : '60%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 260 }: { height?: number }) {
  return (
    <div className="skeleton-chart" style={{ height: `${height}px` }} aria-hidden="true">
      <Skeleton width="100%" height="100%" className="skeleton-chart-block" />
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-stat-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-stat-tile" key={i}>
          <Skeleton height="0.7em" width="50%" />
          <Skeleton height="2rem" width="70%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 3 }: { fields?: number }) {
  return (
    <div className="skeleton-form" aria-hidden="true">
      {Array.from({ length: fields }).map((_, i) => (
        <div className="skeleton-form-field" key={i}>
          <Skeleton height="0.75em" width="30%" />
          <Skeleton height="2.4rem" width="100%" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Append supporting CSS after `app/globals.css:2254`** (right after the existing `.skeleton { ... }` rule closes)

```css
.skeleton-text-group,
.skeleton-form,
.skeleton-row-group,
.skeleton-table,
.skeleton-stat-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.skeleton-row-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.skeleton-table-header,
.skeleton-table-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 0.625rem 0;
  border-bottom: 1px solid var(--color-border);
}

.skeleton-chart {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.skeleton-chart-block {
  border-radius: 12px !important;
}

.skeleton-stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.skeleton-stat-tile {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid var(--color-border);
}

.skeleton-form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/components/skeleton.test.tsx`
Expected: PASS (8 tests)

- [ ] **Step 6: Commit**

```bash
git add components/skeleton.tsx app/globals.css tests/components/skeleton.test.tsx
git commit -m "feat: add SkeletonText/Circle/Row/Table/Chart/StatGrid/Form primitives"
```

---

### Task 10: Wire skeletons into `AdherenceBar` and `PersonSwitcher`

**Files:**
- Modify: `components/adherence-bar.tsx`
- Modify: `components/person-switcher.tsx`
- Test: `tests/components/adherence-bar.test.tsx`
- Test: `tests/components/person-switcher.test.tsx`

**Interfaces:**
- Consumes: `SkeletonText`, `Skeleton` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing tests**

Create `tests/components/adherence-bar.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getExerciseLogsMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getExerciseLogs: (...args: unknown[]) => getExerciseLogsMock(...args),
}))

import { AdherenceBar } from '@/components/adherence-bar'

describe('AdherenceBar', () => {
  it('shows a skeleton while loading, then the adherence copy once resolved', async () => {
    let resolveLogs: (v: unknown[]) => void = () => {}
    getExerciseLogsMock.mockReturnValue(new Promise((resolve) => { resolveLogs = resolve }))

    render(<AdherenceBar uid="u1" personId="p1" />)
    expect(document.querySelector('.skeleton')).toBeInTheDocument()

    resolveLogs([{ completions: { a: true } }, { completions: { a: false } }])

    await waitFor(() => {
      expect(screen.getByText(/of 7 days/)).toBeInTheDocument()
    })
    expect(document.querySelector('.skeleton')).not.toBeInTheDocument()
  })
})
```

Create `tests/components/person-switcher.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getDependentsMock = vi.fn()
vi.mock('@/lib/dependents', () => ({
  getDependents: (...args: unknown[]) => getDependentsMock(...args),
}))

import { PersonSwitcher } from '@/components/person-switcher'

describe('PersonSwitcher', () => {
  it('shows a skeleton pill while loading, then the select once resolved', async () => {
    let resolveDeps: (v: unknown[]) => void = () => {}
    getDependentsMock.mockReturnValue(new Promise((resolve) => { resolveDeps = resolve }))

    render(<PersonSwitcher uid="u1" displayName="Jane" onSelect={vi.fn()} alwaysShow />)
    expect(document.querySelector('.skeleton')).toBeInTheDocument()

    resolveDeps([])

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    expect(document.querySelector('.skeleton')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/adherence-bar.test.tsx tests/components/person-switcher.test.tsx`
Expected: FAIL (`AdherenceBar` returns `null` while loading; `PersonSwitcher` renders the real select immediately)

- [ ] **Step 3: Update `components/adherence-bar.tsx`**

Add the import at the top:

```tsx
import { Skeleton, SkeletonText } from "@/components/skeleton";
```

Replace the `if (daysCompleted === null) return null;` line with:

```tsx
  if (daysCompleted === null)
    return (
      <div className="panel stack">
        <h3>This week&apos;s adherence</h3>
        <SkeletonText lines={1} lastLineWidth="60%" />
        <Skeleton height="12px" width="100%" className="skeleton-bar" />
      </div>
    );
```

- [ ] **Step 4: Update `components/person-switcher.tsx`**

Add the import at the top:

```tsx
import { Skeleton } from "@/components/skeleton";
```

Add a loading flag and skeleton branch. Replace:

```tsx
export function PersonSwitcher({ uid, displayName, onSelect, alwaysShow = false, onAddPerson }: Props) {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [selected, setSelected] = useState(uid);

  useEffect(() => {
    getDependents(uid).then(setDependents);
  }, [uid]);
```

with:

```tsx
export function PersonSwitcher({ uid, displayName, onSelect, alwaysShow = false, onAddPerson }: Props) {
  const [dependents, setDependents] = useState<Dependent[] | null>(null);
  const [selected, setSelected] = useState(uid);

  useEffect(() => {
    setDependents(null);
    getDependents(uid).then(setDependents);
  }, [uid]);
```

Replace `if (dependents.length === 0 && !alwaysShow) return null;` with:

```tsx
  if (dependents === null) {
    if (!alwaysShow) return null;
    return <Skeleton height="2.4rem" width="220px" />;
  }

  if (dependents.length === 0 && !alwaysShow) return null;
```

Update the remaining `dependents.map(...)` reference — it now runs on a non-null array since we've returned above for the `null` case, so no further change is needed there.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/components/adherence-bar.test.tsx tests/components/person-switcher.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add components/adherence-bar.tsx components/person-switcher.tsx tests/components/adherence-bar.test.tsx tests/components/person-switcher.test.tsx
git commit -m "fix: replace blank loading states with skeletons in AdherenceBar and PersonSwitcher"
```

---

### Task 11: Wire skeletons into `PatientProfileEditor` and `BlogFavoriteButton`

**Files:**
- Modify: `components/patient-profile-editor.tsx`
- Modify: `components/blog-favorite-button.tsx`
- Test: `tests/components/patient-profile-editor.test.tsx`
- Test: `tests/components/blog-favorite-button.test.tsx`

**Interfaces:**
- Consumes: `SkeletonForm` and `SkeletonCircle` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing tests**

Create `tests/components/patient-profile-editor.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null, db: null }))
vi.mock('@/lib/patient-account', () => ({
  ensurePatientRecord: vi.fn().mockResolvedValue(undefined),
  mergePatientProfileDetails: vi.fn(),
}))

import { PatientProfileEditor } from '@/components/patient-profile-editor'

describe('PatientProfileEditor', () => {
  it('shows a skeleton form before auth resolves', async () => {
    render(<PatientProfileEditor />)
    expect(document.querySelector('.skeleton-form')).toBeInTheDocument()
  })
})
```

Create `tests/components/blog-favorite-button.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null, db: null }))
vi.mock('@/lib/patient-account', () => ({ ensurePatientRecord: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { BlogFavoriteButton } from '@/components/blog-favorite-button'
import type { BlogArticle } from '@/lib/blog'

const article = { slug: 'a', title: 'A', category: 'C', excerpt: '', image: '', publishedAt: '' } as BlogArticle

describe('BlogFavoriteButton', () => {
  it('shows a skeleton circle while the favourite state is unresolved', () => {
    const { container } = render(<BlogFavoriteButton article={article} />)
    expect(container.querySelector('.skeleton-circle')).toBeInTheDocument()
  })
})
```

Note: with `auth: null`, `onAuthStateChanged` is never wired, so `userId` stays `""` — that's the pre-resolution state this test exercises (no `db`/`userId` means the "haven't checked yet" branch, not the "signed out" branch, so the component must distinguish those two states).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/patient-profile-editor.test.tsx tests/components/blog-favorite-button.test.tsx`
Expected: FAIL (both currently render their real (empty) form/button immediately, no `.skeleton-form` or `.skeleton-circle` present)

- [ ] **Step 3: Update `components/patient-profile-editor.tsx`**

Add a `resolvedAuth` flag and the skeleton import. Add the import:

```tsx
import { SkeletonForm } from "@/components/skeleton";
```

Change the state declarations to add a resolution flag:

```tsx
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Sign in to manage your profile details.");
  const [isSaving, setIsSaving] = useState(false);
  const [resolvedAuth, setResolvedAuth] = useState(false);
```

In the first `useEffect`, set `setResolvedAuth(true)` at the start of the `onAuthStateChanged` callback (right after `async (user) => {`):

```tsx
    return onAuthStateChanged(auth, async (user) => {
      setResolvedAuth(true);
      setUserId(user?.uid || "");
```

Also handle the `!auth` early-return case — add `setResolvedAuth(true)` there too:

```tsx
  useEffect(() => {
    if (!auth) {
      setResolvedAuth(true);
      return;
    }
```

Right before the `return (` of the component's JSX, add an early skeleton return:

```tsx
  if (!resolvedAuth) {
    return (
      <div className="panel patient-profile-panel">
        <SkeletonForm fields={3} />
      </div>
    );
  }

  return (
```

- [ ] **Step 4: Update `components/blog-favorite-button.tsx`**

Add the import:

```tsx
import { SkeletonCircle } from "@/components/skeleton";
```

Add a `resolvedAuth` flag mirroring Task 11's pattern:

```tsx
  const [userId, setUserId] = useState("");
  const [isFavourite, setIsFavourite] = useState(false);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [resolvedAuth, setResolvedAuth] = useState(false);

  useEffect(() => {
    if (!auth) {
      setResolvedAuth(true);
      return;
    }

    return onAuthStateChanged(auth, (user) => {
      setResolvedAuth(true);
      setUserId(user?.uid || "");
    });
  }, []);
```

Before the final `return (`, add:

```tsx
  if (!resolvedAuth) {
    return (
      <div className={`blog-favorite-wrap ${compact ? "compact" : ""}`}>
        <SkeletonCircle size="24px" />
      </div>
    );
  }

  return (
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/components/patient-profile-editor.test.tsx tests/components/blog-favorite-button.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add components/patient-profile-editor.tsx components/blog-favorite-button.tsx tests/components/patient-profile-editor.test.tsx tests/components/blog-favorite-button.test.tsx
git commit -m "fix: replace blank loading states with skeletons in profile editor and favorite button"
```

---

### Task 12: Wire `SkeletonChart` into `RecoveryChart`

**Files:**
- Modify: `components/recovery-chart.tsx` (also fixes `components/admin-recovery-chart.tsx` indirectly since it wraps `RecoveryChart`)
- Test: `tests/components/recovery-chart.test.tsx`

**Interfaces:**
- Consumes: `SkeletonChart` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing test**

Create `tests/components/recovery-chart.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getPainLogsMock = vi.fn()
const getClinicalAssessmentsMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getPainLogs: (...args: unknown[]) => getPainLogsMock(...args),
  getClinicalAssessments: (...args: unknown[]) => getClinicalAssessmentsMock(...args),
}))

import { RecoveryChart } from '@/components/recovery-chart'

describe('RecoveryChart', () => {
  it('shows a SkeletonChart while loading, then removes it once resolved', async () => {
    getPainLogsMock.mockResolvedValue([])
    getClinicalAssessmentsMock.mockResolvedValue([])

    render(<RecoveryChart uid="u1" personId="p1" />)
    expect(document.querySelector('.skeleton-chart')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/log your first pain check-in/i)).toBeInTheDocument()
    })
    expect(document.querySelector('.skeleton-chart')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/recovery-chart.test.tsx`
Expected: FAIL (no `.skeleton-chart` — current loading state is `<p className="muted">Loading chart…</p>`)

- [ ] **Step 3: Update `components/recovery-chart.tsx`**

Add the import:

```tsx
import { SkeletonChart } from "@/components/skeleton";
```

Replace `{loading ? (\n          <p className="muted">Loading chart…</p>\n        ) : error ? (` with:

```tsx
        {loading ? (
          <SkeletonChart height={260} />
        ) : error ? (
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/recovery-chart.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/recovery-chart.tsx tests/components/recovery-chart.test.tsx
git commit -m "fix: replace loading text with SkeletonChart in RecoveryChart"
```

---

### Task 13: Wire skeletons into `AssignedExercises` and `PainCheckIn`

**Files:**
- Modify: `components/assigned-exercises.tsx`
- Modify: `components/pain-check-in.tsx`
- Test: `tests/components/assigned-exercises.test.tsx`
- Test: `tests/components/pain-check-in.test.tsx`

**Interfaces:**
- Consumes: `SkeletonRow` from `@/components/skeleton` (for `AssignedExercises`), `SkeletonStatGrid` (for `PainCheckIn`)

- [ ] **Step 1: Write the failing tests**

Create `tests/components/assigned-exercises.test.tsx`:

```tsx
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getAssignedExercisesMock = vi.fn()
const getTodayExerciseLogMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...args: unknown[]) => getAssignedExercisesMock(...args),
  getTodayExerciseLog: (...args: unknown[]) => getTodayExerciseLogMock(...args),
  toggleExerciseCompletion: vi.fn(),
}))

import { AssignedExercises } from '@/components/assigned-exercises'

describe('AssignedExercises', () => {
  it('shows SkeletonRow while loading', async () => {
    getAssignedExercisesMock.mockResolvedValue([])
    getTodayExerciseLogMock.mockResolvedValue(null)

    const { container } = render(<AssignedExercises uid="u1" personId="p1" />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(container.querySelector('.skeleton-row-group')).not.toBeInTheDocument()
    })
  })
})
```

Create `tests/components/pain-check-in.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getTodayPainLogMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getTodayPainLog: (...args: unknown[]) => getTodayPainLogMock(...args),
  logPainScore: vi.fn(),
}))

import { PainCheckIn } from '@/components/pain-check-in'

describe('PainCheckIn', () => {
  it('shows a SkeletonStatGrid while loading, then the form once resolved', async () => {
    getTodayPainLogMock.mockResolvedValue(null)

    const { container } = render(<PainCheckIn uid="u1" personId="p1" />)
    expect(container.querySelector('.skeleton-stat-grid')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/how is your pain right now/i)).toBeInTheDocument()
    })
    expect(container.querySelector('.skeleton-stat-grid')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/assigned-exercises.test.tsx tests/components/pain-check-in.test.tsx`
Expected: FAIL

- [ ] **Step 3: Update `components/assigned-exercises.tsx`**

Add the import:

```tsx
import { SkeletonRow } from "@/components/skeleton";
```

Replace `if (loading) return <p className="muted">Loading exercises…</p>;` with:

```tsx
  if (loading)
    return (
      <div className="panel stack">
        <h3>Your exercises</h3>
        <SkeletonRow count={3} />
      </div>
    );
```

- [ ] **Step 4: Update `components/pain-check-in.tsx`**

Add the import:

```tsx
import { SkeletonStatGrid } from "@/components/skeleton";
```

Replace:

```tsx
  if (todayLog === undefined) {
    return (
      <div className="panel stack">
        <h3>Today&apos;s pain check-in</h3>
        <p className="muted">Loading…</p>
      </div>
    );
  }
```

with:

```tsx
  if (todayLog === undefined) {
    return (
      <div className="panel stack">
        <h3>Today&apos;s pain check-in</h3>
        <SkeletonStatGrid count={1} />
      </div>
    );
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/components/assigned-exercises.test.tsx tests/components/pain-check-in.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add components/assigned-exercises.tsx components/pain-check-in.tsx tests/components/assigned-exercises.test.tsx tests/components/pain-check-in.test.tsx
git commit -m "fix: replace loading text with skeleton primitives in exercises and pain check-in"
```

---

### Task 14: Wire skeletons into `SavedBlogsSection` and `RehabProgramsSection`

**Files:**
- Modify: `components/saved-blogs-section.tsx`
- Modify: `components/rehab-programs-section.tsx`
- Test: `tests/components/saved-blogs-section.test.tsx`
- Test: `tests/components/rehab-programs-section.test.tsx`

**Interfaces:**
- Consumes: `SkeletonRow` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing tests**

Create `tests/components/saved-blogs-section.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: null }))

import { SavedBlogsSection } from '@/components/saved-blogs-section'

describe('SavedBlogsSection', () => {
  it('shows SkeletonRow while loading, then the empty-state copy once resolved', async () => {
    const { container } = render(<SavedBlogsSection uid="" />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/no saved articles yet/i)).toBeInTheDocument()
    })
  })
})
```

Create `tests/components/rehab-programs-section.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: null }))

import { RehabProgramsSection } from '@/components/rehab-programs-section'

describe('RehabProgramsSection', () => {
  it('shows SkeletonRow while loading, then the empty-state copy once resolved', async () => {
    const { container } = render(<RehabProgramsSection email="" />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/no rehab programme assigned yet/i)).toBeInTheDocument()
    })
  })
})
```

Note: both components short-circuit to `setLoading(false)` synchronously when `db`/`uid`/`email` is falsy (see the `if (!db || !uid) { setLoading(false); return; }` guard), so the initial render (before that effect runs) is still the `loading === true` state — the skeleton is what should render on that first paint.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/saved-blogs-section.test.tsx tests/components/rehab-programs-section.test.tsx`
Expected: FAIL (current loading state is plain text, not `.skeleton-row-group`)

- [ ] **Step 3: Update `components/saved-blogs-section.tsx`**

Add the import:

```tsx
import { SkeletonRow } from "@/components/skeleton";
```

Replace `if (loading) return <p style={{ color: "#5E7A84" }}>Loading saved articles…</p>;` with:

```tsx
  if (loading) return <SkeletonRow count={3} />;
```

- [ ] **Step 4: Update `components/rehab-programs-section.tsx`**

Add the import:

```tsx
import { SkeletonRow } from "@/components/skeleton";
```

Replace `if (loading) return <p style={{ color: "#5E7A84" }}>Loading rehab programmes…</p>;` with:

```tsx
  if (loading) return <SkeletonRow count={2} />;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/components/saved-blogs-section.test.tsx tests/components/rehab-programs-section.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add components/saved-blogs-section.tsx components/rehab-programs-section.tsx tests/components/saved-blogs-section.test.tsx tests/components/rehab-programs-section.test.tsx
git commit -m "fix: replace loading text with SkeletonRow in saved blogs and rehab programs"
```

---

### Task 15: Wire `SkeletonRow` into `PatientLiveOverview`, distinct from the true-empty state

**Files:**
- Modify: `components/patient-live-overview.tsx`
- Test: `tests/components/patient-live-overview.test.tsx`

**Interfaces:**
- Consumes: `SkeletonRow` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing test**

Create `tests/components/patient-live-overview.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null }))
vi.mock('@/lib/firestore-helpers', () => ({
  subscribeUserCollection: vi.fn(() => () => {}),
}))

import { PatientLiveOverview } from '@/components/patient-live-overview'

describe('PatientLiveOverview', () => {
  it('shows a skeleton for each column before auth resolves, and the sign-in prompt after', async () => {
    render(<PatientLiveOverview />)
    expect(document.querySelectorAll('.skeleton-row-group').length).toBe(3)

    await waitFor(() => {
      expect(screen.getByText(/sign in to load your live bookings/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/patient-live-overview.test.tsx`
Expected: FAIL (no distinct loading state today — with `auth: null` mocked, `onAuthStateChanged` never fires and the component sits in a state indistinguishable from "no data")

- [ ] **Step 3: Update `components/patient-live-overview.tsx`**

Add the import:

```tsx
import { SkeletonRow } from "@/components/skeleton";
```

Add a `resolvedAuth` flag:

```tsx
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [favouriteBlogs, setFavouriteBlogs] = useState<FavouriteBlog[]>([]);
  const [userId, setUserId] = useState("");
  const [resolvedAuth, setResolvedAuth] = useState(false);

  useEffect(() => {
    if (!auth) {
      setResolvedAuth(true);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setResolvedAuth(true);
      setEmail(user?.email || "");
      setUserId(user?.uid || "");
    });

    return () => unsubscribeAuth();
  }, []);
```

Replace the returned JSX's opening section (the `<h3>` and the sign-in-status paragraph plus grid) — insert a skeleton branch before it:

```tsx
  if (!resolvedAuth) {
    return (
      <div className="panel stack">
        <h3>Account overview</h3>
        <div className="patient-account-grid">
          <SkeletonRow count={2} />
          <SkeletonRow count={2} />
          <SkeletonRow count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="panel stack">
```

(keep everything from the original `<h3>Account overview</h3>` line onward inside this final `return`, unchanged)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/patient-live-overview.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/patient-live-overview.tsx tests/components/patient-live-overview.test.tsx
git commit -m "fix: show per-column skeletons in PatientLiveOverview before auth resolves"
```

---

### Task 16: Fix `AdminLiveStats` showing fake zeroed data — add real loading state

**Files:**
- Modify: `components/admin-live-stats.tsx`
- Test: `tests/components/admin-live-stats.test.tsx`

**Interfaces:**
- Consumes: `SkeletonStatGrid` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing test**

Create `tests/components/admin-live-stats.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null, db: null }))

import { AdminLiveStats } from '@/components/admin-live-stats'

describe('AdminLiveStats', () => {
  it('shows a SkeletonStatGrid instead of fake zeroed counts before auth resolves', () => {
    render(<AdminLiveStats />)
    expect(document.querySelector('.skeleton-stat-grid')).toBeInTheDocument()
    // The bug this fixes: previously "0" rendered immediately as if it were real data
    expect(screen.queryByText('£520')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/admin-live-stats.test.tsx`
Expected: FAIL (currently renders `DEFAULT` counts, including `£520`, immediately)

- [ ] **Step 3: Update `components/admin-live-stats.tsx`**

Add the import:

```tsx
import { SkeletonStatGrid } from "@/components/skeleton";
```

Add a `resolvedAuth` flag alongside `isSignedIn`:

```tsx
export function AdminLiveStats() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [resolvedAuth, setResolvedAuth] = useState(false);
  const [counts, setCounts] = useState<Counts>(DEFAULT);

  useEffect(() => {
    if (!auth) {
      setResolvedAuth(true);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      setResolvedAuth(true);
      setIsSignedIn(!!user);
    });
  }, []);
```

Insert a skeleton return right after the `pill` helper function definition, before the main `return (`:

```tsx
  if (!resolvedAuth) {
    return (
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={eyebrow}>Live Stats</span>
          <h2 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--color-navy)" }}>Dashboard overview</h2>
        </div>
        <SkeletonStatGrid count={4} />
      </div>
    );
  }

  return (
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/admin-live-stats.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/admin-live-stats.tsx tests/components/admin-live-stats.test.tsx
git commit -m "fix: AdminLiveStats no longer shows fake zeroed data before auth resolves"
```

---

### Task 17: Wire `SkeletonTable` into `AdminBookingsTable` and `AdminEnquiriesTable`

**Files:**
- Modify: `components/admin-bookings-table.tsx`
- Modify: `components/admin-enquiries-table.tsx`
- Test: `tests/components/admin-bookings-table.test.tsx`
- Test: `tests/components/admin-enquiries-table.test.tsx`

**Interfaces:**
- Consumes: `SkeletonTable` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing tests**

Create `tests/components/admin-bookings-table.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: null }))
vi.mock('@/app/admin/actions', () => ({ cancelCalBooking: vi.fn() }))

import { AdminBookingsTable } from '@/components/admin-bookings-table'

describe('AdminBookingsTable', () => {
  it('shows a SkeletonTable while loading', () => {
    const { container } = render(<AdminBookingsTable />)
    expect(container.querySelector('.skeleton-table')).toBeInTheDocument()
  })
})
```

Create `tests/components/admin-enquiries-table.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: null }))

import { AdminEnquiriesTable } from '@/components/admin-enquiries-table'

describe('AdminEnquiriesTable', () => {
  it('shows a SkeletonTable while loading', () => {
    const { container } = render(<AdminEnquiriesTable />)
    expect(container.querySelector('.skeleton-table')).toBeInTheDocument()
  })
})
```

Note: with `db: null` mocked, the `useEffect`'s `if (!db) return;` guard means `loading` never flips to `false`, so both components stay in the loading state — exactly what these tests check.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/admin-bookings-table.test.tsx tests/components/admin-enquiries-table.test.tsx`
Expected: FAIL (current loading state is a `<p>` with `var(--font-sans)`, not `.skeleton-table`)

- [ ] **Step 3: Update `components/admin-bookings-table.tsx`**

Add the import:

```tsx
import { SkeletonTable } from "@/components/skeleton";
```

Replace `{loading && <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Loading bookings…</p>}` with:

```tsx
      {loading && <SkeletonTable rows={5} columns={6} />}
```

- [ ] **Step 4: Update `components/admin-enquiries-table.tsx`**

Add the import:

```tsx
import { SkeletonTable } from "@/components/skeleton";
```

Replace:

```tsx
      {loading && (
        <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Loading enquiries…</p>
      )}
```

with:

```tsx
      {loading && <SkeletonTable rows={5} columns={6} />}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/components/admin-bookings-table.test.tsx tests/components/admin-enquiries-table.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add components/admin-bookings-table.tsx components/admin-enquiries-table.tsx tests/components/admin-bookings-table.test.tsx tests/components/admin-enquiries-table.test.tsx
git commit -m "fix: replace loading text with SkeletonTable in admin bookings and enquiries tables"
```

---

### Task 18: Wire skeletons into `AdminChatLogs`, `AdminPatientSelector`, `AdminExerciseAssigner`

**Files:**
- Modify: `components/admin-chat-logs.tsx`
- Modify: `components/admin-patient-selector.tsx`
- Modify: `components/admin-exercise-assigner.tsx`
- Test: `tests/components/admin-chat-logs.test.tsx`
- Test: `tests/components/admin-patient-selector.test.tsx`
- Test: `tests/components/admin-exercise-assigner.test.tsx`

**Interfaces:**
- Consumes: `SkeletonRow` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing tests**

Create `tests/components/admin-chat-logs.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: null }))

import { AdminChatLogs } from '@/components/admin-chat-logs'

describe('AdminChatLogs', () => {
  it('shows SkeletonRow while loading', () => {
    const { container } = render(<AdminChatLogs />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()
  })
})
```

Create `tests/components/admin-patient-selector.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: null }))
vi.mock('@/lib/dependents', () => ({ getDependents: vi.fn() }))

import { AdminPatientSelector } from '@/components/admin-patient-selector'

describe('AdminPatientSelector', () => {
  it('shows SkeletonRow before the patient list has loaded, then the search input once resolved', async () => {
    const { container } = render(<AdminPatientSelector onSelect={vi.fn()} />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument()
    })
  })
})
```

Note: `db: null` means `getDocs` is never called (the `if (!db) return;` guard), so `patients` stays `[]` forever — add a `loaded` flag to distinguish "still fetching" from "fetched, zero patients."

Create `tests/components/admin-exercise-assigner.test.tsx`:

```tsx
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const getAssignedExercisesMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...args: unknown[]) => getAssignedExercisesMock(...args),
  assignExercise: vi.fn(),
  removeExercise: vi.fn(),
}))

import { AdminExerciseAssigner } from '@/components/admin-exercise-assigner'

describe('AdminExerciseAssigner', () => {
  it('shows SkeletonRow while the assigned list loads', async () => {
    let resolveAssigned: (v: unknown[]) => void = () => {}
    getAssignedExercisesMock.mockReturnValue(new Promise((resolve) => { resolveAssigned = resolve }))

    const { container } = render(
      <AdminExerciseAssigner adminUid="a1" patientUid="p1" personId="p1" />
    )
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()

    resolveAssigned([])
    await waitFor(() => {
      expect(container.querySelector('.skeleton-row-group')).not.toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/admin-chat-logs.test.tsx tests/components/admin-patient-selector.test.tsx tests/components/admin-exercise-assigner.test.tsx`
Expected: FAIL

- [ ] **Step 3: Update `components/admin-chat-logs.tsx`**

Add the import:

```tsx
import { SkeletonRow } from "@/components/skeleton";
```

Replace `if (loading) return <p>Loading chat logs…</p>;` with:

```tsx
  if (loading) return <SkeletonRow count={4} />;
```

- [ ] **Step 4: Update `components/admin-patient-selector.tsx`**

Add the import:

```tsx
import { SkeletonRow } from "@/components/skeleton";
```

Add a `loaded` flag:

```tsx
export function AdminPatientSelector({ onSelect }: Props) {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [personOptions, setPersonOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!db) { setLoaded(true); return; }
    getDocs(collection(db, "patients")).then((snap) => {
      setPatients(
        snap.docs.map((d) => ({
          uid: d.id,
          displayName: (d.data().displayName as string) || "Unnamed",
          email: (d.data().email as string) || "",
        }))
      );
      setLoaded(true);
    });
  }, []);
```

Insert a skeleton return right after the `filtered` computation, before the main `return (`:

```tsx
  if (!loaded) {
    return (
      <div className="panel stack">
        <h3>Select patient</h3>
        <SkeletonRow count={4} />
      </div>
    );
  }

  return (
```

- [ ] **Step 5: Update `components/admin-exercise-assigner.tsx`**

Add the import:

```tsx
import { SkeletonRow } from "@/components/skeleton";
```

Add a `loaded` flag:

```tsx
export function AdminExerciseAssigner({ adminUid, patientUid, personId }: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setLoaded(false);
    getAssignedExercises(patientUid, personId).then((a) => {
      setAssigned(a);
      setLoaded(true);
    });
  }, [patientUid, personId]);
```

Insert a skeleton return right after the `exerciseMap` computation, before the main `return (`:

```tsx
  if (!loaded) {
    return (
      <div className="panel stack">
        <h3>Assigned exercises</h3>
        <SkeletonRow count={2} />
      </div>
    );
  }

  return (
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/components/admin-chat-logs.test.tsx tests/components/admin-patient-selector.test.tsx tests/components/admin-exercise-assigner.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 7: Commit**

```bash
git add components/admin-chat-logs.tsx components/admin-patient-selector.tsx components/admin-exercise-assigner.tsx tests/components/admin-chat-logs.test.tsx tests/components/admin-patient-selector.test.tsx tests/components/admin-exercise-assigner.test.tsx
git commit -m "fix: replace blank/immediate-empty loading states with SkeletonRow in admin chat logs, patient selector, exercise assigner"
```

---

### Task 19: Fix `app/patient/account/page.tsx` returning `null` — add full-page skeleton shell

**Files:**
- Modify: `app/patient/account/page.tsx`
- Test: `tests/app/patient-account.test.tsx`

**Interfaces:**
- Consumes: `SkeletonForm`, `SkeletonRow`, `Skeleton` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing test**

Create `tests/app/patient-account.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => () => {}),
  signOut: vi.fn(),
}))
vi.mock('@/components/patient-profile-editor', () => ({ PatientProfileEditor: () => null }))
vi.mock('@/components/rehab-programs-section', () => ({ RehabProgramsSection: () => null }))
vi.mock('@/components/saved-blogs-section', () => ({ SavedBlogsSection: () => null }))
vi.mock('@/components/upload-panel', () => ({ UploadPanel: () => null }))

import AccountPage from '@/app/patient/account/page'

describe('AccountPage', () => {
  it('renders a skeleton shell instead of nothing before auth resolves', () => {
    const { container } = render(<AccountPage />)
    expect(container.querySelector('.skeleton, .skeleton-form, .skeleton-row-group')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app/patient-account.test.tsx`
Expected: FAIL (component currently returns `null` — `container` is empty)

- [ ] **Step 3: Update `app/patient/account/page.tsx`**

Add the import:

```tsx
import { Skeleton, SkeletonForm, SkeletonRow } from "@/components/skeleton";
```

Replace `if (!uid) return null;` with a skeleton shell matching the loaded layout (user card, quick-link pills, profile editor, list sections):

```tsx
  if (!uid) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}>
          <Skeleton height="1.5rem" width="160px" className="skeleton-heading" />
          <div style={{ marginTop: "0.5rem" }}>
            <Skeleton height="0.9rem" width="220px" />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
          <Skeleton height="2.4rem" width="140px" className="skeleton-pill" />
          <Skeleton height="2.4rem" width="160px" className="skeleton-pill" />
        </div>
        <div style={{ marginBottom: "2rem" }}>
          <SkeletonForm fields={3} />
        </div>
        <div style={{ marginBottom: "2rem" }}>
          <SkeletonRow count={2} />
        </div>
        <div>
          <SkeletonRow count={2} />
        </div>
      </div>
    );
  }
```

- [ ] **Step 4: Add a `.skeleton-pill` rounding rule to `app/globals.css`** (append near the skeleton primitive CSS from Task 9)

```css
.skeleton-pill {
  border-radius: 999px !important;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/app/patient-account.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/patient/account/page.tsx app/globals.css tests/app/patient-account.test.tsx
git commit -m "fix: patient account page shows a skeleton shell instead of returning null"
```

---

### Task 20: Fix `HomeHeroSection` content-flash — skeleton hero during auth resolution

**Files:**
- Modify: `components/home-hero-section.tsx`
- Test: `tests/components/home-hero-section.test.tsx`

**Interfaces:**
- Consumes: `SkeletonStatGrid`, `Skeleton` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing test**

Create `tests/components/home-hero-section.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null }))
vi.mock('@/components/toast-provider', () => ({ useToast: () => ({ show: vi.fn() }) }))
vi.mock('@/components/home-dashboard', () => ({ HomeDashboard: () => <div>Dashboard</div> }))

import { HomeHeroSection } from '@/components/home-hero-section'

describe('HomeHeroSection', () => {
  it('shows a skeleton hero while auth is resolving, not the signed-out marketing hero', () => {
    render(<HomeHeroSection founderName="Jane" />)
    expect(screen.queryByText('Expert Physiotherapy,')).not.toBeInTheDocument()
    expect(document.querySelector('.skeleton-hero')).toBeInTheDocument()
  })
})
```

Note: with `auth: null`, `onAuthStateChanged` never fires, so this reproduces the "still resolving" state indefinitely — exactly the window where the content-flash bug lives today.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/home-hero-section.test.tsx`
Expected: FAIL (currently renders the full signed-out marketing hero, including "Expert Physiotherapy,")

- [ ] **Step 3: Update `components/home-hero-section.tsx`**

Add the import:

```tsx
import { Skeleton, SkeletonStatGrid } from "@/components/skeleton";
```

Change `user` state to a three-way resolution and add a `resolvedAuth` flag:

```tsx
export function HomeHeroSection({ founderName }: { founderName: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [resolvedAuth, setResolvedAuth] = useState(false);
  const { show } = useToast();
  const welcomedRef = useRef(false);

  useEffect(() => {
    if (!auth) {
      setResolvedAuth(true);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setResolvedAuth(true);
      setUser(u);
      if (u && !welcomedRef.current) {
        welcomedRef.current = true;
        show(`Welcome back, ${u.displayName?.split(' ')[0] || 'there'}!`, 'info');
      }
    });
  }, [show]);

  if (!resolvedAuth) {
    return (
      <section className="home-hero home-hero-skeleton">
        <div className="site-shell home-hero-content skeleton-hero">
          <Skeleton height="1.2rem" width="220px" className="skeleton-pill" />
          <div style={{ margin: "1rem 0" }}>
            <Skeleton height="2.5rem" width="80%" />
          </div>
          <SkeletonStatGrid count={2} />
        </div>
      </section>
    );
  }

  if (user) {
    return <HomeDashboard user={user} />;
  }
```

(keep the rest of the file — the signed-out marketing hero JSX — unchanged below this point)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/home-hero-section.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/home-hero-section.tsx tests/components/home-hero-section.test.tsx
git commit -m "fix: HomeHeroSection shows a skeleton hero instead of flashing signed-out content"
```

---

### Task 21: Wire skeletons into appointments pages and `BookAuthGate`

**Files:**
- Modify: `app/patient/appointments/page.tsx`
- Modify: `app/patient/appointments/[id]/page.tsx`
- Modify: `components/book-auth-gate.tsx`
- Test: `tests/app/appointments.test.tsx`
- Test: `tests/app/appointment-detail.test.tsx`
- Test: `tests/components/book-auth-gate.test.tsx`

**Interfaces:**
- Consumes: `SkeletonRow`, `SkeletonForm` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing tests**

Create `tests/app/appointments.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => () => {}),
}))
vi.mock('@/lib/patient-bookings', () => ({ getPatientBookings: vi.fn() }))

import AppointmentsPage from '@/app/patient/appointments/page'

describe('AppointmentsPage', () => {
  it('shows SkeletonRow while loading', () => {
    const { container } = render(<AppointmentsPage />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()
  })
})
```

Create `tests/app/appointment-detail.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'b1' }) }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => () => {}),
}))
vi.mock('@/lib/patient-bookings', () => ({ getBooking: vi.fn() }))
vi.mock('@/lib/session-summaries', () => ({ getSessionSummary: vi.fn() }))

import AppointmentDetailPage from '@/app/patient/appointments/[id]/page'

describe('AppointmentDetailPage', () => {
  it('shows a skeleton row while loading instead of plain "Loading…" text', () => {
    const { container } = render(<AppointmentDetailPage />)
    expect(container.querySelector('.skeleton-row-group')).toBeInTheDocument()
  })
})
```

Create `tests/components/book-auth-gate.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null }))
vi.mock('@/components/auth-panel', () => ({ AuthPanel: () => null }))
vi.mock('@/components/cal-embed', () => ({ CalEmbed: () => null }))

import { BookAuthGate } from '@/components/book-auth-gate'

describe('BookAuthGate', () => {
  it('shows a SkeletonForm while checking the account', () => {
    const { container } = render(<BookAuthGate />)
    expect(container.querySelector('.skeleton-form')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/app/appointments.test.tsx tests/app/appointment-detail.test.tsx tests/components/book-auth-gate.test.tsx`
Expected: FAIL

- [ ] **Step 3: Update `app/patient/appointments/page.tsx`**

Add the import:

```tsx
import { SkeletonRow } from "@/components/skeleton";
```

Replace `{loading && <p style={{ color: "#5E7A84" }}>Loading…</p>}` with:

```tsx
      {loading && <SkeletonRow count={3} />}
```

- [ ] **Step 4: Update `app/patient/appointments/[id]/page.tsx`**

Add the import:

```tsx
import { SkeletonRow } from "@/components/skeleton";
```

Replace:

```tsx
  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "3rem 1rem" }}>
        Loading…
      </div>
    );
  }
```

with:

```tsx
  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "3rem 1rem" }}>
        <SkeletonRow count={1} />
      </div>
    );
  }
```

- [ ] **Step 5: Update `components/book-auth-gate.tsx`**

Add the import:

```tsx
import { SkeletonForm } from "@/components/skeleton";
```

Replace `return <p className="muted">Checking your account…</p>;` with:

```tsx
    return (
      <div className="book-auth-gate">
        <SkeletonForm fields={2} />
      </div>
    );
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/app/appointments.test.tsx tests/app/appointment-detail.test.tsx tests/components/book-auth-gate.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 7: Commit**

```bash
git add app/patient/appointments/page.tsx "app/patient/appointments/[id]/page.tsx" components/book-auth-gate.tsx tests/app/appointments.test.tsx tests/app/appointment-detail.test.tsx tests/components/book-auth-gate.test.tsx
git commit -m "fix: replace loading text with skeleton primitives in appointments pages and BookAuthGate"
```

---

### Task 22: Wire skeletons into `app/admin/recovery/page.tsx`

**Files:**
- Modify: `app/admin/recovery/page.tsx`
- Test: `tests/app/admin-recovery.test.tsx`

**Interfaces:**
- Consumes: `SkeletonChart`, `SkeletonRow` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing test**

Create `tests/app/admin-recovery.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null }))
vi.mock('@/lib/admin-auth', () => ({ isAdminUser: vi.fn() }))

import AdminRecoveryPage from '@/app/admin/recovery/page'

describe('AdminRecoveryPage', () => {
  it('shows a skeleton instead of "Checking admin access…" text', () => {
    const { container } = render(<AdminRecoveryPage />)
    expect(container.querySelector('.skeleton-row-group, .skeleton-chart')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app/admin-recovery.test.tsx`
Expected: FAIL (current state is plain `<p className="muted">Checking admin access…</p>`)

- [ ] **Step 3: Update `app/admin/recovery/page.tsx`**

Add the import:

```tsx
import { SkeletonChart, SkeletonRow } from "@/components/skeleton";
```

Replace:

```tsx
  if (!checkedAdmin) {
    return (
      <div className="site-shell">
        <section className="page-section stack">
          <p className="muted">Checking admin access…</p>
        </section>
      </div>
    );
  }
```

with:

```tsx
  if (!checkedAdmin) {
    return (
      <div className="site-shell">
        <section className="page-section dashboard-grid">
          <SkeletonRow count={4} />
          <SkeletonChart height={260} />
        </section>
      </div>
    );
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/app/admin-recovery.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/admin/recovery/page.tsx tests/app/admin-recovery.test.tsx
git commit -m "fix: replace admin-access-check text with skeleton in admin recovery page"
```

---

### Task 23: Wire `SkeletonCard`-style grid into `app/patient/people/page.tsx`

**Files:**
- Modify: `app/patient/people/page.tsx`
- Test: `tests/app/patient-people.test.tsx`

**Interfaces:**
- Consumes: `Skeleton`, `SkeletonCircle` from `@/components/skeleton` (Task 9) — person cards are composed inline from these two primitives since no dedicated `SkeletonCard` primitive is needed for a single usage site (YAGNI: `Skeleton` + `SkeletonCircle` already cover it).

- [ ] **Step 1: Write the failing test**

Create `tests/app/patient-people.test.tsx`:

```tsx
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((_auth, cb) => {
    cb({ uid: 'u1', displayName: 'Jane', email: 'jane@example.com' });
    return () => {};
  }),
}))

const getDependentsMock = vi.fn()
vi.mock('@/lib/dependents', () => ({
  getDependents: (...args: unknown[]) => getDependentsMock(...args),
  addDependent: vi.fn(),
  updateDependent: vi.fn(),
  deleteDependent: vi.fn(),
}))

import PeoplePage from '@/app/patient/people/page'

describe('PeoplePage', () => {
  it('shows skeleton person cards while dependents are loading', async () => {
    let resolveDeps: (v: unknown[]) => void = () => {}
    getDependentsMock.mockReturnValue(new Promise((resolve) => { resolveDeps = resolve }))

    const { container } = render(<PeoplePage />)
    expect(container.querySelectorAll('.skeleton-person-card').length).toBeGreaterThan(0)

    resolveDeps([])
    await waitFor(() => {
      expect(container.querySelectorAll('.skeleton-person-card').length).toBe(0)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app/patient-people.test.tsx`
Expected: FAIL (dependents grid pops in with no loading indicator today)

- [ ] **Step 3: Update `app/patient/people/page.tsx`**

Add the import:

```tsx
import { Skeleton, SkeletonCircle } from "@/components/skeleton";
```

Add a `dependentsLoaded` flag:

```tsx
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [dependentsLoaded, setDependentsLoaded] = useState(false);
```

In the `onAuthStateChanged` callback, chain the loaded flag onto the `getDependents` call:

```tsx
      setUid(u.uid);
      setCurrentName(u.displayName || "You");
      setCurrentEmail(u.email || "");
      getDependents(u.uid).then((deps) => {
        setDependents(deps);
        setDependentsLoaded(true);
      });
```

Also set it after `handleAdd`, `handleSave`, and `handleDelete` re-fetch (they already call `setDependents(await getDependents(uid))` — no change needed there since `dependentsLoaded` is already `true` by the time a user can trigger those actions).

Insert a skeleton-card grid before the "Dependents" `.map(...)` block, gated on `!dependentsLoaded`:

```tsx
        {/* Dependents */}
        {!dependentsLoaded &&
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} style={cardStyle} className="skeleton-person-card">
              <SkeletonCircle size="52px" />
              <div style={{ flex: 1 }}>
                <Skeleton height="1em" width="140px" />
                <div style={{ marginTop: "0.4rem" }}>
                  <Skeleton height="0.8em" width="180px" />
                </div>
              </div>
            </div>
          ))}

        {dependentsLoaded &&
          dependents.map((dep) =>
```

(the existing `dependents.map((dep) => editingId === dep.id ? (...) : (...))` ternary body is unchanged — only the opening condition changes from `dependents.map((dep) =>` to being wrapped in `dependentsLoaded &&`)

Update the final empty-state condition from `{dependents.length === 0 && !showForm && (` to also require the loaded flag:

```tsx
        {dependentsLoaded && dependents.length === 0 && !showForm && (
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/app/patient-people.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/patient/people/page.tsx tests/app/patient-people.test.tsx
git commit -m "fix: show skeleton person cards in people page while dependents load"
```

---

### Task 24: Replace ring spinners with a branded pulse shell in `AdminAuthGate` and `AdminChatLogsGate`

**Files:**
- Modify: `components/admin-auth-gate.tsx`
- Modify: `components/admin-chat-logs-gate.tsx`
- Test: `tests/components/admin-auth-gate.test.tsx`
- Test: `tests/components/admin-chat-logs-gate.test.tsx`

**Interfaces:**
- Consumes: `SkeletonStatGrid` from `@/components/skeleton` (Task 9)

- [ ] **Step 1: Write the failing tests**

Create `tests/components/admin-auth-gate.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: null }))
vi.mock('@/lib/admin-auth', () => ({ isAdminUser: vi.fn() }))
vi.mock('@/components/admin-sign-in', () => ({ AdminSignIn: () => null }))
vi.mock('@/components/admin-dashboard', () => ({ AdminDashboard: () => null }))

import { AdminAuthGate } from '@/components/admin-auth-gate'

describe('AdminAuthGate', () => {
  it('shows a branded skeleton pulse instead of a spinner while resolving', () => {
    const { container } = render(<AdminAuthGate />)
    expect(container.querySelector('.skeleton-stat-grid')).toBeInTheDocument()
    expect(container.querySelector('[style*="border-top-color"]')).not.toBeInTheDocument()
  })
})
```

Note: with `auth: null`, the gate's `if (!auth) { setStatus("out"); return; }` guard fires synchronously, so this test needs `auth` to be a truthy object whose `onAuthStateChanged` never resolves, to actually observe the `"loading"` state. Use this mock instead:

```tsx
vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => () => {}),
  signOut: vi.fn(),
}))
```

Replace the `vi.mock('@/lib/firebase', ...)` line in the test above with both of these mocks.

Create `tests/components/admin-chat-logs-gate.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => () => {}),
  signOut: vi.fn(),
}))
vi.mock('@/components/admin-sign-in', () => ({ AdminSignIn: () => null }))
vi.mock('@/components/admin-chat-logs', () => ({ AdminChatLogs: () => null }))

import { AdminChatLogsGate } from '@/components/admin-chat-logs-gate'

describe('AdminChatLogsGate', () => {
  it('shows a branded skeleton pulse instead of a spinner while resolving', () => {
    const { container } = render(<AdminChatLogsGate />)
    expect(container.querySelector('.skeleton-stat-grid')).toBeInTheDocument()
    expect(container.querySelector('[style*="border-top-color"]')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/admin-auth-gate.test.tsx tests/components/admin-chat-logs-gate.test.tsx`
Expected: FAIL (both currently render the ring-spinner `<div>` with `borderTopColor`)

- [ ] **Step 3: Update `components/admin-auth-gate.tsx`**

Add the import:

```tsx
import { SkeletonStatGrid } from "@/components/skeleton";
```

Replace the `status === "loading"` branch:

```tsx
  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-navy)" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid var(--color-spinner-track)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
```

with:

```tsx
  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-navy)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 640, background: "var(--color-surface)", borderRadius: 20, padding: "2rem", boxShadow: "var(--shadow-card)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--gradient-primary)", marginBottom: "1.5rem" }} />
          <SkeletonStatGrid count={4} />
        </div>
      </div>
    );
  }
```

- [ ] **Step 4: Update `components/admin-chat-logs-gate.tsx`**

Apply the identical replacement (same `status === "loading"` block, same before/after code as Step 3) to `components/admin-chat-logs-gate.tsx`, plus add the same import:

```tsx
import { SkeletonStatGrid } from "@/components/skeleton";
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/components/admin-auth-gate.test.tsx tests/components/admin-chat-logs-gate.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add components/admin-auth-gate.tsx components/admin-chat-logs-gate.tsx tests/components/admin-auth-gate.test.tsx tests/components/admin-chat-logs-gate.test.tsx
git commit -m "feat: replace ring spinners with branded skeleton pulse shell in admin gates"
```

---

### Task 25: Final full-tree verification and CLAUDE.md update

**Files:**
- Modify: `CLAUDE.md` (Commands section — add `npm test`, per the standing correction that the doc omits the real Vitest suite)

**Interfaces:** None — this is a verification + doc-hygiene task, no new code.

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:run`
Expected: all tests pass (existing 20 + every test added in Tasks 2–24)

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: build succeeds with no type errors

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no errors (warnings acceptable if pre-existing)

- [ ] **Step 4: Grep for any remaining `--color-teal` or bare "Loading…" text left over from the audit**

Run: `grep -rn -- "--color-teal" app/ components/ ; grep -rln "Loading…" app/ components/`
Expected: no `--color-teal` matches; any remaining "Loading…" matches should be reviewed against the Section 4 mapping table in the design spec to confirm they're genuinely out of scope (e.g. inside `node_modules` or unrelated copy, not a missed async loading state)

- [ ] **Step 5: Update `CLAUDE.md`'s Commands section**

Add this line to the `## Commands` code block in `CLAUDE.md` (docs cleanup, unrelated to this feature but a one-line fix noticed during planning):

```bash
npm test            # run the Vitest suite (npm run test:run for a single non-watch run)
```

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document npm test in CLAUDE.md Commands section"
```

---

## Self-Review Notes

- **Spec coverage:** Section 1 (color tokens) → Task 1. Section 2 (GSAP architecture) → Tasks 2–5. Section 3 (notification redesign) → Tasks 6–8. Section 4 (skeleton coverage, all 24 audited files + the "no change needed" list respected) → Tasks 9–24, including all three flagged bugs (`admin-live-stats` fake data → Task 16, `patient/account` returns `null` → Task 19, `home-hero-section` content-flash → Task 20).
- **Type consistency:** `SkeletonRow`, `SkeletonTable`, `SkeletonChart`, `SkeletonStatGrid`, `SkeletonForm`, `SkeletonText`, `SkeletonCircle` signatures defined once in Task 9 and used identically (same prop names) in every consuming task. `useGSAP` and `gsap`/`ScrollTrigger` import paths (`@/hooks/use-gsap-timeline`, `@/lib/gsap`) are consistent across Tasks 4–8.
- **Scope check:** 25 tasks across 4 phases, each independently testable and committable. This is a large plan matching the large, explicitly-approved scope (full GSAP upgrade + all-screens skeleton coverage + notification redesign, one combined spec). Phases 1–3 can ship and be verified before starting Phase 4 if the executor wants an earlier checkpoint.
