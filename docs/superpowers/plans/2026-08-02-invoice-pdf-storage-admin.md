# Invoice PDF + Storage + Admin View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** On every paid booking, generate a real **PDF invoice**, **attach it to the patient's receipt email**, **store it in Firebase Storage** (admin-only), and add an **admin invoices view** to list/download them.

**Architecture:** Extend the existing pay-first webhook. A pure-JS PDF builder (`pdf-lib`, Workers-safe) renders the invoice from the metadata the webhook already has (no dependency on the not-yet-written `bookings` doc). The webhook uploads the PDF to Firebase Storage via a new REST helper on the `firebase-admin` shim (reusing its service-account token) and attaches it to the Resend email. An admin page lists paid invoices and downloads the stored PDF through an admin-gated server route.

**Tech Stack:** Next.js 15 App Router, TypeScript, `pdf-lib`, Firebase Storage REST (over `fetch`), Resend attachments, Cloudflare Workers, Vitest.

## Global Constraints

- **Cloudflare Workers:** no native/binary libs. PDF via **`pdf-lib`** only (pure JS). All Google/Storage calls over `fetch`.
- **PDF source data:** the webhook has `intent.name`, `intent.email`, `intent.service`, `intent.startISO`, `amountPence`, `invoiceNumber`, `paidAt` — build the PDF from these; do NOT rely on the `bookings` doc (may not exist yet).
- **GBP:** amounts integer pence; display `£{(pence/100).toFixed(2)}`.
- **Storage path:** `invoices/{invoiceNumber}.pdf` in the project's default bucket (`FIREBASE_ADMIN_STORAGE_BUCKET`).
- **Privacy (UK health data):** invoice PDFs contain patient name + service. `storage.rules` must **deny all client access** to `invoices/**` (server-only via service account). Admin download goes through an admin-gated server route, never the public bucket.
- **Best-effort, non-blocking:** PDF generation, upload, and email attachment must never break the webhook 200 or the booking. Wrap each in try/catch; on failure, log and continue (the on-screen receipt link still works).
- **Admin gating:** mirror existing admin pattern — client page checks `isAdminUser`; server action/route verifies the caller's ID token is admin before returning data/PDF.

---

### Task 1: Add `pdf-lib` + invoice PDF builder

**Files:**
- Modify: `package.json` (add `pdf-lib` dependency)
- Create: `lib/invoice-pdf.ts`
- Test: `tests/lib/invoice-pdf.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type InvoicePdfInput = {
    invoiceNumber: string;
    paidAtISO: string;
    amountPence: number;
    serviceLabel: string;
    patientName: string;   // may be "" -> falls back to email
    patientEmail: string;
    sessionDateISO: string | null;
  };
  export async function generateInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array>;
  ```
  Renders issuer details from `invoiceIssuer` (`lib/site-data.ts`) + `issuerField`/`formatGbp` (`lib/invoice.ts`): trading name, legal name, address lines, `HCPC {…} · CSP {…}`, contact email; then Receipt title, invoice number, date paid, patient, a service/date/amount row, total, "Paid by card via Stripe", and the VAT-exempt line.

- [ ] **Step 1: Install pdf-lib**

Run: `npm install pdf-lib`
Expected: added to `package.json` dependencies.

- [ ] **Step 2: Write the failing test**

```ts
// tests/lib/invoice-pdf.test.ts
import { describe, expect, it } from "vitest";
import { generateInvoicePdf } from "@/lib/invoice-pdf";

describe("generateInvoicePdf", () => {
  it("produces a valid PDF byte stream", async () => {
    const bytes = await generateInvoicePdf({
      invoiceNumber: "INV-2026-AB12CD34",
      paidAtISO: "2026-08-02T10:00:00.000Z",
      amountPence: 5000,
      serviceLabel: "Initial Online Assessment",
      patientName: "Ada Lovelace",
      patientEmail: "ada@example.com",
      sessionDateISO: "2026-08-18T13:00:00.000Z",
    });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(500);
    // PDF magic header "%PDF"
    expect(Buffer.from(bytes.slice(0, 4)).toString("utf8")).toBe("%PDF");
  });

  it("does not throw when patientName is empty (falls back to email)", async () => {
    const bytes = await generateInvoicePdf({
      invoiceNumber: "INV-2026-ZZ99YY88", paidAtISO: "2026-08-02T10:00:00.000Z",
      amountPence: 4000, serviceLabel: "Online Follow-Up", patientName: "",
      patientEmail: "pat@example.com", sessionDateISO: null,
    });
    expect(Buffer.from(bytes.slice(0, 4)).toString("utf8")).toBe("%PDF");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/lib/invoice-pdf.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 4: Implement `lib/invoice-pdf.ts`**

```ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { invoiceIssuer } from "@/lib/site-data";
import { formatGbp, issuerField } from "@/lib/invoice";

