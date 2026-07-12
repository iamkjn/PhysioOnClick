# PhysioOnClick Visual Redesign — Motion, Alerts & Skeleton Coverage

> **Platform:** Next.js 15 web app only (Flutter mobile app out of scope — GSAP is JS-only)
> **Scope:** New color accent tokens, GSAP-driven animation system (replacing CSS-only reveals), redesigned notification/alert system with animation and graphics, and full skeleton-loading coverage across every async screen.
> **Builds on:** `2026-07-04-ux-redesign-design.md` (base navy/teal/gold tokens, toast/skeleton/empty-state component shells) and `2026-07-05-ui-animation-polish-design.md` (CSS-only scroll-reveal + micro-interactions, being superseded here).

---

## Goals

1. Replace the flat, mostly-static UI with GSAP-driven motion that feels current — timelines, stagger, spring easing — instead of plain CSS transitions.
2. Give toasts and confirmation dialogs a real visual identity: icons, graphics, animated entrance/exit, instead of a flat color box with a unicode glyph.
3. Close the skeleton-loading gap: every async screen shows a shaped placeholder matching its eventual layout, never a blank flash, fake zeroed data, or bare "Loading…" text.
4. Extend (not replace) the existing navy/teal/gold token system with an indigo accent direction for CTAs, progress, and active states.
5. Respect `prefers-reduced-motion` throughout, centrally, via `gsap.matchMedia()`.

---

## 1. Color & Design Tokens

Extends `app/globals.css`. Existing tokens (`--color-navy`, `--color-bg`, `--color-surface`, `--color-border`, `--color-text-primary`, `--color-text-secondary`, `--color-success`, `--color-error`, `--color-warning`, `--color-gold`, `--color-gold-light`) are unchanged. `--color-teal` and its variants are replaced by a new indigo-based primary.

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#4F46E5` | Brand primary — replaces `--color-teal` as the primary/CTA/link/active color |
| `--color-primary-dark` | `#3730A3` | Primary hover state |
| `--color-primary-light` | `#EEF2FF` | Primary tints, pill backgrounds, highlights (replaces `--color-teal-light`) |
| `--color-primary-glow` | `#818CF8` | Gradient endpoint — CTAs, progress bars, active nav indicator |
| `--gradient-primary` | `linear-gradient(135deg, var(--color-primary), var(--color-primary-glow))` | Primary buttons, progress fills, hero accents |
| `--color-accent` | `#10B981` | Recovery/success/"growth" signal — distinct from `--color-success` (same hue family, used for positive data, not form validation) |
| `--color-bg` | `#FAF9FF` | Page background (was `#F7FAFC`) — soft lavender-white |
| `--color-text-primary` | `#1E1B3A` | Body text, headers (was `#0D1B2A`) |
| `--color-coral` | `#FF7A59` | Notification/alert accent — info toasts, badges. Kept distinct from `--color-primary` and `--color-gold` so alerts never compete visually with CTAs or the booking button |
| `--color-coral-light` | `#FFF1EC` | Coral tint backgrounds |
| `--color-gold` | `#B08030` (unchanged) | **Booking CTA only** — exclusivity preserved per the July 4 spec |

Every existing usage of `--color-teal` / `--color-teal-dark` / `--color-teal-light` across components and `globals.css` is renamed to the `--color-primary*` equivalents. This is a rename, not a redesign of every component — card/button/input shapes from the July 4 spec are unchanged.

---

## 2. GSAP Animation Architecture

Replaces the CSS-only `Reveal` / `IntersectionObserver` system and ad-hoc CSS transitions from the July 5 spec. No other libraries added.

**New dependency:** `gsap` (free plugins only — `ScrollTrigger`, `useGSAP`; no paid Club GreenSock plugins).

**New files:**
- `lib/gsap.ts` — registers `ScrollTrigger` once; exports a `prefersReducedMotion` matchMedia helper used by every animated component
- `hooks/use-gsap-timeline.ts` — thin wrapper around the official `useGSAP()` React hook, used for one-off component animations (toast, dialog, skeleton crossfade)

**Modified files:**
- `components/reveal.tsx` — internals rewritten to build a GSAP timeline (opacity + y-translate + slight scale) driven by `ScrollTrigger.create()` instead of `IntersectionObserver`. Public props (`direction`, `delay`, `duration`) unchanged, so every existing call site (`app/page.tsx`, `app/about/page.tsx`, etc.) keeps working without edits.
- `components/site-header.tsx` — scroll-shadow, active-nav underline, and hamburger icon transforms migrate from CSS transitions to GSAP `quickTo()` for interruptible, snappier motion.
- `app/globals.css` — button/card hover transitions removed in favor of GSAP where noted above; `shimmer` keyframe (skeleton background animation) is kept as CSS since it's already performant and doesn't benefit from GSAP.
- `next.config.ts` / View Transitions — kept as the outer page-to-page transition (per July 5 spec); GSAP owns all motion *inside* a page.

