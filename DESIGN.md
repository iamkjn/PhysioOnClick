---
name: PhysioOnClick — The Clarity System
description: Warm-paper, cool-accent design system for an online-first UK physiotherapy practice — coastal clinical calm across marketing, booking, and portal.
colors:
  sky-accent: "#0EA5E9"
  accent-deep: "#0A77A8"
  accent-tint: "#ECF8FD"
  accent-glow: "#38BDF8"
  rail-top: "#086087"
  deep-navy: "#043246"
  warm-paper: "#F6F3EC"
  paper-border: "#E4DED1"
  clarity-ink: "#23201B"
  warm-muted: "#6B655B"
  surface-white: "#FFFFFF"
  coral: "#FF7A59"
  coral-tint: "#FFF1EC"
  gold: "#B08030"
  gold-tint: "#FDF6E9"
  gold-deep: "#8C6420"
  success-green: "#059669"
  error-red: "#DC2626"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(3.4rem, 6vw, 5.2rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "2.1rem"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.35rem"
    fontWeight: 400
    lineHeight: 1.05
  body:
    fontFamily: "DM Sans, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "DM Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.12em"
rounded:
  chip: "10px"
  input: "13px"
  card: "15px"
  panel: "22px"
  pill: "999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section: "4.5rem"
components:
  button-primary:
    backgroundColor: "{colors.accent-deep}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.input}"
    padding: "0 1.2rem"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.rail-top}"
    textColor: "{colors.surface-white}"
  button-secondary:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.deep-navy}"
    rounded: "{rounded.input}"
    height: "46px"
  card:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
  pill-selected:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.accent-deep}"
    rounded: "{rounded.pill}"
  input:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.input}"
    padding: "0.95rem 1rem"
---

# Design System: PhysioOnClick — The Clarity System

## 1. Overview

**Creative North Star: "The Clarity System"**

The name is the codebase's own — its stylesheet already calls this "the Clarity palette" and "the Clarity design system." A warm paper base (#F6F3EC) and dark navy ink (#043246) carry the reading surface everywhere; a single cool sky-blue (#0EA5E9, graded down to #0A77A8 for anything that needs to stay legible) is the only note of color allowed to do real interactive work. The character is coastal clinical: open-water blue against a deep navy rail reads calm and credible without tipping into sterile-hospital white or SaaS-dashboard grey. Brand personality is modern and efficient — the system rejects ceremony (no shimmer sweeps, no idle drama, no filled-block "you selected this" stamps) in favor of a brisk, frictionless feel: state changes are quick, legible, and never performative.

This is explicitly not a generic B2B analytics look. The one recurring instruction embedded in the CSS itself is to keep the raw accent color out of body text and interactive surfaces — "reach for `--color-primary` directly only for decoration or text on dark" — because at 2.77:1 contrast it fails as readable UI. Every button, link, and selected-state color instead uses the darker accent grade. That single discipline is most of what keeps this system legible instead of merely pretty.

