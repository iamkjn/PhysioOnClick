# Public Exercise Library (Phase 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public, search-indexed exercise library at `physioonclick.co.uk/exercises` — condition hubs + canonical exercise pages + SEO + a booking funnel — built on the 158 exercises already in `lib/exercises.ts`.

**Architecture:** New public routes under `/exercises`, statically generated (`force-static` + `generateStaticParams`), matching the existing `/services/[slug]` and `/blog/[slug]` patterns. All content stays in `lib/` for Phase 1, read exclusively through a new `lib/exercise-library.ts` abstraction so the Phase 2 Firestore swap needs no page changes (same pattern as `lib/firestore-content.ts` for blogs).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest (jsdom, `@/` alias). Deployed via OpenNext to Cloudflare Workers. Design system: "The Clarity System" (`DESIGN.md`).

**Spec:** `docs/superpowers/specs/2026-09-08-public-exercise-library.md`

## Global Constraints

- **Content abstraction:** public pages import only from `lib/exercise-library.ts`, never `lib/exercises.ts` / `lib/conditions.ts` directly.
- **Design language:** warm paper `#F6F3EC` ground, navy `#043246` ink, working accent `#0A77A8` (never raw `#0EA5E9` as text/control on light — 2.77:1). Fraunces headings, DM Sans body. Flat + bordered at rest; elevation only on hover/focus/overlay. Selected state = tint + border, never a solid fill. Reuse existing CSS classes/tokens from `app/globals.css`; add new classes prefixed `exlib-`.
- **Rendering:** every page `export const dynamic = "force-static"` + `generateStaticParams`. Never `dynamicParams` tricks (see `project_dynamicparams_breaks_opennext` — force-static + `dynamicParams = false` 404s all paths on deploy).
- **Slugs:** kebab-case, stable, unique, never change once published.
- **Structured data reality (2026):** Google retired `HowTo` and `FAQPage` rich results. Include `BreadcrumbList` (still a rich result), `MedicalWebPage`, `Person` + `hasCredential` (entity/E-E-A-T signal), and `VideoObject` only when a video exists. Do **not** add `HowTo` or `FAQPage` JSON-LD — rely on clean semantic HTML (`<ol>` steps, `<details>` FAQ). This matches the existing `/services/[slug]` decision ("Deliberately no FAQPage").
- **Indexing:** `/exercises/**` is indexed (unique, clinically-reviewed, first-party content — the opposite of the noindexed blog). No `robots` noindex directives on these routes.
- **Copy voice:** UK English, plain language (~reading age 12), calm, never alarmist. `-` not `—`; straight quotes; Latin-1 only (the PDF font can't render more).
- **Author identity:** use `founder` from `lib/site-data.ts` (`founder.name` = "Shivaliba Zala", `founder.credentials`, `founder.hcpcNumber` = "PH155757"). Never hard-code these.
- **Tests:** logic (`lib/`) gets full TDD. Pages get lighter tests in `tests/app/` following `tests/app/privacy-policy.test.tsx` / `tests/app/terms.test.tsx` (render, key elements present, `notFound()` on bad slug). Exclude `.claude/worktrees/` is already configured.
- **Pre-existing failing tests:** `booking-flow.test.tsx` (7) + `toast-provider.test.tsx` (2) fail on `master` before any change (see `project_flaky_tests_booking_toast`). Assert only against files this plan touches.
- **Commits:** after each task. End messages with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`. Work on `master` (trunk-based, per `CLAUDE.md`).

---

## File Structure

**New — data & logic (`lib/`)**

| File | Responsibility |
|---|---|
| `lib/conditions.ts` | `Condition` / `ConditionStage` types + the ~20 condition records |
| `lib/exercise-library.ts` | Read helpers — the only import surface for public pages |
| `lib/exercise-library-svg.ts` | OG-image SVG generators for exercise + condition pages |

**New — routes (`app/exercises/`)**

| File | Page |
|---|---|
| `app/exercises/page.tsx` | Library index |
| `app/exercises/for/[condition]/page.tsx` | Condition hub |
| `app/exercises/[slug]/page.tsx` | Canonical exercise page |
| `app/exercises/area/[bodyArea]/page.tsx` | Body-area / category browse |
| `app/exercises/how-we-make-this/page.tsx` | Methodology page |
| `app/exercise-og/[slug]/route.ts` | Exercise OG image (SVG) |
| `app/condition-og/[slug]/route.ts` | Condition OG image (SVG) |
| `app/api/exercise-plan/condition-pdf/route.ts` | "Get this plan as a PDF" capture |

**New — components (`components/exercise-library/`)**

| File | Responsibility |
|---|---|
| `components/exercise-library/exercise-card.tsx` | Illustration + title + dose + link, used in grids |
| `components/exercise-library/condition-card.tsx` | Condition hub teaser card |
| `components/exercise-library/staged-program.tsx` | The stage-by-stage exercise list on a hub |
| `components/exercise-library/by-line.tsx` | Author + HCPC + reviewed-date block |
| `components/exercise-library/faq-accordion.tsx` | `<details>`-based accordion |
| `components/exercise-library/library-search.tsx` | Client-side search input + results |
| `components/exercise-library/add-to-plan-button.tsx` | localStorage "my plan" hook + button |
| `components/exercise-library/plan-tray.tsx` | Floating "N exercises · view plan" affordance |
| `components/exercise-library/condition-pdf-form.tsx` | Email-capture form on hubs |

**Modified**

| File | Change |
|---|---|
| `lib/exercises.ts` | `Exercise` gains `slug` (req), `aka?`, `helpsWith?`; all 158 entries get a `slug` |
| `lib/exercise-image-prompts.ts` | Style contract → anatomical illustration; all 158 prompt cores |
| `lib/structured-data.ts` | `exerciseHowToPage()`, `conditionMedicalPage()` builders |
| `lib/analytics.ts` | 5 library events |
| `lib/chat-prompt.ts` / `lib/chat-tools.ts` | Library URL awareness |
| `lib/site-data.ts` | `services` array: optional `relatedConditionSlugs` per service |
| `app/sitemap.ts` | Add every `/exercises/**` URL |
| `app/services/[slug]/page.tsx` | Reciprocal links to mapped condition hubs |
| `components/site-header.tsx` (or nav source) | "Exercises" nav link |
| `docs/exercise-image-style.md` | Anatomical illustration style |

---

## Task 1: Exercise slugs

**Files:**
- Modify: `lib/exercises.ts` (type + all 158 entries)
- Modify: `lib/site-data.ts` (re-export unchanged — verify still compiles)
- Test: `tests/lib/exercises.test.ts`

**Interfaces:**
- Produces: `Exercise.slug: string` (required), `Exercise.aka?: string[]`, `Exercise.helpsWith?: string[]`. `slug` is kebab-case, unique across the catalogue, derived from `title` (e.g. "Clamshell" → `clamshell`, "Shoulder External Rotation (Band)" → `shoulder-external-rotation-band`).

- [ ] **Step 1: Write the failing test**

Add to `tests/lib/exercises.test.ts`:

```ts
describe('exercise slugs', () => {
  it('every exercise has a non-empty kebab-case slug', () => {
    for (const e of exercises) {
      expect(e.slug, e.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    }
  })
  it('slugs are unique', () => {
    const slugs = exercises.map((e) => e.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
  it('aka entries, when present, are non-empty strings', () => {
    for (const e of exercises) {
      for (const a of e.aka ?? []) expect(a.trim().length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run it, watch it fail**

Run: `npx vitest run tests/lib/exercises.test.ts`
Expected: FAIL — `slug` is undefined on every entry.

- [ ] **Step 3: Add the type fields**

In `lib/exercises.ts`, the `Exercise` type:

```ts
export type Exercise = {
  id: string;
  slug: string;
  title: string;
  // ...existing fields...
  aka?: string[];
  helpsWith?: string[];
  // ...
};
```

- [ ] **Step 4: Generate + apply the slugs**

Write a one-off script `scripts/add-exercise-slugs.mjs` that reads `lib/exercises.ts`, and for each entry inserts `slug:` right after `id:`, value = `title` lowercased, `&` → "and", non-alphanumerics → `-`, collapsed, trimmed; on a collision append `-2`, `-3`. Reuse the brace-depth-scan approach from `scripts/apply-exercise-drafts.mjs`. Run it. Then delete the script (it's a one-shot; `scripts/apply-exercise-drafts.mjs` is the template, keep that one).

Manually spot-check ~5 slugs in the diff for readability; hand-fix any awkward ones (e.g. prefer `press-up-cobra` over `press-up-mckenzie-press-up`).

- [ ] **Step 5: Run tests + tsc**

Run: `npx vitest run tests/lib/exercises.test.ts tests/lib/exercise-content-shape.test.ts && npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: tests PASS; tsc prints `8` (pre-existing count).

- [ ] **Step 6: Commit**

```bash
git add lib/exercises.ts tests/lib/exercises.test.ts
git commit -m "feat(exercises): stable slug on every catalogue entry"
```

---

## Task 2: `lib/conditions.ts` — types + records

**Files:**
- Create: `lib/conditions.ts`
- Test: `tests/lib/conditions.test.ts`

**Interfaces:**
- Consumes: `Exercise.slug` (Task 1); `services` from `lib/site-data.ts`.
- Produces:
  ```ts
  export type ConditionStage = { stage: string; blurb: string; exerciseSlugs: string[] };
  export type Condition = {
    slug: string; name: string; aka?: string[]; serviceSlug?: string; bodyArea: string;
    seoTitle: string; seoDescription: string; intro: string; whoItHelps: string;
    program: ConditionStage[]; redFlags: string[]; recoveryTimeline: string;
    progressGuidance: string; faqs: { q: string; a: string }[];
    relatedConditionSlugs?: string[]; relatedBlogSlugs?: string[];
    reviewedBy: string; reviewedOn: string;
  };
  export const conditions: Condition[];
  ```

- [ ] **Step 1: Write the failing test**

`tests/lib/conditions.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { conditions } from '@/lib/conditions'
import { exercises } from '@/lib/exercises'
import { services } from '@/lib/site-data'

const slugSet = new Set(exercises.map((e) => e.slug))
const condSlugs = new Set(conditions.map((c) => c.slug))

describe('conditions', () => {
  it('has 12+ conditions, all with unique kebab-case slugs', () => {
    expect(conditions.length).toBeGreaterThanOrEqual(12)
    expect(new Set(conditions.map((c) => c.slug)).size).toBe(conditions.length)
    for (const c of conditions) expect(c.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })
  it('every program stage references only real exercise slugs and is non-empty', () => {
    for (const c of conditions) {
      expect(c.program.length).toBeGreaterThanOrEqual(2)
      for (const st of c.program) {
        expect(st.exerciseSlugs.length).toBeGreaterThan(0)
        for (const s of st.exerciseSlugs) expect(slugSet.has(s), `${c.slug}/${s}`).toBe(true)
      }
    }
  })
  it('serviceSlug and relatedConditionSlugs resolve', () => {
    const svc = new Set(services.map((s) => s.slug))
    for (const c of conditions) {
      if (c.serviceSlug) expect(svc.has(c.serviceSlug), c.slug).toBe(true)
      for (const r of c.relatedConditionSlugs ?? []) expect(condSlugs.has(r), `${c.slug}->${r}`).toBe(true)
    }
  })
  it('every condition has intro, redFlags, recoveryTimeline, 3+ faqs, reviewedBy, reviewedOn', () => {
    for (const c of conditions) {
      expect(c.intro.trim().length).toBeGreaterThan(60)
      expect(c.redFlags.length).toBeGreaterThan(0)
      expect(c.recoveryTimeline.trim().length).toBeGreaterThan(10)
      expect(c.faqs.length).toBeGreaterThanOrEqual(3)
      expect(c.reviewedBy).toBe('Shivaliba Zala')
      expect(c.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
  it('no smart punctuation or non-Latin-1 characters', () => {
    const blob = JSON.stringify(conditions)
    expect(blob).not.toMatch(/[‘’“”–—…]/)
    expect(blob).not.toMatch(/[^ -ÿ]/)
  })
})
```

- [ ] **Step 2: Run it, watch it fail** — `npx vitest run tests/lib/conditions.test.ts` → module not found.

- [ ] **Step 3: Create the file with types + two fully-worked records**

Create `lib/conditions.ts` with the types above and **two complete records** as the pattern — `rotator-cuff-tendinopathy` and `hamstring-strain` (a sports hub, 4 stages). Write real, plain-language, evidence-informed copy (~300 words each), grouping exercises from the catalogue by their `condition` + `stage` fields. Example skeleton (fill with real copy):

```ts
export const conditions: Condition[] = [
  {
    slug: "rotator-cuff-tendinopathy",
    name: "Rotator cuff tendinopathy",
    aka: ["rotator cuff tendinitis", "rotator cuff related shoulder pain"],
    serviceSlug: "musculoskeletal-physiotherapy",
    bodyArea: "Shoulder",
    seoTitle: "Rotator cuff tendinopathy exercises | PhysioOnClick",
    seoDescription: "A staged exercise programme for rotator cuff tendinopathy from a HCPC-registered physiotherapist - what to do, how to progress, and when to get assessed.",
    intro: "Rotator cuff tendinopathy is ...",
    whoItHelps: "These exercises suit ...",
    program: [
      { stage: "Settle the pain", blurb: "Start here ...", exerciseSlugs: ["scapular-setting", "pendulum-swing"] },
      { stage: "Build strength", blurb: "Move on when ...", exerciseSlugs: ["shoulder-external-rotation-band", "shoulder-internal-rotation-band", "wall-slide"] },
      { stage: "Return to activity", blurb: "The final stage ...", exerciseSlugs: ["push-up-plus-wall-or-floor", "shoulder-flexion"] },
    ],
    redFlags: ["Sudden weakness after an injury", "Pain with a fever or feeling unwell", "You cannot lift the arm at all"],
    recoveryTimeline: "Most people improve over 6 to 12 weeks with consistent loading.",
    progressGuidance: "Step up a stage when ...",
    faqs: [
      { q: "Should I push through the pain?", a: "..." },
      { q: "How long until it feels better?", a: "..." },
      { q: "Can I still go to the gym?", a: "..." },
    ],
    relatedConditionSlugs: ["frozen-shoulder", "shoulder-impingement"],
    relatedBlogSlugs: [],
    reviewedBy: "Shivaliba Zala",
    reviewedOn: "2026-09-08",
  },
  // hamstring-strain: same shape, 4 stages (Settle / Strength / Power and change of direction / Return to play),
  // final stage blurb states explicit return-to-play readiness markers.
];
```

- [ ] **Step 4: Draft the remaining ~18 records**

The remaining conditions from spec §10.1 (low-back-pain, sciatica, neck-pain, frozen-shoulder, shoulder-impingement, tennis-elbow, golfers-elbow, knee-osteoarthritis, patellofemoral-pain, gluteal-tendinopathy, achilles-tendinopathy, ankle-sprain, chronic-ankle-instability, patellar-tendinopathy, acl-rehabilitation, return-to-running, return-to-sport-readiness, after-knee-replacement, after-hip-replacement, after-acl-reconstruction, falls-prevention, stress-urinary-incontinence, pregnancy-pelvic-girdle-pain).

These are drafted the same way the exercise write-ups were: AI-draft all records into the file, then produce `docs/exercises-review/condition-hubs.md` (one section per condition, every field laid out, `- [ ] Approved` + `Notes:` line) for Shivaliba. **The tests validate structure, not prose.** Ship with the draft copy behind the same "not on production until she signs off" gate as the exercise write-ups; `reviewedOn` stays a placeholder date until sign-off.

- [ ] **Step 5: Run tests + tsc + lint** — `npx vitest run tests/lib/conditions.test.ts && npx tsc --noEmit 2>&1 | grep -c "error TS" && npx next lint --dir lib`
Expected: PASS; `8`; no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/conditions.ts tests/lib/conditions.test.ts docs/exercises-review/condition-hubs.md
git commit -m "feat(exercises): condition-hub content model + records (draft, pending clinical review)"
```

---

## Task 3: `lib/exercise-library.ts` — read helpers

**Files:**
- Create: `lib/exercise-library.ts`
- Test: `tests/lib/exercise-library.test.ts`

**Interfaces:**
- Consumes: `exercises` (Task 1), `conditions` (Task 2).
- Produces:
  ```ts
  getCondition(slug: string): Condition | null
  allConditionSlugs(): string[]
  getExerciseBySlug(slug: string): Exercise | null
  allExerciseSlugs(): string[]
  programForCondition(slug: string): { stage: ConditionStage; exercises: Exercise[] }[]
  conditionsForExercise(exerciseSlug: string): Condition[]
  relatedExercises(exerciseSlug: string, limit: number): Exercise[]
  bodyAreas(): string[]
  exercisesByBodyArea(area: string): Exercise[]
  conditionsByBodyArea(area: string): Condition[]
  searchLibrary(query: string): { exercises: Exercise[]; conditions: Condition[] }
  ```

- [ ] **Step 1: Write failing tests**

`tests/lib/exercise-library.test.ts` — cover: `getCondition` hit/miss; `programForCondition` returns stages with resolved `Exercise[]` in `exerciseSlugs` order, skipping unknown slugs; `conditionsForExercise` includes the primary condition + any hub whose program lists this slug, deduped; `relatedExercises` excludes the exercise itself, prefers shared conditions then same `bodyPart`, respects `limit`; `searchLibrary('clam')` finds the clamshell by title, `searchLibrary('rotator cuff')` finds the condition, empty query → empty arrays; `bodyAreas()` returns a sorted unique list including `"Sports & return to activity"`.

- [ ] **Step 2: Run, watch fail.**

- [ ] **Step 3: Implement** `lib/exercise-library.ts`. Pure functions over the two static arrays. `searchLibrary` matches case-insensitively against exercise `title` + `aka` and condition `name` + `aka`; cap results at 20 each. `conditionsForExercise` cross-references every condition's `program[].exerciseSlugs`. `bodyAreas()` unions `Exercise.bodyPart` values with the fixed `"Sports & return to activity"` category and any `Condition.bodyArea`.

- [ ] **Step 4: Run tests + tsc.** Expected PASS; tsc `8`.

- [ ] **Step 5: Commit** — `feat(exercises): exercise-library read helpers (public-page abstraction)`

---

## Task 4: Structured-data builders

**Files:**
- Modify: `lib/structured-data.ts`
- Test: `tests/lib/structured-data.test.ts` (create if absent, else extend)

**Interfaces:**
- Consumes: `personNode`/`personRef`/`breadcrumbs` (existing), `Exercise`, `Condition`.
- Produces:
  ```ts
  exerciseWebPage(ex: Exercise, url: string): object   // MedicalWebPage + about + author personRef + lastReviewed
  conditionWebPage(c: Condition, url: string): object   // MedicalWebPage + FAQ as `mainEntity` text (NOT FAQPage type) + author + lastReviewed
  exerciseVideoObject(ex: Exercise): object | null      // null unless ex.videoObject present (Phase 4)
  ```
  Reuse the existing `breadcrumbs()` for the crumb JSON-LD on the pages themselves.

- [ ] **Step 1: Write failing tests** — assert each builder returns an object with `@context: "https://schema.org"`, the right `@type`, an `author` that is `personRef()`, a `lastReviewed` ISO date, and (for `conditionWebPage`) a `description` from `seoDescription`. Assert `exerciseVideoObject` returns `null` for a normal exercise.

- [ ] **Step 2: Run, fail. Step 3: Implement. Step 4: Run, pass + tsc `8`.**

- [ ] **Step 5: Commit** — `feat(seo): structured-data builders for exercise + condition pages`

---

## Task 5: Display components

**Files:**
- Create: `components/exercise-library/exercise-card.tsx`, `condition-card.tsx`, `staged-program.tsx`, `by-line.tsx`, `faq-accordion.tsx`
- Create: `app/exercise-library.css` (or append to `app/globals.css` — match how other feature CSS is organised; check first) with `.exlib-*` classes
- Test: `tests/components/exercise-library-display.test.tsx`

**Interfaces:**
- Consumes: `Exercise`, `Condition`, `ConditionStage`, `programForCondition` output; existing `ExerciseImage` (`components/exercise-image.tsx`) for the illustration/stick-figure fallback; `formatDosage`, `resolveDosage` from `lib/exercises.ts`.
- Produces:
  ```ts
  <ExerciseCard exercise={Exercise} />                       // links to /exercises/[slug]
  <ConditionCard condition={Condition} exerciseCount={number} />  // links to /exercises/for/[slug]
  <StagedProgram program={{stage,exercises}[]} />
  <ByLine reviewedOn={string} />                             // uses founder.*
  <FaqAccordion faqs={{q,a}[]} />                            // <details>/<summary>
  ```

- [ ] **Step 1: Write failing tests** — render each; assert: `ExerciseCard` renders the title, the `formatDosage` string, an `<a href="/exercises/clamshell">`, and an `<img>`/svg from `ExerciseImage`. `ConditionCard` renders the name, `seoDescription`, count, `<a href="/exercises/for/...">`. `StagedProgram` renders each stage name + blurb + one `ExerciseCard` per exercise. `ByLine` renders "Shivaliba Zala", "PH155757", and the formatted date. `FaqAccordion` renders one `<details>` per FAQ with the `q` in `<summary>` and the `a` in the body.

- [ ] **Step 2: Fail. Step 3: Build** — server components (no `"use client"`), Clarity System styling via `.exlib-*` classes. `ExerciseImage` needs `exerciseId` + `name` + `pose` + `size`.

- [ ] **Step 4: Pass + tsc `8` + lint.**

- [ ] **Step 5: Commit** — `feat(exercises): exercise-library display components`

---

## Task 6: Interactive components — search + "add to my plan"

**Files:**
- Create: `components/exercise-library/library-search.tsx`, `add-to-plan-button.tsx`, `plan-tray.tsx`
- Create: `lib/exercise-plan-store.ts` (localStorage read/write, guarded)
- Test: `tests/components/exercise-library-interactive.test.tsx`, `tests/lib/exercise-plan-store.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // lib/exercise-plan-store.ts
  getPlan(): string[]                 // exercise slugs; [] on any error
  addToPlan(slug: string): string[]
  removeFromPlan(slug: string): string[]
  onPlanChange(cb: (slugs: string[]) => void): () => void   // storage + custom-event listener
  ```
  ```tsx
  <LibrarySearch />                   // "use client", filters via searchLibrary passed as prop data
  <AddToPlanButton exerciseSlug={string} exerciseTitle={string} />
  <PlanTray />                        // floating "N exercises - view plan"; hidden when empty
  ```

- [ ] **Step 1: Write failing tests** — `exercise-plan-store`: `getPlan()` returns `[]` when localStorage throws (stub `localStorage.getItem` to throw); `addToPlan` dedupes; `removeFromPlan` works; `onPlanChange` fires on `addToPlan`. Components: `AddToPlanButton` click adds the slug and flips its label to "In your plan"; `PlanTray` shows the count and is absent at count 0.

- [ ] **Step 2: Fail. Step 3: Build.** `lib/exercise-plan-store.ts` wraps every localStorage call in try/catch (per the Artifact-storage discipline — a private window / blocked storage must not crash the page). `LibrarySearch` receives the searchable index as a serialisable prop from the server page (title/slug/aka + condition name/slug) and filters in-memory — no fetch.

- [ ] **Step 4: Pass + tsc `8` + lint.**

- [ ] **Step 5: Commit** — `feat(exercises): client-side library search + add-to-plan tray`

---

## Task 7: Canonical exercise page — `/exercises/[slug]`

**Files:**
- Create: `app/exercises/[slug]/page.tsx`
- Test: `tests/app/exercise-page.test.tsx`

**Interfaces:**
- Consumes: `getExerciseBySlug`, `allExerciseSlugs`, `conditionsForExercise`, `relatedExercises` (Task 3); Task 5 components; `exerciseWebPage`, `breadcrumbs` (Task 4); `TrackedBookLink` (existing).

- [ ] **Step 1: Write failing test** (`tests/app/exercise-page.test.tsx`, pattern from `tests/app/terms.test.tsx`):
  - `generateStaticParams()` returns 158 `{ slug }` objects.
  - Render for `slug: "clamshell"`: `<h1>` contains "Clamshell", the setup text, an `<ol>` with the steps, the cues, the mistakes minus the safety line, the safety line inside a `[data-safety]` element, a link to each condition hub in `conditionsForExercise`, a `TrackedBookLink`, an `AddToPlanButton`, a `<script type="application/ld+json">` whose JSON has `@type: "MedicalWebPage"`.
  - Render for `slug: "nope"` → calls `notFound()` (assert it throws the Next not-found signal).
  - `generateMetadata` for "clamshell" returns `title` ending "| PhysioOnClick", `alternates.canonical` = `/exercises/clamshell`, `openGraph.images` pointing at `/exercise-og/clamshell`.

- [ ] **Step 2: Fail. Step 3: Build the page** — `force-static`, `generateStaticParams`, `generateMetadata`, JSON-LD via `dangerouslySetInnerHTML` (match `app/services/[slug]/page.tsx`), breadcrumb nav, the hero (illustration + title + `aka` + condition chips + dose + CTAs), "How to do it" card, safety callout, related exercises, `<ByLine>`, footer CTA band. Video slot: render `<ExerciseVideo>` only if `ex.videoObject` — for Phase 1 add the component returning `null` when absent.

- [ ] **Step 4: Pass; `npm run build` succeeds (static export of 158 pages); tsc `8`; lint.**

- [ ] **Step 5: Commit** — `feat(exercises): public canonical exercise pages`

---

## Task 8: Condition hub — `/exercises/for/[condition]`

**Files:**
- Create: `app/exercises/for/[condition]/page.tsx`
- Create: `components/exercise-library/condition-pdf-form.tsx` (email capture; posts to Task 12's route)
- Test: `tests/app/condition-hub-page.test.tsx`

**Interfaces:**
- Consumes: `getCondition`, `allConditionSlugs`, `programForCondition` (Task 3); Task 5 components (`StagedProgram`, `FaqAccordion`, `ByLine`); `conditionWebPage`, `breadcrumbs` (Task 4); `TrackedBookLink`, `pricing` from `lib/site-data.ts`.

- [ ] **Step 1: Write failing test:**
  - `generateStaticParams()` returns one `{ condition }` per record.
  - Render `condition: "rotator-cuff-tendinopathy"`: `<h1>` = "Rotator cuff tendinopathy exercises", the intro text, a red-flags region (`[data-red-flags]`) listing every `redFlags` item and appearing in the DOM before the program, one stage block per `program` entry each with its blurb and its `ExerciseCard`s, the recovery-timeline + progress-guidance text, a `<details>` per FAQ, a `TrackedBookLink` showing the online price, a `ConditionPdfForm`, links to `relatedConditionSlugs` hubs and the `serviceSlug` service page, a `MedicalWebPage` JSON-LD script.
  - `condition: "nope"` → `notFound()`.
  - `generateMetadata` returns `seoTitle` / `seoDescription`, canonical `/exercises/for/rotator-cuff-tendinopathy`, OG image `/condition-og/rotator-cuff-tendinopathy`.

- [ ] **Step 2: Fail. Step 3: Build** — main column + a right-rail CTA card (`@media (min-width: 960px)` sticky; stacked inline above the program on mobile — pure CSS, no JS). Breadcrumb, byline, intro, red-flags box (coral tint), `<StagedProgram>`, the two guidance cards, `<FaqAccordion>`, related links, footer CTA band.

- [ ] **Step 4: Pass; `npm run build`; tsc `8`; lint.**

- [ ] **Step 5: Commit** — `feat(exercises): public condition hub pages`

---

## Task 9: Library index, area browse, methodology

**Files:**
- Create: `app/exercises/page.tsx`, `app/exercises/area/[bodyArea]/page.tsx`, `app/exercises/how-we-make-this/page.tsx`
- Test: `tests/app/exercise-library-index.test.tsx`

**Interfaces:**
- Consumes: `conditions`, `bodyAreas`, `exercisesByBodyArea`, `conditionsByBodyArea`, `programForCondition` (for counts); Task 5/6 components (`ConditionCard`, `LibrarySearch`).

- [ ] **Step 1: Write failing tests:**
  - `/exercises`: renders `<h1>` "Exercise library", a `<LibrarySearch>`, a `ConditionCard` for every condition, a body-area chip row including "Sports & return to activity", a featured section, a footer CTA. `generateMetadata` title + canonical `/exercises`.
  - `/exercises/area/[bodyArea]`: `generateStaticParams` from `bodyAreas()`; render "Shoulder" → lists shoulder exercises + shoulder condition hubs; `generateMetadata` sets `alternates.canonical` to `/exercises` (not self).
  - `/exercises/how-we-make-this`: renders the methodology prose, links to `/medical-disclaimer`, `<h1>`.

- [ ] **Step 2: Fail. Step 3: Build all three.** Methodology page copy: write it in the plan? — no, it's ~250 words of straightforward prose; the implementer writes it from spec §5.5 (drafting process, HCPC clinical review of every exercise before publication, 12-month re-review cadence, evidence basis, how to report a concern). Keep the voice plain and confident.

- [ ] **Step 4: Pass; `npm run build`; tsc `8`; lint.**

- [ ] **Step 5: Commit** — `feat(exercises): library index, area browse, methodology page`

---

## Task 10: OG image routes

**Files:**
- Create: `lib/exercise-library-svg.ts`, `app/exercise-og/[slug]/route.ts`, `app/condition-og/[slug]/route.ts`
- Test: `tests/app/exercise-og-route.test.ts`

**Interfaces:**
- Consumes: `getExerciseBySlug`, `getCondition`; pattern from `lib/blog-image-svg.ts` + `app/blog-images/[slug]/route.ts`.
- Produces: `generateExerciseOgSvg(ex): string`, `generateConditionOgSvg(c): string` — 1200×630 SVG, Clarity palette, Fraunces title (web-safe fallback stack), the PhysioOnClick "P" mark, and for exercises the exercise title + "exercise".

- [ ] **Step 1: Write failing tests** — `GET` for a known slug returns 200 + `Content-Type: image/svg+xml` + body containing the title text; unknown slug → 404. `Cache-Control: public, max-age=86400` (not `immutable` — content can be re-reviewed; mirrors the fix in `app/exercise-images/[id]/route.ts`).

- [ ] **Step 2: Fail. Step 3: Implement.** Both routes mirror `app/blog-images/[slug]/route.ts`.

- [ ] **Step 4: Pass; tsc `8`.**

- [ ] **Step 5: Commit** — `feat(seo): OG images for exercise + condition pages`

---

## Task 11: Sitemap, nav link, cross-links

**Files:**
- Modify: `app/sitemap.ts`
- Modify: the site nav source (find it: `grep -rl "Services" components/*.tsx | grep -i header`) — add an "Exercises" link
- Modify: `lib/site-data.ts` (`services` gain `relatedConditionSlugs?: string[]`) + `app/services/[slug]/page.tsx` (render those links)
- Test: `tests/app/sitemap.test.ts` (create; pattern from `tests/app/robots.test.ts`)

- [ ] **Step 1: Write failing tests:**
  - `sitemap()` output includes `${base}/exercises`, `${base}/exercises/how-we-make-this`, one `/exercises/for/[slug]` per condition, one `/exercises/[slug]` per exercise, and one `/exercises/area/[area]` per body area. Total count = `2 + conditions.length + exercises.length + bodyAreas().length`.
  - A `service` with `relatedConditionSlugs` renders a link to each hub on its page.

- [ ] **Step 2: Fail. Step 3: Implement.** In `app/sitemap.ts` import from `lib/exercise-library.ts` (not the raw arrays) and append the entries — no `lastModified` on exercise pages yet (Phase 2 tracks per-item review dates), a truthful one on condition pages from `reviewedOn`.

- [ ] **Step 4: Pass; `npm run build`; tsc `8`.**

- [ ] **Step 5: Commit** — `feat(seo): exercise library in the sitemap + nav + service cross-links`

---

## Task 12: Condition-plan PDF capture route

**Files:**
- Create: `app/api/exercise-plan/condition-pdf/route.ts`
- Create: `lib/emails/condition-plan-email.ts` (mirror `lib/emails/exercise-plan-email.ts`)
- Test: `tests/api/condition-pdf-route.test.ts`

**Interfaces:**
- Consumes: `getCondition`, `programForCondition`; `buildPlanCards` (`lib/exercise-plan.ts`), `buildExercisePlanPdf` (`lib/exercise-plan-pdf.ts`); `sendConditionPlanEmail`.
- Behaviour: `POST { conditionSlug, email, website?  }`. `website` is a honeypot — non-empty → `200 { ok: true }` and do nothing. Missing/invalid `email` → `400`. Unknown `conditionSlug` → `404`. Otherwise: build the plan from the condition's full program (all stages), header = { patientName: "", physioName: `founder.name`, sessionDateISO: today }, email it via Resend, log a lead line (`console.info` for now; a Firestore `leads` collection is Phase 2). Best-effort: downstream failure → `200 { ok: false }` (don't leak internals to a public caller). Simple in-memory rate limit: max 3 requests per IP per 10 min.

- [ ] **Step 1: Write failing tests** (mock `buildExercisePlanPdf`, `sendConditionPlanEmail`, `getCondition`): 400 on no email; 400 on `"notanemail"`; 404 on bad slug; honeypot filled → 200 + email sender NOT called; happy path → 200 + `buildExercisePlanPdf` called with cards from every stage + sender called with the email; downstream throw → still 200 `{ ok: false }`.

- [ ] **Step 2: Fail. Step 3: Implement.**

- [ ] **Step 4: Pass; tsc `8`; lint.**

- [ ] **Step 5: Commit** — `feat(exercises): condition-plan PDF email capture`

---

## Task 13: Analytics + chatbot awareness

**Files:**
- Modify: `lib/analytics.ts` (event names/types)
- Modify: `lib/chat-prompt.ts`, `lib/chat-tools.ts`
- Modify: Task 7/8/9 pages + Task 6 components to fire events
- Test: `tests/lib/analytics.test.ts` (extend), `tests/lib/chat-prompt.test.ts` (extend or create)

**Interfaces:**
- Produces analytics events: `library_hub_view`, `library_exercise_view`, `library_add_to_plan`, `library_pdf_request`, `library_cta_click` — each with `{ slug: string }` (condition or exercise slug).

- [ ] **Step 1: Write failing tests** — `track('library_exercise_view', { slug })` is accepted by the event-name type/union; the chat system prompt string mentions `/exercises` and instructs the assistant it may link to a condition hub or exercise page.

- [ ] **Step 2: Fail. Step 3: Implement.** Add the 5 events to whatever union/registry `lib/analytics.ts` uses. In the pages, fire the `*_view` events client-side (a tiny `"use client"` `<TrackView event slug />` helper, or reuse an existing tracked wrapper). CTA clicks reuse `TrackedBookLink` with a `source` of the slug. Add a short paragraph to `lib/chat-prompt.ts` and, if the tools list an FAQ/redirect tool, let it point at library URLs.

- [ ] **Step 4: Pass; tsc `8`; lint.**

- [ ] **Step 5: Commit** — `feat(exercises): library analytics events + chatbot link awareness`

---

## Task 14: Anatomical illustration style + all 158 prompts

**Files:**
- Modify: `lib/exercise-image-prompts.ts` (`IMAGE_STYLE_PREFIX`, `IMAGE_STYLE_SUFFIX`, all 158 prompt cores)
- Modify: `docs/exercise-image-style.md`
- Test: `tests/lib/exercise-image-prompts.test.ts` (extend)

**Interfaces:**
- Produces: `exerciseImagePrompts` covering **all 158** exercise ids; `fullImagePrompt(id)` non-null for every id.

- [ ] **Step 1: Write the failing test** — extend `tests/lib/exercise-image-prompts.test.ts`: `for (const e of exercises) expect(hasImagePrompt(e.id), e.id).toBe(true)`; the style prefix/suffix contain "medical illustration" / "muscles" and no "flat 2D vector" / "no facial features".

- [ ] **Step 2: Fail. Step 3: Rewrite** `IMAGE_STYLE_PREFIX`/`SUFFIX` to the anatomical-illustration contract (spec §6.1), then write a `core` for every one of the 131 exercises without one and revise the 27 that have one, using each exercise's `setup` + `title` (the position to depict) and `bodyPart` (the consistent camera angle per region). Update `docs/exercise-image-style.md` to describe the new style + note the fallback and the review gate.

- [ ] **Step 4: Pass; tsc `8`.**

- [ ] **Step 5: Commit** — `feat(exercises): anatomical illustration style + prompts for all 158`

**Not in this plan (manual / gated):** running `generate-exercise-images.ts --all` (needs `OPENAI_API_KEY` in `.env.development`), `brand-exercise-images.ts --all`, Shivaliba's image review, `upload-exercise-images.ts --all`, and adding ids to `uploadedImageIds`. Until then the pages and PDF use the stick-figure fallback — the library still ships.

---

## Final steps (after Task 14)

- [ ] `npm run test:run` — full suite: only the 9 pre-existing failures (`booking-flow` 7 + `toast-provider` 2).
- [ ] `npx tsc --noEmit` — 8 pre-existing errors, none new.
- [ ] `npm run build` — succeeds; confirms all `/exercises/**` pages statically export.
- [ ] `npm run deploy:dev`; smoke-test `/exercises`, one hub, one exercise page, `/exercise-og/clamshell`, a `POST` to the condition-pdf route.
- [ ] Whole-branch review (superpowers:requesting-code-review) on the most capable model.
- [ ] superpowers:finishing-a-development-branch.

**Then, outside this plan:** Shivaliba reviews `docs/exercises-review/full-catalogue.md` (exercises), `docs/exercises-review/condition-hubs.md` (hubs), and the generated images. Fill real `reviewedOn` dates on sign-off. Production deploy (`npm run deploy`). Submit the sitemap in Search Console.

---

## Self-Review

**Spec coverage:** routes §4.1 → Tasks 7–11; data model §4.2 → Tasks 1–3; page designs §5 → Tasks 5–9; images §6 → Task 14 (+ manual run); funnel §7 → Tasks 6, 8, 12, 13; SEO §8 → Tasks 4, 10, 11; governance §9 → Tasks 2 (`reviewedOn`), 5 (`ByLine`), 9 (methodology); content plan §10 → Task 2 + the review doc; sports §10.1a → Task 2 (hubs + 4-stage), Task 3 (`bodyAreas` category), Task 9 (chip). Build order §11 ≈ task order. Non-goals §12 respected (no Firestore, no new exercises, no video component beyond a null stub, magic-link auth only).

**Placeholder scan:** the condition-hub prose (Task 2 step 4) and the methodology copy (Task 9 step 3) are written by the implementer/AI-draft rather than spelled out here — this is deliberate and called out, and the tests validate structure not prose, matching how the exercise write-ups were done. No "TBD"/"handle errors appropriately" left in.

**Type consistency:** `slug` (Task 1) used by every later task; `Condition`/`ConditionStage` (Task 2) consumed unchanged by Tasks 3, 4, 8; helper names in Task 3's Interfaces block match their uses in Tasks 7–11; `programForCondition` return shape `{ stage, exercises }[]` consistent between Task 3, Task 5 (`StagedProgram`), Task 8. `exerciseWebPage`/`conditionWebPage` (Task 4) match Tasks 7/8. Analytics event names identical between Task 13 Interfaces and its steps.

**Correction to the spec:** §8 lists `HowTo` + `FAQPage` JSON-LD; Google retired both rich results (FAQ fully in May 2026, per the note in `app/services/[slug]/page.tsx`). The plan uses `MedicalWebPage` + `BreadcrumbList` + `Person`/`hasCredential` only, and clean semantic HTML for steps/FAQ. Update spec §8 to match.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-08-public-exercise-library.md`. Two execution options:

**1. Subagent-Driven (recommended)** — a fresh subagent per task, two-stage review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session with batch checkpoints.

Which approach?
