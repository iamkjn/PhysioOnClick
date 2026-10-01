# Analytics tracking registry

This is the map of every Firebase Analytics / GA4 event fired anywhere in the
app, organized by screen (`app/**/page.tsx`). It is **not** related to Google
Search Console or organic-search rankings — this is user-behavior analytics
(navigation, clicks, conversions), visible in the Firebase / GA4 console. It
has zero effect on SEO.

All events go through `lib/analytics.ts`'s `track()` (or the typed
`trackLibraryEvent()` wrapper). Every call is consent-gated: nothing is sent
until the visitor has granted cookie consent (`poc-cookie-consent === "granted"`
in `localStorage`, the UK PECR gate — see `components/cookie-consent.tsx`), and
the wrapper is SSR-safe and fire-and-forget (it never throws).

## Why this file won't silently go stale

A markdown file nobody is forced to touch rots the moment someone adds,
renames, or deletes a page. There is no filesystem watcher that keeps a
document like this honest on its own — so instead this repo has
`tests/app/analytics-tracking-registry.test.ts`, a structural Vitest test
that:

1. Globs every `page.tsx` file under `app/` (recursively) at test time — the
   same way this file's list was produced: `find app -name "page.tsx" | sort`.
2. Parses this file for every real page path mentioned in backticks below
   (e.g. `app/exercises/area/[bodyArea]/page.tsx`).
3. Fails the suite if a real `page.tsx` has no entry here, or if an entry here
   points at a `page.tsx` that no longer exists.

`npm run test:run` already runs before every commit in this project's normal
workflow, so adding, removing, or moving a page fails CI until this file is
updated to match. That is the realistic, durable version of "keeps itself up
to date" for a static document — **do not delete that test as an annoyance;
it is the entire mechanism that keeps this file trustworthy.** The test only
checks that a page has *an* entry, not that the entry's event list is still
accurate — keeping the event list itself correct when you add/remove a
`track()` call is still on the person making that change.

## Sitewide events (not repeated per page below)

Two events fire from components mounted once in the root layout
(`app/layout.tsx`) and so can in principle fire from *any* page, in addition
to whatever is listed for that page below:

- **`page_view`** — fired automatically on every App Router navigation by
  `components/analytics-tracker.tsx` (`AnalyticsTracker`, mounted in
  `app/layout.tsx`). Params: `page_path`, `page_location`, `page_title`. This
  is the baseline "did anyone visit this screen" signal and is listed
  explicitly for every page below since it is the one event guaranteed to
  fire everywhere.
- **`book_now_click`** with `{ source: "header" }` — the header's own "Book
  Now" button (`components/site-header.tsx`), present in the primary nav on
  every route via the root layout.
- **`chat_open`** with `{ source: "widget" }` — opening the floating chat
  widget (`components/chat-widget.tsx`), also mounted in the root layout.

Below, "custom events" means events beyond these three sitewide ones.

## Public marketing

| Page | Events |
|---|---|
| `app/page.tsx` | `page_view`. Hero CTA: `book_now_click` `{ source: "homepage_hero" }` (`components/home-hero-section.tsx`, signed-out hero only). Signed-in visitors instead render `HomeDashboard`, which pulls in the exercise events below. |
| `app/about/page.tsx` | `page_view` only. |
| `app/services/page.tsx` | `page_view`. Per-service card CTA: `service_book_click` `{ service_slug, source: "service_card" }` (`components/tracked-book-link.tsx`, one per listed service). Bottom CTA band: `service_book_click` `{ service_slug: "cta_band", source: "services_cta_band" }` **and** `book_now_click` `{ source: "service_list" }` (same click, two events — see `extraEvent` on `TrackedBookLink`). |
| `app/services/[slug]/page.tsx` | `page_view`. Primary CTA: `service_book_click` `{ service_slug, source: "service_detail_page" }`. Bottom CTA band: `service_book_click` `{ service_slug: "cta_band", source: "service_detail_cta_band" }` **and** `book_now_click` `{ source: "service_detail" }` (same click). |
| `app/pricing/page.tsx` | `page_view`. Bottom CTA band: `book_now_click` `{ source: "pricing_page" }`. (Per-plan "Book Now"/"Get Started" cards are plain `/book?service=` links, not separately tracked — see "Confirmed gap on public marketing pages" note in the project brief; only the one primary CTA is instrumented here.) |
| `app/glasgow-physiotherapist/page.tsx` | `page_view`. Hero CTA: `book_now_click` `{ source: "glasgow_page" }`. |
| `app/how-online-physiotherapy-works/page.tsx` | `page_view`. Bottom CTA band: `book_now_click` `{ source: "how_it_works_page" }`. |
| `app/contact/page.tsx` | `page_view`. "Book an appointment" CTA: `book_now_click` `{ source: "contact_page" }`. The contact form itself (`components/contact-form.tsx`) is not separately tracked. |
| `app/search/page.tsx` | `page_view` only. |
| `app/medical-disclaimer/page.tsx` | `page_view` only. |
| `app/privacy-policy/page.tsx` | `page_view` only. |
| `app/professional-standards/page.tsx` | `page_view` only. |
| `app/cancellation-policy/page.tsx` | `page_view` only. |
| `app/terms/page.tsx` | `page_view` only. |