export type InvoicePdfInput = {
  invoiceNumber: string;
  paidAtISO: string;
  amountPence: number;
  serviceLabel: string;
  patientName: string;
  patientEmail: string;
  sessionDateISO: string | null;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait (pt)
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.09, 0.12, 0.18);
  const muted = rgb(0.4, 0.44, 0.5);
  const { height, width } = page.getSize();
  const left = 56;
  let y = height - 64;

  const line = (text: string, opts: { size?: number; f?: typeof font; color?: typeof ink; x?: number } = {}) => {
    page.drawText(text, { x: opts.x ?? left, y, size: opts.size ?? 10, font: opts.f ?? font, color: opts.color ?? ink });
  };
  const right = (text: string, size = 10, f = font, color = ink) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: width - 56 - w, y, size, font: f, color });
  };

  // Issuer header
  line(invoiceIssuer.tradingName, { size: 18, f: bold });
  right("RECEIPT", 16, bold, muted);
  y -= 20;
  line(invoiceIssuer.legalName, { color: muted });
  y -= 14;
  for (const l of invoiceIssuer.addressLines.filter(Boolean)) { line(l, { color: muted }); y -= 13; }
  line(invoiceIssuer.contactEmail, { color: muted });
  y -= 22;
  line(`Registration: HCPC ${issuerField(invoiceIssuer.hcpcNumber)}  ·  CSP ${issuerField(invoiceIssuer.cspNumber)}`, { size: 9, color: muted });
  y -= 26;

  // Invoice meta
  line(`Invoice: ${input.invoiceNumber}`, { f: bold });
  y -= 14;
  line(`Date paid: ${fmtDate(input.paidAtISO)}`);
  y -= 14;
  line(`Patient: ${input.patientName || input.patientEmail}`);
  y -= 28;

  // Table header
  line("Service", { f: bold });
  page.drawText("Session date", { x: 300, y, size: 10, font: bold, color: ink });
  right("Amount", 10, bold);
  y -= 6;
  page.drawLine({ start: { x: left, y }, end: { x: width - 56, y }, thickness: 0.75, color: muted });
  y -= 16;

  // Row
  line(input.serviceLabel);
  page.drawText(fmtDate(input.sessionDateISO), { x: 300, y, size: 10, font, color: ink });
  right(formatGbp(input.amountPence));
  y -= 22;
  page.drawLine({ start: { x: left, y }, end: { x: width - 56, y }, thickness: 0.75, color: muted });
  y -= 18;

  // Total
  line("Total paid", { f: bold });
  right(formatGbp(input.amountPence), 11, bold);
  y -= 30;

  line("Paid by card via Stripe.", { color: muted });
  y -= 16;
  line(invoiceIssuer.vatStatus, { size: 9, color: muted });

  return pdf.save();
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/lib/invoice-pdf.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/invoice-pdf.ts tests/lib/invoice-pdf.test.ts
git commit -m "feat(invoice): add pdf-lib invoice PDF builder"
```

---

### Task 2: Firebase Storage upload/download helper (admin shim)

**Files:**
- Modify: `lib/firebase-admin.ts` (add `devstorage` scope + `uploadObject`/`downloadObject`)
- Test: `tests/lib/firebase-admin-storage.test.ts`

**Interfaces:**
- Produces (exported from `lib/firebase-admin.ts`):
  ```ts
  export async function uploadObject(path: string, bytes: Uint8Array, contentType: string): Promise<{ ok: boolean }>;
  export async function downloadObject(path: string): Promise<Uint8Array | null>;
  ```
  Uses the existing `getAccessToken()` (add scope `https://www.googleapis.com/auth/devstorage.read_write` to `SCOPES`). Bucket = `process.env.FIREBASE_ADMIN_STORAGE_BUCKET`. Upload: `POST https://storage.googleapis.com/upload/storage/v1/b/{bucket}/o?uploadType=media&name={encodedPath}` with `Authorization: Bearer` + `Content-Type`. Download: `GET https://storage.googleapis.com/storage/v1/b/{bucket}/o/{encodedPath}?alt=media`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/firebase-admin-storage.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