`gsap.matchMedia()` is set up once in `lib/gsap.ts` with a `(prefers-reduced-motion: reduce)` breakpoint that no-ops all `ScrollTrigger`/timeline animations project-wide, replacing the per-component `@media (prefers-reduced-motion: reduce)` blocks scattered through `globals.css` today.

---

## 3. Notification / Alert System Redesign

`components/toast.tsx` and `components/confirm-dialog.tsx` currently work but have minimal identity: unicode glyphs, flat fill, a single 220ms CSS slide-in, and (for the dialog) no animation at all.

**`components/toast.tsx` / `components/toast-provider.tsx`:**
- Icons: replace unicode glyphs (✓ ℹ ⚠ ✕) with a small inline SVG icon set, consistent stroke width, matching the illustration style already established in `components/empty-state.tsx`
- Visual: surface-colored card (`--color-surface`) with a colored left border + icon in a soft circular badge (type color at 15% opacity), 20px radius and teal-tinted-shadow-equivalent — matching existing card styling instead of looking like a bolted-on system
- Color mapping: success/error/warning keep semantic colors (unchanged, WCAG AA); **info toasts move to `--color-coral`** instead of the old teal, so they read as "notification" rather than "primary action"
- Animation (GSAP, via `useGSAPTimeline`): enter = spring-eased slide-up + scale from 0.95 → 1; exit = ~65% of enter duration (fade + shrink) per the "exit faster than enter" motion guideline; when multiple toasts stack, repositioning animates via GSAP instead of snapping
- Auto-dismiss toasts (success/info) get a thin animated progress bar along the bottom edge showing time-to-dismiss, replacing the current unexplained disappearance
- Warning/error toasts get a one-time subtle "attention" micro-shake on entrance (GSAP, respects reduced-motion) to visually separate urgency without being obnoxious

