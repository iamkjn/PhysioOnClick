# Insurance-Ready Receipt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** After a paid Stripe booking, give the patient an insurance-ready itemised receipt/invoice (pay-and-claim model): viewable/printable from the patient portal AND emailed automatically, carrying the practitioner's registration details.

**Architecture:** No change to the booking/payment logic. Add an `invoiceIssuer` config, stamp an invoice number + paid date onto the `payments` doc when it becomes `paid`, render a printable HTML receipt page keyed by session id, and send it via Resend from the payments webhook.

**Tech Stack:** Next.js 15 App Router, TypeScript, Firestore shim (`lib/firebase-admin.ts`), Resend over `fetch`, Cloudflare Workers (no PDF lib — HTML print-to-PDF).

## Global Constraints

- Cloudflare Workers: no PDF/binary libs. Receipt is server-rendered HTML the patient prints to PDF.
- GBP; amounts stored in integer pence (`amountPence`), displayed as `£{(pence/100).toFixed(2)}`.
- Resend send mirrors `app/api/enquiry/route.ts`: `fetch("https://api.resend.com/emails", { headers: { Authorization: Bearer ${RESEND_API_KEY} }})`, `from` = `process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>"`. If `RESEND_API_KEY` is unset, log and skip (dev-safe), never throw.
- Registration numbers are real-world data; scaffold with clearly-marked `""` placeholders + `TODO` comments. The receipt must render without them but show a visible "[registration pending]" rather than a blank when empty.
- Do not alter existing payment/booking behavior or the 12 pre-existing unrelated test failures.

---

### Task 1: `invoiceIssuer` config + invoice-number helper

**Files:**
- Modify: `lib/site-data.ts` (add `invoiceIssuer` export near `founder`)
- Create: `lib/invoice.ts` (invoice number + money formatting helpers)
- Test: `tests/lib/invoice.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // lib/site-data.ts
  export const invoiceIssuer = {
    legalName: "Shivaliba Zala",           // from founder.name
    tradingName: "PhysioOnClick",
    hcpcNumber: "",                         // TODO: fill before go-live (e.g. "PH123456")
    cspNumber: "",                          // TODO: fill before go-live
    addressLines: ["", "Glasgow", "United Kingdom"], // TODO: street line
    vatStatus: "Physiotherapy services are exempt from VAT (healthcare).",
    contactEmail: "zalashivali1998@gmail.com",
    contactPhone: "",                       // TODO optional
  };
  // lib/invoice.ts
  export function makeInvoiceNumber(seed: string, date?: Date): string; // e.g. "INV-2026-AB12CD" — deterministic from seed (Stripe session id) so retries don't renumber
  export function formatGbp(pence: number): string;                     // 5000 -> "£50.00"
  export function issuerField(value: string, fallback?: string): string; // "" -> "[registration pending]"
  ```

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/invoice.test.ts
import { describe, expect, it } from "vitest";
import { formatGbp, issuerField, makeInvoiceNumber } from "@/lib/invoice";

