# Embeddable Exercises Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any site embed a public exercise via an iframe snippet whose attribution `<a>` sits in the host page, which earns a backlink.

**Architecture:** A pure lib (`lib/exercise-embed.ts`) builds the snippet and a self-contained HTML document. A static route handler `app/embed/exercises/[slug]/route.ts` serves that document outside the root layout. `next.config.mjs` exempts `/embed/*` from the framing block. A client dialog button on the exercise page shows and copies the snippet. The Terms get an embedding clause.

**Tech Stack:** Next.js 15 App Router (OpenNext on Cloudflare Workers), React 19, Vitest + Testing Library (jsdom).

Spec: `docs/superpowers/specs/2026-09-30-exercise-embeds-design.md`

## Global Constraints

- Work only in the worktree `/Users/iamkjn/Documents/Playground/.worktrees/embed` (branch `feat/exercise-embeds`). `node_modules` resolves from the parent repo. Run tests with `npx vitest run <file>`.
- Never add `dynamicParams = false` (it 404s every path on OpenNext). Use `dynamic = "force-static"` + `generateStaticParams`.
- Absolute URLs come from `absoluteUrl()` in `lib/utils.ts` (reads `NEXT_PUBLIC_SITE_URL`, default `https://physioonclick.co.uk`).
- The embed document has **no `<script>`**, no cookies and no analytics, plus `noindex` and a canonical link to `/exercises/<slug>`.
- Watermark text is exactly `© physioonclick.co.uk`.
- Pre-existing unrelated test failures exist on master (booking/toast). Verify only the files you touch.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

### Task 1: Shared safety line helper + embed library

**Files:**
- Create: `lib/exercise-safety-line.ts`
- Create: `lib/exercise-embed.ts`
- Modify: `app/exercises/[slug]/page.tsx` (remove local `SAFETY_CAUTION`/`GENERIC_SAFETY`/`splitMistakes`, import from the new helper)
- Test: `tests/lib/exercise-embed.test.ts`

**Interfaces:**
- Produces: `splitMistakes(mistakes: string[]): { ordinary: string[]; safety: string }`
- Produces: `EMBEDS_ENABLED: boolean`, `embedPath(slug: string): string`, `buildEmbedSnippet(exercise: Exercise): string`, `renderEmbedHtml(exercise: Exercise): string`, `renderEmbedDisabledHtml(exercise: Exercise): string`, `escapeHtml(s: string): string`

- [ ] **Step 1: Write the failing test** `tests/lib/exercise-embed.test.ts`

```ts
import { describe, expect, it } from "vitest";

import { getExerciseBySlug } from "@/lib/exercise-library";
import type { Exercise } from "@/lib/exercises";
import {
  buildEmbedSnippet,
  embedPath,
  escapeHtml,
  renderEmbedDisabledHtml,
  renderEmbedHtml,
} from "@/lib/exercise-embed";
import { splitMistakes } from "@/lib/exercise-safety-line";

const clam = getExerciseBySlug("clam-shell") as Exercise;

describe("exercise embed", () => {
  it("builds the embed path", () => {
    expect(embedPath("clam-shell")).toBe("/embed/exercises/clam-shell");
  });

  it("snippet has the iframe AND a plain attribution link outside it", () => {
    const snippet = buildEmbedSnippet(clam);
    expect(snippet).toContain('src="https://physioonclick.co.uk/embed/exercises/clam-shell"');
    const afterIframe = snippet.split("</iframe>")[1];
    expect(afterIframe).toContain('<a href="https://physioonclick.co.uk/exercises/clam-shell">');
    expect(afterIframe).toContain('<a href="https://physioonclick.co.uk/">PhysioOnClick</a>');
  });

  it("escapes hostile titles", () => {
    const evil = { ...clam, title: `A "b" <c> & d` };
    const snippet = buildEmbedSnippet(evil);
    expect(snippet).not.toContain("<c>");
    expect(snippet).toContain("A &quot;b&quot; &lt;c&gt; &amp; d");
    expect(escapeHtml(`'`)).toBe("&#39;");
  });

  it("renders a self-contained, noindexed, script-free document", () => {
    const html = renderEmbedHtml(clam);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain('<link rel="canonical" href="https://physioonclick.co.uk/exercises/clam-shell">');
    expect(html).toContain("© physioonclick.co.uk");
    expect(html).toContain("/exercise-images/");
    expect(html).toContain("utm_source=embed");
    expect(html).toContain('target="_blank"');
    expect(html.toLowerCase()).not.toContain("<script");
    for (const step of clam.steps ?? []) {
      expect(html).toContain(escapeHtml(step));
    }
  });

  it("renders a disabled card linking to the exercise", () => {
    const html = renderEmbedDisabledHtml(clam);
    expect(html).toContain("View this exercise at PhysioOnClick");
    expect(html).toContain("https://physioonclick.co.uk/exercises/clam-shell");
    expect(html.toLowerCase()).not.toContain("<script");
  });
});

