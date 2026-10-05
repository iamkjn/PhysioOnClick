# Home-visit redesign, stage 2 (address book + postcode lookup) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Patients pick their address from a postcode dropdown (free getAddress.io plan), signed-in patients keep an address book with a usual address per person, and booking step 1 uses both.

**Architecture:** A server-only provider wrapper (`lib/address-lookup.ts`) sits behind two rate-limited API routes; a reusable `AddressLookup` client component calls them. Saved addresses live in a new top-level Firestore collection `patientAddresses` (same pattern as `dependents`) with client helpers in `lib/patient-addresses.ts`; the usual address is `defaultAddressId` on `users/{uid}` and `dependents/{id}`. Booking keeps storing a copy of the chosen address string (`homeVisitAddress`), so the address book never changes past bookings.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Firebase client SDK (Firestore), Firestore security rules (+ `@firebase/rules-unit-testing`, `npm run test:rules` against the emulator), Vitest + Testing Library, Cloudflare Workers rate-limit bindings.

**Spec:** `docs/superpowers/specs/2026-10-04-home-visit-booking-redesign-design.md` — "Stage 2", "Postcode → address dropdown", "Stage 2 adjustments".

## Global Constraints

- Worktree `/Users/iamkjn/Documents/Playground/.worktrees/address-book`, branch `feat/address-book`. Never commit to master, never push, never deploy, never deploy Firestore rules.
- Address lookup provider: getAddress.io. `GET https://api.getaddress.io/autocomplete/{postcode}?api-key=KEY&all=true` → `{ suggestions: [{ address, url, id }] }` (free); `GET https://api.getaddress.io/get/{id}?api-key=KEY` → `{ postcode, line_1, line_2, line_3, line_4, town_or_city, county, ... }` (1 lookup). Secret env var name: `GETADDRESS_API_KEY`.
- Lookups only for **covered** postcodes (`isCoveredPostcode` from `lib/home-visit-area.ts`: G1–G53, PA1, PA2, PA3, ML3).
- Address limits (must match `lib/home-visit.ts`): address line ≤ 120 chars (`HOME_ADDRESS_MAX`), postcode ≤ 10 (`HOME_POSTCODE_MAX`), postcode normalised with `normalisePostcode`. Saved-address label ≤ 40 chars, optional.
- New rate-limit binding `ADDRESS_RATE_LIMITER`: 30 requests per 60 s per IP; wrangler namespace `1003` (prod) and `2003` (dev).
- Guests (not signed in, or anonymous Firebase users) never get an address book; they use the lookup and typing only.
- The address and postcode must never appear in logs, analytics events, URLs or error messages. Lookup routes are POST with JSON bodies (never put the postcode in a query string to our own API).
- Every lookup failure (no key, provider error, 404, 429, network) must leave the patient able to type the address by hand.
- Video bookings and all prices/travel-fee behaviour stay exactly as they are.
- Run single test files with `npx vitest run <path>`. Pre-existing failures to ignore (fail on the base branch): booking-flow ×2, condition-hub-page ×1, exercise-page ×1, body-chart ×1, exercise-library-interactive ×2, start-session-flow-status ×1.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

### Task 1: Address lookup provider, routes and rate limiter

**Files:**
- Create: `lib/address-lookup.ts`, `app/api/address/lookup/route.ts`, `app/api/address/resolve/route.ts`
- Modify: `lib/rate-limit.ts` (add `ADDRESS_RATE_LIMITER`), `wrangler.jsonc` (binding in top-level `ratelimits` and in `env.dev.ratelimits`), `.env.example` (document `GETADDRESS_API_KEY`)
- Test: `tests/lib/address-lookup.test.ts`, `tests/api/address-lookup.test.ts`

