# Paid Booking (Stripe) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect the full service fee (GBP), mandatory, via Stripe hosted Checkout before a Cal.com slot is confirmed, using a pay-first flow where the payment webhook creates the Cal.com booking.

**Architecture:** Booking-flow step 2 redirects to a Stripe Checkout Session instead of calling Cal.com directly. On `checkout.session.completed`, our webhook re-checks slot availability, creates the Cal.com booking via a shared helper, and records a `payments` doc. Cal.com's own `BOOKING_CREATED` webhook still creates the `bookings` Firestore doc; the two reconcile the `paid` flag by `calBookingUid` in either arrival order.

**Tech Stack:** Next.js 15 App Router, TypeScript, Stripe REST API over `fetch` (no Node SDK internals — Cloudflare Workers safe), `crypto` HMAC for webhook verification, Firestore via `lib/firebase-admin.ts` shim, Vitest.

## Global Constraints

- **Runtime:** Cloudflare Workers. No filesystem, no `new Function()`. Call Stripe's REST API over `fetch`; do NOT use `stripe.checkout.sessions.create()` SDK helpers. `crypto` from `node:crypto` is available (already used by `app/api/cal-webhook/route.ts`).
- **Currency:** GBP only. Stripe amounts are in the smallest unit: `price * 100` pence (integer).
- **Amount trust:** Always re-derive the amount server-side from `bookServiceFor(id).price`. Never accept a client-sent amount.
- **Secrets:** Server-only, set via `wrangler secret put`. Never commit to `wrangler.jsonc`. Add to `.env.example`.
- **Firestore shim:** `lib/firebase-admin.ts` implements only `collection/doc/where/orderBy/limit/get/add/set/update/delete`, `FieldValue.serverTimestamp/arrayUnion`. No transactions/collectionGroup. Idempotency uses a deterministic doc ID via `db.collection("payments").doc(eventId)`.
- **Follow existing patterns:** signature verification mirrors `verifySignature` in `app/api/cal-webhook/route.ts`; Cal.com calls mirror `app/api/cal/book/route.ts` (public v2 API, `cal-api-version: 2024-08-13`, no `CAL_API_KEY`).

---

### Task 1: Extract shared Cal.com booking helper

Pull the Cal.com POST logic out of the booking route so both the route and the payments webhook can create bookings without duplication.

**Files:**
- Create: `lib/cal-booking.ts`
- Modify: `app/api/cal/book/route.ts` (replace inline Cal POST with helper call)
- Test: `tests/lib/cal-booking.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type CreateCalBookingInput = {
    service: BookServiceId;
    startISO: string;      // ISO 8601, already validated & in the future
    name: string;
    email: string;
    timeZone: string;
    focusAreas?: string[];
  };
  export type CreateCalBookingResult =
    | { ok: true; uid: string }
    | { ok: false; status: number; error: string };
  export async function createCalBooking(input: CreateCalBookingInput): Promise<CreateCalBookingResult>;
  ```

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/cal-booking.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCalBooking } from "@/lib/cal-booking";

const OK_INPUT = {
  service: "initial-assessment" as const,
  startISO: "2999-01-01T10:00:00.000Z",
  name: "Ada Lovelace",
  email: "ada@example.com",
  timeZone: "Europe/London",
};

afterEach(() => vi.restoreAllMocks());

