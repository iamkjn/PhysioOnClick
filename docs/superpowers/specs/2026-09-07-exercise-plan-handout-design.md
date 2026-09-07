# Exercise Plan Handout — Auto-Emailed Visual Plan on Summary Publish

**Date:** 2026-09-07
**Consumes:** the exercise content from `2026-09-06-exercise-content-overhaul-design.md` (Plan 1 shipped; Plan 2 write-ups in progress — batch 1 done). Handout works with `description` + `defaultDosage` for un-written exercises and gets richer as Plan 2 lands.

## Problem

When a physio publishes a session summary, the patient gets an FCM push saying "summary ready" and the summary body literally reads *"See the exercises assigned to you in the app."* There is no take-away: no printable/emailed exercise sheet with pictures, steps and doses — the thing every physio practice hands a patient after a session. The owner supplied a target: a branded one-page poster ("Ankle & Foot Exercises for Lateral Midfoot Pain") with photo-style images, plain-language bullet steps and doses per exercise.

## Goal

On summary publish, auto-generate a **branded multi-page PDF exercise plan** for the patient's assigned exercises (illustration + setup + steps + form cues + dose per exercise) and **email it** via Resend, and show the same illustrations on the website exercise card. Illustrations are an **AI-generated flat-illustration set** (Imagen via the existing Gemini key), clinically reviewed by Shivaliba.

## Non-goals

- Real photos / a photoshoot / a licensed image library (rejected — AI illustration set chosen).
- A single tall poster PNG (rejected — multi-page PDF scales to any plan size).
- Per-exercise video (still deferred — separate track).
- Mobile app changes (web + email first; the Flutter card can adopt the image URLs later).
- Editing which exercises are in the plan from the handout — the plan mirrors the assigned-exercises list the physio already curates.

## Design

### 1. Image pipeline

**Style spec** — `docs/exercise-image-style.md` (the brand contract for every image):
- Flat 2-D vector-style illustration, **single figure**, shown mid-movement; a **2-panel pair** only where the exercise is a range (ankle pumps, inversion/eversion).
- A **sky-blue motion arrow** showing the direction of movement.
- Palette: navy ink `#14213D` / `#1B2A4A`, sky accent `#0EA5E9`, warm-paper ground `#FBF7F0`. No other colours beyond skin/clothing neutrals.
- **No face detail, no text baked into the image.** Neutral clothing (leggings + top).
- Consistent camera angle and figure scale **per body region** (all lumbar images from the same 3/4 side view, etc.).
- Props only when used: chair, wall, resistance band, low step, exercise mat.
- Output: square, ~768px, PNG, transparent or paper-coloured background.

**Prompts** — `lib/exercise-image-prompts.ts`:
```ts
export const IMAGE_STYLE_PREFIX = "Flat 2D vector illustration, single figure, …palette…";
export const IMAGE_STYLE_SUFFIX = "…motion arrow in sky blue, no text, no face detail, warm paper background";
export const exerciseImagePrompts: Record<string, string> = {
  "ex-3": "a person lying on their back on a mat, knees bent, hips lifted into a bridge, straight line from shoulders to knees, upward arrow at the hips",
  // …one per exercise, authored in batches matching Plan 2
};
export function fullImagePrompt(id: string): string | null; // prefix + entry + suffix, or null
```
I author these; batch 1 = the 13 lumbar exercises (`ex-3, 14, 15, 17, 18, 24, 25, 26, 27, 28, 31, 32, 34`).

**Generation** — `scripts/generate-exercise-images.ts`:
- `npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --batch=1` (or `--only=ex-3,ex-14`).
- Calls the Gemini API Imagen endpoint with `fullImagePrompt(id)`, writes `exercise-images-src/{id}.png` (gitignored working dir).
- Rerun for rejects with a tweaked prompt.

**Clinical review** — generated PNGs collected into `docs/exercise-images-review/NN-<region>.md` (thumbnails + id + prompt + `- [ ] Accurate`). Shivaliba checks joint angle, correct limb, arrow direction. Rejects get re-prompted before upload.

**Upload** — `scripts/upload-exercise-images.ts` pushes approved PNGs to Firebase Storage `exercise-images/{id}.png` via `uploadObject` (public read — `storage.rules` allows it, same class as blog images).

