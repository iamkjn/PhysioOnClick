# PhysioOnClick — Site Improvement Plan

Permanent, consolidated record of a 5-judge review of the PhysioOnClick marketing/booking site
(repo `~/Documents/Krunal_`). Findings from all five lenses are merged below, deduped, and tagged
with the lenses that raised each one (agreement = higher priority). Every finding was sanity-checked
against the actual code before inclusion; verification notes are inline.

**Lenses**
1. First-time patient in pain deciding whether to book (conversion)
2. Senior visual designer auditing craft vs `DESIGN.md` (The Clarity System)
3. Healthcare copywriter & content strategist
4. UX & accessibility auditor
5. Local trust / SEO / schema / booking-friction / pricing auditor

---

## Overall verdict

Underneath a competently-built "Clarity System" UI, the site has a consistent pattern of failures
at exactly the moments that decide trust and bookings:

- **The site's headline differentiator — in-person Glasgow care / "home visits" — is marketed on
  five+ pages but cannot be priced or booked anywhere, and the chat widget quotes three specific
  in-person prices (£65/£50/£80) that exist nowhere a human can pay them.** Raised by lenses 1, 3, 5.
  This is the single most-agreed finding and is a healthcare-grade misrepresentation risk, not just a
  UX gap.
- **The conversion path throws away intent.** Every `Book Assessment` CTA encodes `?service=…` but the
  booking flow never reads it; `/pricing` CTAs don't even pass one. Lens 1 + 4.
- **No phone number, no verifiable address anywhere.** Contact page literally prints "Phone: Contact
  via form"; both maps are a bare `Glasgow UK` city query. Lenses 1, 3, 4, 5.
- **The 108-post blog is a 9×12 mad-lib** with identical excerpts, identical meta descriptions, and a
  boilerplate line that leaks its own array index ("Article {index+1}…") into the copy. Lenses 2, 3, 5.
- **Real accessibility breaks in navigation, dialogs, and the booking funnel** — an always-mounted
  mobile nav in the tab order, an unnamed destructive confirm dialog with no focus management,
  sub-44px tap targets on the money page. Lens 4.
- **Technical SEO own-goals** — `/admin` and `/patient` listed as indexable in the sitemap, no
  Disallow in robots, no site-wide schema, no blog URLs in the sitemap. Lens 5.

A note on the screenshots: lens 2 reported "every page renders with zero CSS." **This is a
capture-tool artifact, not a production bug** — the inline SVG data-URIs render fine in the same
shots, proving HTML + inline assets load; only the external stylesheet/fonts didn't load in the
capture harness. Do not action it as a code change; verify once in a real browser. **However**, the
same shots confirm a *real* bug lens 2 also flagged: the homepage `<h1>` and CTAs are absent from the
server-rendered HTML because the whole hero is gated behind a client-side Firebase-auth resolve
(`home-hero-section.tsx` returns a skeleton until `resolvedAuth`). That is genuine and fixable.

---

## Findings by theme

Severity: **P0** = trust/legal or conversion-critical · **P1** = important · **P2** = polish.
Each finding is tagged **[FIXABLE NOW]** (code-only: tokens, copy, markup, metadata, a11y attrs) or
**[DEFERRED]** (needs a business decision, real photography, or backend work).

### Theme A — The in-person / "home visits" promise vs. the product

