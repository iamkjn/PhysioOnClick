# Site audit — 2026-07-15 (Phase 0 of the design pass)

Sources: browser walkthrough (desktop 1280, mobile 375) + two code audits. Prioritized.

## Systemic (Phase 1 — foundation)

1. **Reveal component blanks pages.** `components/reveal.tsx` hides all wrapped content with GSAP (`opacity: 0`) and reveals via ScrollTrigger. Observed: whole pages (pricing, contact) render blank or ghosted when the animation stalls; content invisible until JS loads. → Replace with IntersectionObserver + CSS, visible-by-default.
2. **No type scale.** ~90 distinct font sizes in `globals.css`; H1-equivalents span 8 unrelated sizes. → `--text-*` tokens, migrate headings/sections/cards.
3. **Section rhythm inconsistent** (3 / 4.2 / 5rem). → `--space-section`.
4. **Off-token radii**: `.button` 14px, `.panel` 18px, chat widget 18/20px, rehab cards 14px — none on the 22/15/13/10/999 scale.
5. **Undefined classes render pages unstyled**: `/glasgow-physiotherapist` (`.page-hero`, `.two-col`, `.info-card`, `.map-frame`… — 10 classes, none exist), patient dashboard `.dashboard-grid`, exercise library `.card`/`.card-grid`, bare `.eyebrow` on pricing/glasgow (only scoped variants exist).
6. **Accent rgba hand-typed 9×** (`rgba(14,165,233,…)`) instead of deriving from the token.
7. **Mobile header** stacks logo above hamburger (~140px waste). Hero location pill stretches full width.

## Public pages (Phase 2)

- Service cards show title/description **twice** — once baked into the SVG cover image, once as HTML below it (home + services).
- Pricing CTA band uses plain `.panel` while About uses branded `.simple-cta-band` — same CTA, two treatments.
- Chat widget: ~150 lines of inline styles, own micro type/radius scale, raw hex, manual JS hover, no focus ring.
- Blog directory: no empty state when a category filter matches nothing.
- 5 near-identical pill/chip implementations → migrate onto `.pill`.
- Booking `.book-cta` diverges from sitewide `.button.primary` (padding/hover).
- Hero art is washed-out abstract SVG; trust chips wrap raggedly on mobile.

## Portal + admin (Phase 3)

- **Portal reads as unstyled MVP**: nearly everything is inline `style={{}}`; the public site's `.button` (with hover/focus states), `ConfirmDialog`, `Toast`, `EmptyState`, `.dashboard-table` CSS all exist and are almost entirely unused here.
- `app/patient/people/page.tsx` uses browser `confirm()` to remove a dependent; admin booking cancel has **no confirmation at all**.
- `pain-check-in` (11 hardcoded hex stops) and `summary-form` (3 token buckets) color the same pain score two different ways.
- Admin stats: 4 identical-weight cards, one of which ("Projected revenue") is a hardcoded fake number indistinguishable from live data.
- Card radii scatter (10–20px); duplicated inline pill-link/input/table styles across files.
- Zero admin/patient selectors in any `@media` block — logged-in surfaces have no explicit responsive rules.
- Empty states inconsistent (illustrated `EmptyState` vs plain `<p>`).
- Dead code: `progress-chart.tsx` unused; `.dashboard-table*` CSS unused; `confirm-dialog.tsx` unused.

## Kept

Uncommitted a11y work (AA contrast grades, skip link, focus ring, reduced-motion catch-all, SVG chat icon) reviewed and committed as `771e381`.
