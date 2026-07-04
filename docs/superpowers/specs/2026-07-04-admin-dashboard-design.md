# Admin Dashboard Redesign — Design Spec

**Date:** 2026-07-04
**Scope:** Full admin dashboard overhaul — auth gate, tabbed layout, bookings table, summary drawer, enquiries, live stats.

---

## Goals

1. Hard-gate the admin area behind sign-in (no data visible to unauthenticated visitors).
2. Match the existing teal/navy/gold design system (`--color-teal`, `--color-navy`, `--color-gold`, DM Serif Display + DM Sans).
3. Give bookings and enquiries equal, focused real estate via tabs.
4. Fix two pre-existing bugs: post-sign-in redirect loop, stale appointment statuses.
5. Make session summary writing faster and richer (pain score, recovery %, outcome, follow-up pills).

---

## Architecture

- `app/admin/page.tsx` — server component; renders `AdminAuthGate` (client) which either shows `AdminSignIn` or `AdminDashboard` based on auth state.
- `components/admin-auth-gate.tsx` — new client component; `onAuthStateChanged` listener, renders sign-in or dashboard.
- `components/admin-sign-in.tsx` — new; replaces inline `AuthPanel` usage on admin page; full-screen navy sign-in card.
- `components/admin-dashboard.tsx` — new shell; sticky header + three tabs (Bookings | Enquiries | Live Stats).
- `components/admin-bookings-table.tsx` — refactored; client-side status resolution, filter chips, 6-column layout.
- `components/admin-enquiries-table.tsx` — refactored; inline status cycling via Firestore update.
- `components/admin-live-stats.tsx` — refactored; redesigned stat cards with breakdowns.
- `components/summary-form.tsx` — enhanced; slide-in drawer with assessment scores block.
- `app/admin/actions.ts` — `PublishSummaryInput` extended with `painScore`, `recoveryPercent`, `sessionOutcome`.

---

## Section 1: Auth Gate

### Behaviour
- `AdminAuthGate` mounts and subscribes to `onAuthStateChanged`.
- While loading: full-screen navy background, centred spinner.
- Unauthenticated: renders `AdminSignIn` fullscreen — no admin data visible.
- Authenticated: renders `AdminDashboard` with header + tabs.
- Sign-out button calls `signOut(auth)` → auth state change → gate reverts to `AdminSignIn`.

### AdminSignIn card
- Navy (`var(--color-navy)`) full-screen background.
- Centred white card, max-width 420px, border-radius 20px.
- Header: PhysioOnClick "P" logomark + "Admin Portal" in DM Serif Display 28px navy.
- Subtitle: "Sign in to access bookings, enquiries and patient data." in DM Sans muted.
- Email + password fields using existing `inputDecorationTheme` tokens.
- "Sign in" button: full-width teal filled button, DM Sans 16px semibold.
- Error message: red text below button, `var(--color-error)`.
- No Google sign-in, no sign-up, no magic link — admin only.
- On success: `window.location.reload()` — forces server components to re-render with fresh auth context. **No `router.push` needed.**

---

## Section 2: Admin Header

- Full-width sticky bar, `background: var(--color-navy)`, height 56px, `z-index: 100`.
- Left: "P" logomark (white) + "PhysioOnClick" in DM Sans 16px semibold white + gold "Admin" badge (8px gold border, gold text, border-radius 999px, padding 2px 8px).
- Right: signed-in email in `var(--color-text-secondary)` 13px + "Sign out" text button in teal 13px.
- Below the bar: three tab buttons — **Bookings · Enquiries · Live Stats**.
  - Active tab: teal underline 2px, navy text bold.
  - Inactive tab: muted text, no underline.
  - Default active: Bookings.

---

## Section 3: Bookings Tab

### Status auto-resolution
Computed at render time (no Firestore write). Rule applied in order:
1. If stored status is `cancelled` → `cancelled` (never overridden).
2. If `appointmentDate` is in the past → display as `completed`.
3. If `appointmentDate` is in the future → display as `upcoming`.
4. Otherwise → display stored status.

`appointmentDate` is parsed from `appointmentLabel` (format: "Thursday, 2 July 2026 at 11:00") using `new Date(appointmentLabel)`. If parsing returns `NaN` (e.g. label is "TBC"), the stored status is shown unchanged.

### Filter chips (client-side)
Row of pills above the table: **All · Pending · Upcoming · Completed · Cancelled**
Each chip shows a count badge. Clicking filters the displayed rows. Active chip: teal background + white text.

### Table columns (6)
| Column | Content |
|---|---|
| Patient | `patientName` bold + `email` muted, stacked |
| Service | service name |
| Appointment | date + time, or "TBC" in muted italic |
| Status | colour-coded pill (see below) |
| Actions | Cancel + Reschedule buttons side-by-side |
| Summary | "Write summary" button or "✓ Published" in green |

### Status badge colours
| Status | Background | Text |
|---|---|---|
| pending | `var(--color-gold-light)` | `var(--color-gold)` |
| upcoming | `var(--color-teal-light)` | `var(--color-teal)` |
| completed | `#D1FAE5` | `#059669` |
| cancelled | `#FEE2E2` | `var(--color-error)` |

### Actions
- Cancel: small red outlined button; disabled + greyed when status is `cancelled`.
- Reschedule: small teal outlined button; links to `https://cal.com/reschedule/{calBookingUid}`; hidden when `calBookingUid` is absent.
- Both always fully visible (no overflow cut-off).

---

## Section 4: Summary Drawer

