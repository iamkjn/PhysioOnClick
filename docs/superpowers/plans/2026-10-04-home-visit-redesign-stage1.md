# Home-visit redesign, stage 1 (website booking, area check, travel fee) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visit-first booking with a server-enforced postcode coverage check and a £15-per-visit travel fee that shows as its own line everywhere money is shown.

**Architecture:** Two new pure modules: `lib/home-visit-area.ts` (coverage) and `lib/home-visit-pricing.ts` (travel fee and totals). They're the only place these rules live. Checkout re-checks coverage and re-derives the amount on the server. Stripe gets a second line item for travel, the fee travels in Stripe metadata as `travelFeePence`, and the webhook stores it and passes it to the invoice and receipts. The booking UI reorders step 1 to visit-first and reads prices from the pricing module.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest + Testing Library (jsdom), Stripe REST over fetch, pdf-lib.

**Spec:** `docs/superpowers/specs/2026-10-04-home-visit-booking-redesign-design.md` (stage 1).

## Global Constraints

- Worktree `/Users/iamkjn/Documents/Playground/.worktrees/hv-redesign`, branch `feat/home-visit-redesign`. Never commit to master; never deploy.
- Covered postcode districts: **G1–G53, PA1, PA2, PA3, ML3**.
- Travel fee: **£15 (1500 pence) per home visit**; bundles multiply by sessions (4 or 8), charged upfront.
- Discount codes reduce the **session price only**; the travel fee is never discounted.
- Video bookings must behave exactly as before (same amount, one Stripe line item, same metadata, same receipts).
- The home address must never appear in logs, analytics events, URLs or error messages.
- Run single test files with `npx vitest run <path>`. Known pre-existing failures to ignore (they fail on the base branch too): 2 in `tests/components/booking-flow.test.tsx`, 1 in `tests/app/condition-hub-page.test.tsx`, 1 in `tests/app/exercise-page.test.tsx`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

### Task 1: Coverage module

**Files:**
- Create: `lib/home-visit-area.ts`
- Test: `tests/lib/home-visit-area.test.ts`

**Interfaces:**
- Consumes: `normalisePostcode(raw: string): string` from `lib/home-visit.ts`
- Produces: `HOME_VISIT_DISTRICTS: ReadonlySet<string>`, `HOME_VISIT_AREA_LABEL: string`, `outwardCode(postcode: string): string`, `isCoveredPostcode(postcode: string): boolean`, `outOfAreaMessage(postcode: string): string`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/home-visit-area.test.ts
import { describe, expect, it } from "vitest";
import {
  HOME_VISIT_AREA_LABEL,
  HOME_VISIT_DISTRICTS,
  isCoveredPostcode,
  outOfAreaMessage,
  outwardCode,
} from "@/lib/home-visit-area";

describe("outwardCode", () => {
  it("returns the district before the space, normalised", () => {
    expect(outwardCode("g31 4hs")).toBe("G31");
    expect(outwardCode("G314HS")).toBe("G31");
    expect(outwardCode(" pa1 1aa ")).toBe("PA1");
    expect(outwardCode("G1 1AA")).toBe("G1");
  });
});

describe("isCoveredPostcode", () => {
  it("covers every Glasgow district G1 to G53", () => {
    for (let n = 1; n <= 53; n++) expect(isCoveredPostcode(`G${n} 1AA`)).toBe(true);
  });
  it("covers Paisley PA1-PA3 and Hamilton ML3", () => {
    expect(isCoveredPostcode("PA1 1AA")).toBe(true);
    expect(isCoveredPostcode("PA2 6AA")).toBe(true);
    expect(isCoveredPostcode("PA3 2AA")).toBe(true);
    expect(isCoveredPostcode("ML3 6AA")).toBe(true);
  });
  it("rejects districts just outside the area", () => {
    for (const pc of ["G54 1AA", "G60 1AA", "G84 1AA", "PA4 8AA", "PA5 1AA", "ML1 1AA", "ML4 1AA", "EH1 1AA"]) {
      expect(isCoveredPostcode(pc)).toBe(false);
    }
  });
  it("does not confuse G1 with G10-G19 or PA1 with PA10+", () => {
    expect(HOME_VISIT_DISTRICTS.has("G1")).toBe(true);
    expect(isCoveredPostcode("PA10 1AA")).toBe(false);
    expect(isCoveredPostcode("ML30 1AA")).toBe(false);
  });
  it("rejects empty or garbage input", () => {
    expect(isCoveredPostcode("")).toBe(false);
    expect(isCoveredPostcode("12345")).toBe(false);
  });
});

