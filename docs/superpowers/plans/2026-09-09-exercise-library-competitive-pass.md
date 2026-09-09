# Exercise Library — Competitive Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkbox syntax.

**Goal:** Close the gap between the shipped Phase-1 public exercise library and a market-competitive one (NHS / Versus Arthritis / Wibbi calibre) — without the AI-image pipeline (still gated on the owner's OpenAI API key) and without pre-empting the physiotherapist's clinical review (which remains the production launch gate).

**Architecture:** Additive on the deployed Phase-1 + Part-B library. Public pages still read only through `lib/exercise-library.ts`. New content lands in `lib/` (`conditions.ts`, `exercises.ts`, a new `lib/body-areas.ts`, `lib/library-search.ts`) behind that barrel. Same OpenNext static-export + Clarity System + `MedicalWebPage`-only-schema constraints as Phase 1.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, `@opennextjs/cloudflare`, Vitest.

## Global Constraints

- OpenNext -> Cloudflare Workers. Every enumerated page: `export const dynamic = "force-static"` + `generateStaticParams()`. NEVER `export const dynamicParams = false` (404s all paths on deploy).
- JSON-LD: `MedicalWebPage` + `about: MedicalCondition` + `BreadcrumbList` + author `Person` only. Never `HowTo` / `FAQPage` / `MedicalTest`.
- "The Clarity System": warm paper `#F6F3EC`, navy `#043246` ink, accent text `--color-primary-dark` (`#0A77A8`) NEVER raw `--color-primary` (`#0EA5E9`) as a `color:`. Fraunces headings, DM Sans body. Flat at rest; lift on hover/focus.
- ASCII / Latin-1 copy only: no U+2013 (`-`), U+2014 (`-`), U+2019 (`'`), U+2026 (`...`).
- Public pages import only from `@/lib/exercise-library` (the barrel), never `lib/conditions.ts` / `lib/exercises.ts` / `lib/self-tests.ts` directly. `lib/structured-data.ts` is the one documented exception (imports `conditions` directly to keep the layout bundle graph small — do not regress that).
- All new hub/exercise/test copy is AI-drafted, `reviewedOn: "2026-09-08"` placeholder, listed in a `docs/exercises-review/*.md` doc for the physiotherapist. It reaches dev; it does NOT reach production until she signs off.
- Stage only your own files (`git add <explicit paths>`, never `git add -A`). A concurrent Claude session shares this repo; untracked `scripts/*.mjs`, `generated-assets/`, `docs/social/`, `warehouse_*`, `physioonclick.co.uk-audit/` are NOT yours.
- tsc baseline is 8 pre-existing errors repo-wide; add 0. `npm run test:run` is already red with 9 pre-existing `booking-flow` + `toast-provider` failures — not a regression; verify against touched files.
- `npm run build` must succeed and statically export every new/changed route.

---

### Task 1: Curated body-area taxonomy (`lib/body-areas.ts`) + fix the browse

**Problem being fixed:** `bodyAreas()` currently returns the raw union of `Exercise.bodyPart` (internal clinical codes: `Neuro`, `Post-op`, `Balance`, `General`, `Core`, `Lumbar spine`, `Cervical spine`, `Face`, `Pelvic health`, `Paediatric`, ...) + `Condition.bodyArea` + a literal -> ~28 public chips, ~17 jargon-titled near-empty canonicalised pages, and `/exercises/area/Sports & return to activity` shows 0 exercises.

**Files:**
- Create: `lib/body-areas.ts`
- Modify: `lib/exercise-library.ts` (re-export the new helpers; keep `bodyAreas()` name but back it with the curated map), `lib/exercises.ts` (NO data change — only if a `bodyPart` value is genuinely wrong; do not retag wholesale)
- Modify: `app/exercises/area/[bodyArea]/page.tsx`, `app/exercises/page.tsx` (chip row), `app/sitemap.ts`
- Test: `tests/lib/body-areas.test.ts`, update `tests/app/sitemap.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // lib/body-areas.ts
  export type BodyAreaKey = string; // kebab, used in the URL: "shoulder", "lower-back", ...
  export type BodyArea = {
    key: BodyAreaKey;
    label: string;          // "Shoulder", "Lower back", "Neck", "Elbow & wrist", ...
    blurb: string;          // one plain sentence
    bodyParts: string[];    // Exercise.bodyPart values that roll up into this area
    conditionArea?: string; // the Condition.bodyArea value that corresponds (if any)
    order: number;
  };
  export const BODY_AREAS: BodyArea[];
  export function getBodyArea(key: string): BodyArea | null;
  export function allBodyAreaKeys(): string[];
  ```
- Consumed by Task 2 (body-map), Task 3 (search facets), the area page, the index, the sitemap.

**The curated map (12 public areas — every internal `bodyPart` maps to exactly one; keep this list in the plan verbatim):**

| key | label | bodyParts rolled up | conditionArea |
|---|---|---|---|
| `neck` | Neck | `Cervical spine`, `Neck` | `Back & neck` (shared) |
| `upper-back` | Upper back & shoulder blades | `Thoracic spine` | - |
| `lower-back` | Lower back | `Lumbar spine`, `Core` | `Back & neck` (shared) |
| `shoulder` | Shoulder | `Shoulder` | `Shoulder` |
| `elbow-wrist-hand` | Elbow, wrist & hand | `Elbow`, `Wrist`, `Hand` | `Elbow & wrist` |
| `hip` | Hip & groin | `Hip` | `Hip` |
| `knee` | Knee | `Knee` | `Knee` |
| `ankle-foot` | Ankle & foot | `Ankle`, `Lower limb` | `Ankle & foot` |
| `balance` | Balance & falls | `Balance` | `Older adults` |
| `after-surgery` | After surgery | `Post-op` | `Post-surgical` |
| `pregnancy-pelvic` | Pregnancy & pelvic health | `Pelvic health` | `Women's health` |
| `neuro` | Neurological rehab | `Neuro`, `Face` | - |

(Paediatric `bodyPart` and `clinicalArea: "general"` / `clinicalArea: "paediatric"` exercises: `general` folds into whichever area its `bodyPart` says; `Paediatric` bodyPart -> a 13th area `children` "Children's physiotherapy". Sports: NOT a body area — sports is condition-led only, keep `conditionsByBodyArea("Sports & return to activity")` working for the hub list but do not emit a `/exercises/area/sports*` page.)

- [ ] **Step 1: Write the failing test** (`tests/lib/body-areas.test.ts`): `BODY_AREAS` has 13 entries; every `Exercise.bodyPart` value in the catalogue appears in exactly one area's `bodyParts` (no bodyPart uncovered, none double-counted); every `key` is unique kebab-case; `getBodyArea` hit + miss; `allBodyAreaKeys().length === 13`; labels are ASCII and contain no internal jargon token (`assert not /Neuro|Post-op|Cervical|Lumbar|Thoracic/` in any label).
- [ ] **Step 2: Run it -> fails (no module).**
- [ ] **Step 3: Create `lib/body-areas.ts`** with the map above. In `lib/exercise-library.ts`: `bodyAreas()` now returns `BODY_AREAS.map(a => a.label)` (or keep returning keys — pick one and make `exercisesByBodyArea` / the sitemap / the page consistent); `exercisesByBodyArea(key)` filters `exercises` where `bodyPart in getBodyArea(key).bodyParts`; `conditionsByBodyArea(key)` filters on `getBodyArea(key).conditionArea`. Update `app/exercises/area/[bodyArea]/page.tsx` to take the kebab `key` param, `getBodyArea` -> `notFound()` on miss, render `label` + `blurb` + the exercise grid + the condition-hub grid + (Task 4's safety block). `generateStaticParams` from `allBodyAreaKeys()`. `alternates.canonical` stays `/exercises`. Update the `app/exercises/page.tsx` chip row to `BODY_AREAS` (label + `/exercises/area/<key>`). Update `app/sitemap.ts` to enumerate `allBodyAreaKeys()`.
- [ ] **Step 4:** `npx vitest run tests/lib/body-areas.test.ts tests/app/sitemap.test.ts tests/app/exercise-library-index.test.tsx` green; `npx tsc --noEmit` = 8; `npm run build` exports one `/exercises/area/[bodyArea]` per key (13). Update the sitemap test's area-count.
- [ ] **Step 5: Commit** `feat(exercises): curated plain-language body-area taxonomy`

---

### Task 2: "Where does it hurt?" entry on `/exercises`

**Files:**
- Create: `components/exercise-library/body-map.tsx` (server component)
- Modify: `app/exercises/page.tsx`
- Test: extend `tests/app/exercise-library-index.test.tsx`

**Interfaces:**
- Consumes: `BODY_AREAS` (Task 1).

- [ ] **Step 1: Write the failing test:** `/exercises` renders a region with `[data-body-map]` containing a link to `/exercises/area/<key>` for every `BODY_AREAS` entry, each labelled with the area `label`; the section has a heading like "Where does it hurt?" / "Find exercises by area".
- [ ] **Step 2: Fail.**
- [ ] **Step 3: Build `<BodyMap>`** — NOT a fiddly SVG silhouette (skip that complexity); a clean responsive grid of large tap targets, one per `BODY_AREAS` entry: the `label`, the `blurb` in small text, links to `/exercises/area/<key>`. Clarity styling, lift on hover. Render it high on `/exercises` — directly under the hero, above the search, as the primary way in. Keep the condition grid below it.
- [ ] **Step 4:** vitest green; tsc 8; `npm run build`.
- [ ] **Step 5: Commit** `feat(exercises): body-area entry point on the library index`

---

### Task 3: Symptom-aware search (`lib/library-search.ts`)

**Problem:** `searchLibrary` / `librarySearchIndex` match a raw case-insensitive substring on `title` + `aka` only. "knee cap pain", "sore shoulder at night", "trapped nerve", "runners knee" all return nothing.

**Files:**
- Create: `lib/library-search.ts` (the ranking + synonym logic, pure)
- Modify: `lib/exercise-library.ts` (`searchLibrary` + `librarySearchIndex` delegate to it; widen the index shape to include `helpsWith` / `bodyArea` / `conditionName`)
- Modify: `components/exercise-library/library-search.tsx` (use the richer matcher client-side; keep it pure-in-memory, no fetch)
- Test: `tests/lib/library-search.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type SearchItem =
    | { kind: "exercise"; slug: string; title: string; terms: string[] }
    | { kind: "condition"; slug: string; name: string; terms: string[] };
  export function buildSearchItems(): SearchItem[];
  export function searchItems(items: SearchItem[], query: string): SearchItem[]; // ranked, deduped, cap 12
  export const SEARCH_SYNONYMS: Record<string, string[]>; // "kneecap" -> ["patella","patellofemoral"], ...
  ```
- `terms` for an exercise = `[title, ...aka, ...helpsWith, condition, bodyPart-area-label]` lower-cased + tokenised. For a condition = `[name, ...aka, bodyArea, ...program stage names]`.
- Matching: tokenise the query, expand each token through `SEARCH_SYNONYMS`, score by (a) exact phrase in `title`/`name` (highest), (b) all query tokens present across `terms`, (c) any token present. Return sorted, exercises and conditions interleaved by score, cap 12.

- [ ] **Step 1: Write the failing test:** `searchItems(buildSearchItems(), "kneecap pain")` returns the `patellofemoral-pain` condition and >=1 knee exercise; `"sore shoulder at night"` returns `rotator-cuff-tendinopathy`; `"trapped nerve leg"` returns `sciatica`; `"tennis elbow"` returns `tennis-elbow`; `"frozen"` returns `frozen-shoulder`; an empty/whitespace query returns `[]`; results are capped at 12; the same slug never appears twice.
- [ ] **Step 2: Fail.**
- [ ] **Step 3: Build** `lib/library-search.ts` with a hand-written `SEARCH_SYNONYMS` map (~25 entries covering the common lay terms for the 25 conditions + the body regions). Rewire `searchLibrary` (server) and `librarySearchIndex` (the serialisable client payload — now `{ items: SearchItem[] }`) to use it. Update `library-search.tsx` to consume `SearchItem[]` and call `searchItems`. Keep the 8+8 -> now single ranked list of <=12, grouped visually by kind.
- [ ] **Step 4:** vitest green (`tests/lib/library-search.test.ts` + `tests/components/exercise-library-interactive.test.tsx` + `tests/app/exercise-library-index.test.tsx`); tsc 8; `npm run build`.
- [ ] **Step 5: Commit** `feat(exercises): symptom-aware library search with a synonym map`

---

### Task 4: Generic "Using these exercises safely" block

**Files:**
- Create: `components/exercise-library/exercise-safety-note.tsx` (server component)
- Modify: `app/exercises/[slug]/page.tsx`, `app/exercises/for/[condition]/page.tsx`, `app/exercises/page.tsx`, `app/exercises/area/[bodyArea]/page.tsx`
- Modify: `app/globals.css` (EOF append)
- Test: `tests/components/exercise-safety-note.test.tsx` + assert it renders on each page in that page's existing test

**Interfaces:**
- `<ExerciseSafetyNote variant?: "full" | "compact" />` — no props otherwise; copy is a module const.

- [ ] **Step 1: Write the failing test:** the component renders a heading ("Using these exercises safely") and list items covering: build up gradually; some muscle soreness up to about 3-4 out of 10 that settles within a day is fine; sharp, spreading, or night pain is not - stop and get it checked; do not push through pain; these are general exercises, not a substitute for a personal assessment. `compact` variant renders a shorter 2-3 line version. All copy ASCII. The `[slug]`, hub, index and area page tests each assert a `[data-safety-note]` element is present.
- [ ] **Step 2: Fail.**
- [ ] **Step 3: Build the component** (Clarity "note" styling - bordered, accent left edge, `--color-primary-dark` heading). `full` on `/exercises` and each area page; `compact` on every exercise page and hub (they already have per-item safety lines / red-flags, so keep it short there). Give the wrapper `data-safety-note`.
- [ ] **Step 4:** vitest green across the touched page tests; tsc 8; `npm run build`.
- [ ] **Step 5: Commit** `feat(exercises): shared "using these exercises safely" guidance`

---

### Task 5: Richer exercise pages + wire hub->blog cross-links

**Files:**
- Modify: `app/exercises/[slug]/page.tsx` (prominent "What this helps with" + equipment + "appears in these programmes")
- Modify: `app/exercises/for/[condition]/page.tsx` (render `relatedBlogSlugs` - currently in the data model but never shown)
- Modify: `lib/exercise-library.ts` (add `programmesForExercise(slug): { condition: Condition; stage: string }[]` and `relatedArticlesForCondition(slug)` re-using `lib/blog.ts` + the existing `articlesForServiceSlug` pattern)
- Modify: `app/globals.css` (EOF append)
- Test: extend `tests/app/exercise-page.test.tsx`, `tests/app/condition-hub-page.test.tsx`, add to `tests/lib/exercise-library.test.ts`

**Interfaces:**
- Produces: `programmesForExercise(exerciseSlug: string): { condition: Condition; stageName: string }[]` (which condition programmes + stage the exercise appears in); `relatedArticlesForCondition(conditionSlug: string): { slug: string; title: string }[]` (from `condition.relatedBlogSlugs`, resolved against `lib/blog.ts`, silently dropping unknowns).

- [ ] **Step 1: Write failing tests:** exercise page for `clam-shell` shows a "What this helps with" block listing its `helpsWith` (or, if empty, the names of the conditions from `conditionsForExercise`), an equipment line (or "No equipment needed"), and an "Appears in these programmes" list linking each `programmesForExercise` hub. Hub page for a condition with `relatedBlogSlugs` shows a "Read more" list linking `/blog/<slug>` for each resolved article; a condition without them shows no such block.
- [ ] **Step 2: Fail.**
- [ ] **Step 3: Implement.** Keep the existing page structure; these are additive sections placed sensibly (helps-with in the hero area, programmes + related exercises together, blog links in the hub's "Related" section next to the related-condition links).
- [ ] **Step 4:** vitest green; tsc 8; `npm run build`.
- [ ] **Step 5: Commit** `feat(exercises): richer exercise pages + hub blog cross-links`

---

### Task 6: ~18 new MSK exercises for the thin regions

**Files:**
- Modify: `lib/exercises.ts` (append the new records to the `exercises` array, ids `ex-151`..`ex-168`)
- Modify: `lib/exercise-image-prompts.ts` (a `core` prompt for each new id, wrapped by the existing PREFIX/SUFFIX)
- Modify: `lib/conditions.ts` (wire the relevant new exercises into the thin hubs' `program[].exerciseSlugs`: golfers-elbow, tennis-elbow, gluteal-tendinopathy, neck-pain, achilles-tendinopathy)
- Modify: `docs/exercises-review/full-catalogue.md` (append the new entries with the "Flagged for review" format)
- Test: update `tests/lib/exercise-plan.test.ts` / `tests/lib/exercises*.test.ts` count assertions; `tests/lib/exercise-library.test.ts` (slug uniqueness still holds); `tests/app/sitemap.test.ts` (exercise count)

**The 18 (slug | title | bodyPart | clinicalArea | primary hub):**
1. `eccentric-wrist-flexion` | Eccentric Wrist Flexion | Wrist | upper_limb | golfers-elbow
2. `resisted-wrist-flexion` | Resisted Wrist Flexion | Wrist | upper_limb | golfers-elbow
3. `forearm-pronation-supination` | Forearm Rotation with Weight | Wrist | upper_limb | golfers-elbow / tennis-elbow
4. `wrist-extension-isotonic` | Wrist Extension with Weight | Wrist | upper_limb | tennis-elbow
5. `tyler-twist-flexbar` | Tyler Twist (Resistance Bar) | Elbow | upper_limb | tennis-elbow
6. `hip-hitch` | Hip Hitch (Pelvic Drop) | Hip | lower_limb | gluteal-tendinopathy
7. `banded-hip-external-rotation` | Banded Hip External Rotation | Hip | lower_limb | gluteal-tendinopathy
8. `copenhagen-adductor` | Copenhagen Adductor Hold | Hip | lower_limb | gluteal-tendinopathy / return-to-sport-readiness
9. `single-leg-glute-bridge` | Single-Leg Glute Bridge | Hip | lower_limb | gluteal-tendinopathy / patellofemoral-pain
10. `standing-banded-hip-abduction` | Standing Banded Hip Abduction | Hip | lower_limb | gluteal-tendinopathy
11. `deep-neck-flexor-hold` | Deep Neck Flexor Endurance Hold | Cervical spine | spine | neck-pain
12. `banded-neck-isometrics` | Banded Neck Isometrics (4-Way) | Cervical spine | spine | neck-pain
13. `prone-neck-extension` | Prone Neck Extension | Cervical spine | spine | neck-pain
14. `heavy-slow-calf-raise` | Heavy Slow Calf Raise | Ankle | lower_limb | achilles-tendinopathy
15. `seated-calf-raise` | Seated Calf Raise (Soleus) | Ankle | lower_limb | achilles-tendinopathy
16. `spanish-squat` | Spanish Squat (Isometric) | Knee | lower_limb | patellar-tendinopathy / patellofemoral-pain
17. `reverse-nordic` | Reverse Nordic (Quad Eccentric) | Knee | lower_limb | patellar-tendinopathy
18. `isometric-quad-wall-sit` | Isometric Wall Sit (Timed) | Knee | lower_limb | patellofemoral-pain / patellar-tendinopathy

- [ ] **Step 1: Write the failing test first** — bump the catalogue-count assertions (158 -> 176) in the test files that hardcode it; assert every new slug is unique, kebab-case, and resolves via `getExerciseBySlug`; assert the 5 target hubs now reference at least one new slug; assert every new exercise has `setup` + >=3 `steps` + >=3 `cues` + >=3 `mistakes` (incl. a safety line) + a `defaultDosage` with a real prescribed field + a `pose` (existing pose key or `null`) + `helpsWith`.
- [ ] **Step 2: Fail.**
- [ ] **Step 3: Write the 18 records** to `lib/exercises.ts` matching the `clam-shell` record shape EXACTLY (4-space field indent inside a 6-space array element; `condition` = a short plain phrase; `stage` = one of the drafting vocabulary e.g. "Build strength"; `tags` = 2-4 kebab tags; `description` = one sentence; `equipment` only when used). Draft `setup/steps/cues/mistakes/defaultDosage` to the same standard as the existing 158 (plain UK English, a "Stop and ..." safety line as the last `mistakes` entry). `pose`: reuse `calfRaise`/`wallSlide`/`bandRotation`/`chinTuck`/`scapularSet` etc. where they fit, else `null`. Add a `core` image prompt for each id to `lib/exercise-image-prompts.ts`. Wire the target hubs in `lib/conditions.ts` (add the new slugs into the appropriate `program` stage's `exerciseSlugs`; keep each stage 3-6 exercises). Append to `docs/exercises-review/full-catalogue.md`.
- [ ] **Step 4:** `npx vitest run` the touched lib + sitemap tests green; `npx tsc --noEmit` = 8; `npm run build` (now 176 exercise pages + 176 exercise-og); lint clean.
- [ ] **Step 5: Commit** `content(exercises): 18 new MSK loading exercises for the thin regions (draft, pending clinical review)`

---

### Task 7: Deepen all 25 condition-hub intros + fix SEO metadata

**Files:**
- Modify: `lib/conditions.ts` (`intro`, and where thin also `whoItHelps` / `recoveryTimeline` / `progressGuidance`; `seoTitle`, `seoDescription`)
- Modify: `docs/exercises-review/condition-hubs.md` (note the rewrite; keep the per-hub Approved checkboxes)
- Test: `tests/lib/conditions.test.ts` — tighten the length assertions

- [ ] **Step 1: Write / tighten the failing test:** every `intro` is 220-320 words; every `seoTitle` <= 60 chars and ends "| PhysioOnClick"; every `seoDescription` is 120-158 chars; `whoItHelps` >= 40 words; still ASCII/Latin-1; still one `MedicalWebPage` per hub (unchanged).
- [ ] **Step 2: Run -> fails (current intros are 110-155 words; 4 seoTitles > 60; ~13 seoDescriptions > 158).**
- [ ] **Step 3: Rewrite** each `intro` to 220-320 words: what the condition is in plain terms, the anatomy in one or two sentences, why it tends to happen, the typical day-to-day picture, that it is usually manageable and not dangerous (where true), the natural course / prognosis with rough timeframes, and what this staged programme sets out to do. Voice: warm, confident, specific, non-alarming - the same register as `rotator-cuff-tendinopathy`'s current intro but fuller. Trim every `seoTitle` to <= 60 and every `seoDescription` to 150-158 without losing the primary keyword. This is the largest content task - do it in body-region batches if using sub-drafters, but ONE commit.
- [ ] **Step 4:** `npx vitest run tests/lib/conditions.test.ts tests/lib/exercise-library.test.ts tests/app/condition-hub-page.test.tsx tests/app/sitemap.test.ts` green; tsc 8; `npm run build`.
- [ ] **Step 5: Commit** `content(exercises): full-depth condition-hub intros + tightened SEO metadata (draft, pending clinical review)`

---

### Task 8: Final review + dev deploy

- [ ] Full `npm run test:run` (expect only the 9 pre-existing failures).
- [ ] `npm run build` — confirm the new route counts (176 exercise pages, 13 area pages, self-tests unchanged).
- [ ] Whole-branch review (`superpowers:requesting-code-review`, most capable available model) over the competitive-pass range. Fix Critical/Important in ONE fix subagent.
- [ ] `superpowers:finishing-a-development-branch` -> push `origin/master` -> `npm run deploy:dev` -> smoke-test the new surfaces (body-map entry, an area page with the plain label, a search for "kneecap pain", the safety block, a deepened hub, a new exercise page).
- [ ] Update `.git/sdd/progress.md` + the `project_public_exercise_library` memory. Refresh the `docs/exercises-review/*.md` covering notes so the physiotherapist review covers the new content.

---

## Self-Review

- **Spec coverage:** this plan is the competitive-pass follow-up to `docs/superpowers/specs/2026-09-08-public-exercise-library.md`; it implements the whole-branch review's "before production" items (curated body-area map, the thin-hub / exercise-gap findings) plus the owner's explicit asks (discovery, search, generic do's/don'ts). Images remain out of scope (owner-gated). Firestore CMS remains Phase 2.
- **Placeholder scan:** the hub-intro and exercise-record prose is written by the implementer/sub-drafters to a defined standard, not spelled out here - deliberate and consistent with how the original 158 + 25 hubs were done; tests validate structure and length, the physiotherapist validates clinical content.
- **Type consistency:** `BodyArea` / `BodyAreaKey` (Task 1) consumed by Tasks 2, 3, 4; `SearchItem` (Task 3) consumed by the search component; `programmesForExercise` / `relatedArticlesForCondition` (Task 5) are new barrel exports; the `Exercise` and `Condition` shapes are unchanged (Tasks 6-7 add records / edit fields, no schema change).
- **Ordering:** Task 1 is foundational (2, 3-facets, 4-area-page, sitemap depend on it). Task 6 before Task 7 (both touch `lib/conditions.ts` - 6 edits `program`, 7 edits `intro`/SEO; do 6 first so 7's drafters see the final exercise set). 2-5 are independent of each other. 8 last.