describe("invoice helpers", () => {
  it("formats pence as GBP", () => {
    expect(formatGbp(5000)).toBe("£50.00");
    expect(formatGbp(4000)).toBe("£40.00");
    expect(formatGbp(0)).toBe("£0.00");
  });

  it("derives a stable invoice number from the same seed", () => {
    const a = makeInvoiceNumber("cs_test_123", new Date("2026-07-31T10:00:00Z"));
    const b = makeInvoiceNumber("cs_test_123", new Date("2026-07-31T10:00:00Z"));
    expect(a).toBe(b);
    expect(a).toMatch(/^INV-2026-[A-Z0-9]{6}$/);
  });

  it("produces different numbers for different seeds", () => {
    const a = makeInvoiceNumber("cs_a", new Date("2026-01-01T00:00:00Z"));
    const b = makeInvoiceNumber("cs_b", new Date("2026-01-01T00:00:00Z"));
    expect(a).not.toBe(b);
  });

  it("falls back to a pending marker for empty issuer fields", () => {
    expect(issuerField("")).toBe("[registration pending]");
    expect(issuerField("PH123456")).toBe("PH123456");
    expect(issuerField("", "n/a")).toBe("n/a");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/invoice.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```ts
// lib/invoice.ts
export function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function issuerField(value: string, fallback = "[registration pending]"): string {
  return value && value.trim() ? value : fallback;
}

/**
 * Deterministic, human-readable invoice number derived from a stable seed
 * (the Stripe session id) so a webhook retry never renumbers an invoice.
 * Format: INV-<year>-<6 base36 chars>.
 */
export function makeInvoiceNumber(seed: string, date: Date = new Date()): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const code = hash.toString(36).toUpperCase().padStart(6, "0").slice(-6);
  return `INV-${date.getUTCFullYear()}-${code}`;
}
```

Add the `invoiceIssuer` export to `lib/site-data.ts` immediately after the `founder` export, with the exact shape and placeholder values from the Interfaces block above.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/invoice.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/invoice.ts lib/site-data.ts tests/lib/invoice.test.ts
git commit -m "feat(receipt): add invoiceIssuer config + invoice helpers"
```

---

### Task 2: Stamp invoice fields on the paid payment doc

**Files:**
- Modify: `app/api/payments/webhook/route.ts` (only the final `status: "paid"` write path)
- Test: `tests/api/payments-webhook.test.ts` (extend the existing "valid event" assertions)

**Interfaces:**
- Consumes: `makeInvoiceNumber` (Task 1).
- The paid `payments` doc gains: `invoiceNumber: string`, `paidAt: <ISO string derived at handler time>`. Keep all existing fields. Use `makeInvoiceNumber(session.id)` so a retry is stable. Do NOT add these to the `processing`/`slot_unavailable`/`booking_failed` writes.

- [ ] **Step 1: Extend the failing test**

In `tests/api/payments-webhook.test.ts`, in the "creates the Cal booking and records the payment on a valid event" test, after the existing final-set assertions add:

```ts
    expect(typeof written.invoiceNumber).toBe("string");
    expect(written.invoiceNumber).toMatch(/^INV-\d{4}-[A-Z0-9]{6}$/);
    expect(typeof written.paidAt).toBe("string");
```

(`written` is the last `paymentDocRef.set` call's first arg, already captured in that test.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/api/payments-webhook.test.ts`
Expected: FAIL — `invoiceNumber` undefined.

- [ ] **Step 3: Implement**

In the final paid write (`await paymentRef.set({ ... status: "paid" ... })`), add:
```ts
    invoiceNumber: makeInvoiceNumber(session.id),
    paidAt: new Date().toISOString(),
```
Add `import { makeInvoiceNumber } from "@/lib/invoice";` at the top.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/api/payments-webhook.test.ts`
Expected: PASS (all cases, including the two hardened lines).

- [ ] **Step 5: Commit**

```bash
git add app/api/payments/webhook/route.ts tests/api/payments-webhook.test.ts
git commit -m "feat(receipt): stamp invoice number + paidAt on paid payments"
```

---

### Task 3: Printable receipt page + status-route passthrough

**Files:**
- Modify: `app/api/checkout/status/route.ts` (return `invoiceNumber` and `paidAt` too)
- Create: `app/book/receipt/[session]/page.tsx` (server component — reads the paid payment by session id, renders printable HTML invoice)
- Create: `lib/patient-receipt.ts` (server helper: `getReceiptBySession(sessionId)` reading the `payments` + matching `bookings` doc)
- Test: `tests/lib/patient-receipt.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // lib/patient-receipt.ts
  export type ReceiptData = {
    invoiceNumber: string;
    paidAt: string;
    amountPence: number;
    service: string;        // BookServiceId
    serviceLabel: string;   // human title from bookServiceFor
    patientName: string;
    patientEmail: string;
    sessionDate: string | null; // ISO if the bookings doc exists yet
    status: string;
  };
  export async function getReceiptBySession(sessionId: string): Promise<ReceiptData | null>;
  ```
- Consumes: `getAdminDb`, `bookServiceFor` (for `serviceLabel` via `.title`), the payment doc's `email`, `service`, `amountPence`, `invoiceNumber`, `paidAt`, `calBookingUid`; the matching `bookings` doc (by `calBookingUid`) for `fullName`/`sessionDate` if present.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/patient-receipt.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

const paymentsGet = vi.fn();
const bookingsGet = vi.fn();
const db = {
  collection: (name: string) => ({
    where: () => ({ limit: () => ({ get: name === "payments" ? paymentsGet : bookingsGet }) }),
  }),
};
vi.mock("@/lib/firebase-admin", () => ({ getAdminDb: () => db }));
import { getReceiptBySession } from "@/lib/patient-receipt";

afterEach(() => vi.restoreAllMocks());

describe("getReceiptBySession", () => {
  it("returns null when no paid payment exists", async () => {
    paymentsGet.mockResolvedValue({ empty: true, docs: [] });
    expect(await getReceiptBySession("cs_none")).toBeNull();
  });

  it("assembles receipt data from payment + booking", async () => {
    paymentsGet.mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({
        status: "paid", invoiceNumber: "INV-2026-AB12CD", paidAt: "2026-07-31T10:00:00.000Z",
        amountPence: 5000, service: "initial-assessment", email: "ada@example.com",
        calBookingUid: "cal_xyz",
      }) }],
    });
    bookingsGet.mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ fullName: "Ada Lovelace", sessionDate: "2026-08-01T09:00:00.000Z" }) }],
    });
    const r = await getReceiptBySession("cs_1");
    expect(r).not.toBeNull();
    expect(r!.invoiceNumber).toBe("INV-2026-AB12CD");
    expect(r!.amountPence).toBe(5000);
    expect(r!.patientName).toBe("Ada Lovelace");
    expect(r!.serviceLabel.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/lib/patient-receipt.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/patient-receipt.ts`**

```ts
import { getAdminDb } from "@/lib/firebase-admin";
import { bookServiceFor, isBookServiceId } from "@/lib/cal-services";

export type ReceiptData = {
  invoiceNumber: string;
  paidAt: string;
  amountPence: number;
  service: string;
  serviceLabel: string;
  patientName: string;
  patientEmail: string;
  sessionDate: string | null;
  status: string;
};

export async function getReceiptBySession(sessionId: string): Promise<ReceiptData | null> {
  if (!sessionId) return null;
  const db = getAdminDb();
  if (!db) return null;

  const paySnap = await db
    .collection("payments")
    .where("stripeSessionId", "==", sessionId)
    .limit(1)
    .get();
  if (paySnap.empty) return null;

  const pay = paySnap.docs[0].data() as {
    status?: string; invoiceNumber?: string; paidAt?: string; amountPence?: number;
    service?: string; email?: string; calBookingUid?: string;
  };
  if (pay.status !== "paid" || !pay.invoiceNumber) return null;

  const service = pay.service ?? "";
  const serviceLabel = isBookServiceId(service) ? bookServiceFor(service).title : service;

  let patientName = "";
  let sessionDate: string | null = null;
  if (pay.calBookingUid) {
    const bookSnap = await db
      .collection("bookings")
      .where("calBookingUid", "==", pay.calBookingUid)
      .limit(1)
      .get();
    if (!bookSnap.empty) {
      const b = bookSnap.docs[0].data() as { fullName?: string; sessionDate?: unknown };
      patientName = b.fullName ?? "";
      const sd = b.sessionDate;
      if (typeof sd === "string") sessionDate = sd;
      else if (sd && typeof sd === "object" && "toDate" in sd && typeof (sd as { toDate: unknown }).toDate === "function") {
        sessionDate = (sd as { toDate: () => Date }).toDate().toISOString();
      } else if (sd instanceof Date) sessionDate = sd.toISOString();
    }
  }

  return {
    invoiceNumber: pay.invoiceNumber,
    paidAt: pay.paidAt ?? "",
    amountPence: pay.amountPence ?? 0,
    service,
    serviceLabel,
    patientName,
    patientEmail: pay.email ?? "",
    sessionDate,
    status: pay.status,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/lib/patient-receipt.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Create the receipt page**

```tsx
// app/book/receipt/[session]/page.tsx
import Link from "next/link";
import { invoiceIssuer } from "@/lib/site-data";
import { formatGbp, issuerField } from "@/lib/invoice";
import { getReceiptBySession } from "@/lib/patient-receipt";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ReceiptPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = await params;
  const r = await getReceiptBySession(session);

  if (!r) {
    return (
      <main className="receipt-page">
        <p>We couldn&apos;t find a paid receipt for this booking yet. If you&apos;ve just paid,
        wait a moment and refresh, or <Link href="/contact">contact us</Link>.</p>
      </main>
    );
  }

  return (
    <main className="receipt-page" style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>{invoiceIssuer.tradingName}</h1>
          <p style={{ margin: "0.25rem 0" }}>{invoiceIssuer.legalName}</p>
          {invoiceIssuer.addressLines.filter(Boolean).map((line) => (
            <p key={line} style={{ margin: 0 }}>{line}</p>
          ))}
          <p style={{ margin: "0.25rem 0" }}>{invoiceIssuer.contactEmail}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: 0 }}>Receipt</h2>
          <p style={{ margin: "0.25rem 0" }}>Invoice: <strong>{r.invoiceNumber}</strong></p>
          <p style={{ margin: 0 }}>Date paid: {fmtDate(r.paidAt)}</p>
        </div>
      </header>

      <section style={{ marginTop: "1.5rem" }}>
        <p><strong>Registration:</strong> HCPC {issuerField(invoiceIssuer.hcpcNumber)} · CSP {issuerField(invoiceIssuer.cspNumber)}</p>
        <p><strong>Patient:</strong> {r.patientName || r.patientEmail}</p>
      </section>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "0.5rem 0" }}>Service</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "0.5rem 0" }}>Session date</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ccc", padding: "0.5rem 0" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: "0.5rem 0" }}>{r.serviceLabel}</td>
            <td style={{ padding: "0.5rem 0" }}>{fmtDate(r.sessionDate)}</td>
            <td style={{ padding: "0.5rem 0", textAlign: "right" }}>{formatGbp(r.amountPence)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 700 }}>Total paid</td>
            <td style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 700 }}>{formatGbp(r.amountPence)}</td>
          </tr>
        </tfoot>
      </table>

      <p style={{ marginTop: "1rem" }}>Paid by card via Stripe.</p>
      <p style={{ color: "#555" }}>{invoiceIssuer.vatStatus}</p>
      <p style={{ marginTop: "1.5rem" }} className="no-print">
        <button type="button" onClick={undefined} />
      </p>
      <p className="no-print" style={{ marginTop: "1rem" }}>
        Tip: use your browser&apos;s Print → Save as PDF to submit this to your insurer.
      </p>
    </main>
  );
}
```

Note: this is a server component, so no `onClick` — remove the stray button; instead just keep the print tip. (Implementer: delete the empty `<button>`/`<p>` with `onClick` — it is invalid in a server component. Keep the print-tip paragraph.)

- [ ] **Step 6: Extend the status route to return invoice fields**

In `app/api/checkout/status/route.ts`, widen the returned object to also include `invoiceNumber: pay.invoiceNumber` and `paidAt: pay.paidAt` (read from the same doc). Keep existing fields and the pending fallbacks.

- [ ] **Step 7: Run tests + typecheck**

Run: `npx vitest run tests/lib/patient-receipt.test.ts tests/api/checkout-status.test.ts && npx tsc --noEmit`
Expected: tests PASS; no NEW tsc errors in the files you touched.

- [ ] **Step 8: Commit**

```bash
git add app/book/receipt/[session]/page.tsx app/api/checkout/status/route.ts lib/patient-receipt.ts tests/lib/patient-receipt.test.ts
git commit -m "feat(receipt): printable insurance receipt page + status passthrough"
```

---

### Task 4: Email the receipt after payment + link from success page

**Files:**
- Create: `lib/emails/receipt-email.ts` (build + send the Resend email; dev-safe when no key)
- Modify: `app/api/payments/webhook/route.ts` (call the emailer after the paid write, best-effort)
- Modify: `app/book/success/page.tsx` (on `paid`, add a "View / print your receipt" link to `/book/receipt/<session_id>`)
- Test: `tests/lib/emails/receipt-email.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // lib/emails/receipt-email.ts
  export async function sendReceiptEmail(input: {
    to: string; patientName: string; invoiceNumber: string;
    serviceLabel: string; amountPence: number; receiptUrl: string;
  }): Promise<{ sent: boolean }>;
  ```
  Sends via `fetch("https://api.resend.com/emails", ...)` with the enquiry-route pattern. If `RESEND_API_KEY` is unset → log `"[receipt-email] RESEND_API_KEY unset; skipping"` and return `{ sent: false }` (never throw).

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/emails/receipt-email.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { sendReceiptEmail } from "@/lib/emails/receipt-email";

const INPUT = {
  to: "ada@example.com", patientName: "Ada", invoiceNumber: "INV-2026-AB12CD",
  serviceLabel: "Initial Assessment", amountPence: 5000,
  receiptUrl: "https://site.test/book/receipt/cs_1",
};

afterEach(() => vi.restoreAllMocks());

describe("sendReceiptEmail", () => {
  it("skips (no throw) when RESEND_API_KEY is unset", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendReceiptEmail(INPUT);
    expect(r).toEqual({ sent: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to Resend with the invoice details when configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendReceiptEmail(INPUT);
    expect(r).toEqual({ sent: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.to).toContain("ada@example.com");
    expect(JSON.stringify(body)).toContain("INV-2026-AB12CD");
    expect(JSON.stringify(body)).toContain("https://site.test/book/receipt/cs_1");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/lib/emails/receipt-email.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/emails/receipt-email.ts`**

