# Embeddable exercises — design

_2026-09-30 · approved by owner in chat · branch `feat/exercise-embeds`_

## Goal

Let other sites (gyms, clinics, clubs, bloggers) embed any public exercise from the library. Each embed carries an attribution link that earns a **real backlink**. This is Phase 2 of the backlink plan (`docs/seo/backlinks-phase1.md`), and it supplies the "linkable asset" for outreach.

## Decisions (owner)

- **Embed-only licence.** Anyone may embed an exercise using the official code, unaltered. Copying, screenshots, handouts and adapting the content still need written permission (the existing Terms IP clause stands). The embed box shows our content from our servers, keeps the watermark, and can be switched off.
- Out of scope: auto-resize script, partner allow-list, printable handouts, an outreach landing page (possible follow-up).

## Why a plain link outside the iframe

Links inside an iframe are credited to the iframe's own document, which is ours, not the host page. The SEO value comes only from an `<a>` in the host's own HTML. The snippet is therefore **iframe + attribution paragraph**.

## Components

### 1. `lib/exercise-embed.ts` (pure, no React)
- `EMBEDS_ENABLED: boolean`: the off switch (constant, `true`).
- `embedPath(slug)` → `/embed/exercises/<slug>`.
- `buildEmbedSnippet(exercise, siteUrl)` → the copy-paste HTML string:
  ```html
  <iframe src="{site}/embed/exercises/{slug}" title="{Title} exercise – PhysioOnClick" width="100%" height="760" loading="lazy" style="border:0;max-width:520px;width:100%"></iframe>
  <p style="font-size:14px;margin:6px 0 0"><a href="{site}/exercises/{slug}">{Title} exercise</a> by <a href="{site}">PhysioOnClick</a></p>
  ```
  All interpolated values are HTML-escaped. `siteUrl` comes from `NEXT_PUBLIC_SITE_URL` (the same source as the existing `absoluteUrl` helper). Prod builds therefore emit `https://physioonclick.co.uk`, and the dev build emits the dev host, which is fine for testing.
- `renderEmbedHtml(exercise, siteUrl)` → a complete, self-contained HTML document (inline CSS only, no JS, no cookies, no analytics). Contents:
  - Illustration via the existing `exerciseImageUrl(id, "full")` (absolute URL), with a CSS watermark overlay "© physioonclick.co.uk" plus `draggable="false"` and `oncontextmenu` suppression via the attribute on the image wrapper (inline attribute, no script file).
  - Title, `setup`, numbered `steps`, dose (`formatDosage(resolveDosage(exercise))`), and the safety line (same `splitMistakes` rule as the detail page, moved into a shared helper).
  - Footer: "See the full guide at PhysioOnClick →" (`target="_blank" rel="noopener"`) linking to `/exercises/<slug>?utm_source=embed&utm_medium=referral`, plus "© PhysioOnClick · General guidance, not a diagnosis".
  - `<meta name="robots" content="noindex">` and `<link rel="canonical" href="{site}/exercises/{slug}">`.
  - Visual style follows The Clarity System (paper background, navy ink, sky accent, system font stack so no web-font requests).
- `renderEmbedDisabledHtml(exercise, siteUrl)` → a minimal card: title + "View this exercise at PhysioOnClick" link.

### 2. Route `app/embed/exercises/[slug]/route.ts`
- A route handler, **not a page**, so it escapes the root layout (header, footer, chat, cookie banner, analytics). The pattern is the same as `app/exercise-og/[slug]/route.ts`: `dynamic = "force-static"` and `generateStaticParams()` over `allExerciseSlugs()`. No `dynamicParams = false` (OpenNext hazard).
- Returns `text/html; charset=utf-8`, `Cache-Control: public, max-age=86400`, and `X-Robots-Tag: noindex`. Unknown slug returns 404. When `EMBEDS_ENABLED` is false it returns the disabled card.

### 3. Framing headers (`next.config.mjs`)
- The global `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'self'` sources change from `/:path*` to a pattern that **excludes `/embed/`** (negative lookahead, e.g. `/:path((?!embed/).*)`). The root `/` must still be matched.
- Add `/embed/:path*`: `Content-Security-Policy: frame-ancestors *; object-src 'none'; base-uri 'self'`, plus `X-Robots-Tag: noindex`. There is no X-Frame-Options (it has no allow-all value).
- Verify with `npm run preview` (workerd): `/embed/exercises/x` has no XFO and has `frame-ancestors *`, while `/` and `/exercises/x` still have SAMEORIGIN.

### 4. `components/exercise-library/embed-exercise-button.tsx` (client)
- Rendered on `app/exercises/[slug]/page.tsx` next to `AddToPlanButton`. Hidden when `EMBEDS_ENABLED` is false.
- It's a button that opens a `<dialog>` containing a live iframe preview of the embed, a read-only `<textarea>` with the snippet, a **Copy code** button (Clipboard API with select-all fallback, then an "Copied" status in `role="status"`), and a licence line: "Free to embed on your website, unchanged and with the credit link. [Embedding terms](/terms#embedding)."
- On copy, it calls `trackLibraryEvent("library_embed_copy", slug)`, which adds a new `LibraryEvent` member.
- The snippet is built server-side on the page and passed as a prop (no catalogue data shipped to the client).

### 5. Terms (`app/terms/page.tsx`)
A new paragraph with `id="embedding"` inside the IP section:

> **Embedding our exercises.** You may embed individual exercises from our exercise library on your website, free of charge, using the embed code provided on each exercise page. The code must be used unchanged, including the credit link to PhysioOnClick, and must not suggest that we endorse your organisation. Embedded exercises remain our content and we may change or withdraw them at any time. This permission covers embedding only. Any other use described above still needs our written permission.

## Error handling

- Unknown slug: the route returns 404 and the button is not rendered (the page itself 404s).
- Missing illustration: the image route already falls back to the placeholder SVG.
- Clipboard API unavailable or denied: fall back to selecting the textarea text and showing "Press Ctrl/Cmd+C to copy".

## Testing (Vitest)

- `tests/lib/exercise-embed.test.ts`:
  - The snippet contains the iframe src and **a plain `<a href>` to the exercise page outside the iframe**.
  - It escapes a title containing `"<&`.
  - The embed HTML has noindex, canonical and watermark text, no `<script`, and no cookies or analytics.
  - The disabled card is returned when the flag is off.
  - The safety-line helper matches the detail page's behaviour.
- `tests/app/embed-route.test.ts`: 200 plus content-type for a known slug, 404 for an unknown slug, and the headers.
- `tests/next-config-headers.test.ts` (or extend an existing one): `headers()` gives `/embed/...` `frame-ancestors *` and no XFO, and still gives `/` and `/exercises/x` SAMEORIGIN. Test the source patterns with `path-to-regexp` against sample paths.
- Button component: renders the snippet and fires the analytics event on copy (mock clipboard).
- Manual: `npm run preview`. Embed the snippet in a local `file://` or scratch HTML page and confirm it renders, then check the headers with `curl -I`.

## Rollout

Build in the `.worktrees/embed` worktree → run the tests → deploy to dev → owner checks → prod only on owner OK.