**Interfaces:**
- Consumes: `isCoveredPostcode` (`lib/home-visit-area.ts`); `normalisePostcode`, `HOME_ADDRESS_MAX` (`lib/home-visit.ts`); `isRateLimited(binding, key)`, `clientIp(request)` (`lib/rate-limit.ts`).
- Produces:
  - `type AddressSuggestion = { id: string; label: string }`
  - `type LookupResult<T> = { ok: true; value: T } | { ok: false; reason: "unconfigured" | "not_found" | "rate_limited" | "provider_error" }`
  - `findAddresses(postcode: string): Promise<LookupResult<AddressSuggestion[]>>`
  - `resolveAddress(id: string): Promise<LookupResult<{ addressLine: string; postcode: string }>>`
  - `formatAddressLine(parts: { line_1?: string; line_2?: string; line_3?: string; line_4?: string; town_or_city?: string }): string`
  - `POST /api/address/lookup` body `{ postcode }` → 200 `{ addresses: AddressSuggestion[] }` | 400 `{ error }` (bad shape) | 422 `{ error: "not_covered" }` | 404 `{ error: "not_found" }` | 429 `{ error: "rate_limited" }` | 503 `{ error: "unavailable" }`
  - `POST /api/address/resolve` body `{ id }` → 200 `{ addressLine, postcode }` | 400 | 404 | 429 | 503, and 422 if the resolved postcode is not covered.

- [ ] **Step 1: Write the failing tests**

`tests/lib/address-lookup.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { findAddresses, formatAddressLine, resolveAddress } from "@/lib/address-lookup";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("formatAddressLine", () => {
  it("joins the non-empty lines and the town", () => {
    expect(formatAddressLine({ line_1: "Flat 2", line_2: "7 Example Street", line_3: "", line_4: "", town_or_city: "Glasgow" })).toBe(
      "Flat 2, 7 Example Street, Glasgow",
    );
  });
  it("caps the result at 120 characters", () => {
    expect(formatAddressLine({ line_1: "x".repeat(200), town_or_city: "Glasgow" }).length).toBe(120);
  });
});

describe("findAddresses", () => {
  it("is unconfigured without a key and never calls the provider", async () => {
    vi.stubEnv("GETADDRESS_API_KEY", "");
    const fetchMock = stubFetch(new Response("{}"));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "unconfigured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls autocomplete with the normalised postcode and maps suggestions", async () => {
    vi.stubEnv("GETADDRESS_API_KEY", "k_test");
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ suggestions: [{ address: "7 Example Street, Glasgow, G31 4HS", url: "/get/abc", id: "abc" }] }), { status: 200 }),
    );
    expect(await findAddresses("g31 4hs")).toEqual({ ok: true, value: [{ id: "abc", label: "7 Example Street, Glasgow, G31 4HS" }] });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://api.getaddress.io/autocomplete/G31%204HS");
    expect(url.searchParams.get("api-key")).toBe("k_test");
    expect(url.searchParams.get("all")).toBe("true");
  });

  it("maps 404 to not_found, 429 to rate_limited and others to provider_error", async () => {
    vi.stubEnv("GETADDRESS_API_KEY", "k_test");
    stubFetch(new Response("", { status: 404 }));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "not_found" });
    stubFetch(new Response("", { status: 429 }));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "rate_limited" });
    stubFetch(new Response("", { status: 500 }));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "provider_error" });
  });

  it("treats an empty suggestion list as not_found and a network error as provider_error", async () => {
    vi.stubEnv("GETADDRESS_API_KEY", "k_test");
    stubFetch(new Response(JSON.stringify({ suggestions: [] }), { status: 200 }));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "not_found" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "provider_error" });
  });
});

describe("resolveAddress", () => {
  it("gets the address by id and returns a single address line plus postcode", async () => {
    vi.stubEnv("GETADDRESS_API_KEY", "k_test");
    const fetchMock = stubFetch(
      new Response(
        JSON.stringify({ postcode: "G31 4HS", line_1: "7 Example Street", line_2: "", line_3: "", line_4: "", town_or_city: "Glasgow", county: "Lanarkshire" }),
        { status: 200 },
      ),
    );
    expect(await resolveAddress("abc")).toEqual({ ok: true, value: { addressLine: "7 Example Street, Glasgow", postcode: "G31 4HS" } });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://api.getaddress.io/get/abc");
  });

  it("never logs the response body (which contains the address)", async () => {
    vi.stubEnv("GETADDRESS_API_KEY", "k_test");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch(new Response("7 Example Street G31 4HS", { status: 500 }));
    await resolveAddress("abc");
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("Example");
    errorSpy.mockRestore();
  });
});
```

`tests/api/address-lookup.test.ts` — mock `@/lib/address-lookup` and `@/lib/rate-limit`, then test both routes:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findAddresses: vi.fn(),
  resolveAddress: vi.fn(),
  isRateLimited: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/lib/address-lookup", () => ({ findAddresses: mocks.findAddresses, resolveAddress: mocks.resolveAddress }));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited: mocks.isRateLimited, clientIp: () => "1.2.3.4" }));

