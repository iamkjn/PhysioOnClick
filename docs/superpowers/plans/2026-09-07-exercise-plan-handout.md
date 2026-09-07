# Exercise Plan Handout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a physio publishes a session summary, auto-generate a branded multi-page PDF exercise plan (illustration + steps + dose per exercise) and email it to the patient, and show the same illustrations on the website exercise card.

**Architecture:** A pure `pdf-lib` builder (`lib/exercise-plan-pdf.ts`, Workers-safe, mirrors `lib/invoice-pdf.ts`) produces the PDF from plain data. A CRON_SECRET-guarded Next route (`/api/exercise-plan/generate`) orchestrates: read the summary/booking, resolve the patient's assigned exercises + doses, fetch each illustration, build the PDF, store it in Storage, email it via Resend, stamp the summary. The existing `onSummaryPublished` Cloud Function fires that route (same Function→route pattern as `sendAssessmentReminders`). Illustrations are AI-generated PNGs in Storage `exercise-images/{id}.png`, served by `app/exercise-images/[id]/route.ts` with a placeholder fallback, and rendered on the web card with an `onError` fall-through to the existing `ExerciseFigure` SVG.

**Tech Stack:** Next.js 15 App Router (Workers via OpenNext), pdf-lib, Resend REST, Firebase Storage via the `lib/firebase-admin.ts` REST shim (`uploadObject`/`downloadObject`), Firebase Functions v2 (`functions/`, separate npm project), Vitest.

## Global Constraints