Triggered by "Write summary" button on a completed booking row.

### Behaviour
- Slides in from the right, width 480px (desktop), full-width (mobile < 640px).
- Semi-transparent navy backdrop (`rgba(13,27,42,0.5)`) behind drawer.
- Escape key closes; backdrop click closes.
- Scroll locked on the main page while drawer is open.

### Header
"Session Summary" in DM Serif Display 22px navy + patient name in muted DM Sans 14px + service name + × close button.

### Assessment Scores block (new)
1. **Pain level today** (required)
   - Label: "Pain level (0 = no pain, 10 = worst)"
   - `<input type="range" min=0 max=10 step=1>` styled with teal thumb + coloured track (green at 0 → red at 10).
   - Current value shown as a pill beside the slider (colour matches track position).
   - Stored as `painScore: number`.

2. **Recovery progress** (required)
   - Label: "Estimated recovery progress"
   - Number input 0–100, suffix "%" displayed beside it.
   - Circular progress ring (SVG, teal fill, navy track, 64px diameter) updates live as number changes.
   - Stored as `recoveryPercent: number`.
   - Stored in `sessionSummaries/{id}.recoveryPercent`. Surfacing this in the patient portal `RecoveryPercentCard` is out of scope for this plan (patient portal currently reads pain logs only).

3. **Session outcome** (required)
   - Three pill toggle buttons (single-select):
     - "Improving ↑" → green when selected
     - "Stable →" → amber when selected
     - "Setback ↓" → red when selected
   - Stored as `sessionOutcome: "improving" | "stable" | "setback"`.

### Session notes block (existing fields, restyled)
- "What we worked on today" — textarea, 3 rows, required.
- "Exercises assigned" — textarea, 3 rows, required.
- "Next steps & advice" — textarea, 3 rows, required.
- All use `var(--color-border)` border + `var(--color-teal)` focus border.

### Follow-up block
- Label: "Recommend follow-up in"
- Pill button row (single-select): **None · 1 wk · 2 wks · 4 wks · 6 wks · 8 wks**
- Default: 2 wks (matches current default).
- Stored as `followUpWeeks: number` (0 for None).

### Footer
- "Publish Summary" — full-width teal filled button. Disabled until `painScore`, `recoveryPercent`, `sessionOutcome`, `workedOn`, `exercises`, `nextSteps` are all filled.
- "Cancel" — text link, muted, closes drawer without saving.

### Data contract extension (`PublishSummaryInput`)
```ts
painScore: number;          // 0–10
recoveryPercent: number;    // 0–100
sessionOutcome: "improving" | "stable" | "setback";
// existing fields unchanged
workedOn: string;
exercises: string;
nextSteps: string;
followUpWeeks: number;
```

---

## Section 5: Enquiries Tab

### Table columns (6)
| Received | Name | Service | Email | Message | Status |
|---|---|---|---|---|---|

- **Message** column: truncated to 2 lines with CSS `line-clamp`. Full message expands on row click (accordion, no modal).
- **Status** badge: clickable inline toggle.
  - `new` → gold pill. Click → update Firestore to `in-progress` → teal pill.
  - `in-progress` → teal pill. Click → update Firestore to `resolved` → green pill.
  - `resolved` → green pill. Click → cycles back to `new`.
  - Optimistic update: badge changes immediately; Firestore write happens in background.
- Above table: "11 enquiries · 8 new" summary line.

### Firestore update
Client-side using `updateDoc(doc(db, "enquiries", id), { status: nextStatus })`.
No server action needed — the client auth token has admin claim so Firestore rules allow the write.

---

## Section 6: Live Stats Tab

### Layout
2×2 grid (desktop), 1-column stack (mobile < 640px).

### Stat cards (4 primary)
Each card: white surface, `var(--color-border)` border 1px, border-radius 20px, padding 1.5rem.

| Card | Primary number | Secondary detail |
|---|---|---|
| Blogs | live count (DM Serif Display 48px navy) | "Live from Firestore" muted |
| Bookings | live count | "X pending · Y upcoming" in coloured pills |
| Enquiries | live count | "X new" in gold pill |
| Revenue | £520 (or live Stripe total) | "Projected from packages" muted |

### Secondary info row (existing)
Smaller cards below the 2×2 grid: Blog count (108), Pricing products (4), Testimonials (3) — same data as today, restyled with tokens.

---

## Bug Fixes (bundled)

### 1. Post-sign-in redirect loop
**Before:** `router.push("/admin")` on the admin page is a no-op (same URL); "Redirecting…" message hangs.
**Fix:** Replace with `window.location.reload()` inside `AdminSignIn` after successful sign-in. The page re-renders with auth state established.

### 2. Stale appointment status
**Before:** Bookings remain "pending" or "upcoming" in the table after their date has passed.
**Fix:** Client-side status resolution in `AdminBookingsTable` — compare parsed appointment date against `new Date()` at render time. No Firestore writes.

---

## Design Tokens Used

All from existing `:root` in `app/globals.css`:
```
--color-navy, --color-teal, --color-teal-light, --color-teal-dark
--color-gold, --color-gold-light, --color-gold-dark
--color-bg, --color-surface, --color-border
--color-text-primary, --color-text-secondary
--color-error, --color-success
--font-serif (DM Serif Display), --font-sans (DM Sans)
```

No new tokens required.

---

## Out of Scope

- Admin blog editor (create/edit/delete blog posts)
- Stripe refund processing UI
- Admin patient record detail page
- Role-based access beyond admin/non-admin