```ts
import { formatGbp } from "@/lib/invoice";

export async function sendReceiptEmail(input: {
  to: string; patientName: string; invoiceNumber: string;
  serviceLabel: string; amountPence: number; receiptUrl: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[receipt-email] RESEND_API_KEY unset; skipping");
    return { sent: false };
  }
  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const greeting = input.patientName ? `Hi ${input.patientName},` : "Hello,";
  const html = `
    <p>${greeting}</p>
    <p>Thank you for your payment. Here is your receipt for insurance or your records.</p>
    <ul>
      <li><strong>Invoice:</strong> ${input.invoiceNumber}</li>
      <li><strong>Service:</strong> ${input.serviceLabel}</li>
      <li><strong>Amount paid:</strong> ${formatGbp(input.amountPence)}</li>
    </ul>
    <p><a href="${input.receiptUrl}">View or print your full receipt (PDF)</a></p>
  `;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `Your payment receipt — ${input.invoiceNumber}`,
        html,
      }),
    });
    if (!response.ok) {
      console.error("[receipt-email] Resend error", response.status);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[receipt-email] send failed", error);
    return { sent: false };
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/lib/emails/receipt-email.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire the emailer into the webhook (best-effort)**

In `app/api/payments/webhook/route.ts`, after the final paid `paymentRef.set(...)` and the existing bookings reconciliation, add a best-effort send (must never break the 200 response):
```ts
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    await sendReceiptEmail({
      to: intent.email,
      patientName: intent.name,
      invoiceNumber,                 // capture the value passed to makeInvoiceNumber(session.id) into a const above the paid set()
      serviceLabel: bookServiceFor(intent.service).title,
      amountPence: session.amount_total ?? 0,
      receiptUrl: `${siteUrl}/book/receipt/${session.id}`,
    });
  } catch (error) {
    console.error("Receipt email failed (non-blocking)", error);
  }
