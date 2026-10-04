# Home-visit booking redesign: visit-first flow, area check, travel fee, address book

Date: 2026-10-04. Owner-approved in conversation (parts 1–3).

Builds on the home-visit work (`feat/seo-phase-b`, another session) and the Cal.com
event mapping (`feat/home-visit-cal-event`: `calSlugFor`, home events
`initial-assessment-home-visit-in-glasgow` and `follow-up-home-visit-in-glasgow` in
both Cal.com accounts). None of this is on master yet; see "Release".

## Goals

- Patients choose **how** they want to be seen before **what** they book.
- Home visits are only bookable for covered postcodes, checked on the server too.
- Home visits cost the video price plus a £15 travel fee per visit, shown as its own line.
- Signed-in patients keep an address book; each person can have a usual address.
- Mobile gets the same flow and address book.

Non-goals: separate home-visit base prices, distance-based coverage, per-session
payment for bundle sessions, Cal.com availability changes (owner decides separately).

## Decisions (from the owner)

| Topic | Decision |
|---|---|
| Coverage | Postcode districts **G1–G53, PA1, PA2, PA3, ML3** (Glasgow, Paisley, Hamilton) |
| Price | Video price **+ £15 travel fee per home visit** |
| Bundles | All travel fees charged upfront: 4 × £15, 8 × £15 |
| Discounts | Codes (e.g. NEW10) reduce the **session price only**, never the travel fee |
| Addresses | Account-level **address book**; each person has an optional usual address |

Resulting home prices: initial £55, follow-up £45, 4-session bundle £180, 8-session bundle £345.

## Stage 1: website booking flow and prices

### Coverage check: `lib/home-visit-area.ts` (new, pure)

- `HOME_VISIT_DISTRICTS`: the covered outward codes, built from the ranges above.
  It's the only copy of the list. Mobile asks the server (stage 3).
- `outwardCode(postcode)`: uses `normalisePostcode` from `lib/home-visit.ts` and returns
  the part before the space ("G31 4HS" gives "G31").
- `isCoveredPostcode(postcode): boolean`.
- `HOME_VISIT_AREA_LABEL`: "Glasgow (G1–G53), Paisley (PA1–PA3) and Hamilton (ML3)".
- Out-of-area copy (owner to confirm): "We don't offer home visits in {outward code} yet.
  Video consultations work anywhere in the UK, or contact us and we'll see if we can help."

### Price: `lib/home-visit-pricing.ts` (new, pure)

- `HOME_VISIT_TRAVEL_FEE_PENCE = 1500` (single constant).
- `travelFeePence(service, visitType)`: `0` for video; otherwise 1500 × the tier's
  `sessions` (1, 1, 4, 8 from `lib/cal-services.ts`).
- `homeVisitTotalPence({ sessionPence, discountPence, travelFeePence })`:
  `max(0, sessionPence - discountPence) + travelFeePence`.
- `displayPrice(service, visitType)` for cards and the rail (whole pounds).

### Booking UI (step 1 of 3 stays step 1)

`components/booking-step-service.tsx` becomes visit-first, with progressive disclosure inside the same step:

1. **"How would you like to be seen?"**: two large cards, *Home visit in Glasgow*
   (house icon) and *Video consultation, anywhere in the UK* (video icon). This
   replaces the radio chips below the service cards.
2. **Home:** postcode field, then a check:
   - covered: show the address-line field, then the service cards with home prices
     and home titles ("Initial Assessment (home visit)", via `serviceLabelFor`);
   - not covered: the out-of-area message and a "Book a video consultation instead"
     button that switches to video. No service cards.
3. **Video:** service cards straight away, at today's prices.
4. Focus areas and "Continue to times" appear once a service is visible and chosen.

`?visit=home` still preselects home. The rail (`booking-flow.tsx`) shows the session
price, a "Travel fee" line when it's a home visit (e.g. "4 home visits × £15"), the
discount line and the total. The existing `validateHomeVisit` keeps checking the address shape.

### Server: `app/api/checkout/create/route.ts`

- For a home visit, after `validateHomeVisit`, reject an uncovered postcode with
  400 "We don't offer home visits at that postcode yet."
- Discount is validated against the session price (unchanged, `lib/checkout-discounts.ts`);
  the travel fee is added afterwards. Charged amount = `homeVisitTotalPence(...)`.
- Intent metadata gains `travelFeePence` (string, only when > 0).
- Stripe Checkout gets **two line items** when there is a travel fee: the session
  (discounted price) and "Travel fee (N home visit(s) × £15)". `lib/payments` gains an
  optional `extraLineItems` input, so video checkouts send exactly what they send today.

### After payment

- `app/api/payments/webhook/route.ts` reads `travelFeePence` from the intent and stores
  it on the `payments` doc and the booking doc.
- `lib/patient-receipt.ts`, the receipt page and `lib/emails/receipt-email.ts` show a
  "Travel fee" line. `lib/invoice-pdf.ts` adds a travel-fee row above the total.
  Video receipts and invoices are unchanged.
- Cal.com booking is unchanged (`calSlugFor` already picks the home events).

### Pricing page

`app/pricing/page.tsx` gains a "Home visits in Glasgow" block: the same services,
+£15 travel per visit, the covered area, and example totals. Prices come from the
constants above, never hard-coded.

## Stage 2: address book (website)

### Data

- New top-level collection **`patientAddresses/{id}`**, the same pattern as `dependents`:
  `ownerUid`, `label` (≤ 40, optional), `line` (≤ 120), `postcode` (normalised, ≤ 10),
  `createdAt`, `updatedAt`. Coverage is never stored; it's computed from the postcode.
- Usual address: optional `defaultAddressId` on `users/{uid}` (account holder) and
  `dependents/{id}` (family members).