describe("copy", () => {
  it("names the covered area and the district in the out-of-area message", () => {
    expect(HOME_VISIT_AREA_LABEL).toBe("Glasgow (G1–G53), Paisley (PA1–PA3) and Hamilton (ML3)");
    expect(outOfAreaMessage("eh1 1aa")).toBe(
      "We don't offer home visits in EH1 yet. Video consultations work anywhere in the UK, or contact us and we'll see if we can help.",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/home-visit-area.test.ts`
Expected: FAIL, cannot resolve `@/lib/home-visit-area`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/home-visit-area.ts
import { normalisePostcode } from "@/lib/home-visit";

/**
 * Where home visits are offered, by postcode district (outward code).
 * This is the ONLY copy of the list: the booking UI, /api/checkout/create and
 * (stage 3) the mobile app's coverage endpoint all read it from here.
 * Owner decision 2026-10-04: Glasgow G1-G53, Paisley PA1-PA3, Hamilton ML3.
 */
const GLASGOW = Array.from({ length: 53 }, (_, i) => `G${i + 1}`);
export const HOME_VISIT_DISTRICTS: ReadonlySet<string> = new Set([...GLASGOW, "PA1", "PA2", "PA3", "ML3"]);

export const HOME_VISIT_AREA_LABEL = "Glasgow (G1–G53), Paisley (PA1–PA3) and Hamilton (ML3)";

/** "g31 4hs" -> "G31". Empty string when there is no recognisable district. */
export function outwardCode(postcode: string): string {
  const normalised = normalisePostcode(postcode.trim());
  const space = normalised.indexOf(" ");
  return space > 0 ? normalised.slice(0, space) : "";
}

export function isCoveredPostcode(postcode: string): boolean {
  const district = outwardCode(postcode);
  return district !== "" && HOME_VISIT_DISTRICTS.has(district);
}

export function outOfAreaMessage(postcode: string): string {
  const district = outwardCode(postcode) || "your area";
  return `We don't offer home visits in ${district} yet. Video consultations work anywhere in the UK, or contact us and we'll see if we can help.`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/home-visit-area.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add lib/home-visit-area.ts tests/lib/home-visit-area.test.ts
git commit -m "home visits: postcode coverage module (G1-G53, PA1-PA3, ML3)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Travel-fee pricing module

**Files:**
- Create: `lib/home-visit-pricing.ts`
- Test: `tests/lib/home-visit-pricing.test.ts`

**Interfaces:**
- Consumes: `bookServiceFor(id: BookServiceId)` from `lib/cal-services.ts` (has `.price` in pounds and `.sessions`); `VisitType` from `lib/home-visit.ts`
- Produces: `HOME_VISIT_TRAVEL_FEE_PENCE = 1500`, `travelFeePence(service: BookServiceId, visitType?: VisitType): number`, `sessionPricePence(service: BookServiceId): number`, `totalPence({ sessionPence, discountPence, travelFeePence }): number`, `travelFeeLabel(service: BookServiceId): string`, `formatPounds(pence: number): string`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/home-visit-pricing.test.ts
import { describe, expect, it } from "vitest";
import { bookServiceFor } from "@/lib/cal-services";
import {
  HOME_VISIT_TRAVEL_FEE_PENCE,
  formatPounds,
  sessionPricePence,
  totalPence,
  travelFeeLabel,
  travelFeePence,
} from "@/lib/home-visit-pricing";

describe("travelFeePence", () => {
  it("is zero for video and for a missing visit type", () => {
    expect(travelFeePence("initial-assessment", "video")).toBe(0);
    expect(travelFeePence("bundle-8")).toBe(0);
  });
  it("is £15 per home visit, multiplied by the sessions in a bundle", () => {
    expect(HOME_VISIT_TRAVEL_FEE_PENCE).toBe(1500);
    expect(travelFeePence("initial-assessment", "home")).toBe(1500);
    expect(travelFeePence("follow-up", "home")).toBe(1500);
    expect(travelFeePence("bundle-4", "home")).toBe(6000);
    expect(travelFeePence("bundle-8", "home")).toBe(12000);
  });
});

describe("totalPence", () => {
  it("discounts the session price only, then adds travel", () => {
    expect(totalPence({ sessionPence: 4000, discountPence: 400, travelFeePence: 1500 })).toBe(5100);
  });
  it("never lets a discount push the session below zero or touch travel", () => {
    expect(totalPence({ sessionPence: 1000, discountPence: 5000, travelFeePence: 1500 })).toBe(1500);
  });
  it("is just the session price for video", () => {
    expect(totalPence({ sessionPence: 4000, discountPence: 0, travelFeePence: 0 })).toBe(4000);
  });
});

describe("helpers", () => {
  it("reads the session price from the pricing table", () => {
    expect(sessionPricePence("bundle-4")).toBe(Math.round(bookServiceFor("bundle-4").price * 100));
  });
  it("labels the travel line with the number of visits", () => {
    expect(travelFeeLabel("initial-assessment")).toBe("Travel fee (1 home visit × £15)");
    expect(travelFeeLabel("bundle-4")).toBe("Travel fee (4 home visits × £15)");
  });
  it("formats whole pounds without pence and part pounds with pence", () => {
    expect(formatPounds(5500)).toBe("£55");
    expect(formatPounds(5150)).toBe("£51.50");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/home-visit-pricing.test.ts`
Expected: FAIL, cannot resolve `@/lib/home-visit-pricing`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/home-visit-pricing.ts
import { bookServiceFor } from "@/lib/cal-services";
import type { VisitType } from "@/lib/home-visit";
import type { BookServiceId } from "@/lib/site-data";

/**
 * Home visits cost the video price plus a travel fee per visit (owner decision
 * 2026-10-04). Bundles pay every visit's fee upfront. Discount codes never
 * reduce the travel fee. This is the only place the fee is defined.
 */
export const HOME_VISIT_TRAVEL_FEE_PENCE = 1500;

export function sessionPricePence(service: BookServiceId): number {
  return Math.round(bookServiceFor(service).price * 100);
}

export function travelFeePence(service: BookServiceId, visitType?: VisitType): number {
  if (visitType !== "home") return 0;
  return HOME_VISIT_TRAVEL_FEE_PENCE * bookServiceFor(service).sessions;
}

export function totalPence(input: { sessionPence: number; discountPence: number; travelFeePence: number }): number {
  return Math.max(0, input.sessionPence - input.discountPence) + input.travelFeePence;
}

/** "£55" for whole pounds, "£51.50" otherwise. */
export function formatPounds(pence: number): string {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}

export function travelFeeLabel(service: BookServiceId): string {
  const visits = bookServiceFor(service).sessions;
  return `Travel fee (${visits} home visit${visits === 1 ? "" : "s"} × ${formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE)})`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/home-visit-pricing.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/home-visit-pricing.ts tests/lib/home-visit-pricing.test.ts
git commit -m "home visits: travel-fee pricing module (£15 per visit, discount on session only)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Payments carry the travel fee (metadata plus a second Stripe line item)

**Files:**
- Modify: `lib/payments/index.ts` (`BookingIntent`, `CreateCheckoutInput`, `intentToMetadata`, `metadataToIntent`)
- Modify: `lib/payments/stripe.ts` (`createStripeCheckout` line items)
- Test: `tests/lib/payments/metadata.test.ts`, `tests/lib/payments/stripe.test.ts` (append)

**Interfaces:**
- Produces: `BookingIntent.travelFeePence?: string` (integer pence as a string, only for home visits with a fee); `CreateCheckoutInput.extraLineItems?: Array<{ name: string; amountPence: number }>`. `amountPence` stays the price of the FIRST line item (the session, after discount).

- [ ] **Step 1: Write the failing tests**

Append to `tests/lib/payments/metadata.test.ts` (it already imports `intentToMetadata`, `metadataToIntent` from `@/lib/payments`; add the import if missing):

```ts
describe("travel fee metadata", () => {
  const base = {
    service: "initial-assessment" as const,
    startISO: "2999-01-01T10:00:00.000Z",
    name: "Ada",
    email: "ada@example.com",
    timeZone: "Europe/London",
  };
  it("round-trips travelFeePence for a home visit", () => {
    const meta = intentToMetadata({ ...base, visitType: "home", homeVisitAddress: "7 Example Street, G31 4HS", travelFeePence: "1500" });
    expect(meta.travelFeePence).toBe("1500");
    expect(metadataToIntent(meta)?.travelFeePence).toBe("1500");
  });
  it("drops travelFeePence on a video booking", () => {
    const meta = intentToMetadata({ ...base, visitType: "video", travelFeePence: "1500" });
    expect(meta).not.toHaveProperty("travelFeePence");
    expect(metadataToIntent({ ...meta, travelFeePence: "1500" })).not.toHaveProperty("travelFeePence");
  });
  it("ignores a non-numeric travelFeePence", () => {
    expect(metadataToIntent({ ...intentToMetadata({ ...base, visitType: "home", homeVisitAddress: "x, G1 1AA" }), travelFeePence: "abc" })).not.toHaveProperty("travelFeePence");
  });
});
```

Append to `tests/lib/payments/stripe.test.ts` (read the file first and reuse its existing fetch stub / env setup; the assertions below read the URL-encoded body of the first fetch call):

```ts
describe("createStripeCheckout line items", () => {
  const intent = {
    service: "initial-assessment" as const,
    startISO: "2999-01-01T10:00:00.000Z",
    name: "Ada",
    email: "ada@example.com",
    timeZone: "Europe/London",
  };
  function stubOk() {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "cs_1", url: "https://checkout.stripe.com/c/cs_1" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    return fetchMock;
  }
  const bodyOf = (fetchMock: ReturnType<typeof vi.fn>) =>
    new URLSearchParams(String((fetchMock.mock.calls[0][1] as RequestInit).body));

  it("sends one line item when there are no extras (video, unchanged)", async () => {
    const fetchMock = stubOk();
    await createStripeCheckout({ intent, amountPence: 4000, serviceLabel: "Initial Online Assessment", successUrl: "s", cancelUrl: "c" });
    const body = bodyOf(fetchMock);
    expect(body.get("line_items[0][price_data][unit_amount]")).toBe("4000");
    expect(body.get("line_items[1][price_data][unit_amount]")).toBeNull();
  });

  it("adds the travel fee as a second line item", async () => {
    const fetchMock = stubOk();
    await createStripeCheckout({
      intent: { ...intent, visitType: "home", homeVisitAddress: "7 Example Street, G31 4HS", travelFeePence: "1500" },
      amountPence: 3600,
      serviceLabel: "Initial Assessment (home visit)",
      extraLineItems: [{ name: "Travel fee (1 home visit × £15)", amountPence: 1500 }],
      successUrl: "s",
      cancelUrl: "c",
    });
    const body = bodyOf(fetchMock);
    expect(body.get("line_items[0][price_data][unit_amount]")).toBe("3600");
    expect(body.get("line_items[1][quantity]")).toBe("1");
    expect(body.get("line_items[1][price_data][currency]")).toBe("gbp");
    expect(body.get("line_items[1][price_data][unit_amount]")).toBe("1500");
    expect(body.get("line_items[1][price_data][product_data][name]")).toBe("Travel fee (1 home visit × £15)");
    expect(body.get("metadata[travelFeePence]")).toBe("1500");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/payments/metadata.test.ts tests/lib/payments/stripe.test.ts`
Expected: FAIL on the new tests (no `travelFeePence` handling, no second line item); TypeScript errors about unknown properties surface as test failures or are reported by the next step.

- [ ] **Step 3: Implement**

In `lib/payments/index.ts`, add to `BookingIntent` after `homeVisitAddress`:

```ts
  /** Integer pence as a string, home visits only: £15 × visits (lib/home-visit-pricing). */
  travelFeePence?: string;
```

Add to `CreateCheckoutInput` after `serviceLabel`:

```ts
  /** Extra Stripe line items after the service (e.g. the home-visit travel fee). Video passes none. */
  extraLineItems?: Array<{ name: string; amountPence: number }>;
```

In `intentToMetadata`, after the `homeVisitAddress` spread:

```ts
    ...(intent.visitType === "home" && intent.travelFeePence ? { travelFeePence: intent.travelFeePence } : {}),
```

In `metadataToIntent`, after the `homeVisitAddress` spread:

```ts
    ...(meta.visitType === "home" && meta.travelFeePence && /^\d+$/.test(meta.travelFeePence)
      ? { travelFeePence: meta.travelFeePence }
      : {}),
```

In `lib/payments/stripe.ts`, after the four `line_items[0]` lines:

```ts
  (input.extraLineItems ?? []).forEach((item, i) => {
    const n = i + 1;
    form.set(`line_items[${n}][quantity]`, "1");
    form.set(`line_items[${n}][price_data][currency]`, "gbp");
    form.set(`line_items[${n}][price_data][unit_amount]`, String(item.amountPence));
    form.set(`line_items[${n}][price_data][product_data][name]`, item.name);
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/payments/`
Expected: PASS (all files in the folder, including the existing ones).

- [ ] **Step 5: Commit**

```bash
git add lib/payments/index.ts lib/payments/stripe.ts tests/lib/payments/metadata.test.ts tests/lib/payments/stripe.test.ts
git commit -m "payments: carry home-visit travel fee in metadata and as a second Stripe line item

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Checkout enforces coverage and charges the travel fee

**Files:**
- Modify: `app/api/checkout/create/route.ts`
- Test: `tests/api/checkout-create.test.ts`

**Interfaces:**
- Consumes: `isCoveredPostcode` (Task 1); `sessionPricePence`, `travelFeePence`, `totalPence`, `travelFeeLabel` (Task 2); `CreateCheckoutInput.extraLineItems`, `BookingIntent.travelFeePence` (Task 3); `validateCheckoutDiscount` returns `{ ok: true, amountPence, discountAmountPence, code, percent }` computed on the session price (unchanged).
- Produces: home-visit checkouts charge `totalPence(...)` across two Stripe line items; out-of-area postcodes get 400 `"We don't offer home visits at that postcode yet."`.

- [ ] **Step 1: Update and add tests**

In `tests/api/checkout-create.test.ts`, replace the test `"accepts a home visit at the same price and carries the address into the intent"` with:

```ts
  it("charges the session price plus a £15 travel fee for a covered home visit", async () => {
    okStripe();
    const res = await POST(req({ ...VALID, visitType: "home", homeAddressLine: " 7 Example Street ", homePostcode: "g31 4hs" }));
    expect(res.status).toBe(200);
    expect(lastIntent().visitType).toBe("home");
    expect(lastIntent().homeVisitAddress).toBe("7 Example Street, G31 4HS");
    expect(lastIntent().travelFeePence).toBe("1500");
    const { bookServiceFor } = await import("@/lib/cal-services");
    const session = Math.round(bookServiceFor("initial-assessment").price * 100);
    const arg = (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.amountPence).toBe(session);
    expect(arg.extraLineItems).toEqual([{ name: "Travel fee (1 home visit × £15)", amountPence: 1500 }]);
  });

  it("charges every visit's travel fee upfront on a home bundle", async () => {
    okStripe();
    await POST(req({ ...VALID, service: "bundle-4", visitType: "home", homeAddressLine: "7 Example Street", homePostcode: "G31 4HS" }));
    const arg = (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.intent.travelFeePence).toBe("6000");
    expect(arg.extraLineItems).toEqual([{ name: "Travel fee (4 home visits × £15)", amountPence: 6000 }]);
  });

  it("rejects a home visit outside the covered area without echoing the address", async () => {
    const res = await POST(req({ ...VALID, visitType: "home", homeAddressLine: "1 Princes Street", homePostcode: "EH2 2AN" }));
    expect(res.status).toBe(400);
    const { error } = await res.json();
    expect(error).toBe("We don't offer home visits at that postcode yet.");
    expect(error).not.toContain("Princes");
    expect(createStripeCheckout).not.toHaveBeenCalled();
  });

  it("sends a video booking with no travel fee and no extra line items", async () => {
    okStripe();
    await POST(req(VALID));
    const arg = (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.intent).not.toHaveProperty("travelFeePence");
    expect(arg.extraLineItems).toBeUndefined();
  });
```

Read the existing discount test (`"applies the new patient discount code server-side"`) and add, next to it, a home-visit version that applies the same code with `visitType: "home"`, `homeAddressLine: "7 Example Street"`, `homePostcode: "G31 4HS"`. Assert `arg.amountPence` equals that test's discounted session amount, `arg.extraLineItems[0].amountPence === 1500`, and `arg.intent.discountAmountPence` is the same as in the video case (the travel fee is not discounted). Reuse the discount mocking that test already uses.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/api/checkout-create.test.ts`
Expected: FAIL on the new tests (no travel fee, no area rejection).

- [ ] **Step 3: Implement**

In `app/api/checkout/create/route.ts`:

Add imports:

```ts
import { isCoveredPostcode } from "@/lib/home-visit-area";
import { sessionPricePence, totalPence, travelFeeLabel, travelFeePence } from "@/lib/home-visit-pricing";
```

Inside the `if (resolvedVisitType === "home") { ... }` block, after `if (!home.ok) return bad(home.error);` and before assigning `homeVisitAddress`:

```ts
    if (!isCoveredPostcode(home.postcode)) return bad("We don't offer home visits at that postcode yet.");
```

Replace

```ts
  const svc = bookServiceFor(service);
  const originalAmountPence = Math.round(svc.price * 100);
  let amountPence = originalAmountPence;
```

with

```ts
  const originalAmountPence = sessionPricePence(service);
  let amountPence = originalAmountPence;
  // Home visits add £15 per visit on top of the (possibly discounted) session price.
  const travelPence = travelFeePence(service, resolvedVisitType);
```

Remove `bookServiceFor` from the `@/lib/cal-services` import if nothing else in the file uses it.

The discount block stays as it is: `amountPence` becomes the discounted session price.

In the `intent` object literal, after the `homeVisitAddress` spread:

```ts
    ...(travelPence > 0 ? { travelFeePence: String(travelPence) } : {}),
```

Replace the `createStripeCheckout({...})` argument's `amountPence` and add extras:

```ts
  const result = await createStripeCheckout({
    intent,
    // The first line item is the session (after any discount); travel is its own line.
    amountPence: totalPence({ sessionPence: amountPence, discountPence: 0, travelFeePence: 0 }),
    serviceLabel: serviceLabelFor(service, resolvedVisitType),
    ...(travelPence > 0 ? { extraLineItems: [{ name: travelFeeLabel(service), amountPence: travelPence }] } : {}),
    successUrl: `${siteUrl}/book/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${siteUrl}/book?cancelled=1`,
  });
```

Update the comment above the visit-type parsing (it says home visits "cost the same") to: `// Home visits (covered postcodes only, see lib/home-visit-area) add a travel fee (lib/home-visit-pricing). Any address sent with a video booking is ignored so it is never stored. Errors never echo the address back.`

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/api/checkout-create.test.ts`
Expected: PASS (all, including the untouched video tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/checkout/create/route.ts tests/api/checkout-create.test.ts
git commit -m "checkout: home visits only for covered postcodes, plus £15 travel fee per visit

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Webhook stores the travel fee and passes it to the invoice and receipt email

**Files:**
- Modify: `app/api/payments/webhook/route.ts`
- Test: `tests/api/payments-webhook-home-visit.test.ts` (append)

**Interfaces:**
- Consumes: `BookingIntent.travelFeePence?: string` (Task 3)
- Produces: `payments/{id}.travelFeePence: number` and `bookings/{id}.travelFeePence: number` (home visits only); `generateInvoicePdf` and `sendReceiptEmail` receive `travelFeePence?: number` (Task 6 adds the parameters; until then TypeScript excess-property checks will flag the call, so Task 6 must follow directly).

- [ ] **Step 1: Write the failing tests**

Append to `tests/api/payments-webhook-home-visit.test.ts` (reuses its `signedRequest`, `eventWith`, `ADDRESS`, `paymentDocRef`, `bookingDoc`, mocks):

```ts
describe("POST /api/payments/webhook — travel fee", () => {
  it("stores the travel fee on the payment doc and the booking doc", async () => {
    await POST(signedRequest(eventWith({ visitType: "home", homeVisitAddress: ADDRESS, travelFeePence: "1500" })));
    const paid = paymentDocRef.set.mock.calls.map((c) => c[0]).find((d) => d.status === "paid");
    expect(paid.travelFeePence).toBe(1500);
    expect(bookingDoc.update.mock.calls[0][0].travelFeePence).toBe(1500);
  });

  it("passes the travel fee to the invoice and the receipt email", async () => {
    await POST(signedRequest(eventWith({ visitType: "home", homeVisitAddress: ADDRESS, travelFeePence: "1500" })));
    expect((generateInvoicePdf as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].travelFeePence).toBe(1500);
    expect((sendReceiptEmail as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].travelFeePence).toBe(1500);
  });

  it("adds no travel fee anywhere for a video booking", async () => {
    await POST(signedRequest(eventWith({})));
    const paid = paymentDocRef.set.mock.calls.map((c) => c[0]).find((d) => d.status === "paid");
    expect(paid).not.toHaveProperty("travelFeePence");
    expect((generateInvoicePdf as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toHaveProperty("travelFeePence");
    expect((sendReceiptEmail as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toHaveProperty("travelFeePence");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/api/payments-webhook-home-visit.test.ts`
Expected: FAIL on the three new tests.

- [ ] **Step 3: Implement**

In `app/api/payments/webhook/route.ts`, right after the `const homeVisit = ...` declaration:

```ts
  // Travel fee (pence) for home visits, from checkout metadata. Stored as a
  // number so receipts and invoices can show it as its own line.
  const travelFee = homeVisit && intent.travelFeePence ? Number(intent.travelFeePence) : 0;
  const travelFeeFields = travelFee > 0 ? { travelFeePence: travelFee } : {};
```

Add `...travelFeeFields,` to:
- the `paymentRef.set({ ... status: "paid", ... })` object, next to `...(homeVisit ?? {}),`
- the `bookingSnap.docs[0].ref.update({ paid: true, ... })` object, next to `...(homeVisit ?? {}),`
- the `generateInvoicePdf({ ... })` argument, after the `visitType` spread
- the `sendReceiptEmail({ ... })` argument, after `...(homeVisit ?? {}),`

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/api/payments-webhook-home-visit.test.ts tests/api/payments-webhook.test.ts`
Expected: PASS. (`npx tsc --noEmit` will still flag the two calls until Task 6; that's expected.)

- [ ] **Step 5: Commit**

```bash
git add app/api/payments/webhook/route.ts tests/api/payments-webhook-home-visit.test.ts
git commit -m "payments webhook: record the home-visit travel fee and pass it to invoice and receipt

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Receipt page, receipt email and invoice PDF show the travel-fee line

**Files:**
- Modify: `lib/invoice-pdf.ts`, `lib/emails/receipt-email.ts`, `lib/patient-receipt.ts`, `app/book/receipt/[session]/page.tsx` (the only folder under `app/book/receipt/`)
- Test: `tests/lib/invoice-pdf.test.ts`, `tests/lib/emails/receipt-email.test.ts`, `tests/lib/patient-receipt.test.ts` (append to each)

**Interfaces:**
- Consumes: stored `payments.travelFeePence: number` (Task 5); `travelFeeLabel` is NOT used here (it needs the service id); the line is labelled "Travel fee (home visit)".
- Produces: `InvoicePdfInput.travelFeePence?: number`; `sendReceiptEmail` input `travelFeePence?: number`; `ReceiptData.travelFeePence: number` (0 for video).

- [ ] **Step 1: Write the failing tests**

`tests/lib/emails/receipt-email.test.ts`: read how it captures the Resend request body (fetch stub plus `RESEND_API_KEY`), then add:

```ts
  it("shows the travel fee and the session price for a home visit", async () => {
    // reuse this file's fetch/env setup helper
    await sendReceiptEmail({
      to: "ada@example.com", patientName: "Ada", invoiceNumber: "INV-1",
      serviceLabel: "Initial Assessment (home visit)", amountPence: 5500,
      receiptUrl: "https://x/receipt", visitType: "home", homeVisitAddress: "7 Example Street, G31 4HS",
      travelFeePence: 1500,
    });
    const sent = JSON.parse(String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body));
    expect(sent.html).toContain("Travel fee:</strong> £15.00");
    expect(sent.html).toContain("Amount paid:</strong> £55.00");
    expect(sent.text).toContain("Travel fee: £15.00");
  });
```

and assert in the existing video test (or a new one) that `sent.html` does not contain `"Travel fee"`.

`tests/lib/patient-receipt.test.ts`: read its Firestore mock; add a case where the payment doc has `travelFeePence: 1500` and expect `getReceiptBySession(...)` to return `travelFeePence: 1500`; and a video case expecting `travelFeePence: 0`.

`tests/lib/invoice-pdf.test.ts`: read how it inspects the generated PDF (if it extracts text, assert `"Travel fee (home visit)"` and `"£15.00"` appear when `travelFeePence: 1500` is passed and don't appear otherwise; if it only checks that bytes are produced, add a test that `generateInvoicePdf({...validInput, visitType: "home", travelFeePence: 1500})` resolves to a non-empty `Uint8Array`, and export and test a pure helper `invoiceLineItems(input)` as described in Step 3).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/emails/receipt-email.test.ts tests/lib/patient-receipt.test.ts tests/lib/invoice-pdf.test.ts`
Expected: FAIL on the new assertions.

- [ ] **Step 3: Implement**

`lib/emails/receipt-email.ts`: add `travelFeePence?: number;` to the input type. After `const amount = ...`:

```ts
  const travel = input.travelFeePence && input.travelFeePence > 0 ? formatGbp(input.travelFeePence) : "";
```

In the HTML table, before the `Amount paid` paragraph:

```ts
          ${travel ? `<p style="margin:0 0 6px;"><strong>Travel fee:</strong> ${travel}</p>` : ""}
```

In the plain text, before `Amount paid:`: `${travel ? `Travel fee: ${travel}\n` : ""}`.

`lib/patient-receipt.ts`: add `travelFeePence: number;` to `ReceiptData`; add `travelFeePence?: number;` to the `pay` cast; return `travelFeePence: typeof pay.travelFeePence === "number" ? pay.travelFeePence : 0,`.

`app/book/receipt/[session]/page.tsx`: in the items table, the service row's amount becomes `formatGbp(r.amountPence - r.travelFeePence)`; add a second row when `r.travelFeePence > 0`:

```tsx
            {r.travelFeePence > 0 ? (
              <tr>
                <td>
                  <div className="rcpt-item-title">Travel fee (home visit)</div>
                  <div className="rcpt-item-sub">£15 per home visit</div>
                </td>
                <td>{fmtDate(r.sessionDate)}</td>
                <td className="r">{formatGbp(r.travelFeePence)}</td>
              </tr>
            ) : null}
```

Subtotal and Total paid keep `formatGbp(r.amountPence)`.

`lib/invoice-pdf.ts`: add `travelFeePence?: number;` to `InvoicePdfInput` (doc comment: "Home visits: printed as its own row; the service row shows amount minus this."). Export a pure helper:

```ts
/** The rows printed under "Service details": the service, then the travel fee if any. */
export function invoiceLineItems(input: Pick<InvoicePdfInput, "amountPence" | "serviceLabel" | "travelFeePence">) {
  const travel = input.travelFeePence && input.travelFeePence > 0 ? input.travelFeePence : 0;
  const rows = [{ label: input.serviceLabel, amountPence: input.amountPence - travel }];
  if (travel) rows.push({ label: "Travel fee (home visit)", amountPence: travel });
  return rows;
}
```

In the service-row drawing code, keep the first row exactly as now but print `formatGbp(invoiceLineItems(input)[0].amountPence)` instead of `formatGbp(input.amountPence)`. When there is a second row, draw it 40pt below (`textAt("Travel fee (home visit)", MARGIN, rowY - 40, { f: bold, size: 11.5 })`, `textRight(formatGbp(travel), right, rowY - 40, { f: bold, size: 11.5 })`), and shift `rule(rowY - 34)` and `totalY` down by 40 when the travel row is present (`const extra = travel ? 40 : 0;` then `rule(rowY - 34 - extra)` and `const totalY = rowY - 126 - extra;`). Test `invoiceLineItems` directly:

```ts
  it("splits a home visit into service and travel rows", () => {
    expect(invoiceLineItems({ amountPence: 5500, serviceLabel: "Initial Assessment (home visit)", travelFeePence: 1500 })).toEqual([
      { label: "Initial Assessment (home visit)", amountPence: 4000 },
      { label: "Travel fee (home visit)", amountPence: 1500 },
    ]);
    expect(invoiceLineItems({ amountPence: 4000, serviceLabel: "Initial Online Assessment" })).toEqual([
      { label: "Initial Online Assessment", amountPence: 4000 },
    ]);
  });
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run tests/lib/emails/receipt-email.test.ts tests/lib/patient-receipt.test.ts tests/lib/invoice-pdf.test.ts tests/api/payments-webhook-home-visit.test.ts`
Expected: PASS.
Run: `npx tsc --noEmit -p . 2>&1 | grep -E "invoice-pdf|receipt|payments/webhook|patient-receipt"`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add lib/invoice-pdf.ts lib/emails/receipt-email.ts lib/patient-receipt.ts "app/book/receipt/[session]/page.tsx" tests/lib/invoice-pdf.test.ts tests/lib/emails/receipt-email.test.ts tests/lib/patient-receipt.test.ts
git commit -m "receipts: show the home-visit travel fee as its own line (page, email, invoice PDF)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Visit-first booking step and the rail's travel-fee line

**Files:**
- Modify: `components/booking-step-service.tsx`, `components/booking-flow.tsx`, `lib/home-visit.ts` (copy only: `VISIT_TYPE_LABELS`, `HOME_VISIT_HINT`)
- Test: `tests/components/booking-visit-type.test.tsx` (update), `tests/lib/home-visit-copy.test.ts` and `tests/lib/home-visit.test.ts` (update any assertions on the changed copy)

**Interfaces:**
- Consumes: `isCoveredPostcode`, `outOfAreaMessage`, `HOME_VISIT_AREA_LABEL` (Task 1); `travelFeePence`, `sessionPricePence`, `travelFeeLabel`, `formatPounds` (Task 2); existing `validateHomeVisit`, `normalisePostcode`, `serviceLabelFor`.
- Produces: unchanged `BookingStepService` callback props, plus the new prop `onSwitchToVideo: () => void`. The rail renders `.book-rail-travel` (only for home) and `.book-rail-total-price` = session + travel.

**UI behaviour (exact):**
- Heading text of step 1 changes from "Choose your service" to "Book your appointment".
- First block, `<p id="visit-type-label" className="book-focus-eyebrow">How would you like to be seen?</p>` and a `role="radiogroup"` with two large card buttons, each `role="radio"` with `aria-checked`. Card order is home first, then video (as in the owner's screenshot):
  - Home card: title "Home visit in Glasgow", subtitle "Your physiotherapist visits you", house icon (inline SVG, `aria-hidden`).
  - Video card: title "Video consultation", subtitle "Online, anywhere in the UK", camera icon.
  - Accessible names come from the visible text (title + subtitle).
  - Class names: `book-visit-grid` wrapper, `book-visit-card` + `is-selected`. Reuse `book-service-card` visual tokens in CSS (Step 3).
- Video is selected by default (unchanged state default); `?visit=home` still preselects home.
- Home selected:
  1. Postcode field first (`id="book-home-postcode"`, label "Postcode", same attributes as today).
  2. Coverage status under it, computed live once `validateHomeVisit("x", postcode)` would accept the postcode shape (use `normalisePostcode` + the existing shape check by calling `validateHomeVisit("placeholder", postcode).ok`):
     - covered: `<p className="book-field-hint" role="status">We visit {outward code}. Home visits cover {HOME_VISIT_AREA_LABEL}.</p>`, then the Address field (`id="book-home-address"`, label "Address", unchanged attributes), then service cards.
     - not covered: `<div className="book-out-of-area" role="alert">{outOfAreaMessage(postcode)} <button type="button" onClick={onSwitchToVideo}>Book a video consultation instead</button></div>`, and **no** address field, service cards, focus areas or Continue button.
     - shape not valid yet: hint "Enter your postcode to check we visit your area." Address field and services hidden.
- Video selected: service cards, focus areas, Continue (as today).
- Service cards: price text is `formatPounds(sessionPricePence(id) + travelFeePence(id, visitType))`; for home add `<span className="book-service-travel">incl. £{travel/100} travel</span>`; card title is `serviceLabelFor(id, visitType)`.
- Continue for a home visit additionally blocks when not covered (set `visitError` to `outOfAreaMessage(postcode)`).
- Rail (`booking-flow.tsx`): when `visitType === "home"`, above the total add
  `<div className="book-rail-travel"><span>{travelFeeLabel(serviceId)}</span><span>{formatPounds(travel)}</span></div>`;
  total price text becomes `formatPounds(sessionPricePence(serviceId) + travel)`.
- Copy changes in `lib/home-visit.ts`: `VISIT_TYPE_LABELS.home = "Home visit (Glasgow area)"` stays (used by consent/admin copy elsewhere; check with grep before changing). `HOME_VISIT_HINT` becomes `` `Home visits cover ${HOME_VISIT_AREA_LABEL}.` `` (import from `lib/home-visit-area`; there's no import cycle because area imports only `normalisePostcode`. If a cycle appears, inline the label string in `lib/home-visit.ts` and have area re-export it).

- [ ] **Step 1: Update the component tests (failing first)**

In `tests/components/booking-visit-type.test.tsx`:
- Replace `getByRole('radio', { name: 'Video call (anywhere in the UK)' })` with `getByRole('radio', { name: /Video consultation/ })` and `getByRole('radio', { name: 'Home visit (Glasgow area)' })` with `getByRole('radio', { name: /Home visit in Glasgow/ })`; `toBeChecked()` becomes `toHaveAttribute('aria-checked', 'true')` (and `'false'` for `not.toBeChecked()`).
- Wherever a test types the address then the postcode, type the **postcode first** (`'g31 4hs'`), then the address (the address field only appears after a covered postcode).
- The test "reveals required, length-capped address fields..." becomes: click home, assert Postcode is required with maxLength 10 and **no** Address field yet; type `G31 4HS`; assert the status text `We visit G31.` is shown and Address is required with maxLength 120; assert `.book-rail-total-price` text is `formatPounds(sessionPricePence('initial-assessment') + 1500)` and `.book-rail-travel` contains `Travel fee (1 home visit × £15)`; click the video card and assert no Address/Postcode fields and no `.book-rail-travel`.
- The test "will not continue to times until..." becomes: click home, type `G31 4HS`, click Continue with an empty address and expect an alert matching `/address/i` (no Step 2).
- Add:

```tsx
  it('blocks an uncovered postcode and offers video instead', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), 'EH1 1AA')
    expect(await screen.findByRole('alert')).toHaveTextContent("We don't offer home visits in EH1 yet.")
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Continue to times/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Book a video consultation instead' }))
    expect(screen.getByRole('radio', { name: /Video consultation/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: /Continue to times/ })).toBeInTheDocument()
  })

  it('shows home prices including travel on the service cards', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), 'G31 4HS')
    const prices = [...document.querySelectorAll('.book-service-price')].map((n) => n.textContent)
    const { sessionPricePence, formatPounds } = await import('@/lib/home-visit-pricing')
    expect(prices).toEqual([
      formatPounds(sessionPricePence('initial-assessment') + 1500),
      formatPounds(sessionPricePence('follow-up') + 1500),
      formatPounds(sessionPricePence('bundle-4') + 6000),
      formatPounds(sessionPricePence('bundle-8') + 12000),
    ])
  })
```

- Keep "sends the home visit to checkout but keeps the address out of analytics" (with postcode typed first) and add `expect(analytics).not.toContain('G31')`. Note: `checkoutBody().homePostcode` stays `'G31 4HS'`.
- In `tests/lib/home-visit-copy.test.ts` / `tests/lib/home-visit.test.ts`, update any expectation of the old `HOME_VISIT_HINT` text to `"Home visits cover Glasgow (G1–G53), Paisley (PA1–PA3) and Hamilton (ML3)."`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/booking-visit-type.test.tsx`
Expected: FAIL (old UI).

- [ ] **Step 3: Implement**

Rewrite `components/booking-step-service.tsx` per "UI behaviour" above: keep its Props (add `onSwitchToVideo`), keep focus areas and Continue markup, move the visit block to the top of `book-panel-body` (after the optional context note), and gate the services, focus areas and Continue on `visitType === "video" || (shapeOk && covered)`. In `components/booking-flow.tsx`: pass `onSwitchToVideo={() => handleVisitTypeChange("video")}`; in `handleServiceContinue`, after `validateHomeVisit` succeeds, add `if (!isCoveredPostcode(home.postcode)) { setVisitError(outOfAreaMessage(home.postcode)); return; }`; render the rail travel line and the new total.

Add CSS to `app/globals.css`, near the other `.book-service-card` rules (find them with `grep -n "book-service-card" app/globals.css`), reusing the existing colour tokens:

```css
.book-visit-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 20px; }
.book-visit-card { display: flex; align-items: center; gap: 14px; text-align: left; padding: 18px 20px; border-radius: 16px; border: 1.5px solid var(--line, #d9dee3); background: var(--surface, #fff); cursor: pointer; font: inherit; color: inherit; }
.book-visit-card.is-selected { border-color: var(--accent, #0a77a8); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent, #0a77a8) 18%, transparent); }
.book-visit-card svg { flex: none; width: 34px; height: 34px; }
.book-visit-title { display: block; font-weight: 700; }
.book-visit-sub { display: block; font-size: 0.9rem; opacity: 0.75; }
.book-out-of-area { margin: 12px 0; padding: 14px 16px; border-radius: 12px; background: var(--wash, #f7f4ed); }
.book-out-of-area button { margin-top: 10px; display: block; }
.book-service-travel { display: block; font-size: 0.8rem; opacity: 0.75; }
.book-rail-travel { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 8px; }
```

Before writing the CSS, check the real token names used by `.book-service-card` in `app/globals.css` and use those instead of the fallbacks above.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/components/booking-visit-type.test.tsx tests/components/booking-guest-checkout.test.tsx tests/components/booking-flow.test.tsx tests/lib/home-visit-copy.test.ts tests/lib/home-visit.test.ts`
Expected: all PASS except the 2 known pre-existing failures in `booking-flow.test.tsx`. If other booking-flow or guest-checkout tests now fail because they relied on the old radio names, update them the same way as above.

- [ ] **Step 5: Commit**

```bash
git add components/booking-step-service.tsx components/booking-flow.tsx lib/home-visit.ts app/globals.css tests/components/booking-visit-type.test.tsx tests/lib/home-visit-copy.test.ts tests/lib/home-visit.test.ts tests/components/booking-guest-checkout.test.tsx tests/components/booking-flow.test.tsx
git commit -m "booking: visit-first step 1 with postcode coverage check and travel fee in the rail

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Time step charges the right total

**Files:**
- Modify: `components/booking-step-time.tsx` (lines ~190-193 amount derivation; the pay button label around line 1014)
- Test: `tests/components/booking-visit-type.test.tsx` (append)

**Interfaces:**
- Consumes: `travelFeePence`, `sessionPricePence`, `totalPence` (Task 2). `visit.visitType` is already a prop. The discount endpoint `/api/checkout/discount` returns the discounted **session** amount (unchanged).

- [ ] **Step 1: Write the failing test**

```tsx
  it('shows the session price plus travel on the pay button for a home visit', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<BookingFlow />)
    await user.click(screen.getByRole('radio', { name: /Home visit in Glasgow/ }))
    await user.type(screen.getByLabelText('Postcode'), 'G31 4HS')
    await user.type(screen.getByLabelText('Address'), '7 Example Street')
    await user.click(screen.getByRole('button', { name: /Continue to times/ }))
    const { sessionPricePence, formatPounds } = await import('@/lib/home-visit-pricing')
    const total = formatPounds(sessionPricePence('initial-assessment') + 1500)
    expect(await screen.findByRole('button', { name: new RegExp(`Continue to payment · ${total.replace('£', '£')}`) })).toBeInTheDocument()
  })
```

(If the button's accessible name is overridden by `aria-label` until a slot and consent are chosen, select a slot and tick consent first, as `payAsGuest` does, then assert on the button text with `toHaveTextContent`.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/components/booking-visit-type.test.tsx -t "pay button"`
Expected: FAIL (button shows the session price only).

- [ ] **Step 3: Implement**

Replace

```ts
  const originalAmountPence = Math.round(service.price * 100);
  const checkoutAmountPence = discountApplied && discountedAmountPence !== null
    ? discountedAmountPence
    : originalAmountPence;
```

with

```ts
  const originalAmountPence = sessionPricePence(service.id);
  // Discount codes reduce the session price only; home visits add £15 travel per visit.
  const sessionAfterDiscountPence = discountApplied && discountedAmountPence !== null
    ? discountedAmountPence
    : originalAmountPence;
  const checkoutAmountPence = totalPence({
    sessionPence: sessionAfterDiscountPence,
    discountPence: 0,
    travelFeePence: travelFeePence(service.id, visit.visitType),
  });
```

Add the import `import { sessionPricePence, totalPence, travelFeePence } from "@/lib/home-visit-pricing";`. Check whether `originalAmountPence` is used elsewhere in the file (`grep -n originalAmountPence`) and keep its meaning (the session price).

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/components/booking-visit-type.test.tsx tests/components/booking-guest-checkout.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/booking-step-time.tsx tests/components/booking-visit-type.test.tsx
git commit -m "booking: pay button total includes the home-visit travel fee

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Pricing page "Home visits in Glasgow" block

**Files:**
- Modify: `app/pricing/page.tsx`
- Test: `tests/app/pricing-page.test.tsx` (create; follow the style of an existing `tests/app/*page.test.tsx` that renders a server component, e.g. find one with `grep -l "render(" tests/app/*.tsx | head -1`)

**Interfaces:**
- Consumes: `HOME_VISIT_TRAVEL_FEE_PENCE`, `sessionPricePence`, `travelFeePence`, `formatPounds` (Task 2); `HOME_VISIT_AREA_LABEL` (Task 1).

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PricingPage from "@/app/pricing/page";
import { formatPounds, sessionPricePence } from "@/lib/home-visit-pricing";

describe("pricing page home visits", () => {
  it("explains the travel fee, the area and shows home totals", () => {
    render(<PricingPage />);
    expect(screen.getByRole("heading", { name: /Home visits in Glasgow/ })).toBeInTheDocument();
    expect(screen.getByText(/£15 travel fee per visit/)).toBeInTheDocument();
    expect(screen.getByText(/Glasgow \(G1–G53\), Paisley \(PA1–PA3\) and Hamilton \(ML3\)/)).toBeInTheDocument();
    expect(screen.getByText(formatPounds(sessionPricePence("initial-assessment") + 1500))).toBeInTheDocument();
    expect(screen.getByText(formatPounds(sessionPricePence("bundle-8") + 12000))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Book a home visit/ })).toHaveAttribute("href", "/book?visit=home");
  });
});
```

If `Reveal` or other client components break rendering in jsdom, mock them as other `tests/app` page tests do.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/app/pricing-page.test.tsx`
Expected: FAIL (no such heading).

- [ ] **Step 3: Implement**

In `app/pricing/page.tsx`, change the online section heading's span from `(UK-wide) or home visits (Glasgow area)` to `(UK-wide)`, and add a new block after the Rehab Packages `<div>` inside `pricing-sections`:

```tsx
        <div>
          <Reveal direction="up">
            <h2>Home visits in Glasgow <span>(video price + £15 travel fee per visit)</span></h2>
          </Reveal>
          <p className="muted">
            We visit {HOME_VISIT_AREA_LABEL}. The travel fee is a fixed {formatPounds(HOME_VISIT_TRAVEL_FEE_PENCE)} per visit,
            shown as its own line at checkout and on your invoice; bundles include every visit&apos;s fee upfront. Discount
            codes apply to the session price.
          </p>
          <div className="pricing-grid pricing-grid-two">
            {[...online, ...packages].map((item) => (
              <article key={item.id} className="simple-price-card">
                <h3>{serviceLabelFor(item.id, "home")}</h3>
                <strong>{formatPounds(sessionPricePence(item.id) + travelFeePence(item.id, "home"))}</strong>
                <p className="muted">
                  {formatPounds(sessionPricePence(item.id))} + {formatPounds(travelFeePence(item.id, "home"))} travel
                </p>
              </article>
            ))}
          </div>
          <Link className="button primary" href="/book?visit=home" style={{ marginTop: "1rem" }}>
            Book a home visit
          </Link>
        </div>
```

Add the imports: `serviceLabelFor` from `@/lib/cal-services`; `HOME_VISIT_AREA_LABEL` from `@/lib/home-visit-area`; `HOME_VISIT_TRAVEL_FEE_PENCE, formatPounds, sessionPricePence, travelFeePence` from `@/lib/home-visit-pricing`. Leave the `metadata` title and description unchanged (owner-approved SEO copy).

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/app/pricing-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/pricing/page.tsx tests/app/pricing-page.test.tsx
git commit -m "pricing: home visits block with £15 travel fee, covered area and totals

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Whole-stage verification

**Files:** none new (fixes only if something fails)

- [ ] **Step 1: Run every touched test area**

Run: `npx vitest run tests/lib tests/api tests/components tests/app 2>&1 | tail -25`
Expected: only the 4 known pre-existing failures listed in Global Constraints. Anything else must be fixed and committed as `fix: …`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p . 2>&1 | head -30`
Expected: no errors in files touched by this plan. Report any pre-existing errors in other files without changing them.

- [ ] **Step 3: Lint touched files**

Run: `npx next lint --file lib/home-visit-area.ts --file lib/home-visit-pricing.ts --file components/booking-step-service.tsx --file components/booking-flow.tsx --file components/booking-step-time.tsx --file app/pricing/page.tsx --file app/api/checkout/create/route.ts`
Expected: no new errors. (A plugin conflict warning about nested `.eslintrc.json` in worktrees is environmental; ignore it.)

- [ ] **Step 4: Commit any fixes**

```bash
git add -A -- lib app components tests
git commit -m "fix: stage 1 verification fixes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(Skip if there is nothing to commit.)