- **Workers-safe only** in `lib/` and `app/api/` — no Node built-ins, no filesystem. Follow `lib/invoice-pdf.ts`: `pdf-lib`, `atob`-based base64, `Uint8Array` bodies cast `as BodyInit`.
- **CRON_SECRET header name is `x-cron-secret`** (matches `app/api/assessment/reminder-email/route.ts`), checked `=== process.env.CRON_SECRET`.
- **Resend attachment shape (verbatim):** `attachments: [{ filename: string, content: <base64 string> }]` inside the `POST https://api.resend.com/emails` JSON body (see `lib/emails/receipt-email.ts:57`).
- **`from` address:** `process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>"`.
- **No new env vars** — `GEMINI_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `FIREBASE_ADMIN_STORAGE_BUCKET` all already set.
- **No `firestore.rules` change.** One `storage.rules` addition (Task 1).
- **No `Exercise` type field** for the image — resolved by id via `exerciseImageUrl(id)`.
- **Storage paths:** images `exercise-images/{id}.png` (public read); plans `exercise-plans/{summaryId}.pdf` (no client access — served only through the auth-checked route, same trust model as `invoices/`).
- **Best-effort:** every step of `/api/exercise-plan/generate` after loading the summary is wrapped so a failure logs and the route still returns `200` (the Cloud Function must not retry-storm). The email step is idempotent on `sessionSummaries/{id}.planEmailedAt` unless `force: true`.
- **Pre-existing flaky tests:** `tests/components/booking-flow.test.tsx` + `tests/components/toast-provider.test.tsx` fail on `master` independent of this work — assert only on files this plan touches.
- **Brand palette (from `lib/invoice-pdf.ts`):** ink `rgb(4/255,50/255,70/255)`, sky `rgb(0x0e/255,0xa5/255,0xe9/255)`, blue `rgb(0x0a/255,0x77/255,0xa8/255)`, wash `rgb(0xea/255,0xf6/255,0xfb/255)`, white.
- Trunk-based; commit to `master`; deploy dev with `npm run deploy:dev` after the plan (Function change also needs `firebase deploy --only functions`).

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `lib/exercise-images.ts` (new) | `exerciseImageUrl(id)`, `EXERCISE_IMAGE_PLACEHOLDER_SVG` | 1 |
| `app/exercise-images/[id]/route.ts` (new) | serve `exercise-images/{id}.png` from Storage, placeholder SVG on miss, 404 on unknown id | 1 |
| `components/exercise-image.tsx` (new) | `<ExerciseImage>` — `<img>` with `onError` → `<ExerciseFigure>` | 1 |
| `components/assigned-exercises.tsx` (modify) | swap the `<ExerciseFigure>` call for `<ExerciseImage>` | 1 |
| `storage.rules` (modify) | `exercise-images/**` public read + admin write | 1 |
| `lib/exercise-image-prompts.ts` (new) | style prefix/suffix, `exerciseImagePrompts` record (batch 1), `fullImagePrompt`, `hasImagePrompt` | 2 |
| `docs/exercise-image-style.md` (new) | the visual brand contract | 2 |
| `tests/lib/exercise-image-prompts.test.ts` (new) | shape test | 2 |
| `scripts/generate-exercise-images.ts` (new) | Imagen generation for a batch → `exercise-images-src/` | 3 |
| `scripts/upload-exercise-images.ts` (new) | push approved PNGs → Storage | 3 |
| `.gitignore` (modify) | `exercise-images-src/` | 3 |
| `lib/exercise-plan-pdf.ts` (new) | pure `buildExercisePlanPdf(input): Promise<Uint8Array>` | 4 |
| `tests/lib/exercise-plan-pdf.test.ts` (new) | page count, `%PDF` header, no network | 4 |
| `lib/emails/exercise-plan-email.ts` (new) | `sendExercisePlanEmail(...)` + `buildExercisePlanEmailHtml` | 5 |
| `tests/lib/exercise-plan-email.test.ts` (new) | HTML/text snapshot, attachment wiring | 5 |
| `lib/exercise-plan.ts` (new) | `buildPlanCards(assigned, exerciseById, fetchImage)` — shared data-prep | 6 |
| `app/api/exercise-plan/generate/route.ts` (new) | orchestration route | 6 |
| `tests/api/exercise-plan-generate.test.ts` (new) | 401, happy path, idempotency | 6 |
| `app/api/exercise-plan/[summaryId]/pdf/route.ts` (new) | patient/admin PDF download | 7 |
| `components/patient-exercise-plan-button.tsx` (new) | "Download my plan (PDF)" | 7 |
| `app/patient/exercises/page.tsx` (modify) | render the button | 7 |
| `functions/src/index.ts` (modify) | `onSummaryPublished` → also `fetch` the generate route | 8 |
| `components/summary-form.tsx` (modify) | "Resend plan email" button | 8 |

---

## Task 1: Image serving route + web card swap

**Files:**
- Create: `lib/exercise-images.ts`, `app/exercise-images/[id]/route.ts`, `components/exercise-image.tsx`
- Modify: `components/assigned-exercises.tsx`, `storage.rules`
- Test: `tests/app/exercise-images-route.test.ts` (new), extend `tests/components/assigned-exercises.test.tsx`

**Interfaces:**
- Produces: `exerciseImageUrl(id: string): string` (= `/exercise-images/${id}`), `EXERCISE_IMAGE_PLACEHOLDER_SVG: string`; `<ExerciseImage name={string} exerciseId={string} pose?={string} size?={number} />`
- Consumes: `downloadObject` from `@/lib/firebase-admin`; `exercises` from `@/lib/exercises`; `ExerciseFigure` from `@/components/exercise-figure`

- [ ] **Step 1: Write the failing route test**

Create `tests/app/exercise-images-route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const downloadObject = vi.fn()
vi.mock('@/lib/firebase-admin', () => ({ downloadObject: (...a: unknown[]) => downloadObject(...a) }))
vi.mock('@/lib/exercises', () => ({ exercises: [{ id: 'ex-3', title: 'Bridge' }] }))

import { GET } from '@/app/exercise-images/[id]/route'

function req() { return new Request('http://localhost/exercise-images/ex-3') }
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => downloadObject.mockReset())

describe('GET /exercise-images/[id]', () => {
  it('404s an unknown exercise id', async () => {
    const res = await GET(req(), ctx('ex-does-not-exist'))
    expect(res.status).toBe(404)
  })
  it('serves the PNG bytes when Storage has it', async () => {
    downloadObject.mockResolvedValue(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))
    const res = await GET(req(), ctx('ex-3'))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
    expect(res.headers.get('cache-control')).toContain('immutable')
  })
  it('serves a placeholder SVG when Storage misses', async () => {
    downloadObject.mockResolvedValue(null)
    const res = await GET(req(), ctx('ex-3'))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/svg+xml')
    expect(await res.text()).toContain('<svg')
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (`Cannot find module '@/app/exercise-images/[id]/route'`)

Run: `npx vitest run tests/app/exercise-images-route.test.ts`

- [ ] **Step 3: Implement**

`lib/exercise-images.ts`:
```ts
export function exerciseImageUrl(id: string): string {
  return `/exercise-images/${encodeURIComponent(id)}`;
}

// A neutral "exercise" glyph so an <img> never shows a broken icon before the
// real illustration exists. The web card additionally swaps to <ExerciseFigure>.
export const EXERCISE_IMAGE_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="#EAF6FB"/><g fill="none" stroke="#0EA5E9" stroke-width="3" stroke-linecap="round"><circle cx="32" cy="20" r="6"/><path d="M32 27v16M24 34h16M27 51l5-8 5 8"/></g></svg>`;
```

`app/exercise-images/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { exercises } from "@/lib/exercises";
import { downloadObject } from "@/lib/firebase-admin";
import { EXERCISE_IMAGE_PLACEHOLDER_SVG } from "@/lib/exercise-images";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!exercises.some((e) => e.id === id)) return new NextResponse("Not found", { status: 404 });

  const bytes = await downloadObject(`exercise-images/${id}.png`).catch(() => null);
  if (bytes) {
    return new NextResponse(bytes as BodyInit, {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }
  return new NextResponse(EXERCISE_IMAGE_PLACEHOLDER_SVG, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" },
  });
}
```

`components/exercise-image.tsx`:
```tsx
"use client";
import { useState } from "react";
import { ExerciseFigure } from "@/components/exercise-figure";
import { exerciseImageUrl } from "@/lib/exercise-images";

export function ExerciseImage({
  exerciseId, name, pose, size = 52,
}: { exerciseId: string; name: string; pose?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <ExerciseFigure name={name} pose={pose} size={size} />;
  return (
    <span className="exercise-figure-tile" style={{ width: size, height: size }}>
      <img
        src={exerciseImageUrl(exerciseId)}
        alt=""
        width={size}
        height={size}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
```
*(Note: the placeholder SVG response is a 200, so `onError` will NOT fire for it — the card shows the sky glyph until a PNG exists. That is acceptable; if the team prefers the stick figure until then, the route should 404 on miss instead and this component's `onError` handles it. Pick one and note it in the commit — default: placeholder SVG.)*

In `components/assigned-exercises.tsx`, replace `<ExerciseFigure name={ex.title} size={52} pose={ex.pose} />` with `<ExerciseImage exerciseId={ex.id} name={ex.title} pose={ex.pose} size={52} />` and add the import.

`storage.rules` — add alongside the blog-images rule:
```
    match /exercise-images/{file} {
      allow read: if true;
      allow write: if false; // uploaded only via the admin REST shim
    }
```

Extend `tests/components/assigned-exercises.test.tsx`: mock `@/lib/exercise-images` (`exerciseImageUrl: (id) => '/exercise-images/'+id`), and assert the card renders an `<img>` with that src for `FIXTURE_EX`. Existing tests stay green (the fixture's title etc. unchanged).

- [ ] **Step 4: Run tests** — `npx vitest run tests/app/exercise-images-route.test.ts tests/components/assigned-exercises.test.tsx` — all pass. `npx tsc --noEmit`, `npm run lint`.

- [ ] **Step 5: Commit**
```bash
git add lib/exercise-images.ts app/exercise-images components/exercise-image.tsx components/assigned-exercises.tsx storage.rules tests/app/exercise-images-route.test.ts tests/components/assigned-exercises.test.tsx
git commit -m "feat(exercises): serve per-exercise illustrations with a stick-figure fallback

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Image prompt module + style doc

**Files:**
- Create: `lib/exercise-image-prompts.ts`, `docs/exercise-image-style.md`, `tests/lib/exercise-image-prompts.test.ts`

**Interfaces:**
- Produces: `IMAGE_STYLE_PREFIX: string`, `IMAGE_STYLE_SUFFIX: string`, `exerciseImagePrompts: Record<string,string>`, `fullImagePrompt(id): string | null`, `hasImagePrompt(id): boolean`
- Consumes: `exercises` from `@/lib/exercises` (for the shape test)

- [ ] **Step 1: Write the failing test** — `tests/lib/exercise-image-prompts.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { fullImagePrompt, hasImagePrompt, exerciseImagePrompts, IMAGE_STYLE_PREFIX } from '@/lib/exercise-image-prompts'
import { exercises } from '@/lib/exercises'

describe('exercise image prompts', () => {
  it('fullImagePrompt wraps the entry in the style prefix + suffix', () => {
    const p = fullImagePrompt('ex-3')
    expect(p).toContain(IMAGE_STYLE_PREFIX)
    expect(p).toContain(exerciseImagePrompts['ex-3'])
  })
  it('returns null for an id with no prompt', () => {
    expect(fullImagePrompt('ex-does-not-exist')).toBeNull()
    expect(hasImagePrompt('ex-does-not-exist')).toBe(false)
  })
  it('every prompt entry is a non-empty single-line string for a real exercise id', () => {
    const ids = new Set(exercises.map((e) => e.id))
    for (const [id, prompt] of Object.entries(exerciseImagePrompts)) {
      expect(ids.has(id)).toBe(true)
      expect(prompt.trim().length).toBeGreaterThan(10)
      expect(prompt).not.toContain('\n')
    }
  })
  it('covers batch 1 (the 13 lumbar/core exercises)', () => {
    for (const id of ['ex-3','ex-14','ex-15','ex-17','ex-18','ex-24','ex-25','ex-26','ex-27','ex-28','ex-31','ex-32','ex-34']) {
      expect(hasImagePrompt(id)).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

`docs/exercise-image-style.md` — write the §1 style spec from the design doc verbatim (flat 2-D, single figure, sky motion arrow, palette `#14213D`/`#0EA5E9`/`#FBF7F0`, no face, no text, consistent per-region angle, props only when used, ~768px square PNG).

`lib/exercise-image-prompts.ts`:
```ts
export const IMAGE_STYLE_PREFIX =
  "Flat 2D vector illustration, clean and minimal, single human figure with neutral leggings and top, no facial features, ";
export const IMAGE_STYLE_SUFFIX =
  ", a single sky-blue (#0EA5E9) curved arrow showing the direction of movement, navy (#14213D) line work, warm off-white (#FBF7F0) background, no text, no labels, no watermark, medically accurate joint positions, 3/4 side view";

export const exerciseImagePrompts: Record<string, string> = {
  "ex-3": "a person lying on their back on an exercise mat with knees bent and feet flat, hips lifted into a bridge so the body forms a straight line from shoulders to knees",
  "ex-14": "a person lying on their back, both arms reaching straight up and hips and knees bent to right angles, slowly lowering one opposite arm and leg towards the floor (dead bug)",
  "ex-15": "a person on hands and knees on a mat, reaching one arm forward and the opposite leg straight back, both level with the flat back (bird dog)",
  "ex-17": "a person lying face down propping the upper body up on straight arms with hips and legs relaxed on the mat, lower back gently arched (press-up / cobra)",
  "ex-18": "a person standing with hands supporting the lower back, leaning the upper body gently backwards",
  "ex-24": "a person lying face down, chest and forehead lifted a small way off the mat, arms by the sides with palms turned outward and shoulder blades drawn together (prone cobra)",
  "ex-25": "a person in a side-lying position propped on one forearm with knees bent, hips lifted so the body is a straight line from head to knees (modified side plank)",
  "ex-26": "a person on a mat rolling smoothly from lying on their back onto their side, one body segment at a time",
  "ex-27": "a person lying on their back with knees bent, gently tilting the pelvis to flatten the lower back towards the floor (pelvic tilt)",
  "ex-28": "a person on hands and knees reaching one arm forward and the opposite leg back, then drawing that elbow and knee together under the body",
  "ex-31": "a person lying on their back gently drawing both bent knees up towards the chest, hands behind the thighs (lumbar flexion in lying)",
  "ex-32": "a person sitting upright on a chair, straightening one leg forward while lifting the head to look up, then bending the knee while tucking the chin (seated nerve glide)",
  "ex-34": "a person hinging at the hips with a flat back and slightly bent knees to lift a small box from the floor, keeping it close to the body",
};

export function hasImagePrompt(id: string): boolean {
  return typeof exerciseImagePrompts[id] === "string";
}
export function fullImagePrompt(id: string): string | null {
  const core = exerciseImagePrompts[id];
  return core ? `${IMAGE_STYLE_PREFIX}${core}${IMAGE_STYLE_SUFFIX}` : null;
}
```

- [ ] **Step 4: Run** — `npx vitest run tests/lib/exercise-image-prompts.test.ts`, `npx tsc --noEmit`, `npm run lint`.

- [ ] **Step 5: Commit**
```bash
git add lib/exercise-image-prompts.ts docs/exercise-image-style.md tests/lib/exercise-image-prompts.test.ts
git commit -m "feat(exercises): image style contract + batch-1 illustration prompts

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Generation + upload scripts

**Files:**
- Create: `scripts/generate-exercise-images.ts`, `scripts/upload-exercise-images.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `fullImagePrompt`, `exerciseImagePrompts` from `@/lib/exercise-image-prompts`; `uploadObject` from `@/lib/firebase-admin`

No unit tests (paid API + live Storage). Verification is manual and documented in each script's header.

- [ ] **Step 1: `.gitignore`** — append `exercise-images-src/`.

- [ ] **Step 2: `scripts/generate-exercise-images.ts`**

Header comment: `npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --only=ex-3,ex-14` (or `--batch=1`). Writes `exercise-images-src/{id}.png`. Uses the Gemini API Imagen endpoint:
```ts
// POST https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=<GEMINI_API_KEY>
// body: { instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: "1:1" } }
// response: { predictions: [{ bytesBase64Encoded }] }
```
Loop the requested ids, `fullImagePrompt(id)`, POST, decode `bytesBase64Encoded`, `writeFileSync(exercise-images-src/${id}.png, buf)`. Log each. On a non-200, print the body and continue.

**BATCH-1 CONSTRAINT:** the first run must be verified — if `imagen-3.0-generate-002:predict` returns 403/404 for this key (Imagen may need a paid tier), STOP and report: the fallback is to switch the endpoint to OpenAI `POST https://api.openai.com/v1/images/generations` (needs an `OPENAI_API_KEY`), or hand the prompts to the owner for manual generation. Do not silently produce nothing.

- [ ] **Step 3: `scripts/upload-exercise-images.ts`**

Header: `npx tsx --env-file=.env.development scripts/upload-exercise-images.ts --only=ex-3,ex-14`. For each id, `readFileSync(exercise-images-src/${id}.png)` → `uploadObject("exercise-images/${id}.png", new Uint8Array(buf), "image/png")`. Log ok/fail per id. Skip ids with no local file.

- [ ] **Step 4: Manual verification (document in the commit body, do not run in CI)**
  1. `npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --only=ex-3` → `exercise-images-src/ex-3.png` exists and looks like a bridge.
  2. `npx tsx --env-file=.env.development scripts/upload-exercise-images.ts --only=ex-3`.
  3. `curl -s -o /dev/null -w "%{http_code} %{content_type}" https://dev.physioonclick.co.uk/exercise-images/ex-3` → `200 image/png` (after Task 1 is deployed).

- [ ] **Step 5: Commit**
```bash
git add scripts/generate-exercise-images.ts scripts/upload-exercise-images.ts .gitignore
git commit -m "chore(exercises): Imagen generation + Storage upload scripts for illustrations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: `lib/exercise-plan-pdf.ts` — pure PDF builder

**Files:**
- Create: `lib/exercise-plan-pdf.ts`, `tests/lib/exercise-plan-pdf.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type ExercisePlanCard = {
    index: number; title: string; imageBytes: Uint8Array | null;
    setup: string | null; steps: string[]; cues: string[];
    safetyLine: string | null; doseText: string; physioNote: string | null;
  };
  export type ExercisePlanPdfInput = {
    patientName: string; physioName: string; sessionDateISO: string | null;
    cards: ExercisePlanCard[];
  };
  export function buildExercisePlanPdf(input: ExercisePlanPdfInput): Promise<Uint8Array>;
  ```
- Consumes: `pdf-lib`; `invoiceIssuer`, `founder` from `@/lib/site-data`; `PRACTICE_PHONE` from `@/lib/structured-data`

- [ ] **Step 1: Write the failing test** — `tests/lib/exercise-plan-pdf.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildExercisePlanPdf, type ExercisePlanCard } from '@/lib/exercise-plan-pdf'

const card = (over: Partial<ExercisePlanCard> = {}): ExercisePlanCard => ({
  index: 1, title: 'Bridge Progression', imageBytes: null,
  setup: 'Lie on your back, knees bent.', steps: ['Tighten your tummy', 'Lift your hips'],
  cues: ['Hips stay level'], safetyLine: 'Stop if pain spreads down your leg.',
  doseText: '2 sets × 10 reps · once a day', physioNote: null, ...over,
})

describe('buildExercisePlanPdf', () => {
  it('returns a non-empty PDF', async () => {
    const bytes = await buildExercisePlanPdf({
      patientName: 'Anish George', physioName: 'Shivaliba Zala',
      sessionDateISO: '2026-09-06T18:00:00.000Z', cards: [card()],
    })
    expect(bytes.byteLength).toBeGreaterThan(1000)
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-')
  })
  it('paginates — 6 full cards produce more than one page', async () => {
    const bytes = await buildExercisePlanPdf({
      patientName: 'X', physioName: 'Y', sessionDateISO: null,
      cards: Array.from({ length: 6 }, (_, i) => card({ index: i + 1 })),
    })
    const { PDFDocument } = await import('pdf-lib')
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBeGreaterThan(1)
  })
  it('tolerates a card with no steps/cues/setup', async () => {
    const bytes = await buildExercisePlanPdf({
      patientName: 'X', physioName: 'Y', sessionDateISO: null,
      cards: [card({ setup: null, steps: [], cues: [], safetyLine: null })],
    })
    expect(bytes.byteLength).toBeGreaterThan(1000)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement** — model on `lib/invoice-pdf.ts`:
  - `PDFDocument.create()`, A4 pages `[595.28, 841.89]`, `embedFont(StandardFonts.Helvetica)` + `HelveticaBold`.
  - Cover band on page 1: navy rect, "PhysioOnClick" bold white, "Your Exercise Plan" large, "For {patientName}", "From your session on {fmtDate(sessionDateISO)} with {physioName}", tagline.
  - A `drawCard(page, y, card)` helper returning the new `y`. Card = light rounded rect (reuse `roundedRectPath` idea from invoice), number badge (sky circle + white bold), title bold, then if `imageBytes` → `page.drawImage(await pdf.embedPng(card.imageBytes), { x, y, width: 120, height: 120 })` in the left gutter (wrap the embed in try/catch — a corrupt PNG must not throw the whole build; on failure treat as no image), text block to the right: setup (italic-ish → just smaller), numbered steps (wrap with a simple word-wrap helper — copy the wrap helper from invoice-pdf if present, else write `wrapText(text, font, size, maxWidth)`), cues prefixed "✓ ", `safetyLine` in a tinted box if present, dose in bold, `physioNote` under it in muted.
  - When `y` drops below the bottom margin, `pdf.addPage(...)` and reset `y`.
  - Footer on every page (loop `pdf.getPages()` at the end like the invoice): rule + `${invoiceIssuer.tradingName} · ${invoiceIssuer.addressLines.join(", ")} · ${PRACTICE_PHONE} · hello@physioonclick.co.uk`, "Small Steps · Big Progress", `Page i of n`.
  - `return pdf.save();`

- [ ] **Step 4: Run** — `npx vitest run tests/lib/exercise-plan-pdf.test.ts`, `npx tsc --noEmit`, `npm run lint`.

- [ ] **Step 5: Commit**
```bash
git add lib/exercise-plan-pdf.ts tests/lib/exercise-plan-pdf.test.ts
git commit -m "feat(plan): pure pdf-lib exercise-plan handout builder

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: `lib/emails/exercise-plan-email.ts`

**Files:**
- Create: `lib/emails/exercise-plan-email.ts`, `tests/lib/exercise-plan-email.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function buildExercisePlanEmailHtml(input: { patientName: string; planUrl: string; exerciseCount: number }): string;
  export function sendExercisePlanEmail(input: {
    to: string; patientName: string; planUrl: string; exerciseCount: number;
    pdf: { filename: string; base64: string };
  }): Promise<{ sent: boolean }>;
  ```
- Consumes: `renderEmailLayout`, `toPlainText` from `@/lib/emails/email-layout`

- [ ] **Step 1: Write the failing test** — `tests/lib/exercise-plan-email.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

import { buildExercisePlanEmailHtml, sendExercisePlanEmail } from '@/lib/emails/exercise-plan-email'

beforeEach(() => { fetchMock.mockReset(); fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) }) })

describe('exercise plan email', () => {
  it('HTML greets the patient and links to the plan', () => {
    const html = buildExercisePlanEmailHtml({ patientName: 'Anish', planUrl: 'https://x/p', exerciseCount: 5 })
    expect(html).toContain('Hi Anish')
    expect(html).toContain('https://x/p')
    expect(html).toContain('5')
  })
  it('sendExercisePlanEmail posts to Resend with the PDF attached', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    await sendExercisePlanEmail({
      to: 'a@b.com', patientName: 'Anish', planUrl: 'https://x/p', exerciseCount: 5,
      pdf: { filename: 'exercise-plan.pdf', base64: 'AAAA' },
    })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.resend.com/emails')
    expect(body.to).toEqual(['a@b.com'])
    expect(body.attachments).toEqual([{ filename: 'exercise-plan.pdf', content: 'AAAA' }])
  })
  it('no-ops without RESEND_API_KEY', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const r = await sendExercisePlanEmail({ to: 'a@b.com', patientName: 'A', planUrl: 'u', exerciseCount: 1, pdf: { filename: 'p.pdf', base64: 'A' } })
    expect(r.sent).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement** — copy the structure of `lib/emails/receipt-email.ts` exactly: `escapeHtml`, `renderEmailLayout` body ("Hi {name}, — here is your exercise plan from your session — {exerciseCount} exercises — button 'Open your plan'"), `toPlainText` version, `fetch("https://api.resend.com/emails", { headers: { Authorization: 'Bearer '+apiKey }, body: JSON.stringify({ from, to:[to], subject: "Your exercise plan from PhysioOnClick", html, text, attachments: [{ filename: input.pdf.filename, content: input.pdf.base64 }] }) })`. `from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>"`. Return `{ sent: res.ok }`; on no key log + `{ sent: false }`.

- [ ] **Step 4: Run** — `npx vitest run tests/lib/exercise-plan-email.test.ts`, `tsc`, `lint`.

- [ ] **Step 5: Commit**
```bash
git add lib/emails/exercise-plan-email.ts tests/lib/exercise-plan-email.test.ts
git commit -m "feat(plan): Resend sender for the exercise-plan email

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: `/api/exercise-plan/generate` orchestration route

**Files:**
- Create: `lib/exercise-plan.ts`, `app/api/exercise-plan/generate/route.ts`, `tests/api/exercise-plan-generate.test.ts`

**Interfaces:**
- Consumes: `getAdminDb`, `uploadObject`, `getAdminAuth` from `@/lib/firebase-admin`; `exercises`, `resolveDosage`, `formatDosage` from `@/lib/exercises`; `buildExercisePlanPdf` (Task 4); `sendExercisePlanEmail` (Task 5); `founder` from `@/lib/site-data`; `exerciseImageUrl` (Task 1)
- Produces:
  ```ts
  // lib/exercise-plan.ts
  export function buildPlanCards(
    assigned: { exerciseId: string; dosage?: import("@/lib/exercises").ExerciseDosage }[],
    imageByExerciseId: Record<string, Uint8Array | null>,
  ): import("@/lib/exercise-plan-pdf").ExercisePlanCard[];
  ```
- `POST /api/exercise-plan/generate` — body `{ summaryId: string, force?: boolean }`, header `x-cron-secret`

- [ ] **Step 1: Write the failing test** — `tests/api/exercise-plan-generate.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const db = { collection: vi.fn() }
const uploadObject = vi.fn().mockResolvedValue({ ok: true })
const sendExercisePlanEmail = vi.fn().mockResolvedValue({ sent: true })
const buildExercisePlanPdf = vi.fn().mockResolvedValue(new Uint8Array([0x25,0x50,0x44,0x46]))

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => db, getAdminAuth: () => null, uploadObject: (...a: unknown[]) => uploadObject(...a),
}))
vi.mock('@/lib/exercise-plan-pdf', () => ({ buildExercisePlanPdf: (...a: unknown[]) => buildExercisePlanPdf(...a) }))
vi.mock('@/lib/emails/exercise-plan-email', () => ({ sendExercisePlanEmail: (...a: unknown[]) => sendExercisePlanEmail(...a) }))
vi.mock('@/lib/exercises', async (o) => ({ ...(await o<typeof import('@/lib/exercises')>()), }))

import { POST } from '@/app/api/exercise-plan/generate/route'

function makeDoc(data: unknown, exists = true) { return { exists, data: () => data, ref: { update: vi.fn().mockResolvedValue(undefined) } } }

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('CRON_SECRET', 'sekret')
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://dev.example')
  // summary -> booking -> assignedExercises
  const summaryDoc = makeDoc({ bookingId: 'b1', patientName: 'Anish', patientId: 'p1' })
  const bookingDoc = makeDoc({ bookedBy: 'u1', patientId: 'p1', email: 'a@b.com', sessionDate: { toDate: () => new Date('2026-09-06') } })
  db.collection.mockImplementation((name: string) => ({
    doc: (id: string) => ({
      get: async () => (name === 'sessionSummaries' ? summaryDoc : bookingDoc),
      collection: () => ({ get: async () => ({ docs: [{ id: 'ex-3', data: () => ({ active: true }) }] }) }),
    }),
  }))
})

function req(body: unknown, secret = 'sekret') {
  return new Request('http://localhost/api/exercise-plan/generate', {
    method: 'POST', headers: { 'x-cron-secret': secret, 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

describe('POST /api/exercise-plan/generate', () => {
  it('401 without the cron secret', async () => {
    const res = await POST(req({ summaryId: 's1' }, 'wrong'))
    expect(res.status).toBe(401)
  })
  it('builds, uploads, emails and stamps on the happy path', async () => {
    const res = await POST(req({ summaryId: 's1' }))
    expect(res.status).toBe(200)
    expect(buildExercisePlanPdf).toHaveBeenCalledOnce()
    expect(uploadObject).toHaveBeenCalledWith('exercise-plans/s1.pdf', expect.any(Uint8Array), 'application/pdf')
    expect(sendExercisePlanEmail).toHaveBeenCalledOnce()
  })
  it('skips a summary already emailed unless force', async () => {
    const summaryDoc = makeDoc({ bookingId: 'b1', patientName: 'A', patientId: 'p1', planEmailedAt: 'yes' })
    db.collection.mockImplementation((name: string) => ({ doc: () => ({
      get: async () => (name === 'sessionSummaries' ? summaryDoc : makeDoc({ bookedBy: 'u1', patientId: 'p1', email: 'a@b.com' })),
      collection: () => ({ get: async () => ({ docs: [] }) }),
    }) }))
    const res = await POST(req({ summaryId: 's1' }))
    expect(res.status).toBe(200)
    expect(sendExercisePlanEmail).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

`lib/exercise-plan.ts` — `buildPlanCards`: map each assigned exercise to an `ExercisePlanCard` — look up the catalogue entry by id (`exercises.find`), `index` 1-based, `setup: ex.setup ?? ex.description ?? null`, `steps: ex.steps ?? []`, `cues: (ex.cues ?? []).slice(0, 3)`, `safetyLine`: the first `ex.mistakes` entry that starts with "Stop" or contains "physio", else null, `doseText: formatDosage(resolveDosage(ex, a))`, `physioNote: a.dosage?.notes ?? ex.defaultDosage?.notes ?? null`, `imageBytes: imageByExerciseId[id] ?? null`. Skip ids not in the catalogue.

`app/api/exercise-plan/generate/route.ts`:
```ts
export async function POST(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("x-cron-secret") !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { summaryId, force } = (await request.json()) as { summaryId?: string; force?: boolean };
  if (!summaryId) return NextResponse.json({ error: "Missing summaryId" }, { status: 400 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "unavailable" }, { status: 500 });

  const summarySnap = await db.collection("sessionSummaries").doc(summaryId).get();
  if (!summarySnap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const summary = summarySnap.data() as { bookingId: string; patientName?: string; patientId?: string; planEmailedAt?: unknown };
  if (summary.planEmailedAt && !force) return NextResponse.json({ ok: true, skipped: "already-emailed" });

  try {
    const bookingSnap = await db.collection("bookings").doc(summary.bookingId).get();
    if (!bookingSnap.exists) return NextResponse.json({ ok: true, skipped: "no-booking" });
    const booking = bookingSnap.data() as { bookedBy?: string; patientId?: string; email?: string; sessionDate?: { toDate(): Date } };
    const personId = summary.patientId ?? booking.patientId ?? booking.bookedBy;
    if (!booking.bookedBy || !personId || !booking.email) return NextResponse.json({ ok: true, skipped: "incomplete" });

    const assignedSnap = await db.collection("patients").doc(booking.bookedBy)
      .collection("people").doc(personId).collection("assignedExercises").get();
    const assigned = assignedSnap.docs
      .map((d) => ({ exerciseId: d.id, ...(d.data() as { active?: boolean; dosage?: ExerciseDosage }) }))
      .filter((a) => a.active !== false);
    if (assigned.length === 0) return NextResponse.json({ ok: true, skipped: "no-exercises" });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const imageByExerciseId: Record<string, Uint8Array | null> = {};
    await Promise.all(assigned.map(async (a) => {
      try {
        const r = await fetch(`${siteUrl}${exerciseImageUrl(a.exerciseId)}`);
        imageByExerciseId[a.exerciseId] = r.ok && r.headers.get("content-type") === "image/png"
          ? new Uint8Array(await r.arrayBuffer()) : null;
      } catch { imageByExerciseId[a.exerciseId] = null; }
    }));

    const cards = buildPlanCards(assigned, imageByExerciseId);
    const pdf = await buildExercisePlanPdf({
      patientName: summary.patientName ?? "",
      physioName: founder.name,
      sessionDateISO: booking.sessionDate?.toDate ? booking.sessionDate.toDate().toISOString() : null,
      cards,
    });
    await uploadObject(`exercise-plans/${summaryId}.pdf`, pdf, "application/pdf");

    // base64 without Buffer (Workers-safe)
    let bin = ""; pdf.forEach((b) => (bin += String.fromCharCode(b)));
    const base64 = btoa(bin);

    await sendExercisePlanEmail({
      to: booking.email, patientName: summary.patientName ?? "",
      planUrl: `${siteUrl}/patient/exercises`, exerciseCount: cards.length,
      pdf: { filename: "exercise-plan.pdf", base64 },
    });
    await summarySnap.ref.update({ planEmailedAt: FieldValue.serverTimestamp(), planPdfPath: `exercise-plans/${summaryId}.pdf` });
    return NextResponse.json({ ok: true, exercises: cards.length });
  } catch (err) {
    console.error("exercise-plan/generate failed", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
```
Imports: `NextResponse`, `getAdminDb`, `uploadObject`, `FieldValue` from `@/lib/firebase-admin`, `founder` from `@/lib/site-data`, `type ExerciseDosage` from `@/lib/exercises`, `exerciseImageUrl`, `buildPlanCards`, `buildExercisePlanPdf`, `sendExercisePlanEmail`.

*(The `btoa`/`String.fromCharCode` loop is fine for ≤ a few-hundred-KB PDF; if plans get large, chunk it. Note in the commit.)*

- [ ] **Step 4: Run** — `npx vitest run tests/api/exercise-plan-generate.test.ts`, `tsc`, `lint`.

- [ ] **Step 5: Commit**
```bash
git add lib/exercise-plan.ts app/api/exercise-plan/generate tests/api/exercise-plan-generate.test.ts
git commit -m "feat(plan): summary-publish handler that builds, stores and emails the plan PDF

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Patient download route + button

**Files:**
- Create: `app/api/exercise-plan/[summaryId]/pdf/route.ts`, `components/patient-exercise-plan-button.tsx`
- Modify: `app/patient/exercises/page.tsx`
- Test: `tests/api/exercise-plan-pdf-download.test.ts` (new)

**Interfaces:**
- `GET /api/exercise-plan/{summaryId}/pdf` — `Authorization: Bearer <idToken>`; 200 `application/pdf` or 401/403/404
- Consumes: `getAdminAuth`, `getAdminDb`, `downloadObject` from `@/lib/firebase-admin`

- [ ] **Step 1: Write the failing test** — mocked shim: 401 without a token; 403 when `verifyIdToken().uid !== booking.bookedBy` and not admin; 200 with bytes when authorised and `downloadObject` returns bytes; 404 when `downloadObject` returns null.

```ts
// key assertions
it('401 without a bearer token', async () => expect((await GET(bareReq(), ctx('s1'))).status).toBe(401))
it('403 for a different user', async () => { verifyIdToken.mockResolvedValue({ uid: 'other' }); expect((await GET(authReq(), ctx('s1'))).status).toBe(403) })
it('streams the stored PDF for the owner', async () => {
  verifyIdToken.mockResolvedValue({ uid: 'u1' }); downloadObject.mockResolvedValue(new Uint8Array([0x25,0x50,0x44,0x46]))
  const res = await GET(authReq(), ctx('s1'))
  expect(res.status).toBe(200); expect(res.headers.get('content-type')).toBe('application/pdf')
})
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**
```ts
export async function GET(request: Request, { params }: { params: Promise<{ summaryId: string }> }) {
  const { summaryId } = await params;
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const auth = getAdminAuth(); const db = getAdminDb();
  if (!token || !auth || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let uid: string; let email = "";
  try { const d = await auth.verifyIdToken(token); uid = d.uid; email = d.email ?? ""; }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const summarySnap = await db.collection("sessionSummaries").doc(summaryId).get();
  if (!summarySnap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const bookingId = (summarySnap.data() as { bookingId: string }).bookingId;
  const bookingSnap = await db.collection("bookings").doc(bookingId).get();
  const bookedBy = bookingSnap.exists ? (bookingSnap.data() as { bookedBy?: string }).bookedBy : undefined;
  const isAdmin = email === (process.env.ADMIN_EMAIL ?? "hello@physioonclick.co.uk");
  if (uid !== bookedBy && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const bytes = await downloadObject(`exercise-plans/${summaryId}.pdf`);
  if (!bytes) return NextResponse.json({ error: "not found" }, { status: 404 });
  return new NextResponse(bytes as BodyInit, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="exercise-plan.pdf"` },
  });
}
```

`components/patient-exercise-plan-button.tsx` — `"use client"`; given a `summaryId`, a button that `fetch`es the route with the Firebase `idToken`, turns the blob into an object URL, opens it in a new tab. Hidden when no `summaryId`.

`app/patient/exercises/page.tsx` — after resolving `personId`, look up the most recent `sessionSummaries` for that patient (a small `getMostRecentSummaryId(uid, personId)` in `lib/session-summaries.ts`, or reuse `getPatientBookings` + `getSessionSummary`); render `<PatientExercisePlanButton summaryId={...} />` in the header area near the `PersonSwitcher`. If that lookup is non-trivial, render the button only when a summary id is passed down and defer the lookup — keep this task small; a follow-up can wire the newest-summary lookup.

- [ ] **Step 4: Run** — new test + `tsc` + `lint`.

- [ ] **Step 5: Commit**
```bash
git add app/api/exercise-plan components/patient-exercise-plan-button.tsx app/patient/exercises/page.tsx tests/api/exercise-plan-pdf-download.test.ts
git commit -m "feat(plan): patient download route + 'Download my plan' button

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Cloud Function trigger + admin resend

**Files:**
- Modify: `functions/src/index.ts`, `components/summary-form.tsx`

**Interfaces:**
- Consumes: existing `SITE_URL` / `CRON_SECRET` reads in `functions/src/index.ts`; `POST /api/exercise-plan/generate` (Task 6)

- [ ] **Step 1: `functions/src/index.ts` — extend `onSummaryPublished`**

Currently it `return`s early when there is no `fcmToken`. Restructure so the plan email fires regardless:
```ts
export const onSummaryPublished = onDocumentCreated("sessionSummaries/{summaryId}", async (event) => {
  const summary = event.data?.data();
  if (!summary) return;
  const db = getFirestore();
  const bookingSnap = await db.doc(`bookings/${summary.bookingId}`).get();
  if (!bookingSnap.exists) return;
  const booking = bookingSnap.data()!;

  // 1. push (unchanged, now guarded so a missing token doesn't skip step 2)
  try {
    const userSnap = await db.doc(`users/${booking.bookedBy}`).get();
    const fcmToken: string | undefined = userSnap.data()?.fcmToken;
    if (fcmToken) {
      const date = /* unchanged */;
      await getMessaging().send({ /* unchanged */ });
      await event.data!.ref.update({ notificationSent: FieldValue.serverTimestamp() });
    }
  } catch (err) { console.error("onSummaryPublished: push failed", err); }

  // 2. exercise-plan PDF + email
  try {
    const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
    const CRON_SECRET = process.env.CRON_SECRET;
    if (SITE_URL && CRON_SECRET) {
      await fetch(`${SITE_URL}/api/exercise-plan/generate`, {
        method: "POST",
        headers: { "x-cron-secret": CRON_SECRET, "content-type": "application/json" },
        body: JSON.stringify({ summaryId: event.params.summaryId }),
      });
    }
  } catch (err) { console.error("onSummaryPublished: plan generate failed", err); }
});
```
Match how `SITE_URL`/`CRON_SECRET` are already referenced elsewhere in this file (copy that exact env access). `fetch` is global in the Functions Node 20 runtime.

- [ ] **Step 2: `components/summary-form.tsx` — "Resend plan email"**

After a summary is published (`publishedSummaryId` in scope, or fetch it), show a secondary button that calls a tiny server action or `fetch('/api/exercise-plan/generate', { headers: { 'x-cron-secret': ... } })` — **but the client must not hold `CRON_SECRET`**. So add a thin authenticated admin route `POST /api/admin/exercise-plan/resend` (Bearer idToken, `isAdmin` check) that server-side calls the generate route with `force: true` and the secret from env. Wire the button to that. (If this balloons, split it into Task 9 — but it is small: ~30 lines route + a button.)

- [ ] **Step 3: Verify** — `functions/` has no test suite; `cd functions && npx tsc --noEmit`. Web: `npx vitest run` for any touched web test, `tsc`, `lint`.

- [ ] **Step 4: Commit**
```bash
git add functions/src/index.ts components/summary-form.tsx app/api/admin/exercise-plan
git commit -m "feat(plan): fire plan generation on summary publish + admin resend

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Wrap-up

