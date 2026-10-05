# SEO Phase B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Phase B pages from `docs/seo/competitor-keyword-gap-2026-09-30.md`:
- B1: 8 "online physiotherapy for [condition]" landing pages.
- B2: 5 cost, insurance and access guides.
- B3: 3 "does online physio work" Q&A guides.
- B4: one "online physiotherapy in Scotland" page.
- Internal links into all of the above from existing pages.

**Architecture:** Two new data-driven, statically exported route families, both following the pattern used by `app/exercises/for/[condition]`:
- `/online-physiotherapy-for/[slug]`, backed by `lib/online-physio-pages.ts`.
- `/guides/[slug]`, backed by `lib/guides.ts`.

`/online-physiotherapy-scotland` is a static page. Every record is individually written, not generated from templates. Each record carries a `sources` list, and every factual claim in it must trace to one of those sources. All sources come from a fact sheet written in Task 1.

**Tech Stack:** Next.js 15 App Router (force-static + generateStaticParams), TypeScript, Vitest + Testing Library (jsdom), deployed via OpenNext on Cloudflare Workers.

## Global Constraints

- Work only in worktree `.worktrees/seo-phase-b` on branch `feat/seo-phase-b`. Never touch the main checkout, because another session has uncommitted work there.
- **Routes:**
  - Every dynamic route sets `export const dynamic = "force-static";` and `generateStaticParams()`.
  - **Never** add `export const dynamicParams = false` (it 404s every path on OpenNext deploys).
  - Unknown slugs call `notFound()`.
  - No `loading.tsx` under any new route segment.
- **Prices:** never hardcode a price. Import `initialAssessmentPrice` and `pricing` from `@/lib/site-data`.
- **Copy rules** for all new content data (enforced by tests):
  - Plain UK English, reading age about 12, calm and never alarmist.
  - Straight quotes only. ASCII hyphen; no en or em dashes. Latin-1 characters only, except `£`.
  - No superlatives about ourselves ("best", "leading", "No.1").
  - No claim that any named insurer accepts our invoices. The owner has not confirmed this.
  - No conditions or services we don't offer (no women's/pelvic health service, no FND/MS pages, no in-person or home visits).
- **Online-only honesty:** the practice is online-only, by video. Every page must say plainly when someone needs in-person or urgent care instead.
- **Clinical review gate:** all new copy is a draft until Shivaliba Zala signs it off. It may be deployed to the dev site, never to production, before sign-off. Task 9 produces the review document.
- **Titles:**
  - Each new page's `<title>` ends with `| PhysioOnClick` and is at most 65 characters.
  - Meta descriptions are 120-160 characters.
- **Schema:** no `FAQPage` or `HowTo` JSON-LD (Google retired those rich results). FAQs ride inside `MedicalWebPage` as `Question`/`Answer` nodes, like `conditionWebPage` in `lib/structured-data.ts`.
- **Analytics:** every new `app/**/page.tsx` must get a row in `docs/analytics-tracking.md` (enforced by `tests/app/analytics-tracking-registry.test.ts`).
- **Commits:** end every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Tests:** run with `npx vitest run <file>`. `npm run test:run` already has known failures on master in `tests/app/exercise-page.test.tsx` (expects a bare `/book` href) and `tests/app/condition-hub-page.test.tsx` (expects the old £25 price). Don't fix them and don't count them as regressions.

## File Structure

| File | Responsibility |
|---|---|
| `docs/seo/phase-b-sources.md` (create) | Verified fact sheet: each claim, the exact source URL and a short quote. The only allowed source of facts and citations for content tasks. |
| `lib/content-types.ts` (create) | Shared `Source` and `RelatedLink` types. |
| `components/inline-text.tsx` (create) | Renders a paragraph string with `[label](/internal-path)` links into React (internal paths only). |
| `lib/guides.ts` (create) | `Guide` type, the `guides` array, `getGuide`, `allGuideSlugs`. |
| `app/guides/page.tsx` (create) | Guides index. |
| `app/guides/[slug]/page.tsx` (create) | Guide detail page. |
| `lib/online-physio-pages.ts` (create) | `OnlinePhysioPage` type, the `onlinePhysioPages` array, `getOnlinePhysioPage`, `allOnlinePhysioSlugs`. |
| `app/online-physiotherapy-for/[slug]/page.tsx` (create) | Condition landing page. |
| `app/online-physiotherapy-scotland/page.tsx` (create) | Scotland page. |
| `lib/structured-data.ts` (modify) | Add `guideWebPage` and `onlinePhysioWebPage`. |
| `app/sitemap.ts` (modify) | Add guides, condition landing pages and the Scotland page. |
| `docs/analytics-tracking.md` (modify) | Registry rows for the 4 new page files. |
| `tests/lib/guides.test.ts`, `tests/lib/online-physio-pages.test.ts`, `tests/app/guide-page.test.tsx`, `tests/app/online-physio-page.test.tsx`, `tests/app/scotland-page.test.tsx`, `tests/components/inline-text.test.tsx` (create) | Tests. |
| Linking files (modify in Task 8) | `app/services/[slug]/page.tsx`, `lib/site-data.ts`, `app/exercises/for/[condition]/page.tsx`, `app/glasgow-physiotherapist/page.tsx`, `components/site-footer.tsx`, `app/how-online-physiotherapy-works/page.tsx`, `app/pricing/page.tsx` |
| `docs/seo/phase-b-clinical-review.md` (create in Task 9) | Every new piece of copy laid out for Shivaliba's sign-off. |

## Shared interfaces (used across tasks)

```ts
// lib/content-types.ts
export type Source = { label: string; url: string };      // url must be https://
export type RelatedLink = { label: string; href: string }; // href must start with "/"
```

```ts
// lib/guides.ts
export type GuideSection = { heading: string; paragraphs: string[] };
export type Guide = {
  slug: string;              // kebab-case, also the URL segment
  title: string;             // H1, question or plain statement
  seoTitle: string;          // <= 65 chars, ends "| PhysioOnClick"
  seoDescription: string;    // 120-160 chars
  answer: string;            // 40-70 word direct answer shown first (AI Overview / snippet bait)
  sections: GuideSection[];  // >= 3; paragraphs may contain [label](/path) links
  faqs: { q: string; a: string }[]; // >= 3
  sources: Source[];         // >= 2, every URL also listed in docs/seo/phase-b-sources.md
  related: RelatedLink[];    // >= 2 internal links
  publishedOn: string;       // YYYY-MM-DD
  reviewedOn: string;        // YYYY-MM-DD
};
export const guides: Guide[];
export function getGuide(slug: string): Guide | null;
export function allGuideSlugs(): string[];
```