**`components/confirm-dialog.tsx`:**
- Currently instant show/hide with no animation
- Add GSAP scale+fade entrance for the dialog card (from the trigger's approximate position, per "modal animates from trigger source") and a fade for the scrim overlay
- Destructive actions keep the red `btn-confirm--destructive` styling, now with a subtle emphasis animation on the dialog border when it opens (visually flags "this needs attention" without extra copy)

---

## 4. Skeleton / Loading Coverage

Full audit (see below) found 1 of ~30 async components using a skeleton; the rest split across 2 spinners, ~12 "Loading…" text instances, and 11 that render nothing or incorrect placeholder state (including one that shows fake zeroed data as if real, and one full page that returns `null`).

**New primitives, added to `components/skeleton.tsx`** (existing `Skeleton` base component kept as-is):

| Primitive | Shape | Used for |
|---|---|---|
| `SkeletonText` | N lines, varied width | Paragraphs, labels |
| `SkeletonCircle` | Circle, sized | Avatars, icon badges, favorite-button placeholder |
| `SkeletonRow` | Circle/icon + 2 text lines | List items: appointments, chat sessions, saved articles, rehab programs |
| `SkeletonTable` | Header + N rows × M columns | Admin bookings/enquiries tables |
| `SkeletonChart` | Rect block + axis-line hints, configurable height | Recovery/progress charts |
| `SkeletonStatGrid` | N stat-tile placeholders | Admin live stats, recovery % card |
| `SkeletonForm` | Labeled field blocks | Profile editor |

Animation: the existing CSS `shimmer` background-position keyframe is kept for the skeleton fill itself. GSAP is used for (a) staggered fade-in of skeleton blocks on mount and (b) a crossfade from skeleton → loaded content, so data doesn't just pop in once it resolves.

**Per-file mapping** (from the loading-state audit):

| File | Current state | Fix |
|---|---|---|
| `components/admin-auth-gate.tsx` | Spinner | Branded pulse shell: logo + `SkeletonStatGrid`-shaped placeholder |
| `components/admin-chat-logs-gate.tsx` | Spinner | Same branded pulse shell |
| `components/recovery-chart.tsx` | "Loading chart…" text | `SkeletonChart` |
| `components/admin-recovery-chart.tsx` | Inherits chart's text | `SkeletonChart` |
| `components/assigned-exercises.tsx` | "Loading exercises…" text | `SkeletonRow` × 3 |
| `components/saved-blogs-section.tsx` | "Loading saved articles…" text | `SkeletonRow` × 3 |
| `components/rehab-programs-section.tsx` | "Loading rehab programmes…" text | `SkeletonRow` × 3 |
| `components/admin-chat-logs.tsx` | "Loading chat logs…" text | `SkeletonRow` × 4 |
| `components/pain-check-in.tsx` | "Loading…" text | `SkeletonStatGrid` (1 tile) |
| `components/admin-bookings-table.tsx` | "Loading bookings…" text | `SkeletonTable` (6 col) |
| `components/admin-enquiries-table.tsx` | "Loading enquiries…" text | `SkeletonTable` (6 col) |
| `app/patient/appointments/page.tsx` | "Loading…" text | `SkeletonRow` list |
| `app/patient/appointments/[id]/page.tsx` | "Loading…" text | `SkeletonRow` + `SkeletonText` block |
| `components/book-auth-gate.tsx` | "Checking your account…" text | `SkeletonForm`-shaped placeholder |
| `app/admin/recovery/page.tsx` | "Checking admin access…" text | `SkeletonChart` + `SkeletonRow` |
| `components/patient-live-overview.tsx` | Blank (empty-state text indistinguishable from true-empty) | 3× `SkeletonRow` columns, distinct from the real empty state |
| `components/adherence-bar.tsx` | Blank (`return null`) | `SkeletonText` + bar placeholder |
| `components/person-switcher.tsx` | Blank (dropdown pops in) | `Skeleton` pill |
| `components/patient-profile-editor.tsx` | Blank (empty form renders immediately) | `SkeletonForm` |
| `components/blog-favorite-button.tsx` | Blank (starts in "unfavourited" state) | `SkeletonCircle` (small) |
| `components/admin-live-stats.tsx` | **Bug:** shows zeroed `DEFAULT` counts as if real | Add explicit `isLoading` state → `SkeletonStatGrid` until first snapshot resolves |
| `components/admin-patient-selector.tsx` | Blank (list pops in) | `SkeletonRow` list |
| `components/admin-exercise-assigner.tsx` | Blank (lists pop in) | `SkeletonRow` list × 2 (assigned/unassigned) |
| `app/patient/account/page.tsx` | **Bug:** `if (!uid) return null` — renders nothing | Full-page skeleton shell matching the loaded layout (user card, quick-link pills, profile editor, list sections) |
| `app/patient/people/page.tsx` | Blank (grid pops in) | `SkeletonCard` grid matching person-card layout |
| `components/home-hero-section.tsx` | **Bug:** renders signed-out hero, then swaps to dashboard once auth resolves (content-flash) | Show a skeleton hero (matching the dashboard grid shape) during the auth-resolve window instead of guessing signed-out state |

Components confirmed to need **no** change: `progress-chart.tsx` and `exercise-library.tsx` (static data, no fetch), `blog-directory.tsx` / `search-experience.tsx` / `app/blog/page.tsx` / `app/search/page.tsx` (server-fetched, no client loading period), `chat-widget.tsx` (no async data), `admin-clinical-entry.tsx` / `contact-form.tsx` (submit-time only, not page-load).

---

## 5. Implementation Notes — Files to Create or Modify

| File | Action | Purpose |
|---|---|---|
| `package.json` | Modify | Add `gsap` dependency |
| `lib/gsap.ts` | Create | ScrollTrigger registration, reduced-motion matchMedia helper |
| `hooks/use-gsap-timeline.ts` | Create | `useGSAP()` wrapper for component-level animations |
| `app/globals.css` | Modify | Rename teal tokens → primary tokens, add coral/glow/gradient tokens, remove superseded CSS transitions, keep `shimmer` keyframe |
| `components/reveal.tsx` | Modify | GSAP-driven internals, same public API |
| `components/site-header.tsx` | Modify | GSAP `quickTo()` for scroll-shadow, nav underline, hamburger transforms |
| `components/toast.tsx` | Modify | New SVG icons, GSAP enter/exit, progress-dismiss bar, shake on warning/error |
| `components/toast-provider.tsx` | Modify | GSAP-animated stack repositioning |
| `components/confirm-dialog.tsx` | Modify | GSAP entrance/exit for dialog + scrim |
| `components/skeleton.tsx` | Modify | Add `SkeletonText`, `SkeletonCircle`, `SkeletonRow`, `SkeletonTable`, `SkeletonChart`, `SkeletonStatGrid`, `SkeletonForm` |
| All files in the Section 4 mapping table | Modify | Wire in the matching skeleton primitive; fix the 3 flagged bugs (`admin-live-stats` fake data, `patient/account` returns `null`, `home-hero-section` content-flash) |

---

## Out of Scope

- Flutter mobile app (separate codebase, GSAP is JS-only — no changes here)
- Figma/21st.dev design-tool integration (not authorized in this environment; can be revisited once connected)
- Any new page/feature — this is a visual/motion/loading-state pass over existing screens only
- Dark mode (not part of the current design system; unchanged)