describe("splitMistakes", () => {
  it("pulls a trailing caution out as the safety line", () => {
    expect(splitMistakes(["Rushing", "Stop if pain spreads"])).toEqual({
      ordinary: ["Rushing"],
      safety: "Stop if pain spreads",
    });
  });

  it("falls back to the generic caution", () => {
    expect(splitMistakes(["Rushing"]).safety).toBe(
      "Stop and seek advice if an exercise causes sharp or lasting pain.",
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/lib/exercise-embed.test.ts`
Expected: FAIL, cannot resolve `@/lib/exercise-embed`.

- [ ] **Step 3: Create `lib/exercise-safety-line.ts`**

```ts
// The safety line is the final `mistakes` entry when it reads as a caution
// ("stop", "seek", "pain", "don't push"); otherwise every mistake renders
// normally and the callout carries a generic caution. Deterministic so the
// static export, the embed and the tests agree.
const SAFETY_CAUTION = /\b(stop|seek|pain|don'?t push|do not push)\b/i;
export const GENERIC_SAFETY =
  "Stop and seek advice if an exercise causes sharp or lasting pain.";

export function splitMistakes(mistakes: string[]): {
  ordinary: string[];
  safety: string;
} {
  const last = mistakes[mistakes.length - 1];
  if (last && SAFETY_CAUTION.test(last)) {
    return { ordinary: mistakes.slice(0, -1), safety: last };
  }
  return { ordinary: mistakes, safety: GENERIC_SAFETY };
}
```

Then in `app/exercises/[slug]/page.tsx`, delete the local `SAFETY_CAUTION`, `GENERIC_SAFETY` and `splitMistakes` block (the comment plus the three declarations) and add `import { splitMistakes } from "@/lib/exercise-safety-line";`.

- [ ] **Step 4: Create `lib/exercise-embed.ts`**

```ts
import { exerciseImageUrl } from "@/lib/exercise-images";
import { formatDosage, resolveDosage, type Exercise } from "@/lib/exercises";
import { splitMistakes } from "@/lib/exercise-safety-line";
import { absoluteUrl } from "@/lib/utils";

// Embeddable exercises (docs/superpowers/specs/2026-09-30-exercise-embeds-design.md).
// Other sites paste buildEmbedSnippet(); the iframe loads renderEmbedHtml() from
// /embed/exercises/<slug>. The attribution <a> deliberately sits OUTSIDE the
// iframe: links inside an iframe belong to our document, so only the host-page
// link counts as a backlink.

/** Off switch: false serves a plain "view at PhysioOnClick" card instead. */
export const EMBEDS_ENABLED = true;

export function embedPath(slug: string): string {
  return `/embed/exercises/${encodeURIComponent(slug)}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function exercisePageUrl(slug: string): string {
  return absoluteUrl(`/exercises/${encodeURIComponent(slug)}`);
}

export function buildEmbedSnippet(exercise: Exercise): string {
  const title = escapeHtml(exercise.title);
  const src = escapeHtml(absoluteUrl(embedPath(exercise.slug)));
  const page = escapeHtml(exercisePageUrl(exercise.slug));
  const home = escapeHtml(absoluteUrl("/"));
  return (
    `<iframe src="${src}" title="${title} exercise – PhysioOnClick" width="100%" height="760" loading="lazy" style="border:0;max-width:520px;width:100%"></iframe>\n` +
    `<p style="font-size:14px;margin:6px 0 0"><a href="${page}">${title} exercise</a> by <a href="${home}">PhysioOnClick</a></p>`
  );
}

// The Clarity System, inlined: paper background, navy ink, sky accent. System
// fonts only so the embed makes no third-party font requests.
const STYLES = `
*{box-sizing:border-box}
body{margin:0;background:#fffdf8;color:#14213d;font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.card{max-width:520px;margin:0 auto;padding:16px}
.media{position:relative;border-radius:14px;overflow:hidden;background:#eaf6fb;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.media img{display:block;width:100%;height:auto;pointer-events:none}
.wm{position:absolute;right:10px;bottom:10px;padding:3px 8px;border-radius:999px;background:rgba(255,253,248,.78);color:#14213d;font-size:11px;font-weight:600;opacity:.8}
h1{font-size:20px;line-height:1.25;margin:14px 0 6px}
p{margin:0 0 10px}
ol{margin:0 0 10px;padding-left:22px}
li{margin-bottom:4px}
.dose{font-weight:600}
.safety{background:#fff4f2;border:1px solid #f3d6d0;color:#a83a2c;border-radius:10px;padding:8px 12px;font-size:14px}
.cta{display:inline-block;margin-top:4px;color:#0369a1;font-weight:600;text-decoration:none}
.cta:hover{text-decoration:underline}
.foot{margin-top:10px;font-size:12px;color:#64737d}
`;

function documentShell(exercise: Exercise, body: string): string {
  const title = escapeHtml(exercise.title);
  const canonical = escapeHtml(exercisePageUrl(exercise.slug));
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="noindex">` +
    `<link rel="canonical" href="${canonical}">` +
    `<title>${title} exercise – PhysioOnClick</title>` +
    `<style>${STYLES}</style></head><body>${body}</body></html>`
  );
}

function fullGuideUrl(slug: string): string {
  return `${exercisePageUrl(slug)}?utm_source=embed&utm_medium=referral`;
}

export function renderEmbedHtml(exercise: Exercise): string {
  const title = escapeHtml(exercise.title);
  const image = escapeHtml(absoluteUrl(exerciseImageUrl(exercise.id, "full")));
  const steps = (exercise.steps ?? []).map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  const dose = formatDosage(resolveDosage(exercise));
  const { safety } = splitMistakes(exercise.mistakes ?? []);
  const cta = escapeHtml(fullGuideUrl(exercise.slug));

  const body =
    `<main class="card">` +
    `<div class="media" oncontextmenu="return false"><img src="${image}" alt="Illustration of the ${title} exercise" width="960" height="960" draggable="false" loading="lazy"><span class="wm" aria-hidden="true">© physioonclick.co.uk</span></div>` +
    `<h1>${title}</h1>` +
    (exercise.setup ? `<p>${escapeHtml(exercise.setup)}</p>` : "") +
    (steps ? `<ol>${steps}</ol>` : "") +
    (dose ? `<p class="dose">${escapeHtml(dose)}</p>` : "") +
    `<p class="safety">${escapeHtml(safety)}</p>` +
    `<a class="cta" href="${cta}" target="_blank" rel="noopener">See the full guide at PhysioOnClick →</a>` +
    `<p class="foot">© PhysioOnClick · General guidance, not a diagnosis.</p>` +
    `</main>`;
  return documentShell(exercise, body);
}

export function renderEmbedDisabledHtml(exercise: Exercise): string {
  const title = escapeHtml(exercise.title);
  const url = escapeHtml(exercisePageUrl(exercise.slug));
  return documentShell(
    exercise,
    `<main class="card"><h1>${title}</h1><a class="cta" href="${url}" target="_blank" rel="noopener">View this exercise at PhysioOnClick →</a></main>`,
  );
}
```

Note: `oncontextmenu="return false"` is an inline event attribute, not a `<script>` element. The test only forbids `<script`.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/lib/exercise-embed.test.ts tests/app/exercise-page.test.tsx`
Expected: PASS (exercise-page still passes after the helper move). If `formatDosage` needs a different import path, check `lib/exercises.ts:6408-6440`.

- [ ] **Step 6: Commit**

```bash
git add lib/exercise-safety-line.ts lib/exercise-embed.ts app/exercises/[slug]/page.tsx tests/lib/exercise-embed.test.ts
git commit -m "feat(embeds): embed snippet + self-contained embed document"
```

---

### Task 2: Embed route handler

**Files:**
- Create: `app/embed/exercises/[slug]/route.ts`
- Test: `tests/app/embed-route.test.ts`

**Interfaces:**
- Consumes: `EMBEDS_ENABLED`, `renderEmbedHtml`, `renderEmbedDisabledHtml` from Task 1; `allExerciseSlugs`, `getExerciseBySlug` from `@/lib/exercise-library`.

- [ ] **Step 1: Failing test** `tests/app/embed-route.test.ts`

```ts
import { describe, expect, it } from "vitest";

import { GET, generateStaticParams } from "@/app/embed/exercises/[slug]/route";

const req = () => new Request("http://localhost/embed/exercises/clam-shell");
const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("GET /embed/exercises/[slug]", () => {
  it("serves the embed document for a known exercise", async () => {
    const res = await GET(req(), ctx("clam-shell"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    expect(res.headers.get("cache-control")).toContain("max-age=86400");
    const body = await res.text();
    expect(body).toContain("<!doctype html>");
    expect(body).toContain("Clam");
  });

  it("404s an unknown slug", async () => {
    const res = await GET(req(), ctx("no-such-exercise"));
    expect(res.status).toBe(404);
  });

  it("prerenders every exercise", () => {
    expect(generateStaticParams().length).toBeGreaterThan(100);
  });
});
```

- [ ] **Step 2: Run, expect FAIL** (module not found): `npx vitest run tests/app/embed-route.test.ts`

- [ ] **Step 3: Implement** `app/embed/exercises/[slug]/route.ts`

```ts
import { NextResponse } from "next/server";

import { allExerciseSlugs, getExerciseBySlug } from "@/lib/exercise-library";
import { EMBEDS_ENABLED, renderEmbedDisabledHtml, renderEmbedHtml } from "@/lib/exercise-embed";

// A route handler (not a page) so the embed escapes the root layout: no site
// header, chat, cookie banner or analytics inside other people's websites.
// Framing is allowed for /embed/* only - see next.config.mjs. Deliberately no
// `dynamicParams = false` - on OpenNext that 404s every path on deploy.
export const dynamic = "force-static";

export function generateStaticParams() {
  return allExerciseSlugs().map((slug) => ({ slug }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exercise = getExerciseBySlug(slug);

  if (!exercise) {
    return new NextResponse("Not found", { status: 404 });
  }

  const html = EMBEDS_ENABLED ? renderEmbedHtml(exercise) : renderEmbedDisabledHtml(exercise);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
```

- [ ] **Step 4: Run, expect PASS**: `npx vitest run tests/app/embed-route.test.ts`

- [ ] **Step 5: Commit**

```bash
git add app/embed tests/app/embed-route.test.ts
git commit -m "feat(embeds): static /embed/exercises/[slug] route"
```

---

### Task 3: Allow framing for /embed only

**Files:**
- Modify: `next.config.mjs` (security-headers block `source: "/:path*"` containing `X-Frame-Options`, and the CSP block `source: "/:path*"`)
- Test: `tests/app/next-config-headers.test.ts` (append)

- [ ] **Step 1: Append failing tests** to `tests/app/next-config-headers.test.ts`. Uses Next's own compiled matcher:

```ts
import { createRequire } from "node:module";

const nodeRequire = createRequire(import.meta.url);
const { pathToRegexp } = nodeRequire("next/dist/compiled/path-to-regexp") as {
  pathToRegexp: (source: string, keys?: unknown[]) => RegExp;
};

function headersFor(rules: HeaderRule[], path: string) {
  const out: Record<string, string> = {};
  for (const rule of rules) {
    if (pathToRegexp(rule.source, []).test(path)) {
      for (const h of rule.headers) out[h.key] = h.value;
    }
  }
  return out;
}

describe("framing headers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("lets anyone frame /embed/* but nothing else", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://physioonclick.co.uk");
    const rules = await loadHeaders();

    const embed = headersFor(rules, "/embed/exercises/clam-shell");
    expect(embed["X-Frame-Options"]).toBeUndefined();
    expect(embed["Content-Security-Policy"]).toContain("frame-ancestors *");
    expect(embed["X-Robots-Tag"]).toBe("noindex");
    expect(embed["Strict-Transport-Security"]).toBeDefined();

    for (const path of ["/", "/exercises/clam-shell", "/book", "/embedded-thing"]) {
      const h = headersFor(rules, path);
      expect(h["X-Frame-Options"], path).toBe("SAMEORIGIN");
      expect(h["Content-Security-Policy"], path).toContain("frame-ancestors 'self'");
    }
  });
});
```

(Put the `createRequire` import at the top of the file with the other imports.)

- [ ] **Step 2: Run, expect FAIL** on `/embed` XFO: `npx vitest run tests/app/next-config-headers.test.ts`

- [ ] **Step 3: Implement** in `next.config.mjs`:

1. Split the "Security headers (every route)" rule. Keep HSTS, nosniff, Referrer-Policy and Permissions-Policy on `source: "/:path*"`. Move `X-Frame-Options: SAMEORIGIN` into a new rule:
```js
      {
        // Everything except the embeddable exercise cards (/embed/*), which
        // exist to be framed by other sites. X-Frame-Options has no
        // allow-all value, so /embed simply doesn't get it.
        source: "/:path((?!embed/).*)",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
```
2. Change the CSP rule's `source: "/:path*"` to `source: "/:path((?!embed/).*)"`, and add after it:
```js
      {
        // Embeddable exercise cards: framable anywhere, never indexed (the
        // canonical exercise page is the one that should rank).
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *; object-src 'none'; base-uri 'self'; upgrade-insecure-requests",
          },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
```

- [ ] **Step 4: Run, expect PASS** (whole file): `npx vitest run tests/app/next-config-headers.test.ts`. If `/` does not match `/:path((?!embed/).*)`, add a separate `source: "/"` rule with the same headers and keep the test.

- [ ] **Step 5: Commit**

```bash
git add next.config.mjs tests/app/next-config-headers.test.ts
git commit -m "feat(embeds): allow framing for /embed only"
```

---

### Task 4: "Embed this exercise" button on exercise pages

**Files:**
- Create: `components/exercise-library/embed-exercise-button.tsx`
- Modify: `lib/analytics.ts` (add `"library_embed_copy"` to `LibraryEvent`)
- Modify: `app/exercises/[slug]/page.tsx` (render the button after `<AddToPlanButton ... />`)
- Modify: `app/globals.css` (append `.exlib-embed*` styles at the end of the `.exlib-*` section)
- Modify: `docs/analytics-tracking.md` (the `app/exercises/[slug]/page.tsx` row gains `library_embed_copy`)
- Test: `tests/components/embed-exercise-button.test.tsx`

**Interfaces:**
- Consumes: `EMBEDS_ENABLED`, `buildEmbedSnippet`, `embedPath` (Task 1); `trackLibraryEvent` from `@/lib/analytics`.
- Produces: `<EmbedExerciseButton slug: string; title: string; snippet: string; previewSrc: string />`

- [ ] **Step 1: Failing test** `tests/components/embed-exercise-button.test.tsx`

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics", () => ({ trackLibraryEvent: vi.fn() }));

import { trackLibraryEvent } from "@/lib/analytics";
import { EmbedExerciseButton } from "@/components/exercise-library/embed-exercise-button";

const props = {
  slug: "clam-shell",
  title: "Clam Shell",
  snippet: '<iframe src="https://physioonclick.co.uk/embed/exercises/clam-shell"></iframe>',
  previewSrc: "/embed/exercises/clam-shell",
};

beforeEach(() => {
  vi.mocked(trackLibraryEvent).mockClear();
  // jsdom lacks <dialog> methods
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("EmbedExerciseButton", () => {
  it("shows the snippet and licence link when opened", () => {
    render(<EmbedExerciseButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /embed this exercise/i }));
    expect(screen.getByLabelText(/embed code/i)).toHaveValue(props.snippet);
    expect(screen.getByRole("link", { name: /embedding terms/i })).toHaveAttribute("href", "/terms#embedding");
  });

  it("copies the snippet and tracks the event", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<EmbedExerciseButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /embed this exercise/i }));
    fireEvent.click(screen.getByRole("button", { name: /copy code/i }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/copied/i));
    expect(writeText).toHaveBeenCalledWith(props.snippet);
    expect(trackLibraryEvent).toHaveBeenCalledWith("library_embed_copy", "clam-shell");
  });

  it("falls back to manual copy when the clipboard is unavailable", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("no")) } });
    render(<EmbedExerciseButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /embed this exercise/i }));
    fireEvent.click(screen.getByRole("button", { name: /copy code/i }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/ctrl\/cmd\+c/i));
  });
});
```

- [ ] **Step 2: Run, expect FAIL**: `npx vitest run tests/components/embed-exercise-button.test.tsx`

- [ ] **Step 3: Implement** `components/exercise-library/embed-exercise-button.tsx`

```tsx
"use client";