- `firestore.rules`: owner read/write own docs (`ownerUid == request.auth.uid`), admin
  read; validate field types and lengths on create/update. Rules are deployed to
  `physioonclick-dev` first, then prod, alongside the matching web release.
- `lib/patient-addresses.ts`: client CRUD plus `setUsualAddress(personId, addressId | null)`.
  Deleting an address clears any `defaultAddressId` pointing at it.

### Portal

- **Account → Addresses**: list, add, edit and delete addresses. Each shows
  "Outside our home-visit area" when its postcode isn't covered.
- **People**: a "Usual address for home visits" select for the account holder and each dependent.

### Booking

- Signed-in plus home visit: after choosing the person, their usual address is
  preselected. They can pick another saved address or "Add a new address"
  ("Save to my address book" ticked by default). The coverage check runs on the chosen postcode.
- Each booking keeps its own copy of the address string (existing `homeVisitAddress`),
  so editing or deleting an address never changes past bookings, receipts or invoices.
- Guests type the address as today; nothing is saved.

### Postcode → address dropdown (added 2026-10-04, owner request)

The owner asked for a free option: the **getAddress.io free plan** (200 lookups/day plus a 600/month reserve, $0; checked on getaddress.io 2026-10-04).

- `lib/address-lookup.ts` (server only) wraps the provider behind `findAddresses(postcode)` → `[{ id, label }]` and
  `resolveAddress(id)` → `{ addressLine, postcode }`. Switching provider later means changing this one file.
  - getAddress UK API: `GET https://api.getaddress.io/autocomplete/{postcode}?api-key=KEY&all=true` →
    `{ suggestions: [{ address, url, id }] }` (free and rate-limited; doesn't use lookups);
    `GET https://api.getaddress.io/get/{id}?api-key=KEY` → `{ postcode, line_1..line_4, town_or_city, county, … }`
    (counts as 1 lookup). `addressLine` = non-empty `line_1..line_4` + `town_or_city`, joined with ", ", capped at 120.
  - Secret `GETADDRESS_API_KEY` (Worker secret and .env files; documented in .env.example). A missing key, provider
    error, 404 or 429 makes the routes answer 503 or 404, and the UI falls back to typing the address. Never log the
    postcode or address.
- Routes `POST /api/address/lookup` `{ postcode }` and `POST /api/address/resolve` `{ id }` validate their input
  (postcode shape as in `validateHomeVisit`; id `/^[A-Za-z0-9_-]{1,200}$/`). They only look up **covered** postcodes,
  since there's no point listing addresses we can't visit. They're rate-limited by a new `ADDRESS_RATE_LIMITER`
  binding (30 per 60 s per IP; prod namespace 1003, dev 2003).
- UI component `AddressLookup`: after a covered postcode, it shows "Select your address" (a native select of the
  suggestions) plus "Enter address manually". Choosing an address resolves it and fills the address line. It's used
  in booking step 1 (for guests, and for signed-in patients adding a new address) and in Account → Addresses.
- The privacy policy lists getAddress.io as a processor (it receives the postcode and the chosen address id).

### Stage 2 adjustments

- The person is chosen on step 2, after the address on step 1. So the saved-address picker on step 1 preselects the
  usual address of whoever the booking is currently for (seeded from the existing PersonProvider context; the
  account holder by default). Changing the person on step 2 doesn't change an address that's already chosen.
- `dependents` rules allow an optional `defaultAddressId` (string ≤ 128). `users` already allows owner updates.
- "Save to my address book" saves the new address when the patient continues to times (signed-in patients only).

### Privacy (unchanged rules)

Addresses never go into logs, analytics events or URLs. The package API only ever
exposes `visitType: "home"`.

## Stage 3: mobile app (Flutter)

- `POST /api/home-visit/coverage` with body `{ postcode }` returns `{ covered, outwardCode }`.
  It's public, rate-limited with the existing `FORM_RATE_LIMITER`, and the postcode is
  never logged. The website uses the shared lib directly; mobile calls this endpoint.
- Booking: the same visit-first screen, then postcode check, then home services with
  travel fee, then the existing time and payment screens. Checkout already goes through
  `/api/checkout/create`, so the server price and area checks apply automatically.
- Address book: the app reads and writes `patientAddresses` and `defaultAddressId`
  directly, as it does for `dependents`. Account → Addresses screen, and a usual-address
  picker per person.

## Release

- Every stage is its own branch, stacked: `feat/home-visit-redesign` (this, stage 1)
  then stage 2, then stage 3. Each goes localhost → owner approval → dev → owner approval.
- **Nothing merges to master until the owner approves home visits going live.** A
  merge would make the next `npm run deploy` from master ship it. The live release
  combines the other session's home-visit work, the Cal.com mapping and these stages,
  coordinated with that session.
- Dev deploys combine this stack with whatever is newer on master, so dev never drops live features.

## Testing

- Unit: coverage (every covered district, edges like G54 and PA4, lowercase/space input),
  pricing (all four tiers × video/home, discount excluded from travel), checkout create
  (amount, two Stripe line items, out-of-area rejection, video request unchanged),
  webhook (stores fee), receipt and invoice (travel line present only for home),
  address helpers and rules (emulator, if available).
- Component: visit-first step (card choice, covered and uncovered postcode, prices shown,
  switch to video), rail travel-fee line.
- Manual: localhost booking with a covered and an uncovered postcode, then dev.

## Cal.com availability (owner decision, not part of this build)

Live: one "Working hours" schedule, every day 19:00–22:00, shared by all four events;
no buffers. Dev: 08:00–21:00. Options offered: a separate home-visit schedule and/or a
travel buffer after home visits. These are Cal.com settings and need no code.
