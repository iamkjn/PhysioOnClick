# Public Exercise Library — Design Spec (Phase 1)

**Date:** 2026-09-08
**Status:** Design approved (brainstorming), pending written review
**Sub-project 1 of 4** — see "Roadmap" below.

## 1. Goal

Publish a free, professional, search-indexed exercise resource on
`physioonclick.co.uk/exercises` that ranks for "[condition] exercises" queries,
establishes PhysioOnClick as a credible clinical authority, and funnels
visitors to an online physiotherapy assessment.

Payoff: organic traffic (the site currently gets ~none — see the 2026-08-25 SEO
audit) and trust. This is the NHS model (a great free public resource), not the
Wibbi model (a B2B program-builder sold to clinics).

## 2. Scope

**Phase 1 (this spec):** the public library, built on the **158 exercises that
already exist** in `lib/exercises.ts` (all now carry `setup` / `steps` / `cues`
/ `mistakes` / `defaultDosage` / `pose` — see the 2026-09-06 and 2026-09-07
content work). Content stays in `lib/` for Phase 1, read through helper
functions so the Phase 2 Firestore swap is a drop-in — the same static-array +
live-layer + `NEXT_PUBLIC_USE_LIVE_CONTENT` pattern the blog already uses
(`lib/firestore-content.ts`).

### Roadmap (later sub-projects, each its own spec)

| # | Sub-project | Depends on |
|---|---|---|
| 1 | **Public Exercise Library** (this spec) | images generated; Shivaliba sign-off |
| — | **Anatomical illustration set** (cross-cutting) | OpenAI API key |
| 2 | **Content system + admin authoring** — catalogue → Firestore, admin UI for Shivaliba to create/edit/illustrate/set review dates/publish; no developer, no deploy | Phase 1 shipped |
| 3 | **Catalogue expansion** — grow to ~300–400 exercises + more condition hubs, prioritised by what ranks and converts | Phase 2 |
| 4 | **Professional video** — filmed demonstrations, top traffic-pullers first | Phase 1 live long enough to see the winners |

## 3. Decisions locked (brainstorming)

| Decision | Choice |
|---|---|
| Primary purpose | Public authority + patient acquisition (SEO + trust → booking) |
| Media | AI illustrations now; professional video for the traffic-winners later (Phase 4) |
| Image style | **Detailed anatomical illustration** — realistic human figure, working muscles/joint highlighted, physio-textbook / Muscle & Motion look |
| Content system | Firestore + admin authoring UI — but that is **Phase 2**; Phase 1 stays in `lib/` behind an abstraction |
| Library structure | **Condition-led hubs**; canonical exercise pages hang off them |
| Phase 1 first milestone | Ship the public library fast on the existing 158; CMS follows |

## 4. Architecture

### 4.1 Routes

All under `/exercises`, all statically generated at build (`force-static` +
`generateStaticParams`, matching `/services/[slug]` and `/blog/[slug]`), all in
`sitemap.xml`.

| Route | Page | Count | Indexed |
|---|---|---|---|
| `/exercises` | Library index — browse by condition, browse by body area / category, search, featured | 1 | yes |
| `/exercises/for/[condition]` | **Condition hub** (incl. the sports hubs — §10.1a) | ~18–22 | yes |
| `/exercises/[slug]` | Canonical single-exercise page | 158 | yes |
| `/exercises/area/[bodyArea]` | Body-area / category browse (secondary nav) | ~10 | crawled, but `canonical` → `/exercises` (not a ranking target) |
| `/exercises/how-we-make-this` | Methodology / clinical-governance page | 1 | yes |

The `for/` segment namespaces conditions so a condition slug and an exercise
slug can never collide. `area/` is a thin filtered view — it exists for human
navigation and internal linking, not as its own ranking target, hence the
self-referential canonical points back to the index.

### 4.2 Data model (Phase 1 — in `lib/`)

**`lib/exercises.ts` — `Exercise` gains:**

