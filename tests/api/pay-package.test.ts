// @vitest-environment node
import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { memoryFirestore } from "../helpers/memory-firestore";

let mem = memoryFirestore();
const { uploadObject, createCalBooking } = vi.hoisted(() => ({
  uploadObject: vi.fn().mockResolvedValue({ ok: true }),
  createCalBooking: vi.fn(),
}));
vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => mem.db,
  FieldValue: { serverTimestamp: () => "TS" },
  uploadObject,
}));
vi.mock("@/lib/invoice-pdf", () => ({
  generateInvoicePdf: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])),
}));
vi.mock("@/lib/cal-booking", () => ({ createCalBooking }));

import { POST as PAY } from "@/app/api/pay/[token]/route";
import { POST as WEBHOOK } from "@/app/api/payments/webhook/route";
import { getPaymentRequest } from "@/lib/package-payment";

const TOKEN = "a".repeat(32);
const SECRET = "whsec_test";
const fetchMock = vi.fn();

function seed(extra: Record<string, unknown> = {}) {
  mem = memoryFirestore({
    "sessionPackages/pkg0000001": {
      ownerUid: "patientUid123", patientId: "patientUid123", patientName: "Edwin Argo", email: "pat@example.com",
      title: "Home visit treatment plan", visitType: "home", totalSessions: 7, usedSessions: 2,
      startDate: "2026-11-15", endDate: "2026-11-21", pricePence: 50000, manual: true,
      paymentStatus: "link-ready", paymentRequestId: TOKEN, ...extra,
    },
    [`paymentRequests/${TOKEN}`]: { packageId: "pkg0000001", status: "open" },
  });
}

beforeEach(() => {
  seed();
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", SECRET);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://physioonclick.co.uk");
  vi.stubEnv("RESEND_API_KEY", "re_test");
  fetchMock.mockImplementation(async (url: string) =>
    String(url).includes("stripe.com")
      ? new Response(JSON.stringify({ id: "cs_pkg", url: "https://checkout.stripe.com/c/cs_pkg" }), { status: 200 })
      : new Response("{}", { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const ctx = (token: string) => ({ params: Promise.resolve({ token }) });

describe("package payment link", () => {
  it("shows only what the payer needs", async () => {
    const view = await getPaymentRequest(TOKEN);
    expect(view).toMatchObject({ firstName: "Edwin", amountPence: 50000, totalSessions: 7, status: "open", datesLine: "Sun 15 Nov – Sat 21 Nov 2026" });
  });

  it("rejects malformed, unknown and replaced tokens", async () => {
    expect(await getPaymentRequest("nope")).toBeNull();
    expect(await getPaymentRequest("b".repeat(32))).toBeNull();
    seed({ paymentRequestId: "c".repeat(32) });
    expect(await getPaymentRequest(TOKEN)).toBeNull();
  });

  it("starts Stripe checkout at the package price with package metadata", async () => {
    const res = await PAY(new Request("http://x", { method: "POST" }), ctx(TOKEN));
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.com/c/cs_pkg" });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = new URLSearchParams(init.body as string);
    expect(form.get("line_items[0][price_data][unit_amount]")).toBe("50000");
    expect(form.get("metadata[kind]")).toBe("package-payment");
    expect(form.get("metadata[paymentRequestId]")).toBe(TOKEN);
    expect(form.get("metadata[service]")).toBeNull();
    expect(form.get("success_url")).toBe(`https://physioonclick.co.uk/pay/${TOKEN}?paid=1`);
  });

  it("refuses to charge twice", async () => {
    seed({ paymentStatus: "paid" });
    const res = await PAY(new Request("http://x", { method: "POST" }), ctx(TOKEN));
    expect(res.status).toBe(409);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("webhook settles the package with no Cal booking and emails a receipt", async () => {
    const event = {
      id: "evt_pkg",
      type: "checkout.session.completed",
      data: { object: { id: "cs_pkg", amount_total: 50000, currency: "gbp", metadata: { kind: "package-payment", paymentRequestId: TOKEN, packageId: "pkg0000001", name: "Edwin Argo", email: "pat@example.com" } } },
    };
    const body = JSON.stringify(event);
    const ts = Math.floor(Date.now() / 1000);
    const v1 = crypto.createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");
    const res = await WEBHOOK(new Request("http://x", { method: "POST", headers: { "stripe-signature": `t=${ts},v1=${v1}` }, body }));
    expect(res.status).toBe(200);
    expect(createCalBooking).not.toHaveBeenCalled();
    expect(mem.get("sessionPackages/pkg0000001")).toMatchObject({ paymentStatus: "paid", paidMethod: "stripe", amountPaidPence: 50000 });
    expect(mem.get(`paymentRequests/${TOKEN}`)).toMatchObject({ status: "paid" });
    expect(mem.get("payments/evt_pkg")).toMatchObject({ status: "paid", kind: "package-payment", stripeSessionId: "cs_pkg", patientName: "Edwin Argo" });
    expect(uploadObject).toHaveBeenCalled();
    const resend = fetchMock.mock.calls.find(([u]) => String(u).includes("resend"));
    expect(resend).toBeTruthy();

    // Stripe retry is a no-op.
    await WEBHOOK(new Request("http://x", { method: "POST", headers: { "stripe-signature": `t=${ts},v1=${v1}` }, body }));
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes("resend"))).toHaveLength(1);
  });

  it("also tells the owner about a paid package", async () => {
    vi.stubEnv("PAYMENT_NOTIFY_EMAIL", "owner@example.com");
    const event = {
      id: "evt_pkg",
      type: "checkout.session.completed",
      data: { object: { id: "cs_pkg", amount_total: 50000, currency: "gbp", metadata: { kind: "package-payment", paymentRequestId: TOKEN, packageId: "pkg0000001", name: "Edwin Argo", email: "pat@example.com" } } },
    };
    const body = JSON.stringify(event);
    const ts = Math.floor(Date.now() / 1000);
    const v1 = crypto.createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");
    const res = await WEBHOOK(new Request("http://x", { method: "POST", headers: { "stripe-signature": `t=${ts},v1=${v1}` }, body }));
    expect(res.status).toBe(200);
    expect(createCalBooking).not.toHaveBeenCalled();
    expect(mem.get("sessionPackages/pkg0000001")).toMatchObject({ paymentStatus: "paid", paidMethod: "stripe", amountPaidPence: 50000 });
    expect(mem.get(`paymentRequests/${TOKEN}`)).toMatchObject({ status: "paid" });
    expect(mem.get("payments/evt_pkg")).toMatchObject({ status: "paid", kind: "package-payment", stripeSessionId: "cs_pkg", patientName: "Edwin Argo" });
    const emails = fetchMock.mock.calls
      .filter(([u]) => String(u).includes("resend"))
      .map(([, init]) => JSON.parse((init as RequestInit).body as string));
    expect(emails).toHaveLength(2);
    expect(emails[1].to).toEqual(["owner@example.com"]);
    expect(emails[1].subject).toContain("Payment received: £500.00 from Edwin Argo");
    expect(emails[1].attachments).toHaveLength(1);
  });
});
