# Home-visit redesign, stage 3 (mobile app) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** The Flutter app gets the same booking as the website: visit-first (home visit in Glasgow or video), postcode coverage check, home prices with the £15 travel fee, address dropdown with manual fallback, saved addresses (address book + usual address per person), and no focus-area chips.

**Architecture:** The website stays the single source of truth. Coverage comes from a new public endpoint `POST /api/home-visit/coverage`; address lookup reuses `POST /api/address/lookup` and `/resolve`; checkout reuses `POST /api/checkout/create` (which already enforces coverage and adds the travel fee server-side). The app reads/writes the same Firestore `patientAddresses` collection and `defaultAddressId` fields the website uses (rules already live). Prices shown in the app mirror `lib/home-visit-pricing.ts` by hand (like `book_service.dart` already mirrors `lib/site-data.ts`).

**Tech Stack:** Next.js route + Vitest (task 1); Flutter (Dart ^3.8.1), `http`, `cloud_firestore`, `firebase_auth`, plain `Navigator` + StatefulWidgets, `flutter_test` (tasks 2–6).

**Spec:** `docs/superpowers/specs/2026-10-04-home-visit-booking-redesign-design.md` (Stage 3 + Stage 2 sections).

## Global Constraints

- Worktree `/Users/iamkjn/Documents/Playground/.worktrees/mobile-hv`, branch `feat/mobile-home-visits`. Never commit to master, never push, never deploy, never touch `/Users/iamkjn/Documents/Playground` (main checkout has other sessions' uncommitted mobile work).
- Covered postcode districts: G1–G53, PA1, PA2, PA3, ML3 — the app never hardcodes this list; it asks `POST /api/home-visit/coverage`.
- Travel fee: £15 per home visit; bundles × sessions (4 or 8), charged upfront; discount codes reduce the session price only. Home prices: initial £55, follow-up £45, 4-bundle £180, 8-bundle £345 (video £40/£30/£120/£225 from `book_service.dart`).
- Home titles: "Initial Assessment (home visit)", "Follow-Up (home visit)", "<bundle title> (home visit)" (mirror `serviceLabelFor` in `lib/cal-services.ts`).
- Copy to reuse: "We don't offer home visits in {outward code} yet. Video consultations work anywhere in the UK, or contact us and we'll see if we can help."; "Home visits cover Glasgow (G1–G53), Paisley (PA1–PA3) and Hamilton (ML3)."; "Outside our home-visit area".
- Address limits: line ≤120, postcode ≤10 (normalised "G31 4HS"), label ≤40. Address/postcode never in analytics, logs, or URLs (POST bodies only).
- Every lookup/coverage failure must leave the patient able to type the address and continue (coverage endpoint unavailable → block home visit with a friendly "couldn't check your postcode, try again" — never silently allow; the server re-checks anyway).
- Video bookings must behave exactly as before. Focus-area chips are removed (send no focusAreas).
- Run Flutter commands from `mobile_app/`: `flutter test`, `flutter analyze`. Web tests: `npx vitest run <file>` from the worktree root (real `node_modules` copy, never a symlink).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

### Task 1 (web): `POST /api/home-visit/coverage`

**Files:** Create `app/api/home-visit/coverage/route.ts`; Test `tests/api/home-visit-coverage.test.ts`.

**Behaviour:** rate-limited with `isRateLimited("ADDRESS_RATE_LIMITER", clientIp(request))` (429 `{error:"rate_limited"}`); JSON body `{ postcode }` (null/non-object body → 400); shape-check with `validateHomeVisit("placeholder", postcode)` (400 `{error:"Enter a valid postcode."}`); 200 `{ covered: isCoveredPostcode(pc), outwardCode: outwardCode(pc), postcode: pc }` where `pc` is normalised. Never log the postcode.

- [ ] Tests first (covered G31 4HS → {covered:true,outwardCode:"G31",postcode:"G31 4HS"}; EH1 1AA → covered false, outward "EH1"; "12345" → 400; null body → 400; rate limited → 429 without calling anything), see them fail, implement, see them pass; `npx tsc --noEmit -p . 2>&1 | grep coverage` empty. Commit "home visits: public postcode coverage endpoint for the app".

### Task 2 (mobile): home-visit pricing, labels and visit model

**Files:** Create `mobile_app/lib/src/features/booking/models/home_visit.dart`; Modify `models/book_service.dart` only if needed; Test `mobile_app/test/features/booking/home_visit_test.dart`.

**Produces:**
```dart
enum VisitType { video, home }
const int kHomeVisitTravelFeePence = 1500;
int sessionPricePence(ResolvedService s);            // (s.price * 100).round()
int travelFeePence(ResolvedService s, VisitType v);   // 0 for video; 1500 * s.sessions for home
int totalPence(ResolvedService s, VisitType v);       // session + travel (no discount here)
String formatPounds(int pence);                       // "£55" / "£51.50"
String serviceLabelFor(ResolvedService s, VisitType v); // home titles per Global Constraints
String travelFeeLabel(ResolvedService s);             // "Travel fee (1 home visit × £15)" / "(4 home visits × £15)"
String normalisePostcode(String raw);                  // mirror lib/home-visit.ts normalisePostcode
class HomeVisitAddress { final String line; final String postcode; String get formatted => '$line, $postcode'; }
```
- [ ] Unit tests for every function (all four services × both visit types; label singular/plural; formatPounds; normalisation "g31  4hs" → "G31 4HS"), red → green, `flutter analyze` clean for the new files. Commit "mobile: home-visit pricing, labels and visit model".

### Task 3 (mobile): API + address-book repositories

**Files:** Create `mobile_app/lib/src/features/booking/home_visit_repository.dart` (coverage + lookup + resolve over `http`, using `kApiBase` and the existing auth-header pattern from `checkout_repository.dart`) and `mobile_app/lib/src/features/addresses/address_repository.dart` (Firestore `patientAddresses` CRUD mirroring `lib/patient-addresses.ts`: `getAddresses(uid)` ordered by `createdAt`, `addAddress`, `updateAddress`, `deleteAddress` (batch: delete + clear `defaultAddressId` on `users/{uid}` and the owner's `dependents` pointing at it), `setUsualAddress(uid, personId?, addressId?)` (verify ownership first), `getUsualAddressId(uid, personId?)`); Tests under `mobile_app/test/features/...` with an injectable `http.Client` (MockClient from `package:http/testing.dart`) and, for Firestore, follow any existing fake pattern in `mobile_app/test` (if none and no fake package is available, make the repository take collection references via constructor so it can be tested with `fake_cloud_firestore` ONLY if already in pubspec; otherwise test the pure helpers and keep Firestore calls thin).

**Produces:** `CoverageResult {covered, outwardCode, postcode}` / throws `CoverageUnavailable`; `lookupAddresses(postcode) → List<AddressSuggestion{id,label}>` / throws `LookupUnavailable` (any non-200); `resolveAddress(id) → HomeVisitAddress` / throws; `SavedAddress {id, ownerUid, label, line, postcode}` + `display` getter.
- [ ] Tests first; POST JSON bodies only (assert no postcode in URL); timeouts 10s; never print addresses. Commit "mobile: coverage, address lookup and address-book repositories".

### Task 4 (mobile): visit-first service screen

**Files:** Modify `mobile_app/lib/src/features/booking/service_select_screen.dart` (and create small widgets under `features/booking/widgets/` if it helps); Test `mobile_app/test/features/booking/service_select_screen_test.dart` (inject repositories via constructor params with defaults so tests can pass fakes).

**Behaviour (mirror the website's step 1):**
- Title "Book your appointment"; first block "How would you like to be seen?" with two large cards: "Home visit in Glasgow / Your physiotherapist visits you" (house icon) and "Video consultation / Online, anywhere in the UK" (video icon). Video selected by default. Accessible (Semantics: selected state, button).
- Home: saved addresses (if any) as radio options with "Outside our home-visit area" badge when the coverage endpoint says uncovered, preselect the usual address of the person being booked for (default: account holder; use `initialPersonId` if given), plus "Use a different address" (default when no usual). Different address: postcode field → on a valid shape call coverage (debounced 400 ms) → covered: "We visit {outward}." then address dropdown (lookup → pick → resolve; "Enter address manually" fallback; any lookup/resolve failure → manual text field), and a "Save to my address book" checkbox (default on). Uncovered: the out-of-area message and a "Book a video consultation instead" button; no services/Continue. Coverage unavailable: "We couldn't check your postcode. Please try again." with a Retry button.
- Service cards show `formatPounds(totalPence(s, visit))` and, for home, "incl. £X travel"; titles via `serviceLabelFor`.
- Focus-area chips removed entirely.
- Continue: requires (video) or (home + covered + non-empty line + valid postcode); if "save" ticked and not already saved (same normalised postcode + case-insensitive line), call `addAddress` without awaiting failure (errors ignored). Passes `visitType` + `HomeVisitAddress?` to `TimeDetailsScreen`.
- [ ] Widget tests: default video; home + covered postcode shows address dropdown and £55; uncovered shows message and switch-to-video works; coverage failure shows retry; saved-address preselect; manual fallback when lookup fails; Continue passes the visit to the next screen. Commit "mobile: visit-first booking step with coverage, address lookup and saved addresses".

### Task 5 (mobile): carry the visit through to checkout

**Files:** Modify `time_details_screen.dart`, `payment_screen.dart` (or wherever `createCheckout` is called — trace it), `checkout_repository.dart` (`createCheckout` gains `String visitType = 'video'`, `String? homeAddressLine`, `String? homePostcode`, sends `visitType` always and the address fields only for home; stop sending `focusAreas`), the rail/summary/price labels (pay button shows `formatPounds(totalPence)`), and the available-times call (`/api/cal/slots` gains `visit=home` for home visits so the home Cal.com event's slots load). Also the app's package-session booking, if it exists (grep for `package-sessions`), must pass nothing new (server handles it). Tests: extend existing booking tests or add `checkout_repository_test.dart` asserting the request body (video unchanged except no focusAreas; home includes address fields) and the slots URL param.
- [ ] Red → green; server error messages (e.g. "We don't offer home visits at that postcode yet.") shown to the user verbatim. Commit "mobile: send home-visit details to checkout; travel fee in totals".

### Task 6 (mobile): Account → Addresses and usual address on People

**Files:** Create `mobile_app/lib/src/features/addresses/addresses_screen.dart` (list, add/edit with postcode → coverage → dropdown or manual, delete with confirmation, uncovered badge, empty state "No saved addresses yet. Add one to book home visits faster."), link it from the profile/account screen (find the account/profile menu under `features/profile`), and add "Usual address for home visits" pickers for the account holder and each dependent on `features/people/people_screen.dart`. Tests: widget tests with fake repositories.
- [ ] Red → green; commit "mobile: address book screen and usual address per person".

### Task 7: verification

- [ ] From `mobile_app/`: `flutter analyze` (no new issues vs base — compare with `git stash`-free method: run on base first via `git worktree`? No: just report issues in files this branch touched) and `flutter test` (all pass, or list pre-existing failures that also fail on base by checking `git log` for the failing test files).
- [ ] Web: `npx vitest run tests/api/home-visit-coverage.test.ts` and `npx tsc --noEmit -p . 2>&1 | grep -v "^tests/"` empty.
- [ ] Build check: `flutter build web --dart-define=APP_ENV=dev` (or the app's documented dev build flag — read `mobile_app/README*`/`scripts/`) succeeds.
- [ ] Commit fixes if any.