```ts
// lib/online-physio-pages.ts
export type OnlinePhysioPage = {
  slug: string;                  // URL segment, e.g. "sciatica"
  name: string;                  // "Sciatica"
  h1: string;                    // "Online physiotherapy for sciatica"
  seoTitle: string;              // <= 65 chars, ends "| PhysioOnClick"
  seoDescription: string;        // 120-160 chars
  answer: string;                // 40-70 word direct answer: can this be treated online?
  howOnlineWorks: string[];      // paragraphs: why video suits THIS condition, specifically
  assessmentChecks: string[];    // bullet list: what the video assessment checks for this condition
  typicalPlan: string[];         // paragraphs: what a plan usually involves + rough number of sessions
  timeline: string;              // one paragraph, honest ranges
  inPersonInstead: string[];     // bullet list: condition-specific reasons to be seen in person / urgently
  faqs: { q: string; a: string }[]; // >= 3, condition-specific
  sources: Source[];             // >= 2
  exerciseHubSlug?: string;      // a slug in lib/conditions.ts -> link to /exercises/for/<slug>
  selfTestSlugs?: string[];      // slugs in lib/self-tests.ts
  blogSlugs?: string[];          // slugs in lib/blog.ts blogArticles
  guideSlugs?: string[];         // slugs in lib/guides.ts
  serviceSlug: string;           // a slug in lib/site-data.ts services
  reviewedOn: string;            // YYYY-MM-DD
};
export const onlinePhysioPages: OnlinePhysioPage[];
export function getOnlinePhysioPage(slug: string): OnlinePhysioPage | null;
export function allOnlinePhysioSlugs(): string[];
```

```ts
// components/inline-text.tsx
export function InlineText({ text }: { text: string }): JSX.Element;
// "[label](/path)" -> <Link href="/path">label</Link>; anything else is plain text.
// Non-internal targets (not starting with "/") render as plain "label" text, no link.
```

```ts
// lib/structured-data.ts additions
export function guideWebPage(g: Guide, path: string): object;
export function onlinePhysioWebPage(p: OnlinePhysioPage, path: string): object;
```

---

### Task 1: Fact sheet of verified sources

No code. Every later content task may only state facts that appear here.

**Files:**
- Create: `docs/seo/phase-b-sources.md`

- [ ] **Step 1: Research and verify each claim with WebFetch on the primary source.** For each item, record: the claim in plain words, the URL, a short quote (under 15 words) from the page, and the date checked. If a claim can't be verified from a primary or authoritative source, write "NOT VERIFIED - do not use" and leave it out of content. Items to cover:
  1. **Telehealth vs in-person physio for knee osteoarthritis (the "PEAK" trial, Hinman/Bennell et al., University of Melbourne):** full citation (journal, year, DOI), sample size, and conclusion (non-inferiority on pain/function).
  2. **At least one systematic review or meta-analysis on telerehabilitation for musculoskeletal conditions:** e.g. Cottrell et al. 2017 *Clinical Rehabilitation*, or a newer one. Record the conclusion.
  3. **CSP (Chartered Society of Physiotherapy) guidance on remote consultations:** what it says about suitability and when to switch to face to face.
  4. **NHS Scotland MSK waits:** Public Health Scotland, published 23 June 2026: on average 52.4% of patients waited four weeks or less (Aug 2025 to Mar 2026), and 75,128 were waiting at 31 March 2026. The URL is already in `app/pricing/page.tsx`.
  5. **Self-referral to NHS MSK physio in Scotland:** the NHS inform page for MSK self-referral.
  6. **"Physiotherapist" is a protected title, and practitioners must be HCPC-registered:** HCPC page.
  7. **How UK private medical insurance handles physiotherapy claims, as described on each insurer's own public pages:** Bupa, AXA Health, Vitality and Aviva. Cover whether the insurer needs a GP referral or pre-authorisation, and whether it pays only "recognised" or "fee-approved" practitioners. Quote each insurer's own wording. Do NOT record or imply that any insurer recognises PhysioOnClick.
  8. **Typical UK private physio prices:** public price pages, at least 4. Use the prices already verified in `docs/seo/competitors-50-raw-2026-09-30.md` (Nuffield £72/£49, Ascenti £44 video, PhysioFast £65/£47, PromoteHealth £45/£40, Complete Physio £125/£95). Re-check at least 2 are still live.
  9. **NICE guidance for each condition** (a NICE or NHS page per condition, for the B1 pages):
     - Low back pain and sciatica: NICE NG59. Exercise first-line; no imaging for non-specific back pain.
     - Knee OA: NICE NG226. Exercise is core treatment.
     - Neck pain, shoulder pain, tennis elbow, plantar fasciitis (heel pain), hip pain / gluteal tendinopathy: the NHS or NHS inform page for each.
  10. **Cauda equina red flags:** NHS page. Used on the back pain and sciatica pages.
- [ ] **Step 2: Lay the file out** as one `##` heading per item, numbered as above. Each verified fact goes on a bullet: `- Claim. Source: <title> <url> - "<quote>" (checked 2026-10-01)`.
- [ ] **Step 3: Commit**

```bash
git add docs/seo/phase-b-sources.md
git commit -m "docs: verified source sheet for SEO phase B content

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Shared types, inline link renderer, and the guides route with its first guide

**Files:**
- Create: `lib/content-types.ts`, `components/inline-text.tsx`, `lib/guides.ts`, `app/guides/page.tsx`, `app/guides/[slug]/page.tsx`
- Modify: `lib/structured-data.ts` (add `guideWebPage`), `app/sitemap.ts`, `docs/analytics-tracking.md`
- Test: `tests/components/inline-text.test.tsx`, `tests/lib/guides.test.ts`, `tests/app/guide-page.test.tsx`

**Interfaces:**
- Consumes: `breadcrumbs`, `personRef`, `absoluteUrl` (already in `lib/structured-data.ts`, check exact export names before use); `ByLine` from `components/exercise-library/by-line.tsx`; `FaqAccordion` from `components/exercise-library/faq-accordion.tsx`; `TrackedBookLink` from `components/tracked-book-link.tsx`; `initialAssessmentPrice` from `lib/site-data.ts`.
- Produces: `Source`, `RelatedLink`, `InlineText`, `Guide`, `guides`, `getGuide`, `allGuideSlugs`, `guideWebPage` (signatures in "Shared interfaces").

- [ ] **Step 1: Write failing tests.**

`tests/components/inline-text.test.tsx`:
```tsx
import { render } from "@testing-library/react";
import { InlineText } from "@/components/inline-text";

