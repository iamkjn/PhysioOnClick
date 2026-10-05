# SEO Phase C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase C of `docs/seo/competitor-keyword-gap-2026-09-30.md`:
- Neurological condition landing pages.
- Post-surgery "online rehab after X" landing pages.
- An honest "how to choose an online physiotherapist" guide (replacing the "best online physio UK" idea).
- A "Self-checks" entry in the main navigation.

**Architecture:** Everything reuses the Phase B systems already on this branch (`feat/seo-phase-b`):
- Landing pages are new records in `lib/online-physio-pages.ts`, served by `app/online-physiotherapy-for/[slug]`.
- The choosing guide is a new record in `lib/guides.ts`.
- Facts come only from `docs/seo/phase-b-sources.md`, extended in Task 1.

Phase C rides the same clinical-review gate: dev site only until Shivaliba signs off.

**Tech Stack:** Next.js 15 App Router (force-static), TypeScript, Vitest, OpenNext on Cloudflare Workers.

## Global Constraints

- Everything in `docs/superpowers/plans/2026-10-01-seo-phase-b.md` "Global Constraints" still applies verbatim. The implementer reads it from `/Users/iamkjn/Documents/Playground/.git/worktrees/seo-phase-b/sdd/global-constraints.md`.
- Every rule in `/Users/iamkjn/Documents/Playground/.git/worktrees/seo-phase-b/sdd/content-lessons.md` applies. In particular, the SAFETY rule: never route a symptom less urgently than the NHS does. Neuro pages must carry the stroke FAST / 999 routing.
- Work only in worktree `.worktrees/seo-phase-b`, branch `feat/seo-phase-b`.
- **No ACL landing page.** The existing blog post `online-physiotherapy-after-acl-reconstruction` owns that query. Link to it instead.
- **Neuro scope honesty:** our neuro service supports people who are medically stable, alongside their wider team, by video, with a carer welcome.
  - No claims of specialist status, "neuro specialist" titles, or treating acute presentations.
  - FND content must not imply a cure or a specific outcome.
  - Every neuro page must say that triage at booking confirms whether video suits the person.
- **Comparison guide (CAP Code):**
  - Only objective, verifiable facts about named competitors: published price, session length, and whether video is offered. Each fact comes from the fact sheet, with the date checked.
  - No subjective rankings or "best".
  - The table must state the check date and say prices may have changed.
  - Our own price comes via the `{INITIAL_PRICE}` / `{FOLLOW_UP_PRICE}` tokens.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Known pre-existing failures:** 11 on master, not regressions:
  - body-chart region buttons
  - booking-flow x2
  - exercise-library-interactive x2
  - start-session-flow-status
  - condition-hub "from" price
  - exercise-page dose string
  - checkout-create x3

## Shared interface changes

```ts
// lib/online-physio-pages.ts — OnlinePhysioPage gains one optional field:
/** How the condition reads mid-sentence ("Parkinson's", "stroke recovery",
 *  "knee replacement"). Defaults to name.toLowerCase() when omitted. */
nameInSentence?: string;
export function sentenceName(p: OnlinePhysioPage): string; // nameInSentence ?? name.toLowerCase()
```

Both call sites that currently do `name.toLowerCase()` must use `sentenceName(page)`:
- `app/online-physiotherapy-for/[slug]/page.tsx:134`
- `app/exercises/for/[condition]/page.tsx:288`

The h1 rule in `tests/lib/online-physio-pages.test.ts` becomes: h1 starts with "Online physiotherapy for" OR "Online physiotherapy after".

---

### Task 1: Extend the fact sheet (neuro, post-surgery, choosing a physio)

**Files:** Modify `docs/seo/phase-b-sources.md`: add items 12-14, in the same bullet format, with checked dates and quotes under 15 words.