// "Embed this exercise": a dialog with a live preview and the copy-paste
// snippet. The snippet is built on the server (lib/exercise-embed.ts) and
// passed in, so no catalogue data ships to the client.

import Link from "next/link";
import { useRef, useState } from "react";

import { trackLibraryEvent } from "@/lib/analytics";

export function EmbedExerciseButton({
  slug,
  title,
  snippet,
  previewSrc,
}: {
  slug: string;
  title: string;
  snippet: string;
  previewSrc: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  function openDialog() {
    setStatus("");
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setOpen(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setStatus("Copied - paste it into your website's HTML.");
    } catch {
      textRef.current?.select();
      setStatus("Code selected - press Ctrl/Cmd+C to copy.");
    }
    trackLibraryEvent("library_embed_copy", slug);
  }

  return (
    <>
      <button type="button" className="exlib-embed-btn" onClick={openDialog}>
        Embed this exercise<span className="sr-only">: {title}</span>
      </button>
      <dialog
        ref={dialogRef}
        className="exlib-embed-dialog"
        aria-labelledby="exlib-embed-title"
        onClose={() => setOpen(false)}
      >
        <div className="exlib-embed-dialog__head">
          <h2 id="exlib-embed-title">Embed this exercise on your website</h2>
          <button type="button" className="exlib-embed-dialog__close" onClick={closeDialog} aria-label="Close">
            ×
          </button>
        </div>
        <p className="muted">
          Free for clinics, gyms, clubs and blogs. Paste this code into your page&apos;s HTML.
        </p>
        {open ? (
          <iframe
            className="exlib-embed-dialog__preview"
            src={previewSrc}
            title={`Preview: ${title} embed`}
            loading="lazy"
          />
        ) : null}
        <label htmlFor="exlib-embed-code" className="exlib-embed-dialog__label">
          Embed code
        </label>
        <textarea id="exlib-embed-code" ref={textRef} readOnly rows={5} value={snippet} onFocus={(e) => e.currentTarget.select()} />
        <div className="exlib-embed-dialog__actions">
          <button type="button" className="button primary" onClick={copy}>
            Copy code
          </button>
          <span role="status" aria-live="polite">{status}</span>
        </div>
        <p className="muted exlib-embed-dialog__licence">
          Free to embed unchanged, with the credit link kept.{" "}
          <Link href="/terms#embedding">Embedding terms</Link>
        </p>
      </dialog>
    </>
  );
}
```

- [ ] **Step 4: Wire it up**

`lib/analytics.ts`: add `| "library_embed_copy"` to the `LibraryEvent` union (after `"library_area_view"`).

`app/exercises/[slug]/page.tsx`: add imports
```tsx
import { EmbedExerciseButton } from "@/components/exercise-library/embed-exercise-button";
import { buildEmbedSnippet, EMBEDS_ENABLED, embedPath } from "@/lib/exercise-embed";
```
and directly after the `<AddToPlanButton ... />` element:
```tsx
            {EMBEDS_ENABLED ? (
              <EmbedExerciseButton
                slug={exercise.slug}
                title={exercise.title}
                snippet={buildEmbedSnippet(exercise)}
                previewSrc={embedPath(exercise.slug)}
              />
            ) : null}
```

`app/globals.css`: append at the end of the `.exlib-*` section (search for the `.exlib-add-btn` rules and add after them), using existing tokens:
```css
.exlib-embed-btn {
  background: none;
  border: 0;
  padding: 6px 0;
  color: var(--color-sky-ink, #0369a1);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.exlib-embed-dialog {
  width: min(640px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  border: 0;
  border-radius: 18px;
  padding: 20px;
  background: var(--color-paper, #fffdf8);
  color: var(--color-navy, #14213d);
}
.exlib-embed-dialog::backdrop { background: rgba(20, 33, 61, 0.45); }
.exlib-embed-dialog__head { display: flex; justify-content: space-between; align-items: start; gap: 12px; }
.exlib-embed-dialog__head h2 { margin: 0; font-size: 1.25rem; }
.exlib-embed-dialog__close { background: none; border: 0; font-size: 1.6rem; line-height: 1; cursor: pointer; color: inherit; }
.exlib-embed-dialog__preview { display: block; width: 100%; height: 360px; border: 1px solid rgba(20, 33, 61, 0.12); border-radius: 12px; margin: 12px 0; }
.exlib-embed-dialog__label { display: block; font-weight: 600; margin-bottom: 4px; }
.exlib-embed-dialog textarea { width: 100%; font: 13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; padding: 10px; border-radius: 10px; border: 1px solid rgba(20, 33, 61, 0.2); resize: vertical; }
.exlib-embed-dialog__actions { display: flex; align-items: center; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
.exlib-embed-dialog__licence { font-size: 0.875rem; margin-top: 12px; }
```
Before committing, check which color custom properties actually exist (`grep -n "^\s*--color-" app/globals.css | head -40`) and swap the fallbacks' variable names to real tokens.

`docs/analytics-tracking.md`: in the `app/exercises/[slug]/page.tsx` row, append `` `library_embed_copy` `{ slug }` from `components/exercise-library/embed-exercise-button.tsx`. ``

- [ ] **Step 5: Run, expect PASS**:
`npx vitest run tests/components/embed-exercise-button.test.tsx tests/app/exercise-page.test.tsx tests/app/analytics-tracking-registry.test.ts tests/lib/analytics.test.ts`

- [ ] **Step 6: Commit**

```bash
git add components/exercise-library/embed-exercise-button.tsx lib/analytics.ts app/exercises/[slug]/page.tsx app/globals.css docs/analytics-tracking.md tests/components/embed-exercise-button.test.tsx
git commit -m "feat(embeds): embed dialog with copy-code on exercise pages"
```

---

### Task 5: Terms embedding clause

**Files:**
- Modify: `app/terms/page.tsx` (inside the `#intellectual-property` article, after the paragraph that starts "Healthcare professionals and organisations")
- Test: `tests/app/terms.test.tsx` (append)

- [ ] **Step 1: Failing test** (append inside the existing `describe`):

```tsx
  it('grants an embed-only licence at #embedding', () => {
    const { container } = render(<TermsPage />)
    const clause = container.querySelector('#embedding')
    expect(clause).not.toBeNull()
    expect(clause?.textContent).toMatch(/embed individual exercises/i)
    expect(clause?.textContent).toMatch(/credit link/i)
    expect(clause?.textContent).toMatch(/covers embedding only/i)
  })
```

- [ ] **Step 2: Run, expect FAIL**: `npx vitest run tests/app/terms.test.tsx`

- [ ] **Step 3: Implement** by adding after the "Healthcare professionals…" `<p>`:

```tsx
          <p id="embedding">
            <strong>Embedding our exercises.</strong> You may embed individual exercises from our{" "}
            <Link href="/exercises" style={inlineLinkStyle}>exercise library</Link> on your website, free of charge,
            using the embed code provided on each exercise page. The code must be used unchanged, including the
            credit link to PhysioOnClick, and must not suggest that we endorse your organisation. Embedded exercises
            remain our content and we may change or withdraw them at any time. This permission covers embedding only;
            any other use described above still needs our written permission.
          </p>
```

- [ ] **Step 4: Run, expect PASS**: `npx vitest run tests/app/terms.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add app/terms/page.tsx tests/app/terms.test.tsx
git commit -m "feat(embeds): embed-only licence clause in Terms"
```

---

### Task 6: Local verification (controller, not a subagent)

- [ ] `npx tsc --noEmit -p .` and `npx vitest run tests/lib/exercise-embed.test.ts tests/app/embed-route.test.ts tests/app/next-config-headers.test.ts tests/components/embed-exercise-button.test.tsx tests/app/terms.test.tsx tests/app/exercise-page.test.tsx`
- [ ] `npm run dev` in the worktree. Open `/exercises/clam-shell`, open the dialog, check the preview renders, and copy the code.
- [ ] Write a scratch `host.html` containing the snippet, serve it from a different origin (e.g. `python3 -m http.server 8081` in the scratchpad, or `npx serve`), and confirm the iframe renders cross-origin.
- [ ] `curl -sI localhost:3000/embed/exercises/clam-shell` → no `X-Frame-Options`, `frame-ancestors *`. `curl -sI localhost:3000/exercises/clam-shell` → `SAMEORIGIN`.
- [ ] Show the owner. Dev deploy only after approval, prod only after a second approval.