// Minimal env so the shim initializes a service account path (mock getAccessToken via fetch to token URL)
const SA = { type: "service_account", project_id: "p", private_key_id: "k",
  private_key: "-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n",
  client_email: "svc@p.iam.gserviceaccount.com" };

afterEach(() => vi.restoreAllMocks());

describe("Storage helpers", () => {
  it("uploadObject posts bytes to the storage upload API with bearer auth", async () => {
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", JSON.stringify(SA));
    vi.stubEnv("FIREBASE_ADMIN_STORAGE_BUCKET", "mybucket.firebasestorage.app");
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("oauth2.googleapis.com/token")) {
        return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
      }
      return new Response(JSON.stringify({ name: "invoices/x.pdf" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    // NOTE: getAccessToken signs a JWT with jose using the private key; if the mock key
    // can't sign, stub the token endpoint is still hit only after signing. If signing fails
    // in the test env, this test may need a real test key — implementer: if jose signing
    // throws on the placeholder key, generate an ephemeral test RSA key in the test setup
    // and use its PKCS8 PEM as private_key so signing succeeds. Keep the assertions below.
    const { uploadObject } = await import("@/lib/firebase-admin");
    const res = await uploadObject("invoices/INV-1.pdf", new Uint8Array([37, 80, 68, 70]), "application/pdf");
    expect(res.ok).toBe(true);
    const uploadCall = fetchMock.mock.calls.find((c) => String(c[0]).includes("/upload/storage/v1/"));
    expect(uploadCall).toBeTruthy();
    const init = uploadCall![1] as RequestInit;
    expect((init.headers as Record<string,string>)["Content-Type"]).toBe("application/pdf");
    expect(String(uploadCall![0])).toContain("name=invoices%2FINV-1.pdf");
  });
});
```

> Implementer note: the `firebase-admin` shim signs a real JWT with `jose` using the service-account `private_key`. If the placeholder PEM above can't be imported by `jose`, generate a throwaway RSA keypair in the test (`crypto.generateKeyPairSync("rsa", { modulusLength: 2048 })`, export PKCS8 PEM) and use that as `private_key` so `getAccessToken()` reaches the mocked token endpoint. The behavioural assertions (upload URL, bearer, content-type, encoded name) are the point.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/lib/firebase-admin-storage.test.ts`
Expected: FAIL — `uploadObject` not exported.

- [ ] **Step 3: Implement in `lib/firebase-admin.ts`**

Add the storage scope to the existing `SCOPES` array:
```ts
const SCOPES = [
  "https://www.googleapis.com/auth/datastore",
  "https://www.googleapis.com/auth/identitytoolkit",
  "https://www.googleapis.com/auth/devstorage.read_write",
].join(" ");
```
(Keep whatever join/format the file already uses — just add the devstorage scope.)

Add near the other exports:
```ts
export async function uploadObject(
  path: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<{ ok: boolean }> {
  const bucket = process.env.FIREBASE_ADMIN_STORAGE_BUCKET;
  if (!bucket) return { ok: false };
  try {
    const token = await getAccessToken();
    const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType },
      body: bytes,
    });
    if (!res.ok) { console.error("Storage upload failed", res.status); return { ok: false }; }
    return { ok: true };
  } catch (error) {
    console.error("Storage upload error", error);
    return { ok: false };
  }
}

export async function downloadObject(path: string): Promise<Uint8Array | null> {
  const bucket = process.env.FIREBASE_ADMIN_STORAGE_BUCKET;
  if (!bucket) return null;
  try {
    const token = await getAccessToken();
    const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/lib/firebase-admin-storage.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the firebase-admin unit suite (guard against regressions)**

Run: `npx vitest run tests/lib/firebase-admin.test.ts`
Expected: PASS (existing tests unaffected — only added a scope + two functions).

- [ ] **Step 6: Commit**

```bash
git add lib/firebase-admin.ts tests/lib/firebase-admin-storage.test.ts
git commit -m "feat(storage): add Firebase Storage upload/download to admin shim"
```

---

### Task 3: Wire PDF into the webhook — attach to email + store

**Files:**
- Modify: `lib/emails/receipt-email.ts` (accept optional PDF attachment)
- Modify: `app/api/payments/webhook/route.ts` (generate PDF, upload, attach; store `invoicePdfPath` on the payment doc)
- Test: extend `tests/lib/emails/receipt-email.test.ts`; extend `tests/api/payments-webhook.test.ts`

**Interfaces:**
- `sendReceiptEmail` gains an optional field:
  ```ts
  export async function sendReceiptEmail(input: {
    to: string; patientName: string; invoiceNumber: string;
    serviceLabel: string; amountPence: number; receiptUrl: string;
    pdf?: { filename: string; base64: string };   // NEW
  }): Promise<{ sent: boolean }>;
  ```
  When `pdf` is present, include Resend `attachments: [{ filename, content: base64 }]`.
- Webhook: after the paid `paymentRef.set(...)`, best-effort: build `InvoicePdfInput` from `intent` + `invoiceNumber` + `paidAt`, `generateInvoicePdf`, `uploadObject("invoices/{invoiceNumber}.pdf", bytes, "application/pdf")`, set `invoicePdfPath` on the payment doc, and pass `pdf` to `sendReceiptEmail`. All wrapped so failure never breaks the 200.

- [ ] **Step 1: Extend receipt-email test**

```ts
// add to tests/lib/emails/receipt-email.test.ts
it("includes the PDF attachment when provided", async () => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  await sendReceiptEmail({
    to: "ada@example.com", patientName: "Ada", invoiceNumber: "INV-2026-AB12CD34",
    serviceLabel: "Initial Online Assessment", amountPence: 5000,
    receiptUrl: "https://site.test/book/receipt/cs_1",
    pdf: { filename: "invoice-INV-2026-AB12CD34.pdf", base64: "JVBERi0x" },
  });
  const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
  expect(body.attachments[0].filename).toBe("invoice-INV-2026-AB12CD34.pdf");
  expect(body.attachments[0].content).toBe("JVBERi0x");
});
```

- [ ] **Step 2: Run (fails), implement attachment in `receipt-email.ts`**

Run: `npx vitest run tests/lib/emails/receipt-email.test.ts` → FAIL.
In `sendReceiptEmail`, when building the Resend body, add:
```ts
      ...(input.pdf ? { attachments: [{ filename: input.pdf.filename, content: input.pdf.base64 }] } : {}),
```
Run again → PASS.

- [ ] **Step 3: Wire into the webhook**

In `app/api/payments/webhook/route.ts`, replace the existing best-effort `sendReceiptEmail` block with one that first builds + stores the PDF:
```ts
  try {
    const { generateInvoicePdf } = await import("@/lib/invoice-pdf");
    const { uploadObject } = await import("@/lib/firebase-admin");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const serviceLabel = bookServiceFor(intent.service).title;
    const pdfBytes = await generateInvoicePdf({
      invoiceNumber,
      paidAtISO: new Date().toISOString(),
      amountPence: session.amount_total ?? 0,
      serviceLabel,
      patientName: intent.name,
      patientEmail: intent.email,
      sessionDateISO: intent.startISO,
    });
    const pdfPath = `invoices/${invoiceNumber}.pdf`;
    const up = await uploadObject(pdfPath, pdfBytes, "application/pdf");
    if (up.ok) {
      try { await paymentRef.set({ invoicePdfPath: pdfPath }, { merge: true }); } catch (e) { console.error("store pdf path failed", e); }
    }
    const base64 = Buffer.from(pdfBytes).toString("base64");
    await sendReceiptEmail({
      to: intent.email, patientName: intent.name, invoiceNumber, serviceLabel,
      amountPence: session.amount_total ?? 0,
      receiptUrl: `${siteUrl}/book/receipt/${session.id}`,
      pdf: { filename: `invoice-${invoiceNumber}.pdf`, base64 },
    });
  } catch (error) {
    console.error("Invoice PDF/email step failed (non-blocking)", error);
  }
```
Confirm `bookServiceFor` is imported in the route (add if missing). If `paymentRef.set(..., { merge: true })` isn't supported by the shim's `set`, use `paymentRef.update({ invoicePdfPath: pdfPath })` instead.

- [ ] **Step 4: Extend the webhook test**

In `tests/api/payments-webhook.test.ts` "valid event" test, the email/pdf step is best-effort and already guarded by `RESEND_API_KEY` unset. Add an assertion that the paid doc write still carries `invoiceNumber` (unchanged) and that the handler still returns 200 with the PDF step present. If `generateInvoicePdf`/`uploadObject` run for real in the test, mock them:
```ts
vi.mock("@/lib/invoice-pdf", () => ({ generateInvoicePdf: vi.fn().mockResolvedValue(new Uint8Array([37,80,68,70])) }));
```
(and ensure `uploadObject` no-ops without a bucket env). Keep all existing assertions.

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/api/payments-webhook.test.ts tests/lib/emails/receipt-email.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/emails/receipt-email.ts app/api/payments/webhook/route.ts tests/api/payments-webhook.test.ts tests/lib/emails/receipt-email.test.ts
git commit -m "feat(invoice): attach PDF to receipt email + store in Firebase Storage"
```

---

### Task 4: Lock the invoices path in Storage rules

**Files:**
- Modify: `storage.rules`

**Interfaces:** deny all client access to `invoices/**` (server-only via service account, which bypasses rules).

- [ ] **Step 1: Add the rule**

In `storage.rules`, inside the `match /b/{bucket}/o {` block, add (before any broad match, or as a specific match):
```
    // Invoice PDFs are written and read only server-side via the service
    // account (which bypasses these rules). Never allow client access.
    match /invoices/{file=**} {
      allow read, write: if false;
    }
```

- [ ] **Step 2: Compile-check by deploying to dev (rules are validated on deploy)**

Run: `firebase deploy --only storage --project physioonclick-dev`
Expected: `rules file storage.rules compiled successfully` + released. (If the CLI isn't authed in the agent env, note this as a manual step for the owner and skip the run — the syntax is standard.)

- [ ] **Step 3: Commit**

```bash
git add storage.rules
git commit -m "chore(storage): deny client access to invoices/ (server-only)"
```

---

### Task 5: Admin invoices view + download route

**Files:**
- Modify: `app/admin/actions.ts` (add `listInvoices`)
- Create: `app/admin/invoices/page.tsx` (client page, admin-gated)
- Create: `app/api/admin/invoice/[invoice]/route.ts` (admin-gated PDF download)
- Test: `tests/api/admin-invoice-download.test.ts`

**Interfaces:**
- `listInvoices(idToken: string)` in `actions.ts`: verify admin (reuse the file's existing admin-verify pattern with `getAdminAuth().verifyIdToken` + `isAdminUser`-equivalent / `ADMIN_EMAIL` check as other actions do), then read the `payments` collection where `status == "paid"`, ordered by `createdAt` desc, returning `{ invoiceNumber, email, service, amountPence, paidAt, stripeSessionId, invoicePdfPath }[]`.
- Download route `GET /api/admin/invoice/[invoice]`: requires an `Authorization: Bearer <idToken>` header (or the app's existing admin session mechanism); verify admin; look up the payment by `invoiceNumber`; `downloadObject(invoicePdfPath)`; return the bytes as `application/pdf` with `Content-Disposition: attachment`. 401 if not admin, 404 if not found.

- [ ] **Step 1: Write the failing test for the download route (admin gating + 404)**

```ts
// tests/api/admin-invoice-download.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
const paymentsGet = vi.fn();
const db = { collection: () => ({ where: () => ({ limit: () => ({ get: paymentsGet }) }) }) };
vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => db,
  getAdminAuth: () => ({ verifyIdToken }),
  downloadObject: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])),
}));
vi.stubEnv("ADMIN_EMAIL", "admin@physioonclick.co.uk");
import { GET } from "@/app/api/admin/invoice/[invoice]/route";

function req(token?: string) {
  return new Request("http://localhost/api/admin/invoice/INV-1", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
const ctx = { params: Promise.resolve({ invoice: "INV-1" }) };

afterEach(() => vi.restoreAllMocks());

describe("GET /api/admin/invoice/[invoice]", () => {
  it("401 without a valid admin token", async () => {
    verifyIdToken.mockRejectedValue(new Error("bad"));
    const res = await GET(req("nope"), ctx);
    expect(res.status).toBe(401);
  });

  it("returns the PDF for an admin", async () => {
    verifyIdToken.mockResolvedValue({ email: "admin@physioonclick.co.uk" });
    paymentsGet.mockResolvedValue({ empty: false, docs: [{ data: () => ({ invoicePdfPath: "invoices/INV-1.pdf", status: "paid" }) }] });
    const res = await GET(req("good"), ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/pdf");
  });

  it("404 when the invoice/pdf is missing", async () => {
    verifyIdToken.mockResolvedValue({ email: "admin@physioonclick.co.uk" });
    paymentsGet.mockResolvedValue({ empty: true, docs: [] });
    const res = await GET(req("good"), ctx);
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/api/admin-invoice-download.test.ts`
Expected: FAIL — route missing.

- [ ] **Step 3: Implement the download route**

```ts
// app/api/admin/invoice/[invoice]/route.ts
import { NextResponse } from "next/server";
import { downloadObject, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

function isAdminEmail(email: string | undefined): boolean {
  const allow = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  return !!email && !!allow && email.toLowerCase() === allow;
}

export async function GET(request: Request, ctx: { params: Promise<{ invoice: string }> }) {
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = getAdminAuth();
  if (!auth) return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  let decoded: { email?: string };
  try { decoded = await auth.verifyIdToken(token); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  if (!isAdminEmail(decoded.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { invoice } = await ctx.params;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  const snap = await db.collection("payments").where("invoiceNumber", "==", invoice).limit(1).get();
  if (snap.empty) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const path = (snap.docs[0].data() as { invoicePdfPath?: string }).invoicePdfPath;
  if (!path) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bytes = await downloadObject(path);
  if (!bytes) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${invoice}.pdf"` },
  });
}
```

> Implementer: confirm `getAdminAuth` is exported from `lib/firebase-admin.ts` (it's imported in `app/admin/actions.ts`). Match the admin check to how `actions.ts` verifies admin (it may use a shared helper — reuse it rather than duplicating the `ADMIN_EMAIL` compare if one exists).

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/api/admin-invoice-download.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Add `listInvoices` to `app/admin/actions.ts`**

Follow the exact admin-verify + `getAdminDb` pattern already used by other actions in the file. Return the paid payments list:
```ts
export async function listInvoices(idToken: string) {
  const db = getAdminDb();
  if (!db) return { ok: false as const, error: "unavailable" };
  // reuse the file's existing admin verification (verifyIdToken + admin check)
  // ... verify or throw/return unauthorized as sibling actions do ...
  const snap = await db.collection("payments").where("status", "==", "paid").orderBy("createdAt", "desc").limit(200).get();
  const invoices = snap.docs.map((d) => {
    const p = d.data() as Record<string, unknown>;
    return {
      invoiceNumber: (p.invoiceNumber as string) ?? "",
      email: (p.email as string) ?? "",
      service: (p.service as string) ?? "",
      amountPence: (p.amountPence as number) ?? 0,
      paidAt: (p.paidAt as string) ?? "",
      stripeSessionId: (p.stripeSessionId as string) ?? "",
      hasPdf: Boolean(p.invoicePdfPath),
    };
  });
  return { ok: true as const, invoices };
}
```
(If `orderBy("createdAt","desc")` needs a Firestore index, add it to `firestore.indexes.json`; the `payments` collection is small, so a client-side sort after a plain `where` is acceptable if simpler — implementer's judgment, matching existing patterns.)

- [ ] **Step 6: Create the admin invoices page**

```tsx
// app/admin/invoices/page.tsx
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminUser } from "@/lib/admin-auth";
import { listInvoices } from "@/app/admin/actions";
import { formatGbp } from "@/lib/invoice";