```
Add imports for `sendReceiptEmail` and `bookServiceFor`. Refactor Task 2's inline `makeInvoiceNumber(session.id)` into a `const invoiceNumber = makeInvoiceNumber(session.id);` declared before the paid `set()` so both the doc write and the email use the same value.

- [ ] **Step 6: Link the receipt from the success page**

In `app/book/success/page.tsx`, in the `status === "paid"` block, add below the existing confirmation copy:
```tsx
<Link href={`/book/receipt/${sessionId}`}>View / print your receipt</Link>
```
(`sessionId` is already read from `useSearchParams` in that component.)

- [ ] **Step 7: Run the suite + typecheck**

Run: `npm run test:run` (ignore the 12 pre-existing unrelated failures; no NEW failures) and `npx tsc --noEmit` (no new errors in touched files).

- [ ] **Step 8: Commit**

```bash
git add lib/emails/receipt-email.ts app/api/payments/webhook/route.ts app/book/success/page.tsx tests/lib/emails/receipt-email.test.ts
git commit -m "feat(receipt): email receipt after payment + success-page link"
```

---

### Task 5: Docs + go-live checklist

**Files:**
- Modify: `.env.example` (note receipt email reuses `RESEND_API_KEY` + `ENQUIRY_EMAIL_FROM`; no new vars)
- Modify: `CLAUDE.md` (one line under payments: receipts via `lib/patient-receipt.ts` + `/book/receipt/[session]`, emailed via Resend)

- [ ] **Step 1: Update `.env.example`** — add a comment under the payments block that the insurance receipt email uses the existing `RESEND_API_KEY`/`ENQUIRY_EMAIL_FROM` (no new secrets).
- [ ] **Step 2: Update `CLAUDE.md`** — append to the Payments paragraph: "Paid bookings generate an insurance-ready receipt (`lib/patient-receipt.ts`, printable at `/book/receipt/[session]`, emailed via Resend); issuer details live in `invoiceIssuer` in `lib/site-data.ts` — HCPC/CSP numbers must be filled before go-live."
- [ ] **Step 3: Commit**

```bash
git add .env.example CLAUDE.md
git commit -m "docs(receipt): document insurance receipt + go-live TODO"
```

---

## Go-live TODO (owner)

Fill the real values in `invoiceIssuer` (`lib/site-data.ts`): `hcpcNumber`, `cspNumber`, `addressLines[0]` (street), optional `contactPhone`. Until then the receipt prints "[registration pending]" in place of the numbers.

## Self-Review Notes

- Delivery = portal + email: covered by the receipt page (Task 3, linked from success page in Task 4 and reachable from the portal via the same URL) and the Resend email (Task 4).
- Registration data provided-by-owner: config with placeholders + visible pending marker (Task 1), documented go-live TODO.
- No change to payment/booking correctness; invoice number is deterministic from session id so retries don't renumber.
- VAT-exempt healthcare line included.