```ts
slug: string;          // "clamshell" — stable, unique, kebab-case, never changes once published
aka?: string[];        // ["clam", "clamshell hip"] — alt names for search + "also known as"
helpsWith?: string[];  // condition slugs this exercise appears in, beyond its primary `condition`
```

`slug` is **required** and enforced unique by a test. The existing `condition`
field stays as the exercise's *primary* condition.

**`lib/conditions.ts` — new. One `Condition` per hub:**

```ts
export type ConditionStage = {
  stage: string;            // e.g. "Settle the pain" / "Build strength" / "Return to activity".
                            // Most conditions have 3 stages; sports hubs have 4 (adds "Power & change of direction").
  blurb: string;            // what this stage is for + how you know you're ready to progress
  exerciseSlugs: string[];  // curated by Shivaliba from the catalogue
};

export type Condition = {
  slug: string;              // "rotator-cuff-tendinopathy"
  name: string;              // "Rotator cuff tendinopathy"
  aka?: string[];            // ["rotator cuff tendinitis", "rotator cuff related shoulder pain"]
  serviceSlug?: string;      // maps to a /services/[slug] for cross-linking
  bodyArea: string;          // "Shoulder" — for the area browse pages
  seoTitle: string;          // "Rotator cuff tendinopathy exercises | PhysioOnClick"
  seoDescription: string;
  intro: string;             // 2–3 short paragraphs, plain language: what it is, why it happens
  whoItHelps: string;        // when these exercises are the right thing; when to get assessed first
  program: ConditionStage[];
  redFlags: string[];        // condition-specific "see a doctor first if…"
  recoveryTimeline: string;  // realistic, evidence-informed
  progressGuidance: string;  // stepping up, easing off, what a normal flare feels like
  faqs: { q: string; a: string }[];   // 3–5
  relatedConditionSlugs?: string[];
  relatedBlogSlugs?: string[];
  reviewedBy: string;        // "Shivaliba Zala"
  reviewedOn: string;        // ISO date
};
```

**`lib/exercise-library.ts` — new. Read helpers (the abstraction layer):**

```ts
getCondition(slug): Condition | null
allConditionSlugs(): string[]
getExerciseBySlug(slug): Exercise | null
exercisesForCondition(slug): { stage: ConditionStage; exercises: Exercise[] }[]
conditionsForExercise(slug): Condition[]        // primary + helpsWith, resolved
relatedExercises(slug, limit): Exercise[]       // same bodyArea / shared conditions
exercisesByBodyArea(area): Exercise[]
searchLibrary(query): { exercises: Exercise[]; conditions: Condition[] }
```

Every public page imports **only** from `lib/exercise-library.ts`, never from
`lib/exercises.ts` / `lib/conditions.ts` directly. Phase 2 reimplements these
helpers against Firestore with the static arrays as the fallback — no page
changes.

### 4.3 Content-source abstraction

Mirror `lib/firestore-content.ts`: the helpers return static data in Phase 1;
in Phase 2 they check `NEXT_PUBLIC_USE_LIVE_CONTENT` and layer Firestore
documents on top, falling back to the static array per-item. The public pages
never know which source answered.

## 5. Page designs

Design language: **The Clarity System** (`DESIGN.md`). Warm paper `#F6F3EC`
ground, navy `#043246` ink, single working accent `#0A77A8` (never raw
`#0EA5E9` on light backgrounds — 2.77:1). Fraunces for headings/authority, DM
Sans for everything functional. Flat + bordered at rest; elevation only on
hover/focus/overlay. Selected state = tint + border, never a solid fill.
Register: `brand` (these are public marketing pages, like `/services`).

All pages: responsive single-column from ~360px; a right rail appears at
`≥960px` on the hub. Every interactive element has a visible focus ring.
Headings form a strict `h1 → h2 → h3` outline (SEO + a11y). Images carry
descriptive `alt`. Prefers-reduced-motion respected (the system has almost no
motion anyway).