type Row = { invoiceNumber: string; email: string; service: string; amountPence: number; paidAt: string; stripeSessionId: string; hasPdf: boolean };

export default function AdminInvoicesPage() {
  const [checked, setChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    if (!auth) { setChecked(true); return; }
    return onAuthStateChanged(auth, async (user) => {
      const ok = user ? await isAdminUser(user) : false;
      setIsAdmin(ok);
      setChecked(true);
      if (ok && user) {
        const t = await user.getIdToken();
        setToken(t);
        const res = await listInvoices(t);
        if (res.ok) setRows(res.invoices);
      }
    });
  }, []);

  if (!checked) return <main style={{ padding: "2rem" }}>Loading…</main>;
  if (!isAdmin) return <main style={{ padding: "2rem" }}>Admin access required.</main>;

  return (
    <main style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
      <h1>Invoices</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>{["Date", "Invoice", "Patient", "Service", "Amount", "PDF"].map((h) => (
            <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "0.5rem" }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.invoiceNumber}>
              <td style={{ padding: "0.5rem" }}>{r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-GB") : "—"}</td>
              <td style={{ padding: "0.5rem" }}>{r.invoiceNumber}</td>
              <td style={{ padding: "0.5rem" }}>{r.email}</td>
              <td style={{ padding: "0.5rem" }}>{r.service}</td>
              <td style={{ padding: "0.5rem" }}>{formatGbp(r.amountPence)}</td>
              <td style={{ padding: "0.5rem" }}>
                {r.hasPdf ? (
                  <a href={`/api/admin/invoice/${r.invoiceNumber}`}
                     onClick={async (e) => {
                       e.preventDefault();
                       const res = await fetch(`/api/admin/invoice/${r.invoiceNumber}`, { headers: { Authorization: `Bearer ${token}` } });
                       if (!res.ok) return;
                       const blob = await res.blob();
                       const url = URL.createObjectURL(blob);
                       const a = document.createElement("a");
                       a.href = url; a.download = `${r.invoiceNumber}.pdf`; a.click();
                       URL.revokeObjectURL(url);
                     }}>Download</a>
                ) : "—"}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} style={{ padding: "1rem", color: "#666" }}>No paid invoices yet.</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 7: Run suite + typecheck**

Run: `npm run test:run` (ignore the 12 pre-existing unrelated failures; no NEW ones) and `npx tsc --noEmit` (touched files clean).

- [ ] **Step 8: Commit**

```bash
git add app/admin/actions.ts app/admin/invoices/page.tsx "app/api/admin/invoice/[invoice]/route.ts" tests/api/admin-invoice-download.test.ts firestore.indexes.json
git commit -m "feat(admin): invoices list + admin-gated PDF download"
```

---

### Task 6: Docs + link the admin page

**Files:**
- Modify: `CLAUDE.md` (note the PDF/storage/admin-invoices addition)
- Modify: the admin dashboard nav/home (`app/admin/page.tsx`) to add an "Invoices" link (match existing admin link pattern)

- [ ] **Step 1:** Add an "Invoices" link to the admin dashboard, matching how existing admin sections (patients, recovery, chat-logs) are linked.
- [ ] **Step 2:** Update `CLAUDE.md` payments paragraph: receipts now generate a `pdf-lib` PDF, attached to the Resend email and stored at `invoices/{invoiceNumber}.pdf` in Firebase Storage (client-denied via `storage.rules`); admin list at `/admin/invoices` + download via `/api/admin/invoice/[invoice]`.
- [ ] **Step 3: Commit**
```bash
git add CLAUDE.md app/admin/page.tsx
git commit -m "docs(invoice): document PDF/storage/admin invoices"
```

---

## Self-Review Notes
- PDF generated server-side with pdf-lib (Workers-safe) — Task 1. Attached to email (Resend attachments) — Task 3. Stored in Firebase Storage via new shim helper reusing the service-account token — Tasks 2–3. Admin list + gated download — Task 5. Client access to invoices denied — Task 4.
- Best-effort throughout: PDF/upload/email failures never break the webhook 200 or the booking (try/catch around the whole block).
- PDF built from webhook metadata (`intent.*`), not the `bookings` doc — correct, since that doc may not exist yet at webhook time.
- Deploy note: after merge, run `npm run deploy` from the worktree; `firebase deploy --only storage` for the new rule (both dev + prod).