describe("InlineText", () => {
  it("renders plain text unchanged", () => {
    const { container } = render(<p><InlineText text="No links here." /></p>);
    expect(container.textContent).toBe("No links here.");
    expect(container.querySelector("a")).toBeNull();
  });
  it("turns [label](/path) into an internal link", () => {
    const { container } = render(<p><InlineText text="See [our pricing](/pricing) first." /></p>);
    const a = container.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("/pricing");
    expect(a.textContent).toBe("our pricing");
    expect(container.textContent).toBe("See our pricing first.");
  });
  it("does not link external or protocol-relative targets", () => {
    const { container } = render(<p><InlineText text="[x](https://evil.example) and [y](//evil.example)" /></p>);
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("x and y");
  });
});
```

`tests/lib/guides.test.ts`:
```ts
import { guides, getGuide, allGuideSlugs } from "@/lib/guides";
import { readFileSync } from "node:fs";
import path from "node:path";

const sourcesDoc = readFileSync(path.resolve(__dirname, "../../docs/seo/phase-b-sources.md"), "utf8");
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const allText = (g: (typeof guides)[number]) =>
  [g.title, g.seoTitle, g.seoDescription, g.answer, ...g.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
   ...g.faqs.flatMap((f) => [f.q, f.a])].join("\n");

describe("guides data", () => {
  it("has unique kebab-case slugs and working lookups", () => {
    expect(guides.length).toBeGreaterThanOrEqual(1);
    expect(new Set(allGuideSlugs()).size).toBe(guides.length);
    for (const g of guides) {
      expect(g.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(getGuide(g.slug)).toBe(g);
    }
    expect(getGuide("nope")).toBeNull();
  });
  it("meets SEO length rules", () => {
    for (const g of guides) {
      expect(g.seoTitle.endsWith("| PhysioOnClick"), g.slug).toBe(true);
      expect(g.seoTitle.length, g.slug).toBeLessThanOrEqual(65);
      expect(g.seoDescription.length, g.slug).toBeGreaterThanOrEqual(120);
      expect(g.seoDescription.length, g.slug).toBeLessThanOrEqual(160);
      expect(words(g.answer), g.slug).toBeGreaterThanOrEqual(40);
      expect(words(g.answer), g.slug).toBeLessThanOrEqual(70);
    }
  });
  it("has real depth, FAQs, sources and related links", () => {
    for (const g of guides) {
      expect(g.sections.length, g.slug).toBeGreaterThanOrEqual(3);
      expect(words(allText(g)), g.slug).toBeGreaterThanOrEqual(700);
      expect(g.faqs.length, g.slug).toBeGreaterThanOrEqual(3);
      expect(g.sources.length, g.slug).toBeGreaterThanOrEqual(2);
      for (const s of g.sources) {
        expect(s.url.startsWith("https://"), s.url).toBe(true);
        expect(sourcesDoc.includes(s.url), `${g.slug}: ${s.url} missing from phase-b-sources.md`).toBe(true);
      }
      expect(g.related.length, g.slug).toBeGreaterThanOrEqual(2);
      for (const r of g.related) expect(r.href.startsWith("/"), r.href).toBe(true);
      expect(g.publishedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(g.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("follows the copy rules", () => {
    for (const g of guides) {
      const t = allText(g);
      expect(/[–—‘’“”]/.test(t), `${g.slug}: curly quote or long dash`).toBe(false);
      expect(/[^\x00-\xff£]/.test(t), `${g.slug}: non Latin-1 character`).toBe(false);
      expect(/\b(best|leading|no\.?\s?1)\b/i.test(t), `${g.slug}: superlative`).toBe(false);
      expect(/£\d/.test(t), `${g.slug}: hardcoded price - interpolate from site-data instead`).toBe(false);
    }
  });
});
```

Note on prices in guides: guide text is static data, so a sentence that needs our own price must use the token `{INITIAL_PRICE}` or `{FOLLOW_UP_PRICE}`. The page replaces these at render time (see Step 3). Competitor and market prices are written as words with the pound sign spelled out ("about 45 to 125 pounds"), so the hardcoded-price check still passes and our own numbers can't drift.

`tests/app/guide-page.test.tsx`:
```tsx
import { render } from "@testing-library/react";
import GuidePage, { generateMetadata, generateStaticParams } from "@/app/guides/[slug]/page";
import GuidesIndex from "@/app/guides/page";
import { guides } from "@/lib/guides";
import { initialAssessmentPrice } from "@/lib/site-data";

const SLUG = guides[0]!.slug;

describe("app/guides/[slug]", () => {
  it("emits one param per guide", () => {
    expect(generateStaticParams()).toEqual(guides.map((g) => ({ slug: g.slug })));
  });
  it("renders the guide title as h1, the answer, sources and a booking CTA with the live price", async () => {
    const { container } = render(await GuidePage({ params: Promise.resolve({ slug: SLUG }) }));
    expect(container.querySelector("h1")?.textContent).toBe(guides[0]!.title);
    expect(container.textContent).toContain(guides[0]!.answer.slice(0, 40));
    expect(container.querySelectorAll("[data-sources] a").length).toBe(guides[0]!.sources.length);
    expect(container.textContent).toContain(`£${initialAssessmentPrice}`);
    expect(container.textContent).not.toContain("{INITIAL_PRICE}");
  });
  it("builds metadata with a relative canonical", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: SLUG }) });
    expect(meta.title).toBe(guides[0]!.seoTitle);
    expect(meta.alternates?.canonical).toBe(`/guides/${SLUG}`);
  });
  it("returns {} metadata for an unknown slug", async () => {
    expect(await generateMetadata({ params: Promise.resolve({ slug: "nope" }) })).toEqual({});
  });
});

describe("app/guides index", () => {
  it("links every guide once", () => {
    const { container } = render(<GuidesIndex />);
    for (const g of guides) {
      expect(container.querySelectorAll(`a[href="/guides/${g.slug}"]`).length).toBe(1);
    }
  });
});
```

Add to `tests/app/sitemap.test.ts`, in its existing `describe`, a test asserting the sitemap contains `${base}/guides` and `${base}/guides/${slug}` for every guide. Match the base-URL handling the file already uses.

- [ ] **Step 2: Run the tests to check they fail.**
Run: `npx vitest run tests/components/inline-text.test.tsx tests/lib/guides.test.ts tests/app/guide-page.test.tsx tests/app/sitemap.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement.**

`lib/content-types.ts`:
```ts
/** A cited source shown under a guide or landing page. Every URL must also be
 *  recorded, with a quote, in docs/seo/phase-b-sources.md. */
export type Source = { label: string; url: string };
/** An internal "related reading" link. `href` is a site-relative path. */
export type RelatedLink = { label: string; href: string };
```

`components/inline-text.tsx`:
```tsx
import Link from "next/link";
import { Fragment } from "react";

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Renders copy that may contain markdown-style `[label](/path)` links. Only
 *  site-relative targets become links; anything else (external, `//host`)
 *  renders as plain label text, so content data can't inject outbound links. */
export function InlineText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match;
    const start = match.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    const internal = href.startsWith("/") && !href.startsWith("//");
    parts.push(internal ? <Link key={start} href={href}>{label}</Link> : label);
    last = start + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}
