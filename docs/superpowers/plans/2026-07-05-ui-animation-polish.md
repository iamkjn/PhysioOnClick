# UI Animation Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add premium animation polish to the PhysioOnClick web app: scroll-aware header, hamburger mobile nav, scroll-reveal system across all public pages, button shimmer + card hover micro-interactions, and View Transitions for page changes.

**Architecture:** Pure CSS + React hooks — no new npm packages. A reusable `<Reveal>` client component wraps content on server-rendered pages using IntersectionObserver. The header stays a single client component; scroll state and menu state live in `useState`. View Transitions are enabled via Next.js 15's `experimental.viewTransition` config flag and the `viewTransition` prop on `<Link>`.

**Tech Stack:** Next.js 15.5 (App Router), React 19, CSS custom properties (existing design tokens), IntersectionObserver API, View Transitions API.

## Global Constraints

- No new npm packages — pure CSS + built-in browser APIs only
- All animations must respect `prefers-reduced-motion: reduce` (disabled in that media query)
- Design tokens to use verbatim: `--color-navy` (#0D1B2A), `--color-teal` (#0B6E8E), `--color-teal-light` (#E6F3F8), `--color-border` / `--line`, `--color-text-secondary` / `--muted`, `--font-sans`, `--font-serif`
- Header z-index is currently 40; mobile nav panel must be z-index 39, backdrop z-index 38 (below header)
- Do not modify any file under `app/admin/`, `app/patient/`, `app/api/`, or `mobile_app/`
- Do not touch `components/home-hero-section.tsx` — it is a complex client component with its own animation; skip it for Reveal
- Dev server: `npm run dev` (http://localhost:3000). No test suite exists — all verification is visual in the browser

---

## File Map

**New files:**
- `hooks/use-in-view.ts` — IntersectionObserver hook, fires once, threshold 0.15
- `components/reveal.tsx` — scroll-reveal wrapper, "use client", renders a `<div>` with CSS classes
- `components/scroll-reset.tsx` — scroll-to-top on pathname change, "use client"

**Modified files:**
- `components/site-header.tsx` — add scroll detection, hamburger menu, active underline, viewTransition on Links
- `app/globals.css` — append new CSS blocks across tasks (never delete existing rules unless specified)
- `next.config.mjs` — add `experimental: { viewTransition: true }`
- `app/layout.tsx` — add `<ScrollReset />`
- `app/page.tsx` — wrap sections in `<Reveal>`
- `app/about/page.tsx` — wrap sections in `<Reveal>`
- `app/services/page.tsx` — wrap service cards in `<Reveal>`
- `app/pricing/page.tsx` — wrap pricing cards in `<Reveal>`
- `app/contact/page.tsx` — wrap sections in `<Reveal>`
- `app/blog/page.tsx` — wrap `<BlogDirectory>` in `<Reveal>`

---

### Task 1: Navigation Redesign

**Files:**
- Modify: `components/site-header.tsx` (full rewrite)
- Modify: `app/globals.css` (append ~80 lines of new CSS at the end; also edit two existing rules)

**Interfaces:**
- Produces: `SiteHeader` component with `scrolled` and `menuOpen` state, `.hamburger`, `.mobile-nav-panel`, `.mobile-nav-backdrop` CSS classes
- Consumed by: `app/layout.tsx` (already wired — no layout change needed this task)

- [ ] **Step 1: Open `components/site-header.tsx` and read its current contents**

The file is currently 52 lines. You will replace it entirely. Note the existing `navItems` array and `isActive()` logic — keep them verbatim.

- [ ] **Step 2: Replace `components/site-header.tsx` with the new implementation**

Write this exact file:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/book", label: "Book" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={`header-wrap simple-header${scrolled ? " header-wrap--scrolled" : ""}`}>
        <div className="site-shell">
          <div className="nav-row simple-nav">
            <Link className="brand simple-brand" href="/" viewTransition>
              <span className="brand-mark">P</span>
              <div>
                <strong>PhysioOnClick</strong>
              </div>
            </Link>
            <nav className="simple-nav-links" aria-label="Primary">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className={isActive(item.href) ? "active" : undefined}
                  href={item.href}
                  viewTransition
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="nav-actions simple-nav-actions">
              <Link className="call-link" href="/contact" viewTransition>
                Contact Us
              </Link>
              <Link className="button primary small" href="/book" viewTransition>
                Book Now
              </Link>
            </div>
            <button
              className={`hamburger${menuOpen ? " hamburger--open" : ""}`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`mobile-nav-backdrop${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <nav
        className={`mobile-nav-panel${menuOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-link${isActive(item.href) ? " active" : ""}`}
            onClick={() => setMenuOpen(false)}
            viewTransition
          >
            {item.label}
          </Link>
        ))}
        <Link
          className="button primary mobile-nav-book"
          href="/book"
          onClick={() => setMenuOpen(false)}
          viewTransition
        >
          Book Now
        </Link>
      </nav>
    </>
  );
}
```

- [ ] **Step 3: Edit the existing `.simple-nav-links a.active` rule in `app/globals.css`**

Find this block (around line 179):
```css
.simple-nav-links a.active {
  background: var(--surface-alt);
  color: var(--ink);
}
```

Change `background: var(--surface-alt)` to `background: transparent`:
```css
.simple-nav-links a.active {
  background: transparent;
  color: var(--ink);
}
```

- [ ] **Step 4: Append the navigation CSS to the end of `app/globals.css`**

Add this entire block at the very end of the file:

```css
/* ─────────────────────────────────────────────────────────────
   Navigation: scroll-aware header
   ──────────────────────────────────────────────────────────── */
.header-wrap {
  transition: background-color 250ms ease, box-shadow 250ms ease;
}
.header-wrap--scrolled {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 2px 20px rgba(13, 27, 42, 0.08);
  border-bottom-color: transparent;
}

/* ─────────────────────────────────────────────────────────────
   Navigation: active link underline (replaces background pill)
   ──────────────────────────────────────────────────────────── */
.simple-nav-links a::after {
  content: "";
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  height: 2px;
  border-radius: 2px;
  background: var(--color-teal);
  width: 0;
  opacity: 0;
  transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease;
}
.simple-nav-links a:hover::after {
  width: 16px;
  opacity: 0.4;
}
.simple-nav-links a.active::after {
  width: 20px;
  opacity: 1;
}

/* ─────────────────────────────────────────────────────────────
   Navigation: hamburger button
   ──────────────────────────────────────────────────────────── */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}
.hamburger span {
  display: block;
  width: 22px;
  height: 2px;
  border-radius: 2px;
  background: var(--color-navy);
  transition: transform 250ms ease, opacity 250ms ease;
  transform-origin: center;
}
.hamburger--open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger--open span:nth-child(2) { opacity: 0; }
.hamburger--open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ─────────────────────────────────────────────────────────────
   Navigation: mobile nav panel + backdrop
   ──────────────────────────────────────────────────────────── */
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
.mobile-nav-panel {
  position: fixed;
  top: 65px;
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
.mobile-nav-link {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 0.75rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--muted);
  border-radius: 10px;
  transition: background-color 120ms ease, color 120ms ease;
}
.mobile-nav-link:hover,
.mobile-nav-link.active {
  background: var(--color-teal-light);
  color: var(--color-teal);
}
.mobile-nav-book {
  margin-top: 0.75rem;
  justify-content: center;
}

@media (max-width: 768px) {
  .simple-nav-links,
  .simple-nav-actions {
    display: none;
  }
  .hamburger {
    display: flex;
  }
}
```

- [ ] **Step 5: Run the dev server and verify in browser**

```bash
npm run dev
```

Open http://localhost:3000. Check all of the following:

1. **Desktop (> 768px):** Scroll down — header should get blur + shadow. Scroll back up — blur fades. Active nav link shows a 20px teal underline, no background. Hover shows 16px underline at lower opacity + teal-light background.
2. **Mobile (≤ 768px, or resize browser to < 768px):** Nav links and "Contact Us / Book Now" buttons are hidden. Hamburger (☰) appears top-right. Click it — panel slides down, backdrop fades in. Click a link — panel closes. Click backdrop — closes. Press Escape — closes. Navigate to a different page — panel closes.

- [ ] **Step 6: Commit**

```bash
git add components/site-header.tsx app/globals.css
git commit -m "feat(nav): scroll-aware header, hamburger mobile menu, active underline"
```

---

### Task 2: Scroll-Reveal System

**Files:**
- Create: `hooks/use-in-view.ts`
- Create: `components/reveal.tsx`
- Modify: `app/globals.css` (append ~30 lines)

**Interfaces:**
- Produces:
  - `useInView(options?): [ref: RefObject<HTMLDivElement>, inView: boolean]`
  - `<Reveal direction? delay? duration? className? style? children />` — renders a `<div>` with reveal classes; `inView` drives the `.in-view` class
- Consumed by: Task 3 (all public pages)

- [ ] **Step 1: Create `hooks/use-in-view.ts`**

Create this file:

```ts
import { useEffect, useRef, useState } from "react";

export function useInView(options: IntersectionObserverInit = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView] as const;
}
```

Key properties: threshold 0.15 (fires when 15% of element is visible), fires exactly once (`observer.disconnect()` on first trigger, cleanup on unmount).

- [ ] **Step 2: Create `components/reveal.tsx`**

Create this file:

```tsx
"use client";

import { CSSProperties } from "react";
import { useInView } from "@/hooks/use-in-view";

type Direction = "up" | "down" | "left" | "right" | "fade";

interface RevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 600,
  className,
  style,
}: RevealProps) {
  const [ref, inView] = useInView();

  return (
    <div
      ref={ref}
      className={[
        "reveal",
        `reveal-${direction}`,
        inView ? "in-view" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Append scroll-reveal CSS to `app/globals.css`**

Add this block at the very end of `app/globals.css`:

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

- [ ] **Step 4: Verify the component compiles**

```bash
npm run build 2>&1 | grep -E "error|Error|✓|✗" | head -30
```

Expected: build completes with no TypeScript errors. (The reveal classes won't be applied to any page yet — that's Task 3.)

- [ ] **Step 5: Commit**

```bash
git add hooks/use-in-view.ts components/reveal.tsx app/globals.css
git commit -m "feat(reveal): IntersectionObserver hook, Reveal component, scroll-reveal CSS"
```

---

### Task 3: Apply Reveal to Public Pages

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/about/page.tsx`
- Modify: `app/services/page.tsx`
- Modify: `app/pricing/page.tsx`
- Modify: `app/contact/page.tsx`
- Modify: `app/blog/page.tsx`

**Interfaces:**
- Consumes: `Reveal` from `@/components/reveal` (from Task 2)
- Import line to add at top of each page file: `import { Reveal } from "@/components/reveal";`

**Important note on CSS grid + Reveal:** `<Reveal>` renders a `<div>`. When this div is a direct child of a CSS grid container, it becomes the grid item. If the parent grid uses `align-items: stretch`, the div will stretch but the inner content won't automatically fill the height. For grids where cards must fill their grid cell (e.g. `about-overview-grid`), wrap the entire grid in a single `<Reveal>` rather than individual cards.

- [ ] **Step 1: Update `app/page.tsx`**

Read the current file, then replace with this (scroll-reveal applied to below-fold content only; `<HomeHeroSection>` is a complex animated client component — do NOT wrap it):

```tsx
import Image from "next/image";
import Link from "next/link";

import { founder } from "@/lib/site-data";
import { getPublicServices } from "@/lib/public-content";
import { HomeHeroSection } from "@/components/home-hero-section";
import { Reveal } from "@/components/reveal";

export default async function HomePage() {
  const homeServices = getPublicServices().slice(0, 4);

  return (
    <>
      <HomeHeroSection founderName={founder.name} />

      <Reveal direction="fade">
        <section className="trust-bar-section">
          <div className="site-shell trust-bar">
            <span>HCPC Registered</span>
            <span>CSP Member</span>
            <span>Home visits in Glasgow</span>
            <span>Online appointments across the UK</span>
          </div>
        </section>
      </Reveal>

      <section className="page-section simple-section">
        <Reveal direction="up">
          <div className="site-shell section-heading">
            <h2>Our Services</h2>
            <p>Comprehensive physiotherapy services tailored to your needs, delivered by an experienced specialist.</p>
          </div>
        </Reveal>
        <div className="site-shell simple-card-grid">
          {homeServices.map((service, i) => (
            <Reveal key={service.slug} direction="up" delay={i * 75}>
              <article className="simple-service-card">
                <Image
                  className="simple-service-image"
                  src={service.image}
                  alt={service.title}
                  width={720}
                  height={420}
                  unoptimized
                />
                <h3>{service.title}</h3>
                <p>{service.summary}</p>
                <Link href={`/services#${service.slug}`} prefetch>Learn more →</Link>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal direction="up" delay={100}>
          <div className="site-shell section-button-center">
            <Link className="button secondary" href="/services" prefetch>
              View All Services
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Update `app/about/page.tsx`**

Read `app/about/page.tsx` in full first.

The about page has these sections in order:
1. `.simple-page-hero.about-page-hero` — above fold, do NOT wrap
2. `.page-section.about-overview-grid` — 2-column grid with overview card + profile card → wrap the ENTIRE `<section>` in one `<Reveal direction="up">` (wrapping individual grid children would disrupt `align-items: stretch`)
3. `.page-section.stack` with specialism cards → wrap the section heading in `<Reveal direction="up">` and each `.about-specialism-card` article in `<Reveal key={item.slug} direction="up" delay={i * 75}>`
4. Any further `<section>` elements (story band, CTA) → wrap each in `<Reveal direction="up">`

Add `import { Reveal } from "@/components/reveal";` at the top of the file.

The transformation pattern for sections 2+:

```tsx
// BEFORE (section 2 example):
<section className="page-section about-overview-grid">
  ...
</section>

// AFTER:
<Reveal direction="up">
  <section className="page-section about-overview-grid">
    ...
  </section>
</Reveal>
```

```tsx
// BEFORE (specialism cards):
{specialisms.map((item) => (
  <article className="about-specialism-card" key={item.title}>
    ...
  </article>
))}

// AFTER:
{specialisms.map((item, i) => (
  <Reveal key={item.slug} direction="up" delay={i * 75}>
    <article className="about-specialism-card">
      ...
    </article>
  </Reveal>
))}
```

Keep all JSX content inside each section exactly as-is — only add `<Reveal>` wrappers. Do not change any text, class names, or props inside the sections.

- [ ] **Step 3: Update `app/services/page.tsx`**

Add `import { Reveal } from "@/components/reveal";` after the other imports.

Wrap the page hero in nothing (it's above-fold). Wrap each `service-split-card` article in `<Reveal direction="up" delay={i * 100}>`:

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { medicalImagePlaceholder } from "@/lib/image-placeholders";
import { getPublicServices } from "@/lib/public-content";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Services | PhysioOnClick",
  description: "Physiotherapist Glasgow services, post knee replacement rehab UK and online physio UK support."
};

export const dynamic = "force-static";

export default function ServicesPage() {
  const services = getPublicServices();

  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <h1>
          Our <span>Services</span>
        </h1>
        <p>Comprehensive, evidence-based physiotherapy services delivered in-person in Glasgow or online across the UK.</p>
      </section>

      <section className="page-section stack simple-services-list">
        {services.map((service, i) => (
          <Reveal key={service.slug} direction="up" delay={i * 80}>
            <article className="service-split-card" id={service.slug}>
              {/* paste the full article content from the existing file here — do not change any of it */}
            </article>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
```

Read `app/services/page.tsx` in full first. Keep the content inside each `<article className="service-split-card">` exactly unchanged — only add the `<Reveal>` wrapper around the article. The `key` prop moves from the article to the `<Reveal>`. Do not add `key` to both.

- [ ] **Step 4: Update `app/pricing/page.tsx`**

Add `import { Reveal } from "@/components/reveal";` after the other imports.

Wrap each `simple-price-card` and `simple-package-card` in `<Reveal direction="up" delay={i * 100}>`. Apply the index from `.map((item, i) => ...)`.

Read the full existing file first. The structure has two sections: Online and Packages. Apply staggered reveals to the cards in each grid. Section headings get `<Reveal direction="up">`.

The key change pattern:
```tsx
{online.map((item, i) => (
  <Reveal key={item.title} direction="up" delay={i * 100}>
    <article className="simple-price-card">
      {/* existing content */}
    </article>
  </Reveal>
))}
```

- [ ] **Step 5: Update `app/contact/page.tsx`**

Add `import { Reveal } from "@/components/reveal";` after the other imports.

The contact page has a `.contact-layout` section with two children: `.contact-info-column` div and `<ContactForm />`. Wrap each in a Reveal:

```tsx
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";

export default function ContactPage() {
  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <h1>
          Get in <span>Touch</span>
        </h1>
        <p>Book an appointment, ask a question or enquire about our services.</p>
      </section>

      <section className="page-section contact-layout">
        <Reveal direction="left">
          <div className="contact-info-column">
            <h2>Contact Information</h2>
            <div className="contact-info-list">
              <div><strong>Location</strong><span>Glasgow home visits and online consultations across the UK</span></div>
              <div><strong>Email</strong><span>hello@physioonclick.co.uk</span></div>
              <div><strong>Phone</strong><span>Contact via form</span></div>
              <div><strong>Hours</strong><span>Mon-Fri: 8am-6pm<br />Sat: 9am-1pm</span></div>
            </div>
            <div className="contact-map-card">
              <iframe title="Glasgow map" src="https://www.google.com/maps?q=Glasgow%20UK&output=embed" loading="lazy" />
            </div>
          </div>
        </Reveal>

        <Reveal direction="right">
          <ContactForm />
        </Reveal>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Update `app/blog/page.tsx`**

Add `import { Reveal } from "@/components/reveal";` after the other imports.

`<BlogDirectory>` is a complex client component with search and filter — do not modify it. Wrap the entire component in a single `<Reveal direction="up">`:

```tsx
import type { Metadata } from "next";

import { BlogDirectory } from "@/components/blog-directory";
import { blogCategories } from "@/lib/blog";
import { getPublicBlogs } from "@/lib/public-content";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Physiotherapy Blog | PhysioOnClick",
  description: "100+ UK-focused physiotherapy articles on back pain, knee injuries, shoulder rehab and more."
};

export const dynamic = "force-static";

export default function BlogPage() {
  const articles = getPublicBlogs();

  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <h1>
          Physiotherapy <span>Blog</span>
        </h1>
        <p>Expert advice, exercise guides and evidence-based articles on physiotherapy and rehabilitation.</p>
      </section>

      <Reveal direction="up">
        <BlogDirectory articles={articles} categories={blogCategories} />
      </Reveal>
    </div>
  );
}
```

- [ ] **Step 7: Run dev server and verify reveals work**

```bash
npm run dev
```

Open http://localhost:3000. Scroll down on the home page — service cards should fade/slide up into view one after another. Visit /about, /services, /pricing, /contact, /blog and scroll down on each. Sections should animate in as they enter the viewport. Nothing above the fold should be invisible on page load.

If any card grid looks broken (cards collapsed or invisible), it's likely a `<Reveal>` div disrupting a grid layout. Fix by wrapping the whole grid container instead of individual items.

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx app/about/page.tsx app/services/page.tsx app/pricing/page.tsx app/contact/page.tsx app/blog/page.tsx
git commit -m "feat(reveal): apply scroll-reveal to all public pages"
```

---

### Task 4: Micro-interactions

**Files:**
- Modify: `app/globals.css` (append ~60 lines; also edit two existing rules)

**Interfaces:**
- Produces: CSS-only shimmer on `.button.primary:hover`, card lift on hover for all non-shimmed card classes
- Consumes: existing `.button`, `.button.primary` classes; existing card classes

**Important:** The existing rule at approximately line 244 in `app/globals.css` combines button and card hover into one selector:
```css
.button:hover,
.button:focus-visible,
.search-result-card:hover,
.simple-blog-card:hover,
.simple-price-card:hover,
.simple-package-card:hover,
.contact-form-card:hover,
.sessions-include-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 36px rgba(22, 34, 50, 0.1);
}
```
The card classes in this rule get `-2px` lift with a navy shadow. We want cards to get `-4px` lift (more pronounced). We will NOT remove the cards from this rule (to avoid a risky edit) — instead we override them with a more specific rule appended below.

Also note: `.simple-service-card` already has its own perfect hover at `-4px` (defined separately around line 497). Do not change it.

- [ ] **Step 1: Add `position: relative; overflow: hidden` to `.button.primary`**

Find the existing `.button.primary` rule in `app/globals.css` (around line 219):
```css
.button.primary {
  background: var(--primary);
  color: white;
}
```

Edit it to:
```css
.button.primary {
  background: var(--primary);
  color: white;
  position: relative;
  overflow: hidden;
}
```

These two properties are required for the shimmer `::after` to be clipped inside the button boundary.

- [ ] **Step 2: Append micro-interaction CSS to `app/globals.css`**

Add this entire block at the very end of `app/globals.css`:

```css
/* ─────────────────────────────────────────────────────────────
   Micro-interactions: primary button shimmer
   ──────────────────────────────────────────────────────────── */
.button.primary::after {
  content: "";
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.28) 50%,
    transparent 60%
  );
  transform: skewX(-15deg);
  transition: left 0s;
  pointer-events: none;
}
.button.primary:hover {
  box-shadow: 0 8px 24px rgba(11, 110, 142, 0.35);
}
.button.primary:hover::after {
  left: 125%;
  transition: left 400ms ease;
}
.button.primary:active {
  transform: translateY(0) !important;
  box-shadow: none !important;
}

/* ─────────────────────────────────────────────────────────────
   Micro-interactions: secondary button border highlight
   ──────────────────────────────────────────────────────────── */
.button.secondary:hover {
  border-color: var(--color-teal);
  color: var(--color-teal);
}

/* ─────────────────────────────────────────────────────────────
   Micro-interactions: call-link underline slide
   ──────────────────────────────────────────────────────────── */
.call-link {
  position: relative;
}
.call-link::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--color-teal);
  transition: width 200ms ease;
}
.call-link:hover::after {
  width: 100%;
}

/* ─────────────────────────────────────────────────────────────
   Micro-interactions: card hover lift
   Override the existing combined selector (cards get -4px, buttons keep -2px)
   .simple-service-card already has its own hover — do not re-declare it
   ──────────────────────────────────────────────────────────── */
.simple-blog-card,
.simple-price-card,
.simple-package-card,
.contact-form-card,
.sessions-include-card,
.service-split-card,
.about-specialism-card {
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.simple-blog-card:hover,
.simple-price-card:hover,
.simple-package-card:hover,
.contact-form-card:hover,
.sessions-include-card:hover,
.service-split-card:hover,
.about-specialism-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(13, 27, 42, 0.10);
}
```

- [ ] **Step 3: Run dev server and verify micro-interactions**

```bash
npm run dev
```

Check all of the following:

1. **Primary button shimmer:** Hover over any "Book Now" or "Book Assessment" button. A light shimmer sweep should cross from left to right in ~400ms. The button should also lift 2px with a teal glow box-shadow. Click it — it should snap back flat.
2. **Secondary button:** Hover "View All Services" or any `.button.secondary` — border and text turn teal.
3. **Call-link underline:** Hover "Contact Us" in the header — a teal underline slides in from left to right.
4. **Card lift:** Hover a service card on the homepage — 4px lift with soft shadow. Same for pricing cards, blog cards, specialism cards.
5. **No double-shimmer:** The shimmer is a single sweep on hover; it should not loop or repeat.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(micro): primary button shimmer, card hover lift, call-link underline"
```

---

### Task 5: Page Transitions + ScrollReset

**Files:**
- Modify: `next.config.mjs` — add `experimental: { viewTransition: true }`
- Create: `components/scroll-reset.tsx`
- Modify: `app/layout.tsx` — add `<ScrollReset />`
- Modify: `app/globals.css` — append view transition keyframes

**Interfaces:**
- Produces: `ScrollReset` client component (no visible output, side-effect only)
- Consumes: `usePathname` from `next/navigation`, Next.js `experimental.viewTransition` flag

**Note:** The `viewTransition` prop on `<Link>` was already added to `components/site-header.tsx` in Task 1. This task wires the rest: the config flag, the CSS keyframes, and the scroll reset.

- [ ] **Step 1: Update `next.config.mjs`**

Read the current file. It contains `images` config only. Add `experimental`:

```mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
```

- [ ] **Step 2: Create `components/scroll-reset.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollReset() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
```

- [ ] **Step 3: Update `app/layout.tsx`**

Add `import { ScrollReset } from "@/components/scroll-reset";` with the other component imports.

Add `<ScrollReset />` inside `<body>` before `<SiteHeader />`:

```tsx
<body>
  <ToastProvider>
    <ScrollReset />
    <SiteHeader />
    <main>{children}</main>
    <SiteFooter />
    <Analytics />
    <ChatWidget />
    <ConnectivityOverlay />
  </ToastProvider>
</body>
```

- [ ] **Step 4: Append view transition CSS to `app/globals.css`**

Add this block at the very end of `app/globals.css`:

```css
/* ─────────────────────────────────────────────────────────────
   Page transitions: View Transitions API
   ──────────────────────────────────────────────────────────── */
@keyframes vt-fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

::view-transition-new(root) {
  animation: vt-fade-up 220ms ease;
}

::view-transition-old(root) {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-new(root),
  ::view-transition-old(root) {
    animation: none;
  }
}
```

- [ ] **Step 5: Run dev server and verify page transitions**

```bash
npm run dev
```

Click between pages using the nav bar (Home → About → Services → Pricing → Contact → Blog). Each page change should produce a subtle fade-up of the incoming page (220ms, barely noticeable — that's intentional). The scroll position should always reset to top on page change.

If view transitions don't appear, check:
1. Browser supports View Transitions (Chrome 111+, Safari 18+). Test in Chrome.
2. `viewTransition` prop is present on nav `<Link>` elements (added in Task 1).
3. `experimental.viewTransition: true` is in `next.config.mjs`.
4. The dev server was restarted after the config change.

- [ ] **Step 6: Final build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes successfully with no TypeScript errors. There should be no "Module not found" or type errors.

- [ ] **Step 7: Commit**

```bash
git add next.config.mjs components/scroll-reset.tsx app/layout.tsx app/globals.css
git commit -m "feat(transitions): View Transitions API, ScrollReset on route change"
```
