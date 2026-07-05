# UI Animation Polish — Design Spec

**Date:** 2026-07-05
**Scope:** Full animation and interaction polish for the PhysioOnClick web app — navigation, scroll-reveal system, micro-interactions, page transitions.

---

## Goals

1. Make the header feel premium — blur + shadow on scroll, no layout shift.
2. Add a proper mobile nav with hamburger menu and slide-down panel.
3. Introduce scroll-triggered reveal animations across all public pages.
4. Add button lift/shimmer and card hover micro-interactions.
5. Smooth page-to-page navigation with View Transitions API.
6. Respect `prefers-reduced-motion` throughout.

---

## Architecture

No new animation libraries. Pure CSS + IntersectionObserver + View Transitions API.

**New files:**
- `hooks/use-in-view.ts` — IntersectionObserver hook
- `components/reveal.tsx` — scroll-reveal wrapper component
- `components/scroll-reset.tsx` — scroll-to-top on route change

**Modified files:**
- `components/site-header.tsx` — scroll detection, hamburger menu, sliding active indicator
- `app/globals.css` — scroll-reveal utility classes, button/card micro-interaction styles, mobile nav styles, view transition keyframes
- `app/layout.tsx` — add `<ScrollReset />`, enable View Transitions on `<Link>` components (or via next.config)
- Public pages: `app/page.tsx`, `app/about/page.tsx`, `app/services/page.tsx`, `app/pricing/page.tsx`, `app/contact/page.tsx`, `app/blog/page.tsx` — wrap key sections in `<Reveal>`

---

## Section 1: Navigation Redesign

### Header scroll behaviour

`site-header.tsx` adds `useEffect` + `useState` to detect `window.scrollY > 20`. When scrolled, applies class `.header-wrap--scrolled` to the header element.

```css
.header-wrap {
  transition: background-color 250ms ease, box-shadow 250ms ease, backdrop-filter 250ms ease;
}
.header-wrap--scrolled {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 2px 20px rgba(13, 27, 42, 0.08);
}
```

Before scroll: flat white, no shadow (exactly as today). The change is invisible until the user moves.

### Active nav sliding underline

Replace the static `.active` background pill with a 2px teal underline that animates position. Each nav link gets `position: relative`. The `.active` class adds:

```css
.simple-nav-links a.active::after {
  content: "";
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  border-radius: 2px;
  background: var(--color-teal);
  transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.simple-nav-links a:hover::after {
  content: "";
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 2px;
  border-radius: 2px;
  background: var(--color-teal);
  opacity: 0.4;
}
```

The background highlight on `.active` is removed. The underline replaces it. Cleaner, more modern.

### Mobile hamburger menu

On screens ≤ 768px:
- All existing nav links and action buttons are hidden (`display: none`).
- A hamburger `<button>` appears in the top-right of the header (3 horizontal bars, 24px, navy).
- State: `menuOpen: boolean` in `site-header.tsx`.

**Hamburger icon:** Three `<span>` bars. When `menuOpen=true`, top bar rotates 45°, middle bar fades out, bottom bar rotates -45° — forming an `✕`. Transition: 250ms ease.

**Slide-down panel:**
```css
.mobile-nav-panel {
  position: fixed;
  top: 64px; /* header height */
  left: 0;
  right: 0;
  background: white;
  z-index: 39;
  border-bottom: 1px solid var(--line);
  box-shadow: 0 8px 32px rgba(13, 27, 42, 0.12);
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  /* Animated open/close */
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition: opacity 300ms ease, transform 300ms ease;
}
.mobile-nav-panel.open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
```

Each nav link inside the panel: full width, 48px min-height, `font-size: 1.1rem`, teal on active.

A "Book Now" teal filled button renders at the bottom of the panel.

**Backdrop overlay:**
```css
.mobile-nav-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(13, 27, 42, 0.3);
  z-index: 38;
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms ease;
}
.mobile-nav-backdrop.open {
  opacity: 1;
  pointer-events: auto;
}
```

Clicking the backdrop sets `menuOpen = false`. `Escape` key also closes the menu. Menu closes on route change (`usePathname` effect).

---

## Section 2: Scroll-Reveal Animation System

### `hooks/use-in-view.ts`

```ts
import { useEffect, useRef, useState } from "react";

export function useInView(options: IntersectionObserverInit = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView] as const;
}
```

Fires once (`observer.disconnect()` on first trigger). Threshold 0.15 = element is 15% visible.

