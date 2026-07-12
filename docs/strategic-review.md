# PhysioOnClick — Strategic Review

**Status:** Opinionated recommendation, not a neutral options menu — 2026-07-10
**Scope:** Whole-project premise, sequencing, and what to do next

## The core question: build vs. buy

PhysioOnClick has custom-built a practice-management stack — booking, clinical notes, session summaries, a recovery dashboard, per-patient exercise assignment, family accounts — on Next.js/Firebase/Flutter. Mature, physio-specific SaaS already solves this for a solo practitioner at low cost:

| Platform | Price | Booking | Clinical notes | Exercise library | Video | Compliance |
|---|---|---|---|---|---|---|
| Cliniko | ~£36/mo | ✅ | ✅ (templated) | — | via integration | — |
| Jane App | ~$54/mo | ✅ | ✅ | — | ✅ built-in | — |
| Physitrack | subscription | via integration | ✅ | 18,000+ exercises | ✅ built-in | ISO 27001 / 13485 |

The one MVP feature this project is still missing — video consultation — is table stakes on these platforms. Compliance certification for health data, which a solo dev will struggle to match, is also already there.

**Verdict: don't scrap the custom build, but stop treating it as obviously the right call by default.** The web presence (108-article SEO library, Glasgow-specific local pages, brand, design) is a real asset no SaaS platform gives you, and the project is too far along to strand that work. But the booking/clinical/recovery backend is re-solving a problem that's already solved cheaply elsewhere. If patient volume stays low for the first few months, revisit whether the backend is worth maintaining versus pointing the same content site at a Cliniko/Jane booking page.

## What the evidence actually shows

- **Effort has gone into polish, not the revenue path.** The last 30 commits: scroll-reveal animations, View Transitions API, micro-interaction shimmer/hover, admin dashboard tabs (live-stats, enquiries, summary drawer), mobile theming, onboarding typography.
- **The revenue path had undiscovered bugs.** In one session, auditing `firestore.rules` and the booking flow surfaced: an open (`allow create: if true`) write rule on `bookings`, a client-writable but entirely unused `payments` collection, and a field-name mismatch (`patientUid` vs `bookedBy`) that silently broke linking a guest booking to a new account. None of this had been exercised by a real patient yet — because there isn't one yet.
- **Test coverage exists but is thin on the money path.** Correction to an earlier claim in this doc: a real test suite exists (`tests/`, 27 tests, covering CSP compliance work and recovery calculations) — it wasn't zero, I just hadn't run it. The gap that's actually real: no tests for `cal-webhook`, `link-bookings`, or `checkout` — the booking/payment path specifically.
- **Scope is large for one operator.** Family accounts, an AI chatbot, per-patient exercise assignment, admin live-stats, a recovery dashboard with charts, and a native mobile app — run by one person who is both the physio and the admin, pre-revenue.

## Recommendation

Freeze feature growth. Spend the next cycle closing the gap between "code exists" and "a real patient can book, pay, and be treated safely," in this order:

### 1. Harden the money and data path (highest priority)
The booking/payment/auth path is the highest-blast-radius surface in the app and currently has the least verification. Before anything else:
- Write tests for booking creation (webhook path), Stripe checkout, and the auth/magic-link flow — not UI tests, path-of-money-and-data tests.
- Re-verify the `firestore.rules` fixes made this session under real usage (a guest booking → sign-up → appointment-shows-up round trip, end to end).

### 2. Ship video the cheap way
Check whether Cal.com's own video conferencing (Cal Video / Google Meet on the event type) is sufficient before building or integrating anything bespoke. You're already paying for Cal.com for booking — this is very likely a settings change, not a build.

### 3. Get one real patient through the full flow before adding anything else
Not a soft launch to friends — an actual stranger, booking a real remote session, paying, receiving a session summary, logging into the portal. This will surface more real problems in an afternoon than another month of building would.

### 4. Only then: reconsider the backend-vs-SaaS question
If patient volume after the above stays low, seriously weigh keeping the content/SEO layer and pointing it at a Cliniko/Jane/Physitrack booking backend instead of maintaining a custom one. If volume justifies it, keep building the custom backend — but as a decision made with evidence, not by default momentum.

## Explicitly deferred (not needed for the first real patient)

- Family/basic accounts beyond what already works
- AI chatbot
- Admin live-stats dashboard depth
- Recovery adherence charts and trend visuals
- Further animation/micro-interaction polish
- Mobile app parity work beyond what's already shipped

These aren't bad ideas — they're retention and scale features for patients you don't have yet. Revisit once step 3 above is done.

## The actual risk

The failure mode that matters here isn't "not ambitious enough" — it's a data-handling mistake in health or payment data landing before or shortly after the first real patient, because there's no test coverage and the revenue path has already shown it can have silent bugs for a while before anyone notices. Sequence around that risk, not around feature count.