**Key Characteristics:**
- Warm paper background + dark navy ink, with a cool sky-blue accent reserved for CTAs and selected states
- Fraunces serif for anything with authority (headlines, prices, the booking rail's title); DM Sans for everything functional
- Flat and bordered at rest; elevation and lift appear only as a response to hover, focus, or being an overlay
- Selected states are a tint + border, never a solid accent fill
- No shimmer, no gradient text, no idle motion — feedback is a lift and a shadow, nothing more

## 2. Colors

The palette runs warm-neutral for structure, cool-blue for action, with coral and gold held in reserve for two specific semantic jobs (advisory warnings and secondary CTAs) rather than general decoration.

### Primary
- **Sky Accent** (#0EA5E9): The raw brand blue. Used for decoration and text set on dark surfaces only (the booking rail's brand mark, chip icons) — never as body text or an interactive control on a light background, since it clears only 2.77:1 contrast on white.
- **Accent Deep** (#0A77A8): The working accent. Every link, primary button, active nav underline, and "selected" text color pulls from this grade instead of the raw Sky Accent.
- **Accent Tint** (#ECF8FD): The light wash behind selected chips, service cards, and calendar days — pairs with Accent Deep text on top of it.
- **Accent Glow** (#38BDF8): Gradient endpoint only, paired with Accent Deep in `--gradient-primary` for the chat widget header and message bubbles.

### Secondary
- **Rail Top** (#086087) / **Deep Navy** (#043246): The two stops of the dark rail gradient used behind the booking flow's left panel and the chat trigger button. Deep Navy is also the site's default body-text ink (aliased as `--ink`) — the same color that anchors the dark surfaces anchors the reading color everywhere else.

### Tertiary
- **Coral** (#FF7A59) with **Coral Tint** (#FFF1EC): Reserved for advisory/warning content — the symptom-checker disclaimer box, the "info" toast variant. Not a general accent.
- **Gold** (#B08030), **Gold Tint** (#FDF6E9), **Gold Deep** (#8C6420): A secondary CTA color, used sparingly (e.g. the empty-state's alternate call-to-action) so it still reads as deliberate when it appears.

### Neutral
- **Warm Paper** (#F6F3EC): The site background and the booking flow's right-hand panel — never pure white.
- **Paper Border** (#E4DED1): Hairline borders inside the booking flow specifically.
- **Clarity Ink** (#23201B): The booking flow's own near-black text color, warmer than Deep Navy — the one place the system deliberately runs a second ink register.
- **Warm Muted** (#6B655B): Secondary/muted text everywhere (`--muted`), a warm grey-brown rather than a cool grey.
- **Surface White** (#FFFFFF): Cards, panels, inputs — the one true white in the system, always sitting on top of Warm Paper, never as the page background itself.

### Named Rules
**The Decoration-Only Raw Accent Rule.** Sky Accent (#0EA5E9) is only 2.77:1 on white. It is never used for body text, links, or fills that need to stay legible — those always step down to Accent Deep (#0A77A8). Sky Accent's job is decoration on dark surfaces and nothing else.

**The Tint-Not-Fill Selection Rule.** A selected chip, calendar day, service card, or nav link never becomes a solid accent block. Selection is always Accent Tint background + Accent Deep border/text — a highlight, not a stamp.

## 3. Typography

**Display Font:** Fraunces (with Georgia, serif fallback)
**Body Font:** DM Sans (with system-ui, -apple-system fallback)

**Character:** Fraunces carries every number and headline that needs authority — hero titles, section headings, prices, the booking confirmation screen — set tight (-0.03em tracking, 1.05 line-height) so its wide counters don't read loose. DM Sans runs everything else: nav, forms, tables, chat, body copy. The pairing keeps the brisk-and-frictionless promise: one typeface signals "this matters," the other gets out of the way.

### Hierarchy
- **Display** (400, `clamp(3.4rem, 6vw, 5.2rem)`, 1.05 line-height): Hero H1s and full-bleed section headings (`.home-hero h1`, `.section-heading h2`).
- **Headline** (400, 2.1rem, 1.05 line-height): Default H2 — page and card section titles.
- **Title** (400, 1.35rem, 1.05 line-height): H3s, card titles, the booking rail's title at mobile width.
- **Body** (400, 1rem, 1.6 line-height, cap 65-75ch on long-form article copy): Paragraph text throughout; article body specifically widens to 1.85 line-height for reading comfort.
- **Label** (700, 0.75rem, 0.12em tracking, uppercase): Eyebrows, pill labels, table headers, the booking rail's uppercase eyebrow text.

### Named Rules
**The Serif-For-Authority Rule.** Fraunces is reserved for headings, prices, and confirmation moments — anything meant to feel considered. It never appears in a form field, a table cell, or a chip; those stay DM Sans even when the surrounding block uses Fraunces for its title.

## 4. Elevation

Flat and bordered at rest, lifted only in response to interaction. Every card and button starts with either no shadow or a single soft ambient shadow (`--shadow: 0 2px 16px rgba(30,45,40,0.10)`); hover/focus/active states are the only place a stronger shadow and a `translateY` lift appear. Overlays (toasts, the confirm dialog, the chat drawer, the booking panel) are the exception — they carry a single strong ambient shadow permanently, since their whole job is to read as floating above the page.

### Shadow Vocabulary
- **Ambient card** (`--shadow: 0 2px 16px rgba(30,45,40,0.10)`): Resting state for all cards and panels.
- **Card hover** (`0 12px 32px rgba(4,50,70,0.10)` paired with `translateY(-4px)`): Blog/pricing/service cards on hover.
- **Button hover** (`0 8px 24px rgba(30,45,40,0.35)` paired with `translateY(-2px)`): Primary buttons and the booking CTA on hover; drops to no shadow and `translateY(0)` on active/press.
- **Panel** (`--shadow-panel: 0 28px 66px -24px rgba(30,45,40,0.42)`): The booking flow's two-pane shell and the chat drawer — the strongest shadow in the system, reserved for the largest floating surfaces.
- **Card (dark)** (`--shadow-card: 0 8px 40px rgba(0,0,0,0.3)`): Deep ambient shadow used behind the darkest surfaces (chat toast).

### Named Rules
**The No-Idle-Drama Rule.** Elevation only appears as a response to state — hover, focus, active, or being an overlay. A resting card never carries more than the ambient shadow; a resting button never carries a shadow at all. Every hover/lift transition in the codebase has a matching `prefers-reduced-motion` override that kills it outright, not just slows it down.

## 5. Components

### Buttons
- **Shape:** 13px radius (`{rounded.input}`), 46px minimum height.
- **Primary:** Accent Deep background, white text. Hover darkens to Rail Top and lifts `translateY(-2px)` with a soft shadow; active drops flat with no shadow.
- **Secondary:** White background, `--line` border, navy text. Hover swaps the border and text to Accent Deep — no fill change.
- **Inverted (on dark surfaces):** Translucent white fill (8% opacity) with a semi-opaque white border, for buttons placed on the rail gradient or hero overlay.

### Named Rules
**The No-Shimmer Rule.** A moving shine sweep reads as coupon-site/salesy. Primary buttons get the same darken-and-lift treatment as everything else in the system — never a decorative sheen. (The one shimmer animation that does exist in the codebase is reserved exclusively for skeleton loading placeholders, never for an interactive control.)

### Chips & Pills
- **Style:** Pill radius (999px), 1-1.5px border, white or Warm Paper background at rest.
- **Selected:** Accent Tint background, Accent Deep text/border, per the Tint-Not-Fill Rule above — never a solid accent fill.
- **Filter chips** (`.blog-chip.active`): The one deliberate exception — filter/toggle chips do go solid Accent Deep with white text, since they represent an active filter rather than a single selectable option.

### Cards
- **Corner style:** 15px (`{rounded.card}`) as the base card radius; larger content cards (blog, pricing, about) hand-tune up to 18-24px for visual weight — the radius scales up slightly with the card's content density, not down.
- **Background:** Surface White, always sitting on the Warm Paper page background.
- **Shadow strategy:** Ambient at rest, hover lift per the Elevation section.
- **Border:** 1px `--line` (a tint of Paper Border).
- **Internal padding:** 1.5-2rem depending on content density.

### Inputs / Fields
- **Style:** White background, 13px radius, 1px `--line` border, `0.95rem 1rem` padding.
- **Focus:** A 4px accent-tinted glow ring (`box-shadow: 0 0 0 4px accent-deep at 12% opacity`) plus a border-color shift — used site-wide on every bare `input`/`select`/`textarea`.
- **Booking-flow exception:** `.book-input` runs the tighter Clarity scale (10px chip radius) and simplifies focus to a border-color change only, no glow ring — a deliberate reduction to keep the wizard feeling brisk rather than decorated.

### Navigation
- **Style:** Sticky white header with a `--line` bottom border; blurs (`backdrop-filter: blur(12px)`) once scrolled.
- **Active state:** A GSAP-driven 2px accent underline beneath the active link, not a filled background pill — the header explicitly moved away from the pill treatment.
- **Mobile:** Collapses past 768px to a hamburger trigger; the nav becomes a slide-down panel with a translucent navy backdrop, each link a full-width 48px-tall row that highlights Accent Tint on hover/active.

### Signature: Booking Flow (the Clarity wizard)
The flagship pattern. A two-pane 372px/1fr split: a dark rail (Rail Top → Deep Navy gradient) carrying the running summary, trust checklist, physio card, and live total in white/light text, paired with a Warm Paper panel carrying the actual step content — service cards, a calendar grid, time slots, contact fields. The confirmation screen mirrors the same split with a large circular check mark on the rail side. Every selectable control (service card, day, slot, chip) follows the Tint-Not-Fill Rule: a 1.5px border in Paper Border at rest, Accent border + Accent Tint fill when selected. On mobile the rail collapses to a single horizontal summary bar (logo, service name, price) so the wizard never loses its brand context even when space is tight.

### Signature: Chat Widget
A 56px circular trigger (Rail gradient fill) fixed bottom-right, scaling to 1.08x on hover/focus. Opens a 360px drawer (22px panel radius, `--shadow-panel`) with a gradient-primary header, a typing indicator of three bouncing dots, and asymmetric message bubbles — bot messages sit on Warm Paper in white pill-shaped bubbles with a sharp bottom-left corner, user messages fill with the primary gradient and a sharp bottom-right corner. Suggested-reply chips sit in a footer strip and invert from outline to solid Accent Deep on hover/focus.

## 6. Do's and Don'ts

### Do:
- **Do** use Accent Deep (#0A77A8) for every interactive/readable color need; reserve raw Sky Accent (#0EA5E9) for decoration and text-on-dark only.
- **Do** mark selected/active states with a tint background + accent border (chips, calendar days, service cards, slots) rather than a solid fill.
- **Do** keep elevation as a state response — flat/bordered at rest, lift + stronger shadow only on hover, focus, or active.
- **Do** give primary buttons a darken-and-lift hover treatment (translateY(-2px) + shadow), never a shimmer sweep.
- **Do** carry the warm paper background and Fraunces headings into portal and admin screens, not just the public marketing pages — the brand identity doesn't stop at the login wall.
- **Do** pair every new hover/reveal transition with a matching `prefers-reduced-motion` override that removes it outright.

### Don't:
- **Don't** let portal or admin screens read as a generic B2B analytics dashboard — this is PhysioOnClick's explicit anti-reference. Data-heavy screens (recovery trends, bookings tables) still get the Warm Paper background and serif section titles, not a cold grey app-shell.
- **Don't** add a shimmer or shine sweep to any interactive control. The one shimmer animation in this system is reserved exclusively for skeleton loading placeholders.
- **Don't** add new colored `border-left`/`border-right` stripe accents on cards, list items, or callouts. The toast component's status border-left is a pre-existing exception, not a pattern to extend — use a background tint, a full border, or a leading icon instead, the way `empty-state` and `confirm-dialog` already do.
- **Don't** fill a selected or active state with a solid accent block outside the deliberate filter-chip exception — Clarity's selection language is tint-plus-border.
- **Don't** use gradient text or `background-clip: text` for emphasis; this system reaches for weight, size, or the serif/sans switch instead.