### `components/reveal.tsx`

```tsx
"use client";
import { useInView } from "@/hooks/use-in-view";

type Direction = "up" | "down" | "left" | "right" | "fade";

interface RevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;       // ms, e.g. 0 | 75 | 150 | 225
  duration?: number;    // ms, default 600
  className?: string;
}

export function Reveal({ children, direction = "up", delay = 0, duration = 600, className }: RevealProps) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={[
        "reveal",
        `reveal-${direction}`,
        inView ? "in-view" : "",
        className,
      ].filter(Boolean).join(" ")}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
```

### CSS utility classes in `globals.css`

```css
/* Scroll-reveal base */
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

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .reveal, .reveal-up, .reveal-down, .reveal-left, .reveal-right, .reveal-fade {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

### Pages where `<Reveal>` is applied

**`app/page.tsx` (Home):**
- Hero copy block: `<Reveal direction="up">`
- Each proof/stat card: `<Reveal direction="up" delay={i * 75}>` (staggered)
- Services teaser section heading: `<Reveal direction="up">`
- Service cards: staggered `delay={i * 75}`
- Trust bar: `<Reveal direction="fade">`

**`app/services/page.tsx`:**
- Section headings: `<Reveal direction="up">`
- Service cards: alternating `left`/`right` or staggered `up`

**`app/pricing/page.tsx`:**
- Pricing cards: `<Reveal direction="up" delay={i * 100}>` with slight scale (CSS only)

**`app/about/page.tsx`:**
- Profile card: `<Reveal direction="left">`
- Story copy: `<Reveal direction="right">`
- Stat counters: staggered `up`

**`app/contact/page.tsx`:**
- Form: `<Reveal direction="up">`
- Info cards: staggered `up`

**`app/blog/page.tsx`:**
- Article cards: staggered `<Reveal direction="up" delay={i * 60}>`

---

## Section 3: Micro-interactions + Page Transitions

### Button micro-interactions (CSS only)

**Primary button lift + shimmer:**
```css
.button.primary {
  position: relative;
  overflow: hidden;
}
.button.primary::after {
  content: "";
  position: absolute;
  top: 0; left: -75%;
  width: 50%; height: 100%;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.28) 50%, transparent 60%);
  transform: skewX(-15deg);
  transition: left 0s;
}
.button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(11, 110, 142, 0.35);
}
.button.primary:hover::after {
  left: 125%;
  transition: left 400ms ease;
}
.button.primary:active {
  transform: translateY(0);
  box-shadow: none;
}
```

**Secondary button:**
```css
.button.secondary:hover {
  border-color: var(--color-teal);
  color: var(--color-teal);
}
```

**CTA text links (`.call-link`):**
```css
.call-link {
  position: relative;
}
.call-link::after {
  content: "";
  position: absolute;
  bottom: -1px; left: 0;
  width: 0; height: 1px;
  background: var(--color-teal);
  transition: width 200ms ease;
}
.call-link:hover::after { width: 100%; }
```

### Card micro-interactions

All cards (`.simple-card`, `.service-card`, `.pricing-card`, `.blog-card`, `.info-card`) get a standardised hover:
```css
[class*="-card"]:not(.no-hover) {
  transition: transform 200ms ease, box-shadow 200ms ease;
}
[class*="-card"]:not(.no-hover):hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(13, 27, 42, 0.10);
}
```

### Page transitions — View Transitions API

Add to `next.config.ts`:
```ts
experimental: { viewTransition: true }
```

Add to `app/globals.css`:
```css
@keyframes vt-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}
::view-transition-new(root) {
  animation: vt-fade-up 220ms ease;
}
::view-transition-old(root) {
  animation: none; /* old page snaps out cleanly */
}
@media (prefers-reduced-motion: reduce) {
  ::view-transition-new(root), ::view-transition-old(root) { animation: none; }
}
```

All `<Link>` components in `site-header.tsx` and primary CTAs get the `viewTransition` prop.

### `components/scroll-reset.tsx`

```tsx
"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollReset() {
  const pathname = usePathname();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  return null;
}
```

Added to `app/layout.tsx` inside `<body>` before `<SiteHeader />`.

---

## Out of Scope

- Parallax scrolling (requires JS scroll listeners on every frame — performance risk)
- Animated number counters on stat cards (nice-to-have, separate spec)
- Lottie / SVG path animations
- Any changes to mobile app (Flutter)