## Blog

| Page | Events |
|---|---|
| `app/blog/page.tsx` | `page_view` only (index/listing). |
| `app/blog/[slug]/page.tsx` | `page_view`. `blog_read_complete` `{ slug }` (`components/blog-detail-actions.tsx`, fires once the reader reaches the end of the article). |
| `app/guides/page.tsx` | `page_view` only (index/listing). |
| `app/guides/[slug]/page.tsx` | `page_view`. CTA band: `service_book_click` `{ service_slug: "initial-assessment", source: "guide-cta-band" }` **and** `book_now_click` `{ source: "guide-cta-band" }` (same click). |
| `app/online-physiotherapy-for/[slug]/page.tsx` | `page_view`. Primary and CTA-band booking links: `service_book_click` `{ service_slug: "initial-assessment", source: "online-physio-landing" \| "online-physio-cta-band", slug }` **and** `book_now_click` `{ source }` (same click). |

## Exercise library

All `library_*` events go through the typed `trackLibraryEvent()` wrapper
(`lib/analytics.ts`), each with a single `slug` param.

| Page | Events |
|---|---|
| `app/exercises/page.tsx` | `page_view`. `library_hub_view` `{ slug: "exercises" }` on mount (`<TrackView>`, the library's own top-level index — reuses the same event condition-hub pages use, distinguished by the constant slug `"exercises"`). |
| `app/exercises/[slug]/page.tsx` | `page_view`. `library_exercise_view` `{ slug: exercise.slug }` on mount. `library_add_to_plan` `{ slug: exerciseSlug }` from `components/exercise-library/add-to-plan-button.tsx`. |
| `app/exercises/area/[bodyArea]/page.tsx` | `page_view`. `library_area_view` `{ slug: area.key }` on mount (new event — body-area filter pages are a distinct page type from a condition hub or the top-level index). |
| `app/exercises/for/[condition]/page.tsx` | `page_view`. `library_hub_view` `{ slug: condition.slug }` on mount. `library_pdf_request` `{ slug: conditionSlug }` from `components/exercise-library/condition-pdf-form.tsx`. |
| `app/exercises/how-we-make-this/page.tsx` | `page_view` only. |
| `app/exercises/tests/page.tsx` | `page_view`. `library_selftest_view` `{ slug: "self-test-index" }` on mount (reuses the self-check detail page's event, distinguished by the constant slug `"self-test-index"` vs a real test slug). |
| `app/exercises/tests/[slug]/page.tsx` | `page_view`. `library_selftest_view` `{ slug: test.slug }` on mount. `library_selftest_cta_click` `{ slug: test.slug }` from the in-page CTA (`TrackedBookLink` with an `event` override). |

## Booking flow

| Page | Events |
|---|---|
| `app/book/page.tsx` | `page_view`. `booking_step_service_done` `{ service_id, focus_areas }` and `booking_confirmed` `{ service_id, for_dependent }` from `components/booking-flow.tsx`, the custom 3-step service → time → confirmation flow. |
| `app/book/success/page.tsx` | `page_view` only (post-payment landing page). |
| `app/book/receipt/[session]/page.tsx` | `page_view` only (printable receipt, reachable by the unguessable Stripe session id). |
| `app/auth/verify/page.tsx` | `page_view`. `login` `{ method: "magic_link", role: "patient" }` on successful magic-link verification — the passwordless sign-in used both standalone and to link guest bookings to an account. |

## Patient portal

| Page | Events |
|---|---|
| `app/patient/page.tsx` | `page_view`. Signed-out: `sign_up` `{ method: "password" }`, `login` `{ method: "password", role: "admin" \| "patient" }`, `login` `{ method: "google", role: "patient" }`, `magic_link_requested` — all from `components/auth-panel.tsx` (via `components/patient-home.tsx`). Signed-in: renders `HomeDashboard`, which pulls in `exercise_video_play` / `exercises_marked_all_done` below. |
| `app/patient/account/page.tsx` | `page_view` only. |
| `app/patient/appointments/page.tsx` | `page_view` only. |
| `app/patient/appointments/[id]/page.tsx` | `page_view` only. |
| `app/patient/assessment/page.tsx` | `page_view` only. |
| `app/patient/exercises/page.tsx` | `page_view`. `exercise_video_play` `{ exercise_id }` and `exercises_marked_all_done` `{ count }` from `components/assigned-exercises.tsx` (also embeds `components/patient-self-tests.tsx`, not separately tracked). |
| `app/patient/invoices/page.tsx` | `page_view` only. |
| `app/patient/notifications/page.tsx` | `page_view` only. |
| `app/patient/people/page.tsx` | `page_view` only (dependents management). |
| `app/patient/recovery/page.tsx` | `page_view`. `exercise_video_play` / `exercises_marked_all_done` (`components/assigned-exercises.tsx`). `components/download-report-button.tsx` on this page is not separately tracked. |

## Admin

| Page | Events |
|---|---|
| `app/admin/page.tsx` | `page_view`. `appointment_cancel` `{ source: "admin" }` and `appointment_reschedule` `{ source: "admin" }` from `components/admin-bookings-table.tsx` (via `AdminAuthGate` → `AdminDashboard`, the admin landing dashboard). |
| `app/admin/assistant/page.tsx` | `page_view` only (AI assistant workspace). |
| `app/admin/chat-logs/page.tsx` | `page_view` only. |
| `app/admin/invoices/page.tsx` | `page_view` only. |
| `app/admin/library/page.tsx` | `page_view` only (exercise-library content manager). |
| `app/admin/patients/page.tsx` | `page_view` only. |
| `app/admin/patients/[id]/page.tsx` | `page_view`. `exercise_video_play` / `exercises_marked_all_done` (`components/assigned-exercises.tsx`, via `AdminPatientDetail` → `AdminAssessmentReview`). |
| `app/admin/recovery/page.tsx` | `page_view`. `follow_up_scheduled` `{ for_dependent }` (`components/admin-follow-up.tsx`). `exercise_video_play` / `exercises_marked_all_done` (`components/assigned-exercises.tsx`, via `AdminExerciseAssigner` / `AdminRecoverySummary`). |
| `app/admin/reset-password/page.tsx` | `page_view` only. |
| `app/admin/session/[bookingId]/page.tsx` | `page_view`. `exercise_video_play` / `exercises_marked_all_done` (via `AdminSessionView` → `AdminAssessmentReview`). |
| `app/admin/session/[bookingId]/start/page.tsx` | `page_view`. `exercise_video_play` / `exercises_marked_all_done` (via `StartSessionFlow` → `AdminAssessmentReview`). |
| `app/admin/sessions/page.tsx` | `page_view` only (upcoming-sessions list). |

## Adding a new page

1. Add the `track()` / `trackLibraryEvent()` call(s) at the call site, following
   the existing naming conventions (snake_case event names; a `source` param
   for click-origin tracking; reuse an existing event with a distinguishing
   param value where one already fits, add a new `LibraryEvent` variant in
   `lib/analytics.ts` when the page type is genuinely new).
2. Add a row for the new `page.tsx` to the relevant section table above,
   including `page_view` and every custom event it fires.
3. Run `npm run test:run` — `tests/app/analytics-tracking-registry.test.ts`
   will fail until step 2 is done, which is the point.
