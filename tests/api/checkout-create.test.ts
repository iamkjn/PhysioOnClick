import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/payments/stripe", () => ({
  createStripeCheckout: vi.fn(),
}));
import { createStripeCheckout } from "@/lib/payments/stripe";
import { POST } from "@/app/api/checkout/create/route";
import { bookServiceFor } from "@/lib/cal-services";

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

// Derived from the live price list so a price change doesn't break these tests.
const SESSION_PENCE = Math.round(bookServiceFor("initial-assessment").price * 100);
const DISCOUNT_PENCE = Math.round(SESSION_PENCE * 0.1);
const DISCOUNTED_PENCE = SESSION_PENCE - DISCOUNT_PENCE;

beforeEach(() => vi.clearAllMocks());
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
    const arg = (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.amountPence).toBe(SESSION_PENCE);
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
    expect(arg.amountPence).toBe(SESSION_PENCE);
  });

  it("applies the new patient discount code server-side", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.test");
    (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, url: "https://checkout.stripe.com/c/cs_1", sessionId: "cs_1",
    });

    const res = await POST(req({ ...VALID, discountCode: "new10" }));

    expect(res.status).toBe(200);
    const arg = (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.amountPence).toBe(DISCOUNTED_PENCE);
    expect(arg.intent.discountCode).toBe("NEW10");
    expect(arg.intent.discountPercent).toBe("10");
    expect(arg.intent.originalAmountPence).toBe(String(SESSION_PENCE));
    expect(arg.intent.discountAmountPence).toBe(String(DISCOUNT_PENCE));
  });

  it("rejects unknown discount codes before Stripe checkout", async () => {
    const res = await POST(req({ ...VALID, discountCode: "SAVE99" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Discount code not recognised.");
    expect(createStripeCheckout).not.toHaveBeenCalled();
  });
});

describe("POST /api/checkout/create — visit type", () => {
  function okStripe() {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.test");
    (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, url: "https://checkout.stripe.com/c/cs_1", sessionId: "cs_1",
    });
  }
  function lastIntent() {
    return (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].intent;
  }
  function lastAmount() {
    return (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].amountPence;
  }

  it("defaults to a video call and needs no address", async () => {
    okStripe();
    const res = await POST(req(VALID));
    expect(res.status).toBe(200);
    expect(lastIntent().visitType).toBe("video");
    expect(lastIntent()).not.toHaveProperty("homeVisitAddress");
  });

  it("ignores any address sent with a video booking", async () => {
    okStripe();
    const res = await POST(req({ ...VALID, visitType: "video", homeAddressLine: "7 Example Street", homePostcode: "G31 4HS" }));
    expect(res.status).toBe(200);
    expect(lastIntent().visitType).toBe("video");
    expect(lastIntent()).not.toHaveProperty("homeVisitAddress");
  });

  it("rejects an unknown visit type", async () => {
    const res = await POST(req({ ...VALID, visitType: "clinic" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/visit type/i);
    expect(createStripeCheckout).not.toHaveBeenCalled();
  });

  it("rejects a home visit without an address", async () => {
    const res = await POST(req({ ...VALID, visitType: "home", homePostcode: "G31 4HS" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/address/i);
    expect(createStripeCheckout).not.toHaveBeenCalled();
  });

  it("rejects a home visit without a valid postcode", async () => {
    const missing = await POST(req({ ...VALID, visitType: "home", homeAddressLine: "7 Example Street" }));
    expect(missing.status).toBe(400);
    expect((await missing.json()).error).toMatch(/postcode/i);
    const malformed = await POST(req({ ...VALID, visitType: "home", homeAddressLine: "7 Example Street", homePostcode: "12345" }));
    expect(malformed.status).toBe(400);
    expect(createStripeCheckout).not.toHaveBeenCalled();
  });

  it("rejects an address over 120 characters", async () => {
    const res = await POST(req({ ...VALID, visitType: "home", homeAddressLine: "x".repeat(121), homePostcode: "G31 4HS" }));
    expect(res.status).toBe(400);
  });

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

  it("does not discount the travel fee on a home visit", async () => {
    okStripe();
    const res = await POST(req({
      ...VALID, discountCode: "new10", visitType: "home", homeAddressLine: "7 Example Street", homePostcode: "G31 4HS",
    }));
    expect(res.status).toBe(200);
    const arg = (createStripeCheckout as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.amountPence).toBe(DISCOUNTED_PENCE);
    expect(arg.extraLineItems[0].amountPence).toBe(1500);
    expect(arg.intent.discountAmountPence).toBe(String(DISCOUNT_PENCE));
  });
});