```

Also export a helper from `lib/site-data.ts`, next to `initialAssessmentPrice`:
```ts
export const followUpPrice = pricing.find((item) => item.id === "follow-up")?.price ?? 0;

/** Swap {INITIAL_PRICE}/{FOLLOW_UP_PRICE} tokens in static copy for live prices,
 *  so content data never hardcodes a price that the owner later changes. */
export function withPrices(text: string): string {
  return text
    .replaceAll("{INITIAL_PRICE}", `£${initialAssessmentPrice}`)
    .replaceAll("{FOLLOW_UP_PRICE}", `£${followUpPrice}`);
}
```

`lib/guides.ts`: the types from "Shared interfaces", `getGuide`/`allGuideSlugs`, and the first guide. The file header comment must say the copy is drafted pending Shivaliba Zala's clinical sign-off and must not reach production before she approves `docs/seo/phase-b-clinical-review.md`.

The first guide is **B2.1, "How much does private physiotherapy cost in the UK?"**, slug `private-physiotherapy-cost-uk`.
- Target queries: "how much is a physio session uk", "private physio cost uk", "online physio price".
- `answer`: a typical UK range in words, and our `{INITIAL_PRICE}` assessment and `{FOLLOW_UP_PRICE}` follow-up.
- Sections:
  - What affects the price (location, session length, first vs follow-up, clinician seniority).
  - Typical prices at named UK providers. Use the Task 1 item 8 figures, written as words. Name providers only with figures from their own public pages, with the date checked.
  - What's included in our sessions: 60-minute assessment, 30-minute follow-ups, plan, invoice. Include the bundles, with savings computed in the page text from `pricing`, or left out.
  - Ways to pay less: bundles, NHS self-referral (Task 1 item 5) with the PHS wait figure (item 4), insurance (link to the insurance guide slug `claim-physiotherapy-on-health-insurance` once Task 3 creates it; until then, link `/pricing`).
- FAQs (at least 3).
- Sources: at least 2 from the fact sheet.
- Related: `/pricing`, `/how-online-physiotherapy-works`.

`app/guides/[slug]/page.tsx` follows `app/exercises/for/[condition]/page.tsx`:
- `force-static` and `generateStaticParams`.
- `generateMetadata`: `title: g.seoTitle`, `description: g.seoDescription`, canonical `/guides/${slug}`, and openGraph `{ type: "article", title, description, url }`.
- `notFound()` for an unknown slug.
- JSON-LD: `guideWebPage(g, path)` plus `breadcrumbs([Home /, Guides /guides, g.title path])`.
- Body, in order:
  - Breadcrumb `<nav>`.
  - `<ByLine reviewedOn={g.reviewedOn} />`.
  - `<h1>{g.title}</h1>`.
  - An answer box `<p className="guide-answer">` rendering `withPrices(g.answer)` through `InlineText`.
  - Each section as `<h2>` plus paragraphs via `<InlineText text={withPrices(p)} />`.
  - `<FaqAccordion>` with the price tokens replaced.
  - A sources block `<section data-sources>` with an `<h2>Sources</h2>` and an `<ol>` of `<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>`.
  - A "Related" list of `Link`s.
  - A `simple-cta-band` section with `TrackedBookLink` (`href="/book?service=initial-assessment"`, `serviceSlug="initial-assessment"`, `source="guide-cta-band"`, `extraEvent="book_now_click"`) and copy that includes `£{initialAssessmentPrice}`.
- Reuse existing CSS classes (`site-shell`, `simple-page-hero`, `page-section`, `exlib-hub__prose`, `simple-cta-band`). Add only `.guide-answer` to `app/globals.css`: a bordered callout using the existing CSS custom properties (read `:root` in `app/globals.css`; no new colours).

`app/guides/page.tsx`:
- Static metadata: title `Physio Guides: Costs, Insurance & Online Care | PhysioOnClick` (61 characters), a 120-160 character description, and canonical `/guides`.
- An `h1` "Guides", then a list of each guide's title (linking to `/guides/<slug>`) and its `answer`'s first sentence.

`lib/structured-data.ts`, adding `guideWebPage`:
```ts
export function guideWebPage(g: Guide, path: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: g.seoTitle,
    headline: g.title,
    description: g.seoDescription,
    url: absoluteUrl(path),
    author: personRef(),
    reviewedBy: personRef(),
    datePublished: g.publishedOn,
    lastReviewed: g.reviewedOn,
    inLanguage: "en-GB",
    citation: g.sources.map((s) => s.url),
    mainEntity: g.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))
  };
}
```
Check the actual helper names in the file. If `absoluteUrl` has a different name, use the existing one. FAQ answers in JSON-LD must also go through `withPrices`.

`app/sitemap.ts`: add `{ url: `${base}/guides` }` and per-guide `{ url, lastModified: new Date(g.reviewedOn) }`, spread into the returned array after `blogEntries`.

`docs/analytics-tracking.md`: add rows in the same table format:
- `app/guides/page.tsx`: `page_view` only.
- `app/guides/[slug]/page.tsx`: `page_view`. CTA band: `service_book_click` `{ service_slug: "initial-assessment", source: "guide-cta-band" }` + `book_now_click`.

- [ ] **Step 4: Run the tests to check they pass.**
Run: `npx vitest run tests/components/inline-text.test.tsx tests/lib/guides.test.ts tests/app/guide-page.test.tsx tests/app/sitemap.test.ts tests/app/analytics-tracking-registry.test.ts tests/app/unknown-slug-status.test.ts`
Expected: all PASS. Then run `npx tsc --noEmit -p . 2>&1 | grep -v "^tests/"`; expected output is empty.

- [ ] **Step 5: Commit**
```bash
git add lib/content-types.ts components/inline-text.tsx lib/guides.ts lib/site-data.ts lib/structured-data.ts app/guides app/sitemap.ts app/globals.css docs/analytics-tracking.md tests/components/inline-text.test.tsx tests/lib/guides.test.ts tests/app/guide-page.test.tsx tests/app/sitemap.test.ts
git commit -m "feat: guides section with private physio cost guide

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: B2 guides 2-5 (insurance, GP referral, sessions, NHS waits)

**Files:**
- Modify: `lib/guides.ts` (append 4 `Guide` records). Also update guide 1's insurance link to `/guides/claim-physiotherapy-on-health-insurance`.
- Test: existing `tests/lib/guides.test.ts` and `tests/app/guide-page.test.tsx` cover the new records. Add one assertion in `tests/lib/guides.test.ts` that these slugs exist: `claim-physiotherapy-on-health-insurance`, `do-i-need-a-gp-referral-for-physiotherapy`, `how-many-physiotherapy-sessions-do-i-need`, `nhs-physio-waiting-times-scotland`.