### 5.1 Library index — `/exercises`

- **Hero** (`brand` register): Fraunces `h1` "Exercise library", one-line
  standfirst, a short paragraph — what it is, who it's for, and the standing
  line "Always worth getting assessed if you're not sure — [book an
  assessment]".
- **Search** — a single text input (client-side; filters exercise titles +
  `aka` + condition names). Instant results list; Enter goes to a results
  view. No server round-trip.
- **Browse by condition** — a card grid of the ~18–22 hubs. Each card: body
  area label (DM Sans `label` style), condition name (Fraunces `title`),
  one-line `seoDescription`, exercise count. Hover = lift + shadow.
- **Browse by body area / category** — a compact chip row (Shoulder, Knee,
  Back, Ankle & foot, **Sports & return to activity**, …) →
  `/exercises/area/[bodyArea]`. "Sports & return to activity" is a category
  chip alongside the body-region chips (§10.1a).
- **Featured** — 4–6 hand-picked exercises or hubs (Phase 1: hard-coded;
  Phase 2: editable). 
- **Footer CTA band** — "Not sure where to start? Book an online assessment."

Empty/again-loading: search shows a skeleton row (existing `SkeletonRow`); no
results shows an `EmptyState` ("Nothing matches '…' — try a body part or
condition name").

### 5.2 Condition hub — `/exercises/for/[condition]`

The SEO and conversion workhorse. Layout: main column + sticky right rail at
`≥960px`; rail collapses inline above the program on mobile.

**Order of blocks (top to bottom):**

1. **Breadcrumb** — `Exercises › [Condition]` (`BreadcrumbList` schema).
2. **`h1`** — `[Condition] exercises` (Fraunces headline). The keyword is in
   the `h1` and the `<title>`, not forced into the URL slug.
3. **Byline** — 28px initials avatar (accent tint bg), "Shivaliba Zala,
   HCPC-registered physiotherapist · #[number]", "Clinically reviewed
   [reviewedOn]" with a `ti-shield-check`-style tick. Renders `Person` +
   `lastReviewed` schema.
4. **Intro** — `condition.intro`, DM Sans body, ~2–3 short paragraphs.
5. **Red-flag box** — coral-tint background (`#FFF1EC`), coral border, warning
   icon, heading "See a doctor first if", `condition.redFlags` as a short
   inline list. Sits high, before the exercises, deliberately.
6. **The staged program** — one bordered container, a stacked sequence of
   stages:
   - Stage header: a tint+border pill "Stage 1", stage name (Fraunces title),
     `stage.blurb` (DM Sans, muted).
   - Exercise cards in a responsive grid (`repeat(auto-fit, minmax(180px,
     1fr))`): the **anatomical illustration thumbnail** (or stick-figure
     fallback), title, `formatDosage(resolveDosage(ex))` one-liner, "Full
     instructions →" linking to `/exercises/[slug]`. Hover = lift.
   - Cards are `<a>` wrapping the whole tile (large tap target); the inner
     "Full instructions" is a visual affordance, not a nested link.
7. **How to progress** + **Recovery timeline** — two side-by-side bordered
   cards (`progressGuidance`, `recoveryTimeline`); stack on mobile.
8. **FAQ** — an accordion (`<details>`/`<summary>`, works without JS, keyboard
   accessible). Semantic HTML only — Google retired FAQ rich results (May
   2026), matching the existing `/services` decision, so no `FAQPage` JSON-LD.
9. **Related** — inline links: related conditions, the mapped
   `/services/[serviceSlug]`, `relatedBlogSlugs`.
10. **Footer CTA band** — "Want this tailored to you? Book an online
    assessment" → `/book`.

**Right rail (`≥960px`, sticky):** accent-tint card — "Get a version tailored
to you by a physiotherapist" → primary button "Book an online assessment"
(shows the price from `lib/site-data.ts`), secondary text link "or get this
plan as a PDF" → the email-capture flow (§7).

### 5.3 Single exercise page — `/exercises/[slug]`

Canonical, condition-independent. Reuses 100% of existing catalogue content.

1. **Breadcrumb** — `Exercises › [Exercise]`.
2. **Hero**: two columns at `≥720px` (illustration left ~40%, text right),
   stacked below.
   - Illustration: the anatomical image at a large size, `alt` = a plain
     description of the position.
   - `h1` "[Title] exercise"; if `aka`, a muted "Also known as: …" line.
   - "What it's for" — tint chips linking to each condition hub
     (`conditionsForExercise`).
   - "Starting dose" — `formatDosage(resolveDosage(ex))`, prefixed with a
     repeat icon, plus the muted line "Your physiotherapist may adjust this."
   - CTAs: primary "Add to my plan" (§7 soft hook), secondary "Book an
     assessment".
3. **How to do it** — a bordered card. "Set up" (bold lead-in + `ex.setup`),
   "Steps" (numbered `<ol>`), then two columns: "Good form" (`ex.cues`, green
   ticks) and "Common mistakes" (`ex.mistakes` minus the safety line, warning
   marks). Semantic `<ol>` for the steps; Google retired `HowTo` rich results,
   so no `HowTo` JSON-LD (see §8).
4. **Safety callout** — error-tint (`#FEE2E2`-ish per system) box: the "Stop
   and message your physio if…" line from `ex.mistakes`.
5. **Video slot** — hidden in Phase 1; a `VideoObject`-ready component that
   renders only when `ex.videoObject` is present (Phase 4).
6. **Conditions this helps** — links to every hub in `conditionsForExercise`.
7. **Related exercises** — `relatedExercises(slug, 4)` as small cards.
8. **Byline** — same author + review-date treatment as the hub.
9. **Footer CTA band**.

### 5.4 Body-area browse — `/exercises/area/[bodyArea]`

A filtered list of `exercisesByBodyArea(area)` as small cards, plus links to
the condition hubs in that area. `canonical` → `/exercises`. Minimal.

### 5.5 Methodology — `/exercises/how-we-make-this`

Prose page: how exercises are drafted, that a HCPC-registered physiotherapist
clinically reviews every one before publication, the re-review cadence (every
12 months or when clinical guidance changes), the evidence basis, and how to
report a concern. Links from the byline on every library page.

## 6. Images — anatomical illustration set (cross-cutting workstream)

Blocking dependency: a working image-generation API. `OPENAI_API_KEY` (a
`platform.openai.com` key with billing — **not** ChatGPT Plus) in
`.env.development`; the generate script auto-detects it (`gpt-image-1`).

### 6.1 Style contract change

`docs/exercise-image-style.md` and the `IMAGE_STYLE_PREFIX` / `IMAGE_STYLE_SUFFIX`
constants in `lib/exercise-image-prompts.ts` change from "flat 2D vector, no
facial features, sky-blue motion arrow" to:

> Detailed medical illustration of a human figure performing the exercise,
> realistic proportions and joint positions, the primary working muscles
> subtly highlighted/shaded, clean textbook style, neutral studio background,
> a single sky-blue (#0EA5E9) motion arrow, PhysioOnClick navy line accents,
> no text, [consistent camera angle per body region].

All 158 prompt cores are (re)written to this style — the 27 existing ones
revised, 131 new. Prompt authoring is a Claude task (drafted into
`lib/exercise-image-prompts.ts`), free.

### 6.2 Pipeline (unchanged)

`generate-exercise-images.ts --all` → `brand-exercise-images.ts --all`
(composites the PhysioOnClick footer) → **Shivaliba reviews every image for
clinical accuracy** → `upload-exercise-images.ts --all` → add ids to
`uploadedImageIds` in `lib/exercise-image-prompts.ts` and commit. Until an id
is in `uploadedImageIds`, the web and PDF fall back to the stick figure — so
the library can ship progressively.

### 6.3 Cost

`gpt-image-1` medium quality ≈ $0.042 / 1024px image. 158 + ~40% regeneration
buffer ≈ **$10–15 one-time**. Ongoing ~$1–3/month as the catalogue grows. Set a
$15–20 monthly limit on the key.

## 7. Conversion funnel

- **Primary CTA** on every hub and exercise page: "Book an online assessment"
  → `/book`. Uses the existing `TrackedBookLink` component.
- **PDF capture** (hubs): "Get this plan as a PDF" → a lightweight form (email
  only) → server route builds the branded plan PDF for that condition's
  program (reuse `lib/exercise-plan-pdf.ts` with generic header values — no
  patient name; physio = `founder.name`; date = today), emails it via Resend,
  and records the lead. New route `app/api/exercise-plan/condition-pdf/`.
  Rate-limited and behind a simple bot check (honeypot field) since it is a
  public, email-sending endpoint.
- **"Add to my plan"** (exercise pages): appends the exercise to a
  `localStorage` list; a floating "N exercises · view plan" affordance;
  "view plan" shows the list with a "Save to your account" prompt (existing
  magic-link auth) and, for signed-in users, "Book to have a physio tailor
  this".
- **Chatbot**: `lib/chat-prompt.ts` / `lib/chat-tools.ts` gain awareness of
  library URLs so the assistant can link to a hub or exercise.
- **Analytics** (extends `lib/analytics.ts`): `library_hub_view`,
  `library_exercise_view`, `library_add_to_plan`, `library_pdf_request`,
  `library_cta_click` (with the condition/exercise slug). This data selects
  Phase 3 conditions and Phase 4 video priorities.

## 8. SEO & indexing

- **`sitemap.xml`** (`app/sitemap.ts`): add every `/exercises/**` URL. It
  currently has none.
- **Indexed, not noindex.** The blog is `noindex` (templated/duplicate risk,
  see `project_blog_noindex_deliberate`). The library is the opposite —
  unique, clinically reviewed, first-party content — so it is indexed. State
  this in the spec so no one "consistency-fixes" it to noindex later.
- **Structured data** (`lib/structured-data.ts` gains builders):
  - exercise page: `MedicalWebPage` + (when present) `VideoObject`
  - condition hub: `MedicalWebPage` + `BreadcrumbList`
  - **Not** `HowTo` or `FAQPage` — Google retired both rich results; clean
    semantic HTML (`<ol>` steps, `<details>` FAQ) is what carries them now.
    This matches the existing `/services/[slug]` decision.
  - author: `Person` with `hasCredential` (HCPC registration) + page
    `lastReviewed` / `reviewedBy`
- **`<title>` / meta**: `condition.seoTitle` / `seoDescription`;
  exercise pages `"[Title] exercise | PhysioOnClick"` + a generated
  description from `ex.setup`.
- **Canonicals**: exercise + hub pages self-canonical; `area/*` → `/exercises`.
- **OG images**: `app/exercise-og/[slug]/route.ts` and
  `app/condition-og/[slug]/route.ts` — SVG routes exactly like
  `app/blog-images/[slug]/route.ts` and `app/service-images/[slug]/route.ts`.
  Title + (for exercises) the illustration + the PhysioOnClick mark.
- **Internal linking**: hub ↔ exercise ↔ mapped service ↔ related conditions ↔
  relevant blog posts. Add reciprocal links from the six `/services/[slug]`
  pages and from relevant blog articles to their condition hubs.

## 9. Governance & E-E-A-T

- Every library page: author byline + HCPC number, "Clinically reviewed
  [date]", and a one-line disclaimer linking to `/medical-disclaimer`.
- `/exercises/how-we-make-this` (§5.5).
- `reviewedOn` per exercise and per condition. Surfaced on-page now; drives a
  "needs re-review" admin view in Phase 2.
- No exercise or hub is publishable (added to the live arrays / removed from a
  `draft` state) until Shivaliba has signed it off. Phase 1: tracked in the
  review docs. Phase 2: a status field in Firestore.

## 10. Content plan

### 10.1 Condition hubs for launch (~18–22)

Curated from the ~100 distinct `condition` values in the catalogue, chosen for
UK search demand + mapping to the services. Shivaliba confirms and prioritises;
anything not ready at launch is simply omitted (no broken links).

Candidate set:

| Body area | Conditions |
|---|---|
| Back / neck | Low back pain · Sciatica · Neck pain |
| Shoulder | Rotator cuff tendinopathy · Frozen shoulder · Shoulder impingement |
| Elbow / wrist | Tennis elbow · Golfer's elbow |
| Hip / knee | Knee osteoarthritis · Patellofemoral pain · Gluteal tendinopathy |
| Ankle / foot | Achilles tendinopathy · Ankle sprain |
| **Sports & return to activity** | **Hamstring strain · Chronic ankle instability · Patellar tendinopathy (jumper's knee) · ACL rehabilitation · Return to running · Return to sport readiness** |
| Post-surgical | After knee replacement · After hip replacement · After ACL reconstruction |
| Women's health / older adults | Falls prevention · Pelvic floor / stress incontinence · Pregnancy-related pelvic girdle pain |

### 10.1a Sports therapy & exercises

Sports rehabilitation is a first-class part of the library, not an afterthought:

- **"Sports & return to activity" is one of the browse categories** on
  `/exercises` and a `bodyArea`-style grouping (its `area/` page lists the
  sports condition hubs + the load-management, plyometric, balance and
  return-to-play exercises already in the catalogue: eccentric heel drop,
  Nordic hamstring curl, split squat, box step-down, lateral band walk,
  single-leg balance with arm reach, return-to-sport readiness circuit,
  wall-squat isometric, etc.).
- The sports condition hubs follow the same staged model — **load / settle →
  progressive strength → power & change-of-direction → return-to-play
  criteria** — with the last stage giving explicit, testable readiness
  markers (e.g. limb symmetry, pain-free hopping, sport-specific drills) and
  a strong "get assessed before you go back" message.
- These hubs map to the **Musculoskeletal Physiotherapy** and **Online Rehab
  Programmes** services; the spec assumes the MSK service page gains a short
  "sports & athletic rehabilitation" paragraph + reciprocal links (a small
  service-page edit, tracked in the plan).
- **Catalogue gaps for Phase 3** (flagged, not built now): calf strain,
  adductor/groin strain, MCL sprain, medial tibial stress syndrome
  (shin splints), plantar fasciitis, proximal hamstring tendinopathy,
  shoulder instability, hip flexor strain. The taxonomy anticipates them so
  adding them later is additive, not a restructure.

### 10.2 Per-hub copy (new — AI-drafted, Shivaliba reviews)

~250–400 words each: `intro`, `whoItHelps`, the `stage.blurb`s (three for most
conditions; the sports hubs use four — load/settle, strength, power &
change-of-direction, return-to-play), `redFlags`, `recoveryTimeline`,
`progressGuidance`, 3–5 `faqs`, and the `stage.exerciseSlugs` grouping (she
curates from the catalogue — the existing `condition` + `stage` fields give the
starting split). Sports hubs additionally carry explicit return-to-play
readiness markers in the final stage blurb.

Delivered as one review document (`docs/exercises-review/condition-hubs.md`),
same pipeline as the exercise write-ups.

### 10.3 The critical path is clinical review

Shivaliba must sign off, before launch:
- the 158 exercise write-ups (`docs/exercises-review/full-catalogue.md` — she
  needs to anyway)
- the 158 anatomical images
- the ~18 condition-hub docs

Realistically a week or two of her part-time attention. This gates the launch,
not the build. The build (§11) proceeds against placeholder hub copy and the
stick-figure fallback so it is ready the moment sign-off lands.

## 11. Build order

1. **Images**: rewrite the style contract + all 158 prompt cores; once the
   OpenAI key is in place, `generate --all` → `brand --all`. (Needs the key.)
2. **Data + helpers**: add `slug`/`aka`/`helpsWith` to `Exercise`; create
   `lib/conditions.ts` (with placeholder copy) and `lib/exercise-library.ts`;
   slug-uniqueness test.
3. **Pages**: `/exercises`, `/exercises/for/[condition]`, `/exercises/[slug]`,
   `/exercises/area/[bodyArea]`, `/exercises/how-we-make-this` — built against
   the existing 158 + placeholder hubs.
4. **SEO plumbing**: sitemap entries, schema builders, OG-image routes,
   canonicals, `<title>`/meta, service ↔ hub reciprocal links.
5. **Funnel**: `TrackedBookLink` CTAs, the condition-PDF capture route,
   "Add to my plan", chatbot URL awareness, analytics events.
6. **Content**: AI-draft the ~18 hubs → Shivaliba review → integrate (parallel
   with 3–5).
7. **Sign-off**: Shivaliba approves write-ups + images + hubs.
8. **Ship**: fill real hub copy, confirm every generated image is uploaded (or
   accept the stick-figure fallback for stragglers), submit the sitemap in
   Search Console, announce.

Deploy: `npm run deploy:dev` throughout; `npm run deploy` for production once
signed off.

## 11a. Self-check tests (Phase 1 — Part B)

A second public content type alongside exercises: **self-check tests** — plain,
safe, illustrated movement tests a person can try at home to see what their
symptoms might point towards, each mapping to one or more condition hubs. The
sample provided (a branded "Full Can Test" card) sets the format.

**Positioning.** These are *informational triage*, not diagnosis. Every test
page and card carries: "This is a guide, not a diagnosis. It cannot rule a
problem in or out — a physiotherapist can. If you have [red flags], see a
doctor." A positive result funnels straight to "book an online assessment"
(the natural next step — someone who just reproduced their pain wants it
looked at). This is a high-intent SEO surface: "full can test", "hawkins
kennedy test", "slump test for sciatica", "how to tell if I have a rotator
cuff tear".

**Route:** `/exercises/tests` (index) + `/exercises/tests/[slug]` (one test).
Statically generated, indexed, in the sitemap, with OG images.

**Data model — `lib/self-tests.ts`:**

```ts
export type SelfTestStep = {
  label: string;          // "Lift to 90 degrees"
  instruction: string[];  // 1-3 bullet points
  imageId: string;        // -> /exercise-images/{imageId}.png  (e.g. "test-full-can-3")
};
export type SelfTest = {
  slug: string;              // "full-can-test"
  name: string;              // "Full Can Test"
  aka?: string[];            // "full can", "supraspinatus test"
  assesses: string;          // "The supraspinatus muscle (part of the rotator cuff)"
  bodyArea: string;          // reuses the exercise bodyArea vocabulary
  conditionSlugs: string[];  // hubs this test points towards
  whatItChecks: string;      // 1-2 plain sentences
  whoShouldNotDoThis: string;// e.g. "a recent injury, you cannot lift the arm at all, or it is very painful at rest"
  steps: SelfTestStep[];     // 3-5
  negativeResult: string[];  // "normal / negative" bullets (green box)
  positiveResult: string[];  // "positive" bullets (red box)
  tips: string[];            // (blue box)
  interpretation: string;    // "A positive result may point towards ... It does not confirm it."
  reviewedBy: string;
  reviewedOn: string;
};
export const selfTests: SelfTest[];
```

**Helpers (extend `lib/exercise-library.ts`):** `getSelfTest(slug)`,
`allSelfTestSlugs()`, `selfTestsForCondition(conditionSlug)`,
`selfTestsByBodyArea(area)`.

**Page layout** (mirrors the sample card): breadcrumb → `h1` "[Name]" + a
sub-line "Checks: [assesses]" → byline → "what this checks" → a **"do not do
this test if"** callout (coral) → the numbered photo steps (photo left / label
+ bullets right, stack on mobile) → three result panels: **Normal / negative**
(success tint), **Positive** (error tint), **Tips** (accent tint) → the
interpretation + disclaimer → "Points towards" links to the mapped condition
hubs → **primary CTA "Book an online assessment"** → footer band. A
"Download this as a card (PDF)" secondary action reuses the plan-PDF /
infographic pipeline.

**Images:** photo-style (the sample uses photos), same `gpt-image-1` pipeline
and brand-footer compositing as the exercise illustrations but a distinct
`SELF_TEST_IMAGE_STYLE` contract (realistic photo of a person demonstrating the
position, consistent model/wardrobe/background, the sky-blue angle arrow where
the sample has one). Prompts in `lib/self-test-image-prompts.ts`. Same
`uploadedImageIds` go-live gate; until an image exists the step shows a
labelled placeholder, the page still ships. (Note: a concurrent workstream has
`scripts/build-numbered-exercise-photo-cards.mjs` + `generated-assets/` for a
similar photo-card renderer — reconcile before building the downloadable card,
don't duplicate.)

**Launch set (~10–14, one to two per region, all mapping to a hub):** Full Can
Test + Hawkins-Kennedy (shoulder), Painful Arc self-check, resisted wrist
extension / Cozen's self-version (tennis elbow), Slump / Straight Leg Raise
self-check (sciatica), single-leg decline squat quality (patellofemoral),
Trendelenburg mirror check (gluteal tendinopathy), single-leg calf-raise +
hop (Achilles / ankle), active knee-extension (hamstring), FABER-style hip
check, chin-tuck + rotation range (neck). Shivaliba confirms the list and
every result-interpretation line — clinical review is the same gate as the
exercises and hubs.

**Schema:** `MedicalWebPage` + `about: MedicalCondition` + `BreadcrumbList` +
author `Person`. Deliberately NOT `MedicalTest` / `MedicalGuideline` — those
assert clinical validity this content does not claim.

**Non-goals for Part B:** no scored symptom questionnaire / triage algorithm
(that is a bigger medico-legal build); no "your result is X" persistence; the
tests are static informational pages, not an interactive assessment.

## 12. Non-goals (Phase 1)

- The Firestore content system / admin authoring UI (Phase 2).
- Any new exercises beyond the existing 158 (Phase 3).
- Professional video (Phase 4).
- B2B / multi-clinic / selling access.
- User accounts beyond the existing magic-link auth ("Add to my plan" is
  `localStorage` until a user opts to save).
- Personalised programs generated on the public side (that's what booking is
  for).
- Non-English content.

## 13. Open questions for Shivaliba

1. The final condition list and launch priority order (§10.1).
2. Per-condition red flags and realistic recovery timelines.
3. The stage grouping of exercises per condition — does the catalogue's
   `stage` field map cleanly, or does she want to regroup?
4. Whether any exercise needs a title change (kept from the earlier review).
5. Sign-off cadence — can she review in batches (e.g. one body region per
   sitting) to unblock a partial launch?
6. Self-check tests (§11a): the launch list, and — the important one — the
   exact wording of every "positive result" and "interpretation" line, plus
   the "who should not do this test" line per test. This is the highest
   medico-legal sensitivity in the whole library.

## 14. Success metrics (review at 60 and 120 days post-launch)

- `/exercises/**` pages indexed in Search Console (target: >90% within 30 days)
- Organic impressions and clicks to `/exercises/**` (baseline ~0)
- `library_cta_click` → `/book` starts → completed bookings attributed to a
  library entry page
- `library_pdf_request` volume (email leads)
- Which condition hubs drive the above — feeds Phase 3 and Phase 4 priority

---

*Roadmap sub-projects 2–4 each get their own spec when Phase 1 is live.*