- [ ] **Step 1: Research with WebFetch / WebSearch on primary pages.** Use the exact canonical URLs. Mark anything you can't read as NOT VERIFIED.
  - **Item 12, neurological:**
    - NHS stroke recovery / rehabilitation (physiotherapy's role) and NHS stroke symptoms (FAST, 999). The FAST item already exists in item 11, so reference it.
    - NHS Parkinson's disease (physiotherapy; exercise).
    - NHS multiple sclerosis (physiotherapy; relapse symptoms needing urgent care).
    - NHS inform or neurosymptoms.org on functional neurological disorder (FND), covering physiotherapy's role.
    - The Physio4FND trial result (Lancet 2024/2025): record its ACTUAL finding precisely. Do not characterise it beyond what the paper says.
    - NHS on acquired / traumatic brain injury rehabilitation, plus its urgent symptoms.
    - NICE NG236 (stroke rehabilitation in adults, 2023) if it can be read.
  - **Item 13, post-surgery:**
    - NHS knee replacement recovery (physio exercises, typical return-to-activity times).
    - NHS hip replacement recovery.
    - NHS (or an NHS trust) rotator cuff repair recovery.
    - Signs of DVT / blood clot and wound infection after surgery, with the NHS's own routing (999 / A&E / 111 / surgical team).
  - **Item 14, choosing a physiotherapist:**
    - HCPC "check the register" page.
    - CSP "find a physio" / what to look for, if available.
    - Re-verify the competitor prices already in item 8, with today's date: Nuffield, Complete Physio, PhysioFast, Ascenti. Also record whether each offers video sessions, per its own page.
- [ ] **Step 2: Commit** `docs: phase C sources (neuro, post-surgery, choosing a physio)`.

---

### Task 2: Sentence-case names, "after" h1s, and three post-surgery landing pages

**Files:**
- Modify `lib/online-physio-pages.ts`: add the field, `sentenceName`, and 3 records.
- Modify `app/online-physiotherapy-for/[slug]/page.tsx` and `app/exercises/for/[condition]/page.tsx` to use `sentenceName`.
- Modify `tests/lib/online-physio-pages.test.ts`: relax the h1 rule, and add the slug assertions and `sentenceName` tests.
- Modify `lib/site-data.ts`: `post-surgical-rehabilitation` gets `onlinePhysioSlugs` for the 3 new slugs.

| slug | h1 | name / nameInSentence | exerciseHubSlug | serviceSlug | notes |
|---|---|---|---|---|---|
| `knee-replacement-rehab` | Online physiotherapy after knee replacement | Knee replacement / knee replacement | `after-knee-replacement` | post-surgical-rehabilitation | Link the knee-pain landing page. Surgical-team-first for wound/clot/infection, with NHS routing from item 13. |
| `hip-replacement-rehab` | Online physiotherapy after hip replacement | Hip replacement / hip replacement | `after-hip-replacement` | post-surgical-rehabilitation | Hip precautions only as the surgical team advises (say so; don't invent precautions). |
| `rotator-cuff-repair-rehab` | Online physiotherapy after rotator cuff repair | Rotator cuff repair / rotator cuff repair | none, or `rotator-cuff-tendinopathy` only if appropriate (explain your choice) | post-surgical-rehabilitation | Sling and protection phases are set by the surgeon. Link the shoulder-pain landing page and `blogSlugs: ["online-physiotherapy-after-acl-reconstruction"]` is NOT relevant here. Also add a "Related" mention of the ACL blog post on the knee page FAQ ("Had ACL surgery? See ..."). |

Every page must say:
- online rehab starts once the surgical team has cleared exercise-based rehab;
- wound checks and complications go back to the surgical team.

Base this on the `whenInPersonInstead` copy for post-surgical-rehabilitation in `lib/site-data.ts`: attribute it, reword it, and never copy it.

- [ ] **Step 1: Write the failing tests:**
  - `sentenceName` returns `nameInSentence` when set, and the lowercased name otherwise.
  - The 3 slugs exist.
  - The h1 rule accepts "after".
  - The post-surgical service's `onlinePhysioSlugs` resolve.

  Run them and expect FAIL.
- [ ] **Step 2: Implement.** Run `npx vitest run tests/lib/online-physio-pages.test.ts tests/app/online-physio-page.test.tsx tests/app/condition-hub-page.test.tsx tests/app/sitemap.test.ts tests/app/scotland-page.test.tsx`. Only the known condition-hub failure is allowed. Update the sitemap count test honestly if it is exact.
- [ ] **Step 3: Commit** `content: online rehab after knee, hip and rotator cuff surgery`.

---

### Task 3: Neurological landing pages

**Files:**
- Modify `lib/online-physio-pages.ts`: add 4 records.
- Modify `lib/site-data.ts`: `neurological-rehabilitation.onlinePhysioSlugs`.
- Tests as in Task 2.

| slug | h1 | nameInSentence | serviceSlug | notes |
|---|---|---|---|---|
| `stroke-rehabilitation` | Online physiotherapy for stroke recovery | stroke recovery | neurological-rehabilitation | FAST / 999 first in `inPersonInstead`. For people medically stable after hospital discharge. Carer welcome. Alongside NHS stroke team. |
| `parkinsons` | Online physiotherapy for Parkinson's | Parkinson's | neurological-rehabilitation | Exercise and movement, falls; link the gait service and the falls-prevention hub (`exerciseHubSlug: "falls-prevention"` if it exists). No disease-modification claims. |
| `multiple-sclerosis` | Online physiotherapy for multiple sclerosis | MS | neurological-rehabilitation | Fatigue-aware pacing only if sourced. NHS relapse routing. |
| `functional-neurological-disorder` | Online physiotherapy for functional neurological disorder (FND) | FND | neurological-rehabilitation | State the Physio4FND finding exactly as the sheet records it. Never claim cure or outcome. Say that FND diagnosis comes from a neurologist, not us. |

- [ ] **Step 1: Failing tests** (4 slugs exist; the neuro service links resolve). Run them and expect FAIL.
- [ ] **Step 2: Implement**, then run the same test set as Task 2.
- [ ] **Step 3: Commit** `content: online neuro physiotherapy pages (stroke, Parkinson's, MS, FND)`.

---

### Task 4: "How to choose an online physiotherapist" guide

**Files:**
- Modify `lib/guides.ts`: one record, slug `how-to-choose-an-online-physiotherapist-uk`.
- Modify `tests/lib/guides.test.ts`: slug assertion.

Content:
- **Title:** "How to choose an online physiotherapist in the UK".
- **Target queries:** best online physio uk, online physio uk reviews, choosing an online physiotherapist.
- **Sections:**
  - A checklist: HCPC register check (item 14), what the first session should include, price transparency, what happens if video isn't right, invoices for insurance.
  - "Prices at some UK providers (checked <date>)", as a set of paragraphs: provider, price as words, session length, video yes/no. Use only item 8/14 facts, and say prices may have changed.
  - "Where we fit", factual only: our prices via tokens, video only, an HCPC number, and what we don't offer.
- **Rules:** no ranking, no "best", no disparagement.
- **Related links:** `/pricing`, `/guides/does-online-physiotherapy-work`, `/guides/claim-physiotherapy-on-health-insurance`.

Steps:
- [ ] Failing test, then implement, then run `npx vitest run tests/lib/guides.test.ts tests/app/guide-page.test.tsx tests/app/sitemap.test.ts`.
- [ ] Commit `content: how to choose an online physiotherapist guide`.

---

### Task 5: "Self-checks" in the main navigation

**Files:**
- Modify `components/site-header.tsx`: add `{ href: "/exercises/tests", label: "Self-checks" }` directly after Exercises.
- Make sure `isActive` doesn't light up both items:
  - `/exercises/tests` must highlight only Self-checks.
  - `/exercises/*` (other) must highlight only Exercises.
- Add or extend a header test (find the existing one under `tests/components`).
- Check the layout doesn't wrap or overflow. Read the header CSS in `app/globals.css`. Note it in the report if the item count needs a breakpoint tweak, and make the minimal CSS change if needed.

Steps:
- [ ] Failing test for both active-state cases.
- [ ] Implement.
- [ ] Run the header tests.
- [ ] Commit `feat: Self-checks link in the main navigation`.

---

### Task 6: Review pack, verification

- [ ] Regenerate `docs/seo/phase-b-clinical-review.md`. Use the same throwaway-generator approach (not committed).
  - Add the 7 new landing pages and the new guide, each with a checkbox.
  - Add questions to "Questions for Shivaliba / the owner":
    - (9) Is she comfortable being positioned for stroke, Parkinson's, MS and FND online?
    - (10) Are the post-surgery "when to start" and red-flag lines right for her practice?
    - (11) Is the comparison guide's competitor price table acceptable to publish?
- [ ] Verification:
  - `npx tsc --noEmit -p . 2>&1 | grep -v "^tests/"` is empty.
  - Lint shows no new findings.
  - Full vitest has only the 11 known failures.
  - The title/description length table for the 8 new pages is in the report.
- [ ] Commit `docs: phase C added to clinical review pack`.

**After Task 6 (controller):**
- Run the final whole-branch review of the Phase C range.
- Deploy to dev from this worktree. It has real node_modules; never symlink.
- Check every new URL returns 200 with the banner, and `/guides` lists the new guide.
- Production still waits for Shivaliba.