describe("createCalBooking", () => {
  it("posts to Cal.com and returns the uid", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { uid: "cal_abc" } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");

    const result = await createCalBooking(OK_INPUT);

    expect(result).toEqual({ ok: true, uid: "cal_abc" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.cal.com/v2/bookings");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.eventTypeSlug).toBe("initial-online-assessment");
    expect(body.username).toBe("physio");
    expect(body.attendee.email).toBe("ada@example.com");
  });

  it("returns an error result when Cal.com rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 500 })));
    vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");
    const result = await createCalBooking(OK_INPUT);
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/cal-booking.test.ts`
Expected: FAIL — cannot resolve `@/lib/cal-booking`.

- [ ] **Step 3: Write the helper**

```ts
// lib/cal-booking.ts
import { CAL_USERNAME, calServiceFor } from "@/lib/cal-services";
import type { BookServiceId } from "@/lib/site-data";

export type CreateCalBookingInput = {
  service: BookServiceId;
  startISO: string;
  name: string;
  email: string;
  timeZone: string;
  focusAreas?: string[];
};

export type CreateCalBookingResult =
  | { ok: true; uid: string }
  | { ok: false; status: number; error: string };

async function postToCal(payload: Record<string, unknown>): Promise<Response> {
  return fetch("https://api.cal.com/v2/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "cal-api-version": "2024-08-13" },
    body: JSON.stringify(payload),
  });
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

export async function createCalBooking(
  input: CreateCalBookingInput,
): Promise<CreateCalBookingResult> {
  if (!CAL_USERNAME) {
    return { ok: false, status: 503, error: "Booking calendar is not configured." };
  }

  const calSlug = calServiceFor(input.service).calSlug;
  const basePayload: Record<string, unknown> = {
    start: input.startISO,
    attendee: { name: input.name, email: input.email, timeZone: input.timeZone },
    eventTypeSlug: calSlug,
    username: CAL_USERNAME,
  };
  const cleanedFocus = input.focusAreas?.filter((f) => f.trim().length > 0);
  const payloadWithMetadata =
    cleanedFocus && cleanedFocus.length > 0
      ? { ...basePayload, metadata: { focusAreas: cleanedFocus.join(", ") } }
      : basePayload;

  let response: Response;
  try {
    response = await postToCal(payloadWithMetadata);
    if (!response.ok && payloadWithMetadata !== basePayload && response.status === 400) {
      response = await postToCal(basePayload);
    }
  } catch (error) {
    console.error("Cal.com booking request failed", error);
    return { ok: false, status: 502, error: "Unable to create booking." };
  }

  if (!response.ok) {
    console.error("Cal.com booking error status", response.status, await safeText(response));
    return { ok: false, status: 502, error: "Unable to create booking." };
  }

  let json: { data?: { uid?: unknown } };
  try {
    json = (await response.json()) as { data?: { uid?: unknown } };
  } catch {
    return { ok: false, status: 502, error: "Unable to create booking." };
  }

  const uid = json?.data?.uid;
  if (typeof uid !== "string" || !uid) {
    return { ok: false, status: 502, error: "Unable to create booking." };
  }
  return { ok: true, uid };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/cal-booking.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Refactor `app/api/cal/book/route.ts` to use the helper**

Keep all existing input validation in the route (name/email/timeZone/focusAreas/start checks). Replace the inline `postToCal`/retry/response-parsing block (everything from the local `basePayload` construction to the final `uid` extraction) with:

```ts
import { createCalBooking } from "@/lib/cal-booking";
// ...after validation, with startDate/trimmedName/trimmedEmail/resolvedTimeZone/cleanedFocusAreas in scope:
const result = await createCalBooking({
  service,
  startISO: startDate.toISOString(),
  name: trimmedName,
  email: trimmedEmail,
  timeZone: resolvedTimeZone,
  focusAreas: cleanedFocusAreas,
});
if (!result.ok) {
  return NextResponse.json(
    { ok: false, error: "Unable to create booking. Please try again or contact us directly." },
    { status: result.status },
  );
}
return NextResponse.json({ ok: true, uid: result.uid, start: startDate.toISOString(), service });
```

Delete the now-unused local `postToCal` and `safeText` from the route.

- [ ] **Step 6: Run the full suite and lint**

Run: `npm run test:run && npm run lint`
Expected: PASS, no lint errors.

- [ ] **Step 7: Commit**

```bash
git add lib/cal-booking.ts app/api/cal/book/route.ts tests/lib/cal-booking.test.ts
git commit -m "refactor(booking): extract shared createCalBooking helper"
```

---

### Task 2: Payments provider interface + Stripe checkout session creation

**Files:**
- Create: `lib/payments/index.ts`, `lib/payments/stripe.ts`
- Test: `tests/lib/payments/stripe.test.ts`

**Interfaces:**
- Consumes: `bookServiceFor(id)` from `lib/cal-services.ts` (returns `CalService & PricingItem`, has `.price`, `.name`).
- Produces:
  ```ts
  // lib/payments/index.ts
  export type BookingIntent = {
    service: BookServiceId;
    startISO: string;
    name: string;
    email: string;
    timeZone: string;
    focusAreas?: string[];
  };
  export type CreateCheckoutInput = {
    intent: BookingIntent;
    amountPence: number;      // integer, GBP minor units
    serviceLabel: string;
    successUrl: string;
    cancelUrl: string;
  };
  export type CreateCheckoutResult =
    | { ok: true; url: string; sessionId: string }
    | { ok: false; error: string };

  // lib/payments/stripe.ts
  export async function createStripeCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  ```
  `BookingIntent` fields are flattened into Stripe `metadata` (all string values) so the webhook can rebuild the booking.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/payments/stripe.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createStripeCheckout } from "@/lib/payments/stripe";

const INPUT = {
  intent: {
    service: "initial-assessment" as const,
    startISO: "2999-01-01T10:00:00.000Z",
    name: "Ada Lovelace",
    email: "ada@example.com",
    timeZone: "Europe/London",
  },
  amountPence: 5000,
  serviceLabel: "Initial Assessment",
  successUrl: "https://site.test/book/success?session_id={CHECKOUT_SESSION_ID}",
  cancelUrl: "https://site.test/book?cancelled=1",
};

afterEach(() => vi.restoreAllMocks());

describe("createStripeCheckout", () => {
  it("posts a GBP checkout session and returns the redirect url", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "cs_123", url: "https://checkout.stripe.com/c/cs_123" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");

    const result = await createStripeCheckout(INPUT);

    expect(result).toEqual({ ok: true, url: "https://checkout.stripe.com/c/cs_123", sessionId: "cs_123" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.stripe.com/v1/checkout/sessions");
    expect((init as RequestInit).method).toBe("POST");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sk_test_x");
    const body = (init as RequestInit).body as string;
    expect(body).toContain("currency=gbp");
    expect(body).toContain("unit_amount=5000");
    expect(body).toContain("mode=payment");
    expect(body).toContain(encodeURIComponent("metadata[email]"));
  });

  it("returns an error when STRIPE_SECRET_KEY is missing", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const result = await createStripeCheckout(INPUT);
    expect(result.ok).toBe(false);
  });

  it("returns an error when Stripe responds non-2xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 400 })));
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    const result = await createStripeCheckout(INPUT);
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/payments/stripe.test.ts`
Expected: FAIL — cannot resolve `@/lib/payments/stripe`.

- [ ] **Step 3: Write the interface and Stripe implementation**

```ts
// lib/payments/index.ts
import type { BookServiceId } from "@/lib/site-data";

export type BookingIntent = {
  service: BookServiceId;
  startISO: string;
  name: string;
  email: string;
  timeZone: string;
  focusAreas?: string[];
};

export type CreateCheckoutInput = {
  intent: BookingIntent;
  amountPence: number;
  serviceLabel: string;
  successUrl: string;
  cancelUrl: string;
};

export type CreateCheckoutResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; error: string };

/** Flatten a BookingIntent into Stripe metadata (string values only). */
export function intentToMetadata(intent: BookingIntent): Record<string, string> {
  return {
    service: intent.service,
    startISO: intent.startISO,
    name: intent.name,
    email: intent.email,
    timeZone: intent.timeZone,
    focusAreas: (intent.focusAreas ?? []).join(", "),
  };
}

/** Rebuild a BookingIntent from Stripe metadata. Returns null if required fields are missing. */
export function metadataToIntent(meta: Record<string, string> | undefined): BookingIntent | null {
  if (!meta) return null;
  const { service, startISO, name, email, timeZone } = meta;
  if (!service || !startISO || !name || !email || !timeZone) return null;
  const focusAreas = meta.focusAreas
    ? meta.focusAreas.split(",").map((f) => f.trim()).filter(Boolean)
    : undefined;
  return { service: service as BookServiceId, startISO, name, email, timeZone, focusAreas };
}
```

```ts
// lib/payments/stripe.ts
import { intentToMetadata, type CreateCheckoutInput, type CreateCheckoutResult } from "@/lib/payments";

/**
 * Stripe hosted Checkout over the REST API (Cloudflare Workers safe — no SDK internals).
 * Renders the standard UK payment screen (Apple Pay / Google Pay / card) when those
 * wallets are enabled in the Stripe dashboard.
 */
export async function createStripeCheckout(
  input: CreateCheckoutInput,
): Promise<CreateCheckoutResult> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { ok: false, error: "Payments are not configured." };

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", input.successUrl);
  form.set("cancel_url", input.cancelUrl);
  form.set("customer_email", input.intent.email);
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "gbp");
  form.set("line_items[0][price_data][unit_amount]", String(input.amountPence));
  form.set("line_items[0][price_data][product_data][name]", input.serviceLabel);
  for (const [key, value] of Object.entries(intentToMetadata(input.intent))) {
    form.set(`metadata[${key}]`, value);
  }

  let response: Response;
  try {
    response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
  } catch (error) {
    console.error("Stripe checkout request failed", error);
    return { ok: false, error: "Unable to start payment." };
  }

  if (!response.ok) {
    console.error("Stripe checkout error status", response.status, await response.text().catch(() => ""));
    return { ok: false, error: "Unable to start payment." };
  }

  const json = (await response.json()) as { id?: string; url?: string };
  if (!json.id || !json.url) return { ok: false, error: "Unable to start payment." };
  return { ok: true, url: json.url, sessionId: json.id };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/payments/stripe.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/payments/index.ts lib/payments/stripe.ts tests/lib/payments/stripe.test.ts
git commit -m "feat(payments): add provider interface + Stripe checkout session creation"
```

---

### Task 3: Stripe webhook signature verification

**Files:**
- Modify: `lib/payments/stripe.ts` (add `verifyStripeSignature`)
- Test: `tests/lib/payments/stripe-webhook.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): boolean;
  ```
  Implements Stripe's scheme: header `t=<ts>,v1=<hex>`, signed payload = `${t}.${rawBody}`, HMAC-SHA256 with `secret`, constant-time compare against `v1`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/payments/stripe-webhook.test.ts
import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "@/lib/payments/stripe";

const SECRET = "whsec_test";
const BODY = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });

function sign(body: string, ts: number, secret: string): string {
  const v1 = crypto.createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  return `t=${ts},v1=${v1}`;
}

describe("verifyStripeSignature", () => {
  it("accepts a correctly signed payload", () => {
    const header = sign(BODY, Math.floor(Date.now() / 1000), SECRET);
    expect(verifyStripeSignature(BODY, header, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const header = sign(BODY, Math.floor(Date.now() / 1000), SECRET);
    expect(verifyStripeSignature(BODY + "x", header, SECRET)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    const header = sign(BODY, Math.floor(Date.now() / 1000), SECRET);
    expect(verifyStripeSignature(BODY, header, "whsec_other")).toBe(false);
  });

  it("rejects a malformed header", () => {
    expect(verifyStripeSignature(BODY, "garbage", SECRET)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/payments/stripe-webhook.test.ts`
Expected: FAIL — `verifyStripeSignature` is not exported.

- [ ] **Step 3: Add the verifier to `lib/payments/stripe.ts`**

```ts
import crypto from "node:crypto";
// ...existing imports...

export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  if (!secret || !signatureHeader) return false;
  try {
    const parts = Object.fromEntries(
      signatureHeader.split(",").map((kv) => {
        const [k, v] = kv.split("=");
        return [k, v];
      }),
    ) as Record<string, string>;
    const timestamp = parts.t;
    const provided = parts.v1;
    if (!timestamp || !provided) return false;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/payments/stripe-webhook.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/payments/stripe.ts tests/lib/payments/stripe-webhook.test.ts
git commit -m "feat(payments): add Stripe webhook signature verification"
```

---

### Task 4: `POST /api/checkout/create` route

**Files:**
- Create: `app/api/checkout/create/route.ts`
- Test: `tests/api/checkout-create.test.ts`

**Interfaces:**
- Consumes: `createStripeCheckout` (Task 2), `isBookServiceId`/`bookServiceFor` from `lib/cal-services.ts`.
- Request body: `{ service, start, name, email, timeZone?, focusAreas? }` (same shape the UI already sends to `/api/cal/book`).
- Response: `{ ok: true, url: string }` (302-style redirect handled client-side) or `{ ok: false, error }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/api/checkout-create.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/payments/stripe", () => ({
  createStripeCheckout: vi.fn(),
}));
import { createStripeCheckout } from "@/lib/payments/stripe";
import { POST } from "@/app/api/checkout/create/route";

function req(body: unknown) {
  return new Request("http://localhost/api/checkout/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID = {
  service: "initial-assessment",
  start: "2999-01-01T10:00:00.000Z",
  name: "Ada Lovelace",
  email: "ada@example.com",
  timeZone: "Europe/London",
};

afterEach(() => vi.restoreAllMocks());

describe("POST /api/checkout/create", () => {
  it("derives the amount server-side and returns the checkout url", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.test");
    (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, url: "https://checkout.stripe.com/c/cs_1", sessionId: "cs_1",
    });
    const res = await POST(req(VALID));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, url: "https://checkout.stripe.com/c/cs_1" });
    // initial-assessment price is £50 -> 5000 pence
    const arg = (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.amountPence).toBe(5000);
    expect(arg.intent.service).toBe("initial-assessment");
  });

  it("rejects an unknown service", async () => {
    const res = await POST(req({ ...VALID, service: "not-real" }));
    expect(res.status).toBe(400);
  });

  it("rejects a past start time", async () => {
    const res = await POST(req({ ...VALID, start: "2000-01-01T10:00:00.000Z" }));
    expect(res.status).toBe(400);
  });

  it("ignores any client-sent amount", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.test");
    (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, url: "https://checkout.stripe.com/c/cs_1", sessionId: "cs_1",
    });
    await POST(req({ ...VALID, amountPence: 1 }));
    const arg = (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.amountPence).toBe(5000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/checkout-create.test.ts`
Expected: FAIL — cannot resolve the route module.

- [ ] **Step 3: Write the route**

```ts
// app/api/checkout/create/route.ts
import { NextResponse } from "next/server";

import { bookServiceFor, isBookServiceId } from "@/lib/cal-services";
import { createStripeCheckout } from "@/lib/payments/stripe";
import type { BookingIntent } from "@/lib/payments";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_TIMEZONE = "Europe/London";

type Body = {
  service?: unknown;
  start?: unknown;
  name?: unknown;
  email?: unknown;
  timeZone?: unknown;
  focusAreas?: unknown;
};

function bad(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return bad("Invalid request body.");
  }

  const { service, start, name, email, timeZone, focusAreas } = body;

  if (!isBookServiceId(service)) return bad("Invalid or missing service.");
  if (typeof start !== "string" || start.trim() === "") return bad("Invalid or missing start time.");
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return bad("Invalid start time.");
  if (startDate.getTime() <= Date.now()) return bad("start must be in the future.");

  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName || trimmedName.length > 100) return bad("Invalid or missing name.");

  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  if (!trimmedEmail || trimmedEmail.length > 200 || !EMAIL_PATTERN.test(trimmedEmail)) {
    return bad("Invalid or missing email.");
  }

  let resolvedTimeZone = DEFAULT_TIMEZONE;
  if (timeZone !== undefined && timeZone !== null) {
    if (typeof timeZone !== "string" || timeZone.trim() === "" || timeZone.length > 64) {
      return bad("Invalid timeZone.");
    }
    resolvedTimeZone = timeZone;
  }

  const cleanedFocus = Array.isArray(focusAreas)
    ? focusAreas.filter((f): f is string => typeof f === "string" && f.trim().length > 0).slice(0, 10)
    : undefined;

  const svc = bookServiceFor(service);
  const amountPence = Math.round(svc.price * 100);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const intent: BookingIntent = {
    service,
    startISO: startDate.toISOString(),
    name: trimmedName,
    email: trimmedEmail,
    timeZone: resolvedTimeZone,
    focusAreas: cleanedFocus,
  };

  const result = await createStripeCheckout({
    intent,
    amountPence,
    serviceLabel: svc.name,
    successUrl: `${siteUrl}/book/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${siteUrl}/book?cancelled=1`,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, url: result.url });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/checkout-create.test.ts`
Expected: PASS (4 tests).

> Note: if `bookServiceFor(...).name` is not present, use `svc.tier`/the display field on `PricingItem` — confirm the field name in `lib/site-data.ts` `PricingItem` and use the human-readable label. The test asserts `amountPence`, not the label, so the label field choice won't break tests but must be a real property.

- [ ] **Step 5: Commit**

```bash
git add app/api/checkout/create/route.ts tests/api/checkout-create.test.ts
git commit -m "feat(payments): add /api/checkout/create route"
```

---

### Task 5: `POST /api/payments/webhook` route

Handles `checkout.session.completed`: verify signature, idempotency, re-check slot, create Cal booking, record payment, reconcile `paid`.

**Files:**
- Create: `app/api/payments/webhook/route.ts`
- Test: `tests/api/payments-webhook.test.ts`

**Interfaces:**
- Consumes: `verifyStripeSignature` (Task 3), `metadataToIntent` (Task 2), `createCalBooking` (Task 1), `getAdminDb`/`FieldValue` from `lib/firebase-admin.ts`, `bookServiceFor` for `slotIsFree` re-check via `/v2/slots`.
- Idempotency: `db.collection("payments").doc(event.id)` — if it exists, return 200 without side effects.
- Payment doc shape (written on success):
  ```ts
  {
    provider: "stripe",
    stripeSessionId: string,
    calBookingUid: string,
    amountPence: number,
    currency: "gbp",
    status: "paid",
    email: string,
    service: BookServiceId,
    createdAt: FieldValue.serverTimestamp(),
  }
  ```

- [ ] **Step 1: Write the failing test**

```ts
// tests/api/payments-webhook.test.ts
import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const bookingDoc = { update: vi.fn().mockResolvedValue(undefined) };
const paymentDocRef = {
  get: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
};
const db = {
  collection: vi.fn((name: string) => {
    if (name === "payments") {
      return { doc: vi.fn(() => paymentDocRef) };
    }
    // bookings lookup by calBookingUid
    return {
      where: () => ({ limit: () => ({ get: async () => ({ empty: false, docs: [{ ref: bookingDoc }] }) }) }),
    };
  }),
};

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => db,
  FieldValue: { serverTimestamp: () => "TS" },
}));
vi.mock("@/lib/cal-booking", () => ({
  createCalBooking: vi.fn().mockResolvedValue({ ok: true, uid: "cal_xyz" }),
}));
// slot re-check helper lives in the route module's dependency; stub global fetch for /v2/slots
import { createCalBooking } from "@/lib/cal-booking";
import { POST } from "@/app/api/payments/webhook/route";

const SECRET = "whsec_test";

function signedRequest(event: unknown) {
  const body = JSON.stringify(event);
  const ts = Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");
  return new Request("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: { "stripe-signature": `t=${ts},v1=${v1}` },
    body,
  });
}

const EVENT = {
  id: "evt_1",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_1",
      amount_total: 5000,
      currency: "gbp",
      metadata: {
        service: "initial-assessment",
        startISO: "2999-01-01T10:00:00.000Z",
        name: "Ada Lovelace",
        email: "ada@example.com",
        timeZone: "Europe/London",
        focusAreas: "",
      },
    },
  },
};

beforeEach(() => {
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", SECRET);
  vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");
  paymentDocRef.get.mockResolvedValue({ exists: false });
  // slot re-check: return the requested start as available
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { "2999-01-01": [{ start: "2999-01-01T10:00:00.000Z" }] } }), {
        status: 200,
      }),
    ),
  );
});
afterEach(() => vi.restoreAllMocks());

describe("POST /api/payments/webhook", () => {
  it("creates the Cal booking and records the payment on a valid event", async () => {
    const res = await POST(signedRequest(EVENT));
    expect(res.status).toBe(200);
    expect(createCalBooking).toHaveBeenCalledOnce();
    expect(paymentDocRef.set).toHaveBeenCalledOnce();
    const written = paymentDocRef.set.mock.calls[0][0];
    expect(written.calBookingUid).toBe("cal_xyz");
    expect(written.amountPence).toBe(5000);
    expect(written.status).toBe("paid");
  });

  it("rejects an invalid signature", async () => {
    const bad = new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=deadbeef" },
      body: JSON.stringify(EVENT),
    });
    const res = await POST(bad);
    expect(res.status).toBe(400);
    expect(createCalBooking).not.toHaveBeenCalled();
  });

  it("is idempotent when the event was already processed", async () => {
    paymentDocRef.get.mockResolvedValue({ exists: true });
    const res = await POST(signedRequest(EVENT));
    expect(res.status).toBe(200);
    expect(createCalBooking).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/payments-webhook.test.ts`
Expected: FAIL — cannot resolve the route module.

- [ ] **Step 3: Write the route**

```ts
// app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";

import { createCalBooking } from "@/lib/cal-booking";
import { FieldValue, getAdminDb } from "@/lib/firebase-admin";
import { metadataToIntent } from "@/lib/payments";
import { verifyStripeSignature } from "@/lib/payments/stripe";
import { CAL_USERNAME, calServiceFor } from "@/lib/cal-services";
import type { BookServiceId } from "@/lib/site-data";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      amount_total?: number;
      currency?: string;
      metadata?: Record<string, string>;
    };
  };
};

/** Confirm the exact slot is still offered by Cal.com before we book it. */
async function slotStillFree(service: BookServiceId, startISO: string): Promise<boolean> {
  if (!CAL_USERNAME) return false;
  const day = startISO.slice(0, 10); // YYYY-MM-DD
  const url = new URL("https://api.cal.com/v2/slots");
  url.searchParams.set("eventTypeSlug", calServiceFor(service).calSlug);
  url.searchParams.set("username", CAL_USERNAME);
  url.searchParams.set("start", day);
  url.searchParams.set("end", day);
  try {
    const res = await fetch(url.toString(), { headers: { "cal-api-version": "2024-08-13" } });
    if (!res.ok) return false;
    const json = (await res.json()) as { data?: Record<string, Array<{ start?: string }>> };
    const wanted = new Date(startISO).getTime();
    for (const slots of Object.values(json.data ?? {})) {
      for (const slot of slots ?? []) {
        if (slot.start && new Date(slot.start).getTime() === wanted) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  // Idempotency: deterministic doc id per Stripe event.
  const paymentRef = db.collection("payments").doc(event.id);
  const existing = await paymentRef.get();
  if (existing.exists) return NextResponse.json({ received: true }, { status: 200 });

  const session = event.data.object;
  const intent = metadataToIntent(session.metadata);
  if (!intent) {
    console.error("Stripe webhook missing booking metadata", session.id);
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  if (!(await slotStillFree(intent.service, intent.startISO))) {
    // Slot lost between checkout and webhook. Record for admin follow-up/refund.
    await paymentRef.set({
      provider: "stripe",
      stripeSessionId: session.id,
      calBookingUid: "",
      amountPence: session.amount_total ?? 0,
      currency: session.currency ?? "gbp",
      status: "slot_unavailable",
      email: intent.email,
      service: intent.service,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.error("Paid but slot unavailable — refund required", session.id);
    return NextResponse.json({ received: true, warning: "slot_unavailable" }, { status: 200 });
  }

  const booking = await createCalBooking({
    service: intent.service,
    startISO: intent.startISO,
    name: intent.name,
    email: intent.email,
    timeZone: intent.timeZone,
    focusAreas: intent.focusAreas,
  });

  if (!booking.ok) {
    await paymentRef.set({
      provider: "stripe",
      stripeSessionId: session.id,
      calBookingUid: "",
      amountPence: session.amount_total ?? 0,
      currency: session.currency ?? "gbp",
      status: "booking_failed",
      email: intent.email,
      service: intent.service,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.error("Paid but Cal booking failed — refund required", session.id);
    return NextResponse.json({ received: true, warning: "booking_failed" }, { status: 200 });
  }

  await paymentRef.set({
    provider: "stripe",
    stripeSessionId: session.id,
    calBookingUid: booking.uid,
    amountPence: session.amount_total ?? 0,
    currency: session.currency ?? "gbp",
    status: "paid",
    email: intent.email,
    service: intent.service,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Reconcile: if cal-webhook already created the bookings doc, stamp it paid.
  // If it hasn't yet, cal-webhook will find this payment doc (Task 6).
  try {
    const bookingSnap = await db
      .collection("bookings")
      .where("calBookingUid", "==", booking.uid)
      .limit(1)
      .get();
    if (!bookingSnap.empty) {
      await bookingSnap.docs[0].ref.update({
        paid: true,
        amountPaidPence: session.amount_total ?? 0,
        paymentProvider: "stripe",
      });
    }
  } catch (error) {
    console.error("Payment recorded but booking paid-flag update failed", error);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/payments-webhook.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/payments/webhook/route.ts tests/api/payments-webhook.test.ts
git commit -m "feat(payments): add Stripe payments webhook (pay-first booking)"
```

---

### Task 6: Reconcile `paid` flag in the Cal.com webhook

When `cal-webhook` creates a `bookings` doc, check for a matching `payments` doc and stamp `paid`.

**Files:**
- Modify: `app/api/cal-webhook/route.ts` (inside the `existingSnap.empty` branch, after `bookingRef` is created)
- Test: `tests/api/cal-webhook-paid.test.ts` (new focused test; do not rewrite existing cal-webhook tests)

**Interfaces:**
- Consumes: the `payments` collection written by Task 5, queried by `calBookingUid`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/api/cal-webhook-paid.test.ts
// Focused test: after creating a booking doc, cal-webhook stamps paid=true
// when a matching payments doc exists. Mock getAdminDb so `bookings` add()
// returns a ref whose update() we assert, and `payments` where() returns a paid doc.
// (Model this on the existing tests/api/cal-webhook.test.ts setup — reuse its
//  signature-signing helper and body shape.)
import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const bookingRef = { update: vi.fn().mockResolvedValue(undefined) };
const db = {
  collection: vi.fn((name: string) => {
    if (name === "bookings") {
      return {
        where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
        add: vi.fn(async () => bookingRef),
      };
    }
    if (name === "payments") {
      return {
        where: () => ({
          limit: () => ({
            get: async () => ({ empty: false, docs: [{ data: () => ({ amountPence: 5000, status: "paid" }) }] }),
          }),
        }),
      };
    }
    // users / patients lookups -> empty
    return { where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }) };
  }),
  doc: () => ({ get: async () => ({ exists: false }), delete: vi.fn(), update: vi.fn() }),
};

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => db,
  FieldValue: { serverTimestamp: () => "TS" },
}));
import { POST } from "@/app/api/cal-webhook/route";