**Interfaces:**
- Consumes: the `Guide` type, the `{INITIAL_PRICE}`/`{FOLLOW_UP_PRICE}` tokens, and the fact sheet.
- Produces: the 4 slugs above, which Tasks 4-8 link to.

Content requirements. Each guide is written fresh, with no shared paragraphs between guides (a test in Step 1 enforces this).

1. **`claim-physiotherapy-on-health-insurance`** ("Can I claim physiotherapy on my health insurance?"). Targets: "is physio covered by bupa", "physio receipt insurance claim", "claim physio on insurance".
   - Explain the usual claim steps in general terms: check that the policy includes outpatient therapies, check whether a GP referral or pre-authorisation is needed, check whether the insurer only pays practitioners on its recognised list, pay, then submit the invoice.
   - Quote what each insurer says on its own site (Task 1 item 7), each attributed to that insurer.
   - Must say plainly: "We are not on every insurer's recognised list. Check with your insurer before booking if you plan to claim."
   - Describe our invoice: HCPC number, itemised session, PDF.
   - Never state or imply that any insurer accepts our invoices.
2. **`do-i-need-a-gp-referral-for-physiotherapy`**: private physio needs no referral. Cover NHS self-referral in Scotland and England (Task 1 item 5), and when seeing a GP first is the right call (red flags).
3. **`how-many-physiotherapy-sessions-do-i-need`**: honest ranges by situation, based on the existing service copy in `lib/site-data.ts` (most plans run 4-8 sessions across 6-10 weeks; post-surgery runs longer). Cover what speeds progress, when to stop, and the bundles.
4. **`nhs-physio-waiting-times-scotland`**: the PHS figures (item 4), the meaning of the four-week standard, how to self-refer, what to do while waiting (link the exercise library `/exercises` and `/exercises/tests`), and going private as an option.

- [ ] **Step 1:** Add the slug-existence assertion, plus a duplicate-paragraph test, to `tests/lib/guides.test.ts`:
```ts
it("no paragraph is reused across guides", () => {
  const seen = new Map<string, string>();
  for (const g of guides) for (const s of g.sections) for (const p of s.paragraphs) {
    expect(seen.has(p), `${g.slug} repeats a paragraph from ${seen.get(p)}`).toBe(false);
    seen.set(p, g.slug);
  }
});
it("has the phase B2 guides", () => {
  for (const s of ["private-physiotherapy-cost-uk", "claim-physiotherapy-on-health-insurance",
    "do-i-need-a-gp-referral-for-physiotherapy", "how-many-physiotherapy-sessions-do-i-need",
    "nhs-physio-waiting-times-scotland"]) expect(getGuide(s), s).not.toBeNull();
});
```
- [ ] **Step 2:** Run `npx vitest run tests/lib/guides.test.ts`. Expected: FAIL on the missing slugs.
- [ ] **Step 3:** Write the 4 records.
- [ ] **Step 4:** Run `npx vitest run tests/lib/guides.test.ts tests/app/guide-page.test.tsx`. Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add lib/guides.ts tests/lib/guides.test.ts
git commit -m "content: insurance, GP referral, sessions and NHS wait guides

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: B3 guides (does online physio work)

**Files:**
- Modify: `lib/guides.ts` (append 3 records), `tests/lib/guides.test.ts` (extend the slug list)

Content requirements:
1. **`does-online-physiotherapy-work`** ("Does online physiotherapy work?"). Targets: "does online physiotherapy work", "is online physio as good as in person", "online vs in person physio".
   - Lead with the evidence (Task 1 items 1-3), stated precisely: which conditions and which outcomes. Don't over-generalise from a knee OA trial to every condition.
   - Then cover who it suits, who it doesn't, and how we decide at triage.
2. **`can-a-physio-diagnose-over-video`**: what a video assessment can and can't establish. Cover guided movement tests, symptom history, and when imaging or a hands-on exam is needed. Link `/exercises/tests` for self-checks.
3. **`what-online-physiotherapy-cannot-do`**: an honest limits page covering:
   - Hands-on treatment (manual therapy, acupuncture).
   - Acute trauma or suspected fracture.
   - Red-flag symptoms.
   - Complex neuro presentations that need hands-on handling.
   - Babies who need hands-on assessment.
   - For each, what to do instead.
   - Cross-link the service pages' "when in person instead" content. Read `whenInPersonInstead` in `lib/site-data.ts` and stay consistent with it.

- [ ] **Step 1:** Extend the slug assertion with the 3 slugs. Run it and expect FAIL.
- [ ] **Step 2:** Write the 3 records.
- [ ] **Step 3:** Run `npx vitest run tests/lib/guides.test.ts tests/app/guide-page.test.tsx` and expect PASS.
- [ ] **Step 4: Commit**
```bash
git add lib/guides.ts tests/lib/guides.test.ts
git commit -m "content: does online physio work guides

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Condition landing route and the sciatica page

**Files:**
- Create: `lib/online-physio-pages.ts`, `app/online-physiotherapy-for/[slug]/page.tsx`
- Modify: `lib/structured-data.ts` (add `onlinePhysioWebPage`), `app/sitemap.ts`, `docs/analytics-tracking.md`, `tests/app/sitemap.test.ts`
- Test: `tests/lib/online-physio-pages.test.ts`, `tests/app/online-physio-page.test.tsx`

**Interfaces:**
- Consumes: `Source` (Task 2); `InlineText`; `withPrices`, `initialAssessmentPrice`, `services`; `getCondition` (`lib/exercise-library`); `getSelfTest`; `getArticle` (`lib/blog`); `getGuide` (Task 2); `ByLine`; `FaqAccordion`; `TrackedBookLink`.
- Produces: `OnlinePhysioPage`, `onlinePhysioPages`, `getOnlinePhysioPage`, `allOnlinePhysioSlugs`, `onlinePhysioWebPage`.

- [ ] **Step 1: Write failing tests.**

`tests/lib/online-physio-pages.test.ts`:
```ts
import { onlinePhysioPages, getOnlinePhysioPage, allOnlinePhysioSlugs } from "@/lib/online-physio-pages";
import { getCondition } from "@/lib/exercise-library";
import { getSelfTest } from "@/lib/self-tests";
import { getArticle } from "@/lib/blog";
import { getGuide } from "@/lib/guides";
import { services } from "@/lib/site-data";
import { readFileSync } from "node:fs";
import path from "node:path";