import { POST as lookup } from "@/app/api/address/lookup/route";
import { POST as resolve } from "@/app/api/address/resolve/route";

const post = (body: unknown) =>
  new Request("http://localhost/api/address/x", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isRateLimited.mockResolvedValue(false);
});

describe("POST /api/address/lookup", () => {
  it("returns suggestions for a covered postcode", async () => {
    mocks.findAddresses.mockResolvedValue({ ok: true, value: [{ id: "abc", label: "7 Example Street, Glasgow, G31 4HS" }] });
    const res = await lookup(post({ postcode: "g31 4hs" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ addresses: [{ id: "abc", label: "7 Example Street, Glasgow, G31 4HS" }] });
    expect(mocks.findAddresses).toHaveBeenCalledWith("G31 4HS");
  });
  it("rejects a malformed postcode with 400 and an uncovered one with 422, without calling the provider", async () => {
    expect((await lookup(post({ postcode: "12345" }))).status).toBe(400);
    const uncovered = await lookup(post({ postcode: "EH1 1AA" }));
    expect(uncovered.status).toBe(422);
    expect(await uncovered.json()).toEqual({ error: "not_covered" });
    expect(mocks.findAddresses).not.toHaveBeenCalled();
  });
  it("maps provider failures to 404 / 429 / 503", async () => {
    mocks.findAddresses.mockResolvedValueOnce({ ok: false, reason: "not_found" });
    expect((await lookup(post({ postcode: "G31 4HS" }))).status).toBe(404);
    mocks.findAddresses.mockResolvedValueOnce({ ok: false, reason: "rate_limited" });
    expect((await lookup(post({ postcode: "G31 4HS" }))).status).toBe(429);
    mocks.findAddresses.mockResolvedValueOnce({ ok: false, reason: "unconfigured" });
    expect((await lookup(post({ postcode: "G31 4HS" }))).status).toBe(503);
    mocks.findAddresses.mockResolvedValueOnce({ ok: false, reason: "provider_error" });
    expect((await lookup(post({ postcode: "G31 4HS" }))).status).toBe(503);
  });
  it("is rate limited per IP with ADDRESS_RATE_LIMITER", async () => {
    mocks.isRateLimited.mockResolvedValue(true);
    expect((await lookup(post({ postcode: "G31 4HS" }))).status).toBe(429);
    expect(mocks.isRateLimited).toHaveBeenCalledWith("ADDRESS_RATE_LIMITER", "1.2.3.4");
    expect(mocks.findAddresses).not.toHaveBeenCalled();
  });
});

describe("POST /api/address/resolve", () => {
  it("returns the address line and postcode", async () => {
    mocks.resolveAddress.mockResolvedValue({ ok: true, value: { addressLine: "7 Example Street, Glasgow", postcode: "G31 4HS" } });
    const res = await resolve(post({ id: "abc" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ addressLine: "7 Example Street, Glasgow", postcode: "G31 4HS" });
  });
  it("rejects a bad id with 400", async () => {
    expect((await resolve(post({ id: "../etc" }))).status).toBe(400);
    expect((await resolve(post({}))).status).toBe(400);
  });
  it("refuses an address whose postcode is outside the covered area", async () => {
    mocks.resolveAddress.mockResolvedValue({ ok: true, value: { addressLine: "1 Princes Street, Edinburgh", postcode: "EH2 2AN" } });
    expect((await resolve(post({ id: "abc" }))).status).toBe(422);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/address-lookup.test.ts tests/api/address-lookup.test.ts`
Expected: FAIL (modules don't exist).

- [ ] **Step 3: Implement**

`lib/address-lookup.ts`:

```ts
// Server-only postcode -> address lookup. Provider: getAddress.io (free plan,
// owner decision 2026-10-04). Switching provider means changing only this file.
// Autocomplete is free (rate-limited by the provider); /get counts as a lookup.
// Never log postcodes, addresses or provider response bodies.
import { HOME_ADDRESS_MAX, normalisePostcode } from "@/lib/home-visit";

export type AddressSuggestion = { id: string; label: string };
export type LookupResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "unconfigured" | "not_found" | "rate_limited" | "provider_error" };

const BASE = "https://api.getaddress.io";

function apiKey(): string {
  return process.env.GETADDRESS_API_KEY ?? "";
}

function failure(status: number): LookupResult<never> {
  if (status === 404) return { ok: false, reason: "not_found" };
  if (status === 429) return { ok: false, reason: "rate_limited" };
  return { ok: false, reason: "provider_error" };
}

export function formatAddressLine(parts: {
  line_1?: string; line_2?: string; line_3?: string; line_4?: string; town_or_city?: string;
}): string {
  return [parts.line_1, parts.line_2, parts.line_3, parts.line_4, parts.town_or_city]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(", ")
    .slice(0, HOME_ADDRESS_MAX);
}

export async function findAddresses(postcode: string): Promise<LookupResult<AddressSuggestion[]>> {
  const key = apiKey();
  if (!key) return { ok: false, reason: "unconfigured" };
  const url = new URL(`${BASE}/autocomplete/${encodeURIComponent(normalisePostcode(postcode))}`);
  url.searchParams.set("api-key", key);
  url.searchParams.set("all", "true");
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("Address lookup failed", res.status);
      return failure(res.status);
    }
    const json = (await res.json()) as { suggestions?: Array<{ id?: unknown; address?: unknown }> };
    const value = (json.suggestions ?? [])
      .filter((s): s is { id: string; address: string } => typeof s.id === "string" && typeof s.address === "string")
      .map((s) => ({ id: s.id, label: s.address }));
    return value.length ? { ok: true, value } : { ok: false, reason: "not_found" };
  } catch {
    console.error("Address lookup request failed");
    return { ok: false, reason: "provider_error" };
  }
}

export async function resolveAddress(id: string): Promise<LookupResult<{ addressLine: string; postcode: string }>> {
  const key = apiKey();
  if (!key) return { ok: false, reason: "unconfigured" };
  const url = new URL(`${BASE}/get/${encodeURIComponent(id)}`);
  url.searchParams.set("api-key", key);
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("Address resolve failed", res.status);
      return failure(res.status);
    }
    const json = (await res.json()) as Record<string, unknown>;
    const str = (k: string) => (typeof json[k] === "string" ? (json[k] as string) : "");
    const addressLine = formatAddressLine({
      line_1: str("line_1"), line_2: str("line_2"), line_3: str("line_3"), line_4: str("line_4"), town_or_city: str("town_or_city"),
    });
    const postcode = normalisePostcode(str("postcode"));
    if (!addressLine || !postcode) return { ok: false, reason: "provider_error" };
    return { ok: true, value: { addressLine, postcode } };
  } catch {
    console.error("Address resolve request failed");
    return { ok: false, reason: "provider_error" };
  }
}
```

Routes (`app/api/address/lookup/route.ts`; `resolve/route.ts` follows the same shape):

```ts
import { NextResponse } from "next/server";
import { findAddresses } from "@/lib/address-lookup";
import { isCoveredPostcode } from "@/lib/home-visit-area";
import { validateHomeVisit } from "@/lib/home-visit";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

const STATUS = { not_found: 404, rate_limited: 429, unconfigured: 503, provider_error: 503 } as const;
const ERROR = { not_found: "not_found", rate_limited: "rate_limited", unconfigured: "unavailable", provider_error: "unavailable" } as const;

export async function POST(request: Request) {
  if (await isRateLimited("ADDRESS_RATE_LIMITER", clientIp(request))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  let body: { postcode?: unknown };
  try {
    body = (await request.json()) as { postcode?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  // Reuse the booking validator's postcode rules; the address line is irrelevant here.
  const shape = validateHomeVisit("placeholder", body.postcode);
  if (!shape.ok) return NextResponse.json({ error: "Enter a valid postcode." }, { status: 400 });
  if (!isCoveredPostcode(shape.postcode)) return NextResponse.json({ error: "not_covered" }, { status: 422 });
  const result = await findAddresses(shape.postcode);
  if (!result.ok) return NextResponse.json({ error: ERROR[result.reason] }, { status: STATUS[result.reason] });
  return NextResponse.json({ addresses: result.value });
}
```

`resolve/route.ts`: same rate limit; validate `id` with `/^[A-Za-z0-9_-]{1,200}$/` (400 otherwise); call `resolveAddress(id)`; map failures the same way; if `!isCoveredPostcode(value.postcode)` return 422 `{ error: "not_covered" }`; else 200 `{ addressLine, postcode }`.

`lib/rate-limit.ts`: extend `RateLimiterBinding` with `"ADDRESS_RATE_LIMITER"`, add `ADDRESS_RATE_LIMITER: { limit: 30, windowMs: 60_000 }` to `FALLBACK`, and update the header comment that lists the bindings.

`wrangler.jsonc`: add `{ "name": "ADDRESS_RATE_LIMITER", "namespace_id": "1003", "simple": { "limit": 30, "period": 60 } }` to the top-level `ratelimits` array (next to FORM) and `{ "name": "ADDRESS_RATE_LIMITER", "namespace_id": "2003", "simple": { "limit": 30, "period": 60 } }` to `env.dev.ratelimits`. If `cloudflare-env.d.ts` lists the other limiters, add this one the same way.

`.env.example`: add a commented block: `# Postcode -> address dropdown (getAddress.io free plan). Server-only; set as a Worker secret with wrangler secret put GETADDRESS_API_KEY. Without it, patients type their address.` followed by `GETADDRESS_API_KEY=`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/lib/address-lookup.test.ts tests/api/address-lookup.test.ts tests/lib/rate-limit.test.ts` (the last only if it exists)
Expected: PASS. `npx tsc --noEmit -p . 2>&1 | grep -E "address-lookup|api/address|rate-limit"` prints nothing.

- [ ] **Step 5: Commit**

```bash
git add lib/address-lookup.ts app/api/address lib/rate-limit.ts wrangler.jsonc .env.example tests/lib/address-lookup.test.ts tests/api/address-lookup.test.ts
git commit -m "address lookup: getAddress.io postcode -> address routes (covered postcodes only, rate limited)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `AddressLookup` component in booking step 1

**Files:**
- Create: `components/address-lookup.tsx`
- Modify: `components/booking-step-service.tsx` (home-visit branch: replace the free-text Address field with `AddressLookup` once the postcode is covered)
- Test: `tests/components/address-lookup.test.tsx`, `tests/components/booking-visit-type.test.tsx` (adjust)

**Interfaces:**
- Consumes: `POST /api/address/lookup`, `POST /api/address/resolve` (Task 1); `HOME_ADDRESS_MAX` (`lib/home-visit.ts`).
- Produces: `AddressLookup` props:
  ```ts
  type AddressLookupProps = {
    postcode: string;                       // normalised, already shape-checked AND covered by the caller
    addressLine: string;                    // controlled value of the address line
    onAddressLineChange: (value: string) => void;
    onPostcodeResolved?: (postcode: string) => void; // provider's canonical postcode after a pick
    inputId?: string;                       // id for the manual address input (default "book-home-address")
  };
  ```

**Behaviour (exact):**
- On mount and whenever `postcode` changes: POST `/api/address/lookup` with `{ postcode }` (debounce 300 ms; cancel stale requests via an `AbortController`/ignore flag).
- While loading: `<p role="status">Finding addresses…</p>`.
- On 200 with addresses: render `<label for="book-home-address-select">Select your address</label>` and a native `<select id="book-home-address-select">` whose first option is a placeholder `Choose your address` (value ""), then one option per suggestion (value = id, text = label). Below it, a button `Enter address manually`.
- Choosing an option: POST `/api/address/resolve` with `{ id }`; on 200 call `onAddressLineChange(addressLine)` and `onPostcodeResolved?.(postcode)`, then show the chosen address as text (`<p>{addressLine}</p>`) with a `Change` button that returns to the select. On any non-200, switch to manual mode with the hint "We couldn't fetch that address. Please type it below."
- Manual mode (button clicked, or lookup answered 404/429/503, or a network error): show the existing Address text input (`id={inputId}`, label "Address", `required`, `maxLength={HOME_ADDRESS_MAX}`, `autoComplete="street-address"`), controlled by `addressLine`. For a 404 show "We couldn't find addresses for that postcode. Please type your address."; for 429/503/network show nothing extra (silent fallback). If addresses exist, manual mode offers `Choose from the list instead`.
- Never put the postcode or address in analytics, URLs or console output.
- In `booking-step-service.tsx`, the covered branch renders `<AddressLookup postcode={normalised covered postcode} addressLine={homeAddressLine} onAddressLineChange={onHomeAddressLineChange} onPostcodeResolved={onHomePostcodeChange} />` instead of the plain Address input. Uncovered and pending states are unchanged. `validateHomeVisit` on Continue still runs on `homeAddressLine` + `homePostcode`, so an un-picked dropdown blocks Continue with the existing address error.

- [ ] **Step 1: Write the failing tests** — `tests/components/address-lookup.test.tsx` renders `AddressLookup` with a `fetch` stub and asserts:
  1. it POSTs `/api/address/lookup` with body `{"postcode":"G31 4HS"}` (not a query string) and shows the select with the placeholder plus the suggestions;
  2. picking a suggestion POSTs `/api/address/resolve` with `{"id":"abc"}` and calls `onAddressLineChange("7 Example Street, Glasgow")` and `onPostcodeResolved("G31 4HS")`;
  3. a 503 from lookup shows the manual Address input with no error text;
  4. a 404 shows the manual input with "We couldn't find addresses for that postcode. Please type your address.";
  5. "Enter address manually" switches to the input, and "Choose from the list instead" switches back;
  6. a resolve failure falls back to manual with "We couldn't fetch that address. Please type it below.".
  Use fake timers or `waitFor` for the 300 ms debounce.
  In `tests/components/booking-visit-type.test.tsx`, the global `fetchMock` must answer `/api/address/lookup` with 503 by default (so existing tests keep typing into "Address"), and add one test where lookup returns two suggestions and resolve returns an address: choose it, continue, pay as guest, and assert `checkoutBody()` has `homeAddressLine: "7 Example Street, Glasgow"` and `homePostcode: "G31 4HS"`, and that analytics calls contain neither "Example" nor "G31".
- [ ] **Step 2: Run them, see them fail.** `npx vitest run tests/components/address-lookup.test.tsx tests/components/booking-visit-type.test.tsx`
- [ ] **Step 3: Implement** `components/address-lookup.tsx` (client component, `"use client"`) per Behaviour, and wire it into `booking-step-service.tsx`. Reuse existing booking form classes (`book-field`, `book-label`, `book-input`, `book-field-hint`, `book-error`); if a select needs styling, reuse `.book-input` on the `<select>`. Add no new colours.
- [ ] **Step 4: Run tests** — the two files above plus `tests/components/booking-guest-checkout.test.tsx` and `tests/components/booking-flow.test.tsx` (only the 2 known failures allowed) — and `npx tsc --noEmit -p . 2>&1 | grep -E "address-lookup|booking-step-service"` prints nothing.
- [ ] **Step 5: Commit** — `"booking: postcode -> address dropdown with manual fallback"` + trailer.

---

### Task 3: Address book data layer and Firestore rules

**Files:**
- Create: `lib/patient-addresses.ts`
- Modify: `firestore.rules` (new `patientAddresses` block; allow `defaultAddressId` on `dependents`), `lib/dependents.ts` (`Dependent.defaultAddressId?: string`)
- Test: `tests/lib/patient-addresses.test.ts` (mock `firebase/firestore` like `tests/lib/dependents*.test.ts` if one exists — read it first), `tests/rules/firestore.test.ts` (append; follow its existing setup)

**Interfaces:**
- Produces:
  ```ts
  export type SavedAddress = { id: string; ownerUid: string; label: string; line: string; postcode: string };
  export const ADDRESS_LABEL_MAX = 40;
  export function addressDisplay(a: Pick<SavedAddress, "label" | "line" | "postcode">): string; // label || line, then ", POSTCODE"
  export async function getAddresses(uid: string): Promise<SavedAddress[]>;                 // ordered by createdAt asc
  export async function addAddress(uid: string, input: { label?: string; line: string; postcode: string }): Promise<string>;
  export async function updateAddress(id: string, input: { label?: string; line: string; postcode: string }): Promise<void>;
  export async function deleteAddress(uid: string, id: string): Promise<void>;              // also clears defaultAddressId pointing at it (users/{uid} and the owner's dependents)
  export async function setUsualAddress(uid: string, personId: string | null, addressId: string | null): Promise<void>; // personId null = account holder (users/{uid}); else dependents/{personId}
  export async function getUsualAddressId(uid: string, personId: string | null): Promise<string | null>;
  ```
  `addAddress`/`updateAddress` validate with `validateHomeVisit(line, postcode)` (throw `Error(validation.error)` on failure), store the normalised postcode and trimmed line, label trimmed and capped at 40, and set `createdAt`/`updatedAt` with `serverTimestamp()`. All functions no-op/return empty when `db` is null.

- Firestore rules (add near `dependents`):
  ```
  match /patientAddresses/{addressId} {
    function validAddress(d) {
      return d.keys().hasOnly(['ownerUid', 'label', 'line', 'postcode', 'createdAt', 'updatedAt']) &&
        d.ownerUid is string &&
        d.label is string && d.label.size() <= 40 &&
        d.line is string && d.line.size() >= 1 && d.line.size() <= 120 &&
        d.postcode is string && d.postcode.size() >= 5 && d.postcode.size() <= 10;
    }
    allow read: if isAdmin() || (isSignedIn() && resource.data.ownerUid == request.auth.uid);
    allow create: if isSignedIn() && request.resource.data.ownerUid == request.auth.uid && validAddress(request.resource.data);
    allow update: if isSignedIn() && resource.data.ownerUid == request.auth.uid &&
      request.resource.data.ownerUid == resource.data.ownerUid && validAddress(request.resource.data);
    allow delete: if isSignedIn() && resource.data.ownerUid == request.auth.uid;
  }
  ```
  In `dependents`' `validDependent`, add `'defaultAddressId'` to `hasOnly` and `&& (!('defaultAddressId' in d) || (d.defaultAddressId is string && d.defaultAddressId.size() <= 128))`. Use the helper names that already exist in `firestore.rules` (`isAdmin`, `isSignedIn`; check exact names first).

- [ ] **Step 1: Failing tests.** Unit tests for `lib/patient-addresses.ts` (mocked Firestore): add normalises the postcode and caps the label; add rejects an invalid postcode/empty line; delete clears `defaultAddressId` on the user doc and on the owner's dependents that pointed at it, and leaves others; `setUsualAddress(uid, null, id)` writes `users/{uid}`, `setUsualAddress(uid, "dep1", id)` writes `dependents/dep1`; `addressDisplay` formats. Rules tests (emulator): owner can create/read/update/delete own address; another user cannot read or write it; an anonymous-auth user can only touch their own; invalid docs (line 121 chars, label 41 chars, extra field, ownerUid of someone else) are rejected; a dependent update with `defaultAddressId` is allowed for its owner and one with a 200-char id is rejected.
- [ ] **Step 2: Run, see them fail.** `npx vitest run tests/lib/patient-addresses.test.ts`; rules: `npm run test:rules` (needs the Firestore emulator; `npm run emulators` needs Java 21 — if the emulator can't start in this environment, say so in the report and still commit the rules tests).
- [ ] **Step 3: Implement** `lib/patient-addresses.ts`, the rules, and the `Dependent` type field.
- [ ] **Step 4: Run tests** (unit always; rules if the emulator runs). `npx tsc --noEmit -p . 2>&1 | grep -E "patient-addresses|dependents"` prints nothing.
- [ ] **Step 5: Commit** — `"address book: patientAddresses data layer, usual address, Firestore rules"` + trailer.

---

### Task 4: Portal — Account → Addresses, and usual address on People

**Files:**
- Create: `components/address-book-manager.tsx`
- Modify: `app/patient/account/page.tsx` (render the manager in a new section titled "Addresses"), `app/patient/people/page.tsx` (usual-address select per person, including the account holder)
- Test: `tests/components/address-book-manager.test.tsx`, plus a test for the People select (create `tests/app/patient-people-usual-address.test.tsx` or extend an existing People test if one exists)

**Interfaces:**
- Consumes: Task 3 helpers; `AddressLookup` (Task 2); `isCoveredPostcode` (`lib/home-visit-area.ts`); `validateHomeVisit`, `HOME_POSTCODE_MAX` (`lib/home-visit.ts`).

**Behaviour:**
- `AddressBookManager({ uid })`: lists saved addresses (`addressDisplay`), each with an "Outside our home-visit area" badge when `!isCoveredPostcode(postcode)`, plus Edit and Delete buttons. Delete asks for confirmation (reuse the app's existing confirm-dialog component if there is one — `grep -rn "ConfirmDialog" components`). "Add an address" opens a form: optional Label (maxLength 40), Postcode (maxLength 10), then — when the postcode is covered — `AddressLookup` (inputId `address-book-line`); when not covered — a plain Address input (saving an address outside the area is allowed; it's just badged). Save calls `addAddress`/`updateAddress` and shows validation errors from them. Empty state: "No saved addresses yet. Add one to book home visits faster."
- People page: for the account holder and each dependent, a "Usual address for home visits" `<select>` with "None" plus every saved address; changing it calls `setUsualAddress`. If there are no saved addresses, show a link "Add an address" to `/patient/account#addresses`.
- Addresses never in analytics or URLs.

- [ ] Steps: failing tests (list + badge, add via manual input saves through `addAddress` with the right args, edit, delete clears via `deleteAddress`, People select calls `setUsualAddress(uid, null|depId, addressId|null)`) → implement → run `npx vitest run <the new test files>` + `npx tsc` grep for the touched files → commit `"portal: address book on Account and usual address on People"` + trailer.

---

### Task 5: Booking step 1 uses the address book for signed-in patients

**Files:**
- Modify: `components/booking-flow.tsx`, `components/booking-step-service.tsx`
- Test: `tests/components/booking-address-book.test.tsx` (new; copy the mocking setup from `tests/components/booking-visit-type.test.tsx`, with a signed-in, non-anonymous user and mocked `@/lib/patient-addresses`)

**Interfaces:**
- Consumes: `getAddresses`, `getUsualAddressId`, `addAddress`, `addressDisplay` (Task 3); `AddressLookup` (Task 2). `booking-flow.tsx` already tracks `user` and `bookingForId` (null = account holder), seeded from the PersonProvider context.

**Behaviour:**
- Only when the user is signed in and not anonymous, and visit type is home: load saved addresses once (`getAddresses(user.uid)`) and the usual address id for `bookingForId` (`getUsualAddressId`).
- If there are saved addresses, step 1's home branch shows, **above** the postcode field, a `role="radiogroup"` "Your saved addresses" listing each (`addressDisplay`, plus "Outside our home-visit area" badge if uncovered) and a final option "Use a different address". Preselect the usual address if it exists, else nothing.
- Choosing a saved address sets `homePostcode` and `homeAddressLine` from it (so the existing coverage check and Continue validation apply unchanged) and hides the postcode/lookup inputs; an uncovered saved address shows the existing out-of-area message with the video switch.
- "Use a different address" shows the normal postcode → `AddressLookup` flow plus a checkbox "Save to my address book" (checked by default). On Continue (after `validateHomeVisit` and coverage pass), if the box is ticked and the address isn't already saved (same normalised postcode and same line, case-insensitive), call `addAddress(user.uid, { line, postcode })`; a save failure must not block booking (ignore and continue).
- Guests and anonymous users: behaviour unchanged (Task 2 flow, no saved list, no checkbox).
- Changing the person on step 2 does not change the already-chosen address.

- [ ] Steps: failing tests (saved list shown + usual preselected; choosing a saved address and continuing sends its line/postcode to checkout; uncovered saved address blocks with the out-of-area message; "Use a different address" + ticked box calls `addAddress` once on Continue; unticked doesn't; anonymous user sees no saved list) → implement → run the new test file + `tests/components/booking-visit-type.test.tsx` + `tests/components/booking-guest-checkout.test.tsx` + `npx tsc` grep → commit `"booking: choose a saved address or save a new one (signed-in patients)"` + trailer.

---

### Task 6: Privacy policy and docs

**Files:**
- Modify: `app/privacy-policy/page.tsx` (processors list + retention), `CLAUDE.md` (one bullet under Environment variables / Booking for `GETADDRESS_API_KEY`, `ADDRESS_RATE_LIMITER`, `patientAddresses`)
- Test: extend the privacy policy page test if one exists (`grep -rln "privacy-policy" tests`), else create `tests/app/privacy-policy-address.test.tsx`

**Copy:**
- Processors list, alphabetical position: `<li><strong>getAddress.io:</strong> when you look up a home-visit address, the postcode you enter (and the address you choose) is sent to getAddress.io to list the addresses at that postcode. It is used only to answer that lookup.</li>`
- Retention list: `<li><strong>Saved addresses:</strong> addresses you save to your address book are kept until you delete them or close your account. Past bookings keep their own copy of the visit address.</li>`

- [ ] Steps: failing test asserting both sentences → edit → run → commit `"privacy: getAddress.io processor and saved addresses retention"` + trailer.

---

### Task 7: Whole-stage verification

- [ ] `npx vitest run tests/lib tests/api tests/components tests/app 2>&1 | tail -30` — only the 8 known pre-existing failures.
- [ ] `npm run test:rules` if the emulator can run here; otherwise report that it couldn't and why.
- [ ] `npx tsc --noEmit -p . 2>&1 | grep -v "^tests/"` prints nothing.
- [ ] Fix anything this branch caused; commit `"fix: stage 2 verification fixes"` + trailer (skip if nothing to fix).