const SECRET = "cal_secret";
function signed(body: string) {
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
  return new Request("http://localhost/api/cal-webhook", {
    method: "POST",
    headers: { "X-Cal-Signature-256": sig },
    body,
  });
}

const BODY = JSON.stringify({
  triggerEvent: "BOOKING_CREATED",
  payload: {
    uid: "cal_xyz",
    startTime: "2999-01-01T10:00:00.000Z",
    attendees: [{ name: "Ada", email: "ada@example.com" }],
    eventType: { title: "Initial Assessment" },
  },
});

beforeEach(() => vi.stubEnv("CAL_WEBHOOK_SECRET", SECRET));
afterEach(() => vi.restoreAllMocks());

describe("cal-webhook paid reconciliation", () => {
  it("stamps paid=true when a matching payments doc exists", async () => {
    const res = await POST(signed(BODY));
    expect(res.status).toBe(200);
    const updates = bookingRef.update.mock.calls.map((c) => c[0]);
    expect(updates.some((u) => u.paid === true && u.amountPaidPence === 5000)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/cal-webhook-paid.test.ts`
Expected: FAIL — booking is never stamped `paid` (assertion false).

- [ ] **Step 3: Add reconciliation to `app/api/cal-webhook/route.ts`**

Immediately after `const bookingRef = await db.collection("bookings").add({ ... })` (and before the users/patients linking block), insert:

```ts
        // Paid-booking reconciliation: if the payment webhook already recorded
        // a payment for this Cal booking, stamp the booking as paid. If the
        // payment webhook arrives later, it stamps the booking itself (see
        // app/api/payments/webhook/route.ts).
        try {
          const paymentSnap = await db
            .collection("payments")
            .where("calBookingUid", "==", booking.uid)
            .limit(1)
            .get();
          if (!paymentSnap.empty) {
            const pay = paymentSnap.docs[0].data() as { amountPence?: number; status?: string };
            if (pay.status === "paid") {
              await bookingRef.update({
                paid: true,
                amountPaidPence: pay.amountPence ?? 0,
                paymentProvider: "stripe",
              });
            }
          }
        } catch (error) {
          console.error("cal-webhook paid reconciliation failed", error);
        }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/cal-webhook-paid.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the whole suite (guard against regressions in existing cal-webhook tests)**

Run: `npm run test:run`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/cal-webhook/route.ts tests/api/cal-webhook-paid.test.ts
git commit -m "feat(payments): reconcile paid flag in Cal.com webhook"
```

---

### Task 7: Booking-flow redirect + success page

Switch booking-step-time to redirect to Stripe, and add a success page that reads booking status.

**Files:**
- Modify: `components/booking-step-time.tsx:357-379` (replace the `/api/cal/book` fetch + `onConfirmed` with a redirect to Checkout)
- Create: `app/api/checkout/status/route.ts` (poll payment status by `session_id`)
- Create: `app/book/success/page.tsx` (client page: poll status, show confirmation)
- Test: `tests/api/checkout-status.test.ts`

**Interfaces:**
- `GET /api/checkout/status?session_id=cs_x` → `{ status: "paid" | "pending" | "slot_unavailable" | "booking_failed", service?, calBookingUid? }`. Looks up the `payments` collection by `stripeSessionId`.

- [ ] **Step 1: Write the failing test for the status route**

```ts
// tests/api/checkout-status.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

const db = {
  collection: () => ({
    where: () => ({
      limit: () => ({
        get: async () => ({
          empty: false,
          docs: [{ data: () => ({ status: "paid", service: "initial-assessment", calBookingUid: "cal_xyz" }) }],
        }),
      }),
    }),
  }),
};
vi.mock("@/lib/firebase-admin", () => ({ getAdminDb: () => db }));
import { GET } from "@/app/api/checkout/status/route";

afterEach(() => vi.restoreAllMocks());

describe("GET /api/checkout/status", () => {
  it("returns paid status for a known session", async () => {
    const res = await GET(new Request("http://localhost/api/checkout/status?session_id=cs_1"));
    const json = await res.json();
    expect(json.status).toBe("paid");
    expect(json.calBookingUid).toBe("cal_xyz");
  });

  it("returns pending when no payment doc exists yet", async () => {
    const emptyDb = {
      collection: () => ({ where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }) }),
    };
    vi.doMock("@/lib/firebase-admin", () => ({ getAdminDb: () => emptyDb }));
    const { GET: GET2 } = await import("@/app/api/checkout/status/route?pending");
    const res = await GET2(new Request("http://localhost/api/checkout/status?session_id=cs_none"));
    const json = await res.json();
    expect(json.status).toBe("pending");
  });
});
```

> If the `vi.doMock` + re-import pattern for the second case is awkward under the project's Vitest config, split it into its own file `tests/api/checkout-status-pending.test.ts` with the empty-db mock at top level. Keep both assertions.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/checkout-status.test.ts`
Expected: FAIL — route module not found.

- [ ] **Step 3: Write the status route**

```ts
// app/api/checkout/status/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!sessionId) return NextResponse.json({ status: "pending" }, { status: 200 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ status: "pending" }, { status: 200 });

  const snap = await db
    .collection("payments")
    .where("stripeSessionId", "==", sessionId)
    .limit(1)
    .get();

  if (snap.empty) return NextResponse.json({ status: "pending" }, { status: 200 });

  const pay = snap.docs[0].data() as {
    status?: string;
    service?: string;
    calBookingUid?: string;
  };
  return NextResponse.json(
    { status: pay.status ?? "pending", service: pay.service, calBookingUid: pay.calBookingUid },
    { status: 200 },
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/checkout-status.test.ts`
Expected: PASS.

- [ ] **Step 5: Modify `components/booking-step-time.tsx` to redirect to Checkout**

Replace the block at lines ~357–379 (the `const res = await fetch("/api/cal/book", ...)` through the `onConfirmed({...})` call) with:

```ts
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: service.id,
          start: selectedSlot,
          name: attendeeName,
          email: attendeeEmail,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          focusAreas,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        setError("We couldn't start payment. Please try again.");
        return;
      }
      // Redirect to Stripe's hosted Checkout (standard UK payment screen).
      window.location.href = data.url as string;
      return;
```

`onConfirmed` and the `BookingConfirmation` prop may now be unused in this file's happy path. Leave the prop in place (the parent passes it) but if TypeScript/ESLint flags `onConfirmed` as unused, keep the type and reference it in a `void onConfirmed;` no-op comment, OR — cleaner — keep step 3's in-app confirmation as a fallback for a future £0 service. Do NOT delete the parent wiring in this task.

- [ ] **Step 6: Write the success page**

```tsx
// app/book/success/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Status = "pending" | "paid" | "slot_unavailable" | "booking_failed";

export default function BookingSuccessPage() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") ?? "";
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let tries = 0;
    async function poll() {
      tries += 1;
      try {
        const res = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`);
        const data = (await res.json()) as { status: Status };
        if (cancelled) return;
        setStatus(data.status);
        if (data.status === "pending" && tries < 10) {
          setTimeout(poll, 2000);
        }
      } catch {
        if (!cancelled && tries < 10) setTimeout(poll, 2000);
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <main className="book-panel" style={{ maxWidth: 560, margin: "0 auto", padding: "3rem 1.5rem" }}>
      {status === "paid" && (
        <>
          <h1 className="book-panel-title">Payment received — you&apos;re booked</h1>
          <p>Thank you. We&apos;ve confirmed your session and a confirmation email is on its way.</p>
          <Link href="/patient/appointments">View my appointments</Link>
        </>
      )}
      {status === "pending" && (
        <>
          <h1 className="book-panel-title">Confirming your booking…</h1>
          <p>Your payment went through. We&apos;re just confirming your slot — this takes a few seconds.</p>
        </>
      )}
      {(status === "slot_unavailable" || status === "booking_failed") && (
        <>
          <h1 className="book-panel-title">We hit a snag confirming your slot</h1>
          <p>
            Your payment was received but we couldn&apos;t lock in that time. Our team will contact you to
            rebook or refund. Please <Link href="/contact">get in touch</Link> if you&apos;d like to sort it now.
          </p>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 7: Run tests, lint, and type-check via build-lint**

Run: `npm run test:run && npm run lint`
Expected: PASS, no lint errors.

- [ ] **Step 8: Commit**

```bash
git add components/booking-step-time.tsx app/api/checkout/status/route.ts app/book/success/page.tsx tests/api/checkout-status.test.ts
git commit -m "feat(payments): redirect booking to Stripe Checkout + success page"
```

---

### Task 8: Environment config + docs

**Files:**
- Modify: `.env.example`
- Modify: `CLAUDE.md` (env-vars section — Stripe is no longer vestigial)

- [ ] **Step 1: Add the new vars to `.env.example`**

```bash
# --- Payments (Stripe) ---
# Server-only. On Cloudflare, set with: wrangler secret put STRIPE_SECRET_KEY
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- [ ] **Step 2: Update `CLAUDE.md`**

In the "Booking flow" section, replace the line stating Stripe is "largely vestigial ... there is no checkout route anymore" with:

```markdown
Payments: paid booking runs through Stripe hosted Checkout. `app/api/checkout/create/`
creates a Checkout Session (amount derived server-side from `lib/site-data.ts`),
`app/api/payments/webhook/` verifies the Stripe signature and creates the Cal.com booking
after payment (pay-first), and `app/api/checkout/status/` backs the `/book/success` page.
`lib/payments/` holds the provider interface + Stripe implementation (REST over `fetch`,
Workers-safe). PayPal is a planned phase-2 provider behind the same interface.
```

Add `STRIPE_WEBHOOK_SECRET` to the "Key server-only vars" list.

- [ ] **Step 3: Commit**

```bash
git add .env.example CLAUDE.md
git commit -m "docs(payments): document Stripe env vars and paid-booking flow"
```

---

### Task 9: Sandbox end-to-end verification (manual, guided)

No code — this is the "test" half of the request. The implementer walks the owner through it and captures proof.

- [ ] **Step 1:** In the Stripe dashboard (test mode), enable Apple Pay, Google Pay, and card payments; copy the **test** secret key.
- [ ] **Step 2:** Create `.env.local` (copy from `.env.example`) with `STRIPE_SECRET_KEY=sk_test_...` and a placeholder `STRIPE_WEBHOOK_SECRET` (filled in step 4). Ensure Firebase emulator or a test project is configured per CLAUDE.md dev-safety note.
- [ ] **Step 3:** Start the dev server (via the preview tool, not `npm run dev` in Bash): `npm run dev` config → http://localhost:3000.
- [ ] **Step 4:** In a terminal run `stripe login` then `stripe listen --forward-to localhost:3000/api/payments/webhook`. Copy the printed `whsec_...` into `.env.local` as `STRIPE_WEBHOOK_SECRET` and restart the dev server.
- [ ] **Step 5:** Go to `/book`, pick a service and slot, click "Continue to secure payment", and pay with test card `4242 4242 4242 4242` (any future expiry, any CVC, any postcode).
- [ ] **Step 6:** Confirm the `stripe listen` terminal shows `checkout.session.completed` forwarded with a 200. Confirm a `payments` doc with `status: "paid"` and a `bookings` doc with `paid: true` exist in Firestore. Confirm `/book/success` shows "you're booked".
- [ ] **Step 7:** Capture a screenshot of the success page and the Firestore docs; share with the owner. Do NOT switch to live keys until the owner approves.

---

## Phase 2 (separate plan): PayPal

Deferred per the spec. When ready, add `lib/payments/paypal.ts` implementing the same
`CreateCheckoutResult` interface (PayPal Orders v2 REST), a provider switch in
`/api/checkout/create` keyed on a `provider` body field, PayPal order-webhook verification
in `/api/payments/webhook` (or a sibling route), and `PAYPAL_*` env vars. Reuse
`createCalBooking`, `metadataToIntent`, and the `payments`/reconciliation machinery
unchanged. This will get its own plan file.

---

## Self-Review Notes

- **Spec coverage:** pay-first flow (Tasks 1,5,7), server-derived amount (Task 4), standard UK screen via hosted Checkout (Task 7 + Stripe dashboard step in Task 9), webhook-confirms source of truth (Task 5), idempotency (Task 5), slot re-check + refund-needed path (Task 5, surfaced in Task 7 success page), unit tests mirroring firebase-admin style (all tasks), sandbox e2e (Task 9), env/secrets (Task 8). PayPal explicitly deferred (matches spec phase 2).
- **Known field to confirm at implementation time:** the human-readable label on `PricingItem`/`bookServiceFor()` used for `serviceLabel` in Task 4 (asserted amount, not label, so no test breakage) — verify the exact property name in `lib/site-data.ts`.
- **Refund automation** (auto-refund on `slot_unavailable`/`booking_failed`) is intentionally out of scope for phase 1: those paths record a status for manual admin action. Add a Stripe refund call in a follow-up if manual handling proves too frequent.