- [ ] `npm run test:run` — only the pre-existing `booking-flow`/`toast-provider` failures.
- [ ] `npm run lint`, `npx tsc --noEmit` (root) and `cd functions && npx tsc --noEmit`.
- [ ] `npm run deploy:dev`, then `firebase deploy --only functions` (needs Java 21 / firebase login — if the agent can't, hand the exact command to the owner).
- [ ] Manual on dev: run Task 3's generate+upload for `ex-3`; confirm `https://dev.physioonclick.co.uk/exercise-images/ex-3` is a PNG; assign `ex-3` to the George test dependent, publish a session summary, confirm the plan PDF email arrives at `seena.rachelgeorge@gmail.com` and `/patient/exercises` shows the illustration + "Download my plan".
- [ ] Fold "author image prompts for this batch's ids" into every remaining Plan 2 batch brief; run generate+upload+review per batch.

## Self-Review

- **Spec coverage:** §1 image pipeline → Tasks 1 (serve+card), 2 (prompts+style), 3 (scripts). §2 PDF → Task 4. §3 trigger/delivery → Task 6 (generate route), Task 7 (patient download), Task 8 (Function + admin resend). §4 website card → Task 1. §5 data/rules → Task 1 (storage.rules), Task 6 (`planEmailedAt`/`planPdfPath` via shim, no rules change). §6 sequencing → Wrap-up + batch-brief note. Testing → each task + Wrap-up.
- **Placeholders:** none — every code step has real code; the two "if this balloons, split" notes (Task 7 newest-summary lookup, Task 8 resend route) name the concrete fallback.
- **Type consistency:** `ExercisePlanCard` / `ExercisePlanPdfInput` defined once (Task 4), consumed by Tasks 6 & 7. `buildPlanCards` signature (Task 6) returns `ExercisePlanCard[]`. `exerciseImageUrl` (Task 1) used by Tasks 1, 6. `x-cron-secret` header consistent across Tasks 6 & 8. `sendExercisePlanEmail` signature (Task 5) matches the Task 6 call.