**Serving** — `app/exercise-images/[id]/route.ts` (mirrors `app/blog-images/[slug]/route.ts`):
- Unknown exercise id → 404.
- Known id, `downloadObject("exercise-images/{id}.png")` hit → serve bytes, `Content-Type: image/png`, `Cache-Control: public, max-age=31536000, immutable`.
- Known id, miss (image not generated yet) → serve a small generic "exercise" placeholder SVG (`Content-Type: image/svg+xml`, short cache) so an `<img>` never shows a broken icon. The website card additionally swaps to the full `<ExerciseFigure>` via `onError` (see §4); the PDF caller treats a non-PNG response as "no image" (§3 step 2).
- Helper `exerciseImageUrl(id)` = `/exercise-images/{id}` — used by the card and the PDF fetch.

**No new `Exercise` field** — the image is resolved by id.

### 2. Handout PDF — `lib/exercise-plan-pdf.ts` (pdf-lib, Workers-safe, mirrors `lib/invoice-pdf.ts`)

```ts
export type ExercisePlanCard = {
  index: number;          // 1-based
  title: string;
  imageBytes: Uint8Array | null;
  setup: string | null;   // description if no setup yet
  steps: string[];        // [] if none
  cues: string[];
  safetyLine: string | null;  // the one "stop and message your physio if…" line, if present
  doseText: string;       // formatDosage(resolveDosage(...))
  physioNote: string | null;  // per-patient dosage.notes
};
export type ExercisePlanPdfInput = {
  patientName: string;
  physioName: string;      // founder.name
  sessionDateISO: string | null;
  cards: ExercisePlanCard[];
};
export async function buildExercisePlanPdf(input: ExercisePlanPdfInput): Promise<Uint8Array>;
```

Layout:
- **Cover band** (navy, full width): "P" logo mark + "PhysioOnClick" wordmark, "Your Exercise Plan", "For {patientName}", "From your session on {date} with {physioName}", tagline "Move Better · Live Brighter".
- **Cards**, 1 per row (full width) — a 2-column card grid gets cramped once steps are present; the poster's 3×2 assumes ~4-line bullets. Number badge, title, embedded PNG (left, ~45mm) or text-only if `imageBytes` is null, then: *Get set up* line, numbered *steps*, compact *Good form* cues, the *safety line* in a tinted box if present, **dose in bold**. `physioNote` under the dose.
- **Footer band** on every page: `invoiceIssuer` address + `PRACTICE_PHONE` + `hello@physioonclick.co.uk`, "Small Steps · Big Progress", page N of M.
- Images embedded via `pdfDoc.embedPng(bytes)`. Input `imageBytes` are pre-fetched by the caller (route) from `exerciseImageUrl(id)` so the pure builder does no I/O.

**Risk:** a 15-exercise plan embeds 15 PNGs in one Workers request. Mitigation: images capped ~768px/~100KB; if CPU/response limits bite, the route caps the plan at the N most-recent exercises and notes "full plan in the app", or the generation moves to a queued job. Flag for load-check at implementation.

### 3. Trigger + delivery

Follows the existing **Function → Next API route** pattern (`sendAssessmentReminders` → `/api/assessment/reminder-email`).

**`POST /api/exercise-plan/generate`** (Next route, Workers) — guarded by `CRON_SECRET` (Bearer), body `{ summaryId }`:
1. Load `sessionSummaries/{summaryId}` → `bookingId` → `bookings/{bookingId}` (`bookedBy`, `patientId`, `patientName`, `email`, `sessionDate`).
2. `getAssignedExercises(bookedBy, patientId)` (admin-side read via the shim), resolve each dose, fetch each `exerciseImageUrl(id)` — keep the bytes only when the response `Content-Type` is `image/png`, else `imageBytes: null` — build `ExercisePlanCard[]`.
3. `buildExercisePlanPdf(...)`.
4. `uploadObject("exercise-plans/{summaryId}.pdf", bytes, "application/pdf")`.
5. Resend email — new `lib/emails/exercise-plan-email.ts` (uses `renderEmailLayout`): subject "Your exercise plan from PhysioOnClick", short body, **PDF as a base64 attachment**, an "open your plan in the app" magic-link to `/patient/exercises`.
6. `sessionSummaries/{summaryId}.update({ planEmailedAt: serverTimestamp(), planPdfPath })`.
- Every step best-effort; a failure logs and returns 200 so the Function doesn't retry-storm. Idempotent on `planEmailedAt`.