const sourcesDoc = readFileSync(path.resolve(__dirname, "../../docs/seo/phase-b-sources.md"), "utf8");
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const allText = (p: (typeof onlinePhysioPages)[number]) =>
  [p.h1, p.seoTitle, p.seoDescription, p.answer, ...p.howOnlineWorks, ...p.assessmentChecks, ...p.typicalPlan,
   p.timeline, ...p.inPersonInstead, ...p.faqs.flatMap((f) => [f.q, f.a])].join("\n");

describe("online physio landing pages", () => {
  it("unique slugs and lookups", () => {
    expect(new Set(allOnlinePhysioSlugs()).size).toBe(onlinePhysioPages.length);
    for (const p of onlinePhysioPages) {
      expect(p.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(getOnlinePhysioPage(p.slug)).toBe(p);
      expect(p.h1.toLowerCase().startsWith("online physiotherapy for"), p.slug).toBe(true);
    }
    expect(getOnlinePhysioPage("nope")).toBeNull();
  });
  it("SEO length rules", () => {
    for (const p of onlinePhysioPages) {
      expect(p.seoTitle.endsWith("| PhysioOnClick"), p.slug).toBe(true);
      expect(p.seoTitle.length, p.slug).toBeLessThanOrEqual(65);
      expect(p.seoDescription.length, p.slug).toBeGreaterThanOrEqual(120);
      expect(p.seoDescription.length, p.slug).toBeLessThanOrEqual(160);
      expect(words(p.answer), p.slug).toBeGreaterThanOrEqual(40);
      expect(words(p.answer), p.slug).toBeLessThanOrEqual(70);
    }
  });
  it("depth, safety and sources", () => {
    for (const p of onlinePhysioPages) {
      expect(words(allText(p)), p.slug).toBeGreaterThanOrEqual(650);
      expect(p.assessmentChecks.length, p.slug).toBeGreaterThanOrEqual(4);
      expect(p.inPersonInstead.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.faqs.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.sources.length, p.slug).toBeGreaterThanOrEqual(2);
      for (const s of p.sources) expect(sourcesDoc.includes(s.url), `${p.slug}: ${s.url}`).toBe(true);
    }
  });
  it("cross-references resolve", () => {
    const svc = new Set(services.map((s) => s.slug));
    for (const p of onlinePhysioPages) {
      expect(svc.has(p.serviceSlug), p.slug).toBe(true);
      if (p.exerciseHubSlug) expect(getCondition(p.exerciseHubSlug), p.slug).not.toBeNull();
      for (const t of p.selfTestSlugs ?? []) expect(getSelfTest(t), `${p.slug}/${t}`).toBeTruthy();
      for (const b of p.blogSlugs ?? []) expect(getArticle(b), `${p.slug}/${b}`).toBeTruthy();
      for (const g of p.guideSlugs ?? []) expect(getGuide(g), `${p.slug}/${g}`).not.toBeNull();
    }
  });
  it("copy rules and no reused paragraphs", () => {
    const seen = new Map<string, string>();
    for (const p of onlinePhysioPages) {
      const t = allText(p);
      expect(/[–—‘’“”]/.test(t), p.slug).toBe(false);
      expect(/[^\x00-\xff£]/.test(t), p.slug).toBe(false);
      expect(/\b(best|leading|no\.?\s?1|cure[sd]?)\b/i.test(t), `${p.slug}: superlative or cure claim`).toBe(false);
      expect(/£\d/.test(t), `${p.slug}: hardcoded price`).toBe(false);
      for (const para of [...p.howOnlineWorks, ...p.typicalPlan]) {
        expect(seen.has(para), `${p.slug} reuses a paragraph from ${seen.get(para)}`).toBe(false);
        seen.set(para, p.slug);
      }
    }
  });
});
```
Check the actual export names in `lib/self-tests.ts` and `lib/exercise-library.ts` before writing the imports (`getSelfTest` might live in `lib/exercise-library`). Import from wherever `app/exercises/tests/[slug]/page.tsx` imports it.

`tests/app/online-physio-page.test.tsx` follows `tests/app/guide-page.test.tsx`. It covers:
- One static param per record.
- `h1` equals `p.h1`.
- The answer text is present.
- `[data-in-person]` list length equals `p.inPersonInstead.length`.
- `[data-sources] a` count equals the number of sources.
- A link to `/exercises/for/${p.exerciseHubSlug}` exists when that field is set.
- A link to `/services/${p.serviceSlug}` exists.
- The booking link `a[href^="/book"]` exists, and the text contains `£${initialAssessmentPrice}`.
- Metadata canonical is `/online-physiotherapy-for/${slug}`.
- Metadata for an unknown slug is `{}`.

The sitemap test asserts `${base}/online-physiotherapy-for/${slug}` for every record.

- [ ] **Step 2:** Run both new test files plus the sitemap test. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - `lib/online-physio-pages.ts`:
    - The type from "Shared interfaces", `getOnlinePhysioPage` (returns `null` when missing), and `allOnlinePhysioSlugs`.
    - A header comment with the same clinical sign-off rule as `lib/guides.ts`.
    - The **sciatica** record, slug `sciatica`:
      - h1 "Online physiotherapy for sciatica".
      - Target queries: "online physio for sciatica", "online physiotherapy sciatica", "can sciatica be treated online".
      - `exerciseHubSlug: "sciatica"`, `selfTestSlugs: ["slump-self-check", "straight-leg-raise-self-check"]`, `serviceSlug: "musculoskeletal-physiotherapy"`.
      - `guideSlugs`: `does-online-physiotherapy-work`, `how-many-physiotherapy-sessions-do-i-need`.
      - `blogSlugs`: any existing sciatica article slugs from `lib/blog.ts`. Pick 1-2 by reading `blogArticles` where `category === "Sciatica"`.
      - `inPersonInstead` must include the cauda equina red flags (Task 1 item 10) and progressive leg weakness.
      - Facts from NICE NG59 only, via the fact sheet.
  - `app/online-physiotherapy-for/[slug]/page.tsx`, modelled on the condition hub page:
    - `force-static`, `generateStaticParams`, `generateMetadata` (canonical `/online-physiotherapy-for/${slug}`, openGraph type `website`), `notFound()`.
    - JSON-LD: `onlinePhysioWebPage` plus breadcrumbs (Home / Services `/services` / `p.h1`).
    - Layout:
      - `ByLine`, then `h1`, then the answer callout (`.guide-answer`).
      - A primary `TrackedBookLink`: `href="/book?service=initial-assessment&source=online-physio-landing&condition=<slug>"`, `serviceSlug="initial-assessment"`, `source="online-physio-landing"`, `params={{ slug }}`, `extraEvent="book_now_click"`. Label: "Book a £{initialAssessmentPrice} video assessment".
      - Then these sections:
        - `h2` "How online physiotherapy works for {name}", with the `howOnlineWorks` paragraphs.
        - `h2` "What the video assessment checks", with a `ul` of `assessmentChecks`.
        - `h2` "What treatment usually involves", with the `typicalPlan` paragraphs.
        - `h2` "How long recovery usually takes", with the `timeline`.
        - `h2` "When you need to be seen in person instead", rendered as `div.exlib-redflags[data-in-person]` with the `inPersonInstead` list (reuse the coral red-flag styling).
      - An "Exercises and self-checks" block linking the exercise hub and self-tests (titles via `getCondition`/`getSelfTest`).
      - `FaqAccordion`.
      - "Further reading" links to guides, blog articles and `/services/${serviceSlug}`.
      - The sources block (`[data-sources]`).
      - A CTA band.
    - All copy goes through `withPrices` and `InlineText`.
  - `onlinePhysioWebPage` in `lib/structured-data.ts`: same shape as `guideWebPage`, plus `about: { "@type": "MedicalCondition", name: p.name }`, with `lastReviewed: p.reviewedOn`.
  - Sitemap: per-record entries with `lastModified: new Date(p.reviewedOn)`.
  - Analytics registry row:
    - `app/online-physiotherapy-for/[slug]/page.tsx`: `page_view`.
    - Primary + band CTA: `service_book_click` `{ service_slug: "initial-assessment", source: "online-physio-landing" | "online-physio-cta-band", slug }` + `book_now_click`.

- [ ] **Step 4:** Run the Task 5 tests plus `tests/app/analytics-tracking-registry.test.ts` and `tests/app/unknown-slug-status.test.ts`. Expected: PASS. Typecheck is clean.
- [ ] **Step 5: Commit**
```bash
git add lib/online-physio-pages.ts lib/structured-data.ts app/online-physiotherapy-for app/sitemap.ts docs/analytics-tracking.md tests/lib/online-physio-pages.test.ts tests/app/online-physio-page.test.tsx tests/app/sitemap.test.ts
git commit -m "feat: online physiotherapy for [condition] landing pages + sciatica

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Landing pages for back, neck, shoulder and knee

**Files:**
- Modify: `lib/online-physio-pages.ts` (append 4 records), `tests/lib/online-physio-pages.test.ts` (assert these slugs exist)

| slug | h1 | primary queries | exerciseHubSlug | selfTestSlugs (verify they exist) | serviceSlug | notes |
|---|---|---|---|---|---|---|
| `low-back-pain` | Online physiotherapy for lower back pain | online physio for back pain, remote physio back pain, video physio lower back pain | `low-back-pain` | `straight-leg-raise-self-check` if relevant | musculoskeletal-physiotherapy | NICE NG59; cauda equina flags; don't duplicate sciatica paragraphs; link the sciatica landing page |
| `neck-pain` | Online physiotherapy for neck pain | online physio neck pain, video physio consultation neck pain | `neck-pain` | `chin-tuck-rotation-check` | musculoskeletal-physiotherapy | red flags: arm weakness or numbness in both arms, balance or co-ordination changes, after trauma, dizziness/visual symptoms with neck movement |
| `shoulder-pain` | Online physiotherapy for shoulder pain | online physio for shoulder pain uk, remote physio shoulder | `rotator-cuff-tendinopathy` | `full-can-test`, `hawkins-kennedy-test`, `painful-arc-self-check` | musculoskeletal-physiotherapy | link the blog slug `online-physiotherapy-for-frozen-shoulder` (don't compete with it: mention frozen shoulder briefly and point there); red flags: dislocation, fall with inability to lift, chest pain/breathlessness |
| `knee-pain` | Online physiotherapy for knee pain | remote physiotherapy for knee pain, online physio knee osteoarthritis | `knee-osteoarthritis` | `single-leg-decline-squat-check` | musculoskeletal-physiotherapy | NICE NG226 plus the PEAK trial (knee OA is where the online evidence is strongest, so say so precisely); also patellofemoral pain; red flags: locking, giving way after injury, hot swollen joint |

- [ ] **Step 1:** Add the 4-slug existence assertion. Run it and expect FAIL.
- [ ] **Step 2:** Write the 4 records. Each one's `howOnlineWorks`, `assessmentChecks` and `typicalPlan` must be specific to that condition: what is actually tested on video for the neck and what for the knee. Not interchangeable.
- [ ] **Step 3:** Run `npx vitest run tests/lib/online-physio-pages.test.ts tests/app/online-physio-page.test.tsx tests/app/sitemap.test.ts` and expect PASS.
- [ ] **Step 4: Commit**
```bash
git add lib/online-physio-pages.ts tests/lib/online-physio-pages.test.ts
git commit -m "content: online physio landing pages for back, neck, shoulder, knee

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Landing pages for plantar fasciitis, tennis elbow and hip, plus the Scotland page

**Files:**
- Modify: `lib/online-physio-pages.ts` (3 records), `tests/lib/online-physio-pages.test.ts`
- Create: `app/online-physiotherapy-scotland/page.tsx`, `tests/app/scotland-page.test.tsx`
- Modify: `app/sitemap.ts` (add `/online-physiotherapy-scotland` to `routes`), `docs/analytics-tracking.md`

| slug | h1 | exerciseHubSlug | selfTestSlugs | notes |
|---|---|---|---|---|
| `plantar-fasciitis` | Online physiotherapy for plantar fasciitis (heel pain) | none (no hub exists; omit the field) | `single-leg-calf-raise-check` if it fits | NHS heel pain source; red flags: heel pain after a fall or jump, numbness or tingling in the foot, pain at night or at rest, hot swollen heel with fever |
| `tennis-elbow` | Online physiotherapy for tennis elbow | `tennis-elbow` | `resisted-wrist-extension-test` | NHS tennis elbow; red flags: after injury with swelling/deformity, numbness or tingling in the fingers, pain with fever |
| `hip-pain` | Online physiotherapy for hip pain | `gluteal-tendinopathy` | `trendelenburg-mirror-check` | cover gluteal tendinopathy and hip OA; red flags: after a fall in older adults (fracture), unable to weight-bear, hot swollen joint/fever, history of cancer |

All three use `serviceSlug: "musculoskeletal-physiotherapy"`.

**Scotland page** (`/online-physiotherapy-scotland`):
- Static page modelled on `app/glasgow-physiotherapist/page.tsx`, with the same section classes.
- Metadata: title `Online Physiotherapy in Scotland | PhysioOnClick`; description (120-160 characters) mentioning video appointments across Scotland, no GP referral, and `£${initialAssessmentPrice}`; canonical `/online-physiotherapy-scotland`.
- H1: "Online physiotherapy across Scotland".
- Content:
  - Glasgow-based HCPC physio, video only, anywhere in Scotland.
  - The PHS waiting-time figure with a link (fact sheet item 4).
  - NHS self-referral as an option (item 5), presented neutrally.
  - Links to the 8 condition landing pages, `/services/neurological-rehabilitation`, `/glasgow-physiotherapist`, and the guide `nhs-physio-waiting-times-scotland`.
  - 3 FAQs as a plain `<details>` list:
    - "Can I see you in person in Scotland?" Answer: no, video only, and say what to do if hands-on care is needed.
    - "Do you cover the Highlands and islands?"
    - "Can I claim on insurance?" Link the insurance guide.
- JSON-LD: a `WebPage` with `about: practiceRef()`, as on the Glasgow page. No `FAQPage`.
- CTA: `TrackedBookLink` with `source="scotland_page"`, `event="book_now_click"`.
- Analytics registry row: `page_view`. CTA `book_now_click` `{ source: "scotland_page" }`.
- `tests/app/scotland-page.test.tsx`:
  - The h1 text.
  - Every `allOnlinePhysioSlugs()` link is present.
  - It links `/guides/nhs-physio-waiting-times-scotland`.
  - It contains `52.4%`.
  - It contains `£${initialAssessmentPrice}`.
  - Metadata canonical.

- [ ] **Step 1:** Add the 3-slug assertion and the Scotland test. Run them and expect FAIL.
- [ ] **Step 2:** Write the 3 records and the Scotland page. Update the sitemap and registry.
- [ ] **Step 3:** Run `npx vitest run tests/lib/online-physio-pages.test.ts tests/app/online-physio-page.test.tsx tests/app/scotland-page.test.tsx tests/app/sitemap.test.ts tests/app/analytics-tracking-registry.test.ts`. Expected: PASS.
- [ ] **Step 4: Commit**
```bash
git add lib/online-physio-pages.ts app/online-physiotherapy-scotland app/sitemap.ts docs/analytics-tracking.md tests/lib/online-physio-pages.test.ts tests/app/scotland-page.test.tsx
git commit -m "content: heel, elbow and hip landing pages + online physiotherapy Scotland page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Internal linking into the new pages

**Files:**
- Modify:
  - `lib/site-data.ts`: optional `onlinePhysioSlugs?: string[]` on `Service`. Set it on `musculoskeletal-physiotherapy` (all 8) and `online-rehab-programmes` (`low-back-pain`, `neck-pain`, `knee-pain`, `shoulder-pain`).
  - `app/services/[slug]/page.tsx`: when `service.onlinePhysioSlugs` is set, render an `h2` "Online physiotherapy by condition" with links to `/online-physiotherapy-for/<slug>`, labelled with `getOnlinePhysioPage(slug).name`.
  - `app/exercises/for/[condition]/page.tsx`: when a landing page has `exerciseHubSlug === condition.slug`, render one line in the rail/CTA area: "Want a physio to guide you? [Online physiotherapy for {name}]". Use a reverse lookup helper `onlinePhysioPageForHub(hubSlug)` exported from `lib/online-physio-pages.ts`.
  - `app/glasgow-physiotherapist/page.tsx`: link to `/online-physiotherapy-scotland`.
  - `components/site-footer.tsx`: under the existing "Online physio for Glasgow patients" link, add "Online physio in Scotland" (`/online-physiotherapy-scotland`) and "Guides" (`/guides`).
  - `app/pricing/page.tsx`: in the FAQ "How much does private physiotherapy cost in the UK?", append a link to `/guides/private-physiotherapy-cost-uk`. In "Can I claim this back on health insurance?", link `/guides/claim-physiotherapy-on-health-insurance`.
  - `app/how-online-physiotherapy-works/page.tsx`: under the steps, add a link to `/guides/does-online-physiotherapy-work`.
- Test: extend `tests/app/condition-hub-page.test.tsx` (sciatica hub links `/online-physiotherapy-for/sciatica`). Add to `tests/lib/online-physio-pages.test.ts` a test for `onlinePhysioPageForHub("sciatica")?.slug === "sciatica"` and `onlinePhysioPageForHub("nope") === null`. Add a test that every `onlinePhysioSlugs` entry on services resolves.

**Interfaces:**
- Produces: `export function onlinePhysioPageForHub(hubSlug: string): OnlinePhysioPage | null`

- [ ] **Step 1:** Write the tests above. Run them and expect FAIL.
- [ ] **Step 2:** Implement the links.
- [ ] **Step 3:** Run `npx vitest run tests/lib tests/app tests/components 2>&1 | grep -E "×|Test Files|Tests "`. Expected: only the 2 known pre-existing failures (the exercise-page `/book` href and the condition-hub £25 price). If the condition-hub test file now has a new failure, fix it.
- [ ] **Step 4: Commit**
```bash
git add -A lib app components tests
git commit -m "feat: link services, condition hubs, pricing and footer to phase B pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Clinical review document and final verification

**Files:**
- Create: `docs/seo/phase-b-clinical-review.md`

- [ ] **Step 1:** Generate the review doc with a small Node script under the session scratchpad, NOT committed. It imports nothing from TS. Easiest is a throwaway vitest file that writes markdown and is deleted afterwards. The doc lists every guide and landing page:
  - URL path.
  - Title.
  - Answer.
  - Every section.
  - In-person and red-flag lists.
  - FAQs.
  - Sources.
  - A checkbox `- [ ] Approved by Shivaliba Zala (date: ____)` per page.
  - At the top: "These pages are live on dev.physioonclick.co.uk only. They go to the live site after every page below is approved."
- [ ] **Step 2: Full checks.**
  - `npx tsc --noEmit -p . 2>&1 | grep -v "^tests/"`: empty.
  - `npx next lint`: no errors.
  - `npx vitest run tests 2>&1 | grep -E "×|Tests "`: only the 2 known failures.
- [ ] **Step 3:** Title and description length report. Print every new page's title and description length via a throwaway vitest, and confirm the limits.
- [ ] **Step 4: Commit**
```bash
git add docs/seo/phase-b-clinical-review.md
git commit -m "docs: phase B clinical review pack for Shivaliba

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

**After Task 9 (controller, not a subagent):**
1. Merge `feat/seo-phase-b` into master with a fast-forward from the main checkout. Only do this if the main checkout's uncommitted changes don't touch the same files; check `git status` first.
2. Deploy to **dev only** with `bash scripts/deploy-dev.sh` from the main checkout, then `rm -rf .open-next .next`.
3. Verify on dev:
   - `/guides`, all 8 guides and all 8 landing pages, plus `/online-physiotherapy-scotland`, return 200.
   - The test-site banner is present.
4. Send the owner the review doc. Production deploy waits for sign-off.