**A1. In-person Glasgow care is marketed everywhere but cannot be priced or booked. [P0]**
Lenses 1, 3, 5 (strong agreement).
`lib/site-data.ts` `pricing[]` has zero `mode: "In-person"` items, so `app/pricing/page.tsx`'s
`{inPerson.length > 0 && …}` "In-Person Sessions (Glasgow home visits)" block never renders
(verified). `lib/cal-services.ts` defines only online tiers, so `/book` has no in-person option.
Yet the home trust bar ("Home visits in Glasgow"), hero copy ("In-person in Glasgow or online"),
`/about` highlights, `/services` hero, `/glasgow-physiotherapist` FAQ ("Do you offer in-person
physiotherapy in Glasgow? **Yes.**"), `/contact`, and the footer all sell it.
*Fix:* decide the real-world model, then either (a) ship an in-person `PricingItem` + Cal.com event
type + booking option, or (b) strip every in-person/home-visit claim and reposition as "online
physiotherapy, UK-wide." **[DEFERRED — business decision]** (which is true?).
Files: `lib/site-data.ts`, `lib/cal-services.ts`, `components/booking-flow.tsx`, `app/pricing/page.tsx`, `app/page.tsx`, `components/home-hero-section.tsx`, `app/about/page.tsx`, `app/services/page.tsx`, `app/glasgow-physiotherapist/page.tsx`, `app/contact/page.tsx`, `components/site-footer.tsx`.

**A2. The chat widget quotes fabricated, unbookable in-person prices. [P0]** Lenses 1, 3.
`components/chat-widget.tsx` `PRICING_TEXT` lists "In-person sessions (Glasgow): Initial Assessment
(45 min) — £65 / Follow-Up (30 min) — £50 / Extended Session (60 min) — £80" (verified). None of
these exist in `pricing[]` or the booking flow. Safe to fix regardless of the A1 decision: align the
chat script to the *actually bookable* products (online £50/£40 + packages £180/£340).
**[FIXABLE NOW]** — remove the three fabricated in-person lines. File: `components/chat-widget.tsx`.

**A3. The site can't agree whether in-person means "home visit" or "clinic." [P1]** Lens 3.
Footer / `/contact` / `/pricing` meta say "home visits" (physio travels to patient); `/about` stat
card says "Glasgow clinic care"; every service cover SVG bakes in "Glasgow clinic and online"
(`lib/service-image-svg.ts` line 165). Operationally different models used interchangeably.
*Fix:* pick one term everywhere. Tied to A1. **[DEFERRED — business decision]** (part resolvable in
copy once model is chosen). Files: `lib/service-image-svg.ts`, `app/about/page.tsx`, `app/contact/page.tsx`, `app/pricing/page.tsx`, `components/site-footer.tsx`.

### Theme B — Conversion path & booking funnel

**B1. Every "Book" CTA discards the service intent it encodes. [P0]** Lenses 1, 4.
`app/services/page.tsx` links to `/book?service=${encodeURIComponent(service.title)}` but
`components/booking-flow.tsx` hard-codes `useState<BookServiceId>("initial-assessment")` and never
reads `useSearchParams` (verified). `/pricing` CTAs link bare to `/book`.
*Fix:* read `?service=` in booking-flow and initialise `serviceId`; have `/pricing` CTAs pass the real
`BookServiceId` (`follow-up`, `bundle-4`, `bundle-8`); have `/services` CTAs pass a valid id.
**[FIXABLE NOW]** Files: `components/booking-flow.tsx`, `app/services/page.tsx`, `app/pricing/page.tsx`.

**B2. Homepage `<h1>` + CTAs are not in the server-rendered HTML. [P0]** Lens 2 (verified).
`components/home-hero-section.tsx` returns a skeleton while `resolvedAuth` is false, so the H1
"Expert Physiotherapy, One Click Away", subhead, and both CTAs only appear after Firebase auth
resolves client-side. Bad for SEO and first paint.
*Fix:* render the guest hero markup by default (so the H1/CTAs are in initial render) and only swap to
`HomeDashboard` once a signed-in `user` is confirmed. **[FIXABLE NOW]** File: `components/home-hero-section.tsx`.

**B3. Price never appears where the clinical decision is made. [P1]** Lens 1.
Each `/services` card ends in "Book Assessment" with no price; the patient must leave for `/pricing`
and cross-reference. *Fix:* show a "From £50 online" starting price under each service CTA.
**[FIXABLE NOW]** File: `app/services/page.tsx`.

**B4. Cancellation/refund reassurance is hidden until inside the wizard. [P2]** Lens 1.
"Free to reschedule up to 24 hours before your session" lives only in the `/book` rail
(`booking-flow.tsx` line 145), not on `/pricing` where the £340 decision is made. The `included[]`
list on `/pricing` has no reschedule/refund line. *Fix:* add a one-line reschedule reassurance under
the package cards. **[FIXABLE NOW]** File: `app/pricing/page.tsx`.

**B5. Booking forces mid-checkout password creation; no guest/magic-link path. [P1]** Lenses 4, 5.
`components/booking-step-time.tsx` (line ~362) requires name+email+**password** (`minLength=6`,
`createUserWithEmailAndPassword`) to confirm — contradicting the product's low-friction principle,
despite an existing magic-link flow (`app/api/auth/magic-link`). *Fix:* book as guest (name+email),
send confirmation + login link, claim account passwordlessly after. **[DEFERRED — backend/product]**
File: `components/booking-step-time.tsx`.

### Theme C — Trust signals (phone, address, reviews, founder)

**C1. No phone number anywhere on the site. [P0]** Lenses 1, 3, 4, 5 (strong agreement).
`app/contact/page.tsx` renders "Phone: Contact via form" (verified); footer repeats "Contact via
booking form." Blocks click-to-call, NAP consistency for local SEO, and reassurance for anxious/
elderly/home-visit patients. *Fix:* publish a real `tel:` number in header, footer, `/contact`, and
LocalBusiness schema. **[DEFERRED — needs a real business phone number]**; the *fixable* part is to
stop labelling a non-answer "Phone" (see C1b).
Files: `components/site-header.tsx`, `components/site-footer.tsx`, `app/contact/page.tsx`, `app/glasgow-physiotherapist/page.tsx`.

**C1b. Contact page's "Phone: Contact via form" reads as a broken field; email is plain text. [P1]**
Lenses 3, 4. *Fix:* drop the misleading "Phone" row (or replace with honest "Prefer to talk? Leave
your number and we'll call back"), and make the email a real `mailto:` (the pattern already exists in
`contact-form.tsx` line 178). **[FIXABLE NOW]** File: `app/contact/page.tsx`.

**C2. No verifiable address; both maps are a generic city query. [P1]** Lenses 3, 5.
`/contact` and `/glasgow-physiotherapist` embed `google.com/maps?q=Glasgow%20UK&output=embed` — a
city-wide map, no pin, no street address in footer/schema. *Fix:* publish a real address or a stated
service-area postcode and pin it; if home-visits-only, drop the "Clinic map" heading for a service-
area statement. **[DEFERRED — business decision]** Files: `app/contact/page.tsx`, `app/glasgow-physiotherapist/page.tsx`.

**C3. Founder photo is unrelated hotlinked Unsplash stock. [P0-trust]** Lenses 2, 5.
`app/about/page.tsx` line 93 hotlinks `images.unsplash.com/photo-1666214280391…` alt "Clinical
physiotherapy consultation" — a generic tech/control-room scene, not Shivaliba Zala, sitting exactly
where a real headshot does the most trust work (verified). *Fix:* replace with a real photo of the
practitioner or genuinely licensed on-brand imagery. **[DEFERRED — needs real photography]** File: `app/about/page.tsx`.

**C4. No verifiable third-party reviews; only 3 uncredited testimonials. [P1]** Lenses 1, 3, 5.
`lib/site-data.ts` `testimonials[]` has 3 first-name+initial quotes, shown once on the homepage, no
stars/photos/review count/source link. `/glasgow-physiotherapist` ships a literal
`{/* Google Business Profile review embed goes here */}` stub. No DBS/indemnity-insurance statement
near the home-visit/paediatric copy. *Fix:* surface a real GBP star rating + count, link testimonials
to source, state DBS/indemnity. **[DEFERRED — needs real GBP/business data]**. The *fixable* slice:
wire the existing `testimonial.focus` field to place a matching quote on `/services` and `/pricing`
(more social proof from existing data). Files: `app/page.tsx`, `lib/site-data.ts`, `app/glasgow-physiotherapist/page.tsx`, `app/services/page.tsx`, `app/pricing/page.tsx`.

**C5. No availability/capacity signal for a sole practitioner. [P2]** Lens 1.
*Fix:* add "Usually booking within 2–3 days" or a live next-slot pull near the primary CTA.
**[DEFERRED — business/backend]** Files: `components/home-hero-section.tsx`, `lib/site-data.ts`.

### Theme D — Content & copy

**D1. The 108-post blog is a mechanical mad-lib. [P0-SEO]** Lenses 2, 3, 5 (strong agreement).
`lib/blog.ts` builds all 108 posts as `${topic} and ${category}: a practical UK physiotherapy guide`
with (1) identical `excerpt`, (2) identical `seoDescription`, (3) the same five section headings, and
a boilerplate line that leaks the index: "Article {index+1} is designed to support…" (verified).
Duplicate meta across 100+ URLs is a Search Console / Helpful-Content (YMYL) demotion trigger; a
reader who opens two posts spots the template instantly.
*Fix (fixable slice):* generate a **unique** `excerpt` and `seoDescription` per article (derive from
its own topic+category) and remove the array-index leak from the body boilerplate. **[FIXABLE NOW]**
*Fix (deferred):* cut the corpus to genuinely distinct, clinician-authored/reviewed posts; add author
byline + last-reviewed date + `BlogPosting`/`MedicalWebPage` JSON-LD. **[DEFERRED — content/editorial]**
Files: `lib/blog.ts`, `app/blog/[slug]/page.tsx`.

**D2. Authored trust copy exists but is never shipped. [P1]** Lens 3 (verified).
Every service in `site-data.ts` has a `faqs[]` (12 Q&As) that `app/services/page.tsx` never reads
(zero `.faqs` call sites), and the `stats[]` export ("4+ years", "6 services", "100+ resources",
"24h response") is imported by nothing. *Fix:* render `service.faqs` as an FAQ block per service card;
surface `stats` on the homepage/About. **[FIXABLE NOW]** Files: `app/services/page.tsx`, `lib/site-data.ts`, `app/about/page.tsx`.

**D3. Same stock adjectives recur verbatim sitewide. [P2]** Lens 3.
"evidence-based" ×8, "calm" ×4, "structured" ×8; "transparent pricing" and "clear pricing" two lines
apart on `/glasgow-physiotherapist`. Reads as template filler vs `PRODUCT.md`'s "warm expert."
*Fix:* one strong "evidence-based" per page max; replace the rest with concrete specifics.
**[FIXABLE NOW — copy]** Files: `app/page.tsx`, `app/about/page.tsx`, `app/services/page.tsx`, `app/glasgow-physiotherapist/page.tsx`, `app/blog/page.tsx`, `lib/site-data.ts`.

**D4. Founder bio is thin and uses euphemistic "exposure/placement" phrasing. [P1]** Lens 3.
No HCPC registration number, no concrete role detail, no outcome vignette. *Fix:* factual NHS role
sentence, HCPC PIN for independent verification, 1–2 anonymised outcome vignettes.
**[DEFERRED — needs real facts from founder]** Files: `app/about/page.tsx`, `lib/site-data.ts`.

**D5. No "what happens in your first session" explainer. [P1]** Lens 3.
*Fix:* add a short "What to expect at your first appointment" section above the booking flow.
**[FIXABLE NOW — copy]** File: `app/book/page.tsx`.

### Theme E — Visual craft (Clarity System)

**E1. "No CSS applied" in every screenshot. [—]** Lens 2. **Capture-tool artifact, NOT a code bug**
(inline SVGs render in the same shots). Do not action; verify once in a real browser's Network tab.
**[DEFERRED — verification only]** Files: `app/layout.tsx`, `app/globals.css`.

**E2. Service cover SVGs bake in repeated text chips. [P1]** Lens 2 (verified).
`lib/service-image-svg.ts` renders "PhysioOnClick", the category label, and "Glasgow clinic and
online" as vector text in identical positions on all 6 covers — duplicating the real H3/body one line
below, non-selectable, non-indexable, and making 6 "bespoke" illustrations read as one palette-swap
template. *Fix:* strip the baked-in text chips; keep only gradient + bespoke icon.
**[FIXABLE NOW]** File: `lib/service-image-svg.ts`.

**E3. Broken-image glyphs on some cover routes. [P1]** Lens 2.
About specialism-card images and homepage service-card images (mobile only) rendered as broken-image
icons in captures. *Fix:* check `app/specialism-images/` and `app/service-images/` route handlers for
width/DPR/srcset request shapes that fail and confirm valid `image/svg+xml` across every size Next
requests. **[FIXABLE NOW — needs route-handler investigation]** Files: `app/specialism-images/`, `app/service-images/`, `app/about/page.tsx`, `app/page.tsx`. *(Note: this needs verification against the live routes; may be the same capture artifact. Investigate before editing.)*

### Theme F — Accessibility (lens 4)

**F1. Mobile nav panel stays in the tab order & AT tree when closed. [P0-a11y]** (verified)
`components/site-header.tsx` mounts `.mobile-nav-panel` unconditionally; `app/globals.css` (2987–3009)
hides it only with `opacity:0; pointer-events:none` — never `display/visibility/aria-hidden`. Keyboard
users tab through 7–8 invisible duplicate links at every viewport.
*Fix:* add `aria-hidden={!menuOpen}` + `inert={!menuOpen}` on the panel, and switch the closed CSS
state to `visibility:hidden` (→ `visibility:visible` on `.open`). **[FIXABLE NOW]**
Files: `components/site-header.tsx`, `app/globals.css`.

**F2. ConfirmDialog: unnamed modal, no focus management/trap. [P0-a11y]** (verified)
`components/confirm-dialog.tsx` has `role="dialog" aria-modal="true"` but no `aria-labelledby`/
`describedby`, never moves focus in on open, never restores focus on close, no focus trap (only Escape
handled). Used for irreversible booking cancellation. *Fix:* id the `<h3>`/`<p>` and reference via
`aria-labelledby`/`aria-describedby`; focus the dialog/Cancel on open; restore focus on close; trap
Tab between the two buttons. **[FIXABLE NOW]** File: `components/confirm-dialog.tsx`.

**F3. Sub-44px tap targets on the booking calendar (mobile). [P1-a11y]** (verified)
`app/globals.css`: `.book-cal-day{height:32px}` (3611), `.book-cal-nav{28×28}` (3580) — below the 44px
comfortable target and the system's own 46px standard. *Fix:* `.book-cal-day` ≥ 44px, `.book-cal-nav`
≥ 40×40, adjust `.book-cal-grid` gap. **[FIXABLE NOW]** File: `app/globals.css`.

**F4. Chat drawer dialog: no Escape, no focus management. [P1-a11y]** (verified)
`components/chat-widget.tsx` drawer is `role="dialog"` but has no Escape handler and no focus move/
restore. *Fix:* add Escape-to-close, focus first element on open, restore focus to trigger on close.
**[FIXABLE NOW]** File: `components/chat-widget.tsx`.

**F5. Toasts: fixed 3s auto-dismiss, no dismiss control, all `aria-live="assertive"`. [P1-a11y]**
(verified) `components/toast.tsx` auto-removes success/info after 3000ms with no dismiss button and
uses `assertive` for routine "Welcome back" info. Fails WCAG 2.2.1. *Fix:* give auto-dismiss toasts a
dismiss control (and/or pause on hover/focus); use `aria-live="polite"` for success/info, reserve
`assertive` for warning/error. **[FIXABLE NOW]** File: `components/toast.tsx`.

**F6. Broken heading hierarchies. [P1-a11y]** (verified)
`app/services/page.tsx`: h1 → h2 → **h4** ("Treatment Approach", skips h3); "Conditions Treated" is a
`<div>` not a heading. `app/glasgow-physiotherapist/page.tsx`: h1 → **h3** ("Local patient benefits"
aside) → h2 ("Why local patients book"). *Fix:* services "Treatment Approach" → h3, "Conditions
Treated" → h3; glasgow "Local patient benefits" → h2. **[FIXABLE NOW]**
Files: `app/services/page.tsx`, `app/glasgow-physiotherapist/page.tsx`.

**F7. Booking date-picker uses invalid ARIA grid structure. [P2-a11y]** (verified)
`components/booking-step-time.tsx` line 250 puts `role="grid" aria-label="Choose a date"` on a `<div>`
whose children are bare `<span>`/`<button>` (no `role="row"`/`gridcell"`). *Fix:* drop the grid role in
favour of `role="group"` (matching `.book-slots`). **[FIXABLE NOW]** File: `components/booking-step-time.tsx`.

**F8. Dynamic status regions not announced. [P1-a11y]** (verified)
`components/contact-form.tsx` `.form-note` (175) and `components/blog-directory.tsx` `.blog-result-count`
(84) update visible text with no `aria-live`/`role="status"`; contact `.field-error` spans aren't wired
to inputs via `aria-describedby`/`aria-invalid`. *Fix:* add `role="status" aria-live="polite"`; id each
`.field-error` and reference from its input's `aria-describedby`, set `aria-invalid`.
**[FIXABLE NOW]** Files: `components/contact-form.tsx`, `components/blog-directory.tsx`.

**F9. `/blog` renders all 108 posts unpaginated in one client list. [P1]** Lens 4.
`components/blog-directory.tsx` renders `getPublicBlogs()` with no pagination/virtualization (a single
~52,000px-tall page). *Fix:* paginate (12–20/page with real `?page=N` URLs) or "Load more" + back-to-top.
**[FIXABLE NOW]** Files: `components/blog-directory.tsx`, `app/blog/page.tsx`.

**F10. Footer links whose text lies about their destination. [P2-a11y]** Lens 4 (verified).
`components/site-footer.tsx` 33–35: "Glasgow, Scotland, UK" → `/glasgow-physiotherapist`;
"hello@physioonclick.co.uk" → `/contact` (not `mailto:`); "Contact via booking form" → `/contact`.
Also `/glasgow-physiotherapist` is orphaned from the primary nav. *Fix:* relabel the Glasgow link
("Physiotherapist in Glasgow"), make the email a real `mailto:`, point/relabel the booking-form link.
**[FIXABLE NOW]** Files: `components/site-footer.tsx`, `components/site-header.tsx`.

### Theme G — Technical SEO / schema / metadata (lens 5)

**G1. `/admin` and `/patient` listed as public indexable URLs; robots has no Disallow. [P0-SEO]**
(verified) `app/sitemap.ts` includes `/patient` and `/admin`; `app/robots.ts` allows `*` on `/` with
no Disallow. *Fix:* remove `/admin`, `/patient` from the sitemap; add `Disallow: ["/admin","/patient",
"/api"]` to robots. **[FIXABLE NOW]** Files: `app/sitemap.ts`, `app/robots.ts`.

**G2. Sitemap omits all 108 blog URLs. [P1-SEO]** (verified)
`app/sitemap.ts` lists 12 static routes only. *Fix:* iterate `blogArticles` and emit an entry per slug
with its `publishedAt` as `lastModified`. **[FIXABLE NOW]** Files: `app/sitemap.ts`, `lib/blog.ts`.

**G3. Almost no structured data. [P1-SEO]** (verified)
Only `/glasgow-physiotherapist` has JSON-LD, and that `MedicalBusiness` block lacks `telephone`,
`address.streetAddress`, `openingHours`, `priceRange`, `sameAs`. No site-wide Organization/
LocalBusiness in `app/layout.tsx`, no `Person`/`Physician` on `/about`, no `FAQPage` on the existing
FAQ arrays. *Fix:* add site-wide Organization/LocalBusiness in layout, `Person` on About, wrap
`faqItems`/`service.faqs` in `FAQPage`. **[FIXABLE NOW]** (telephone/address values deferred to C1/C2)
Files: `app/layout.tsx`, `app/about/page.tsx`, `app/glasgow-physiotherapist/page.tsx`, `app/services/page.tsx`.

**G4. No favicon, apple-touch-icon, or OG image. [P2-SEO]** (verified)
`public/` has only the hero SVG; `app/layout.tsx` `openGraph` has no `images`. Shared links render
blank preview cards. *Fix:* add favicon/apple-touch-icon set + a 1200×630 OG image referenced in
metadata. **[DEFERRED — needs image assets]** (the metadata wiring is trivial once assets exist).
Files: `app/layout.tsx`, `public/`.

---

## Fixability summary

**Fixable now (code-only) — the workstreams below cover these:**
A2 · B1 · B2 · B3 · B4 · C1b · C4(partial: focus-field wiring) · D1(partial) · D2 · D3 · E2 · F1–F10 · G1 · G2 · G3(structure).

**Deferred (business decision / photography / backend / assets):**
A1 (does in-person exist?) · A3 (which model) · B5 (guest booking) · C1 (real phone) · C2 (real address)
· C3 (real founder photo) · C4 (real GBP/DBS data) · C5 (availability feed) · D1 (corpus rewrite) ·
D4 (bio facts/HCPC PIN) · E1 (verify only) · E3 (route-handler investigation — verify first) ·
G3 (telephone/address values) · G4 (OG/favicon image assets).

---

## Parallel workstreams (fixable-now work)

Each repo file appears in **exactly one** workstream. Full self-contained instructions live in the
fixer briefs; summary here.

- **WS1 — Conversion path & page content:** `home-hero-section.tsx`, `booking-flow.tsx`,
  `app/services/page.tsx`, `app/pricing/page.tsx`. (B1, B2, B3, B4, D2-services, F6-services)
- **WS2 — Interaction-layer a11y & tokens:** `app/globals.css`, `site-header.tsx`, `confirm-dialog.tsx`,
  `toast.tsx`, `booking-step-time.tsx`. (F1, F2, F3, F5, F7)
- **WS3 — SEO / schema / metadata:** `app/sitemap.ts`, `app/robots.ts`, `app/layout.tsx`,
  `app/about/page.tsx`, `app/glasgow-physiotherapist/page.tsx`. (G1, G2, G3, F6-glasgow, D2-about, C3-alt)
- **WS4 — Content generation & cover art:** `lib/blog.ts`, `lib/service-image-svg.ts`, `chat-widget.tsx`.
  (D1-partial, E2, A2, F4)
- **WS5 — Contact / footer / forms:** `app/contact/page.tsx`, `site-footer.tsx`, `contact-form.tsx`,
  `blog-directory.tsx`. (C1b, F10, F8, F9)

`lib/site-data.ts` intentionally has **no** required code edit in this pass (its fixable uses — rendering
`faqs`/`stats`/`testimonials` — happen in the page files that own those renders; any new in-person or
bio data is deferred). If a fixer needs to add data to it, that must be coordinated as a single
follow-up owner to avoid conflicts.