**`onSummaryPublished`** (Cloud Function, `functions/src/index.ts`) — after the existing push block (and regardless of whether an `fcmToken` exists — currently it `return`s early with no token; move the push into its own guarded block so the plan email still fires):
```ts
await fetch(`${SITE_URL}/api/exercise-plan/generate`, {
  method: "POST",
  headers: { authorization: `Bearer ${CRON_SECRET}`, "content-type": "application/json" },
  body: JSON.stringify({ summaryId: event.params.summaryId }),
});
```
`SITE_URL` + `CRON_SECRET` already read by `sendAssessmentReminders` in the same file.

**Patient download** — `GET /api/exercise-plan/[summaryId]/pdf` (auth: signed-in user whose `uid == booking.bookedBy`, or admin) → `downloadObject("exercise-plans/{summaryId}.pdf")`, or 404 → regenerate inline. A **"Download my plan (PDF)"** button on `/patient/exercises` linking to the most recent summary's PDF.

**Admin** — `SummaryForm` / patient detail: **"Preview plan"** (opens the PDF) and **"Resend plan email"** (re-POSTs `/api/exercise-plan/generate` with a `force` flag that bypasses the `planEmailedAt` idempotency).

### 4. Website exercise card

`components/assigned-exercises.tsx`: a small `<ExerciseImage id name pose>` component renders `<img src={exerciseImageUrl(id)} alt="">`; on `onError` (or the placeholder-SVG response) it swaps to the existing `<ExerciseFigure name pose>`. So exercises with a generated PNG show the illustration; the rest keep today's stick figure, with no per-exercise wiring.

### 5. Data / config / rules

- `sessionSummaries`: `+ planEmailedAt?: Timestamp`, `+ planPdfPath?: string`. **No `firestore.rules` change** — that write comes from `/api/exercise-plan/generate` via the admin shim (rules bypassed), the client never writes these, and `validSummary` has no `hasOnly` (extra fields are already permitted).
- `storage.rules`: `exercise-images/**` public read, admin write (like blog images); `exercise-plans/**` — deny client access (served only through the auth-checked route, same trust model as `invoices/**`).
- Env: **none new** — `GEMINI_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL` all already set. Deploying the Function change needs `firebase deploy --only functions`.

### 6. Sequencing

Build §1–§4 now against batch 1's 13 lumbar exercises:
1. Style doc + prompt file (batch 1) + generation script + upload script + serving route.
2. `buildExercisePlanPdf` + a golden-ish test.
3. `/api/exercise-plan/generate` + email builder + the Function fetch + patient download route + buttons.
4. Website card image swap.
Then images + plan richness track Plan 2 batch-by-batch (each Plan 2 batch's brief gains "also add the image prompts for these ids").

## Testing

- `buildExercisePlanPdf` — unit: given 2 cards (one with image bytes, one without) returns a non-empty `Uint8Array` starting `%PDF`, with the expected page count; the pure builder does no network.
- `fullImagePrompt` / prompt file — shape test: every non-retired exercise that has `steps` also has a prompt entry; every prompt contains no stray newlines and the id resolves.
- `exercise-plan-email` — snapshot the rendered HTML + text.
- `/api/exercise-plan/generate` — route test with mocked shim + Resend `fetch`: 401 without `CRON_SECRET`; happy path stamps `planEmailedAt` and calls Resend once with an attachment; second call without `force` is a no-op.
- `exercise-images/[id]` route — returns the stored bytes when present; falls back (302 or SVG) on miss; never 404s a real id.
- Generation + upload scripts — manual (paid API / live Storage).

## Follow-up (not this spec)

- Mobile card adopts `exerciseImageUrl`.
- A print-friendly `/patient/exercises/plan` web poster view.
- Re-generate the plan PDF when the physio edits doses after publish (currently only regenerates on "Resend").
