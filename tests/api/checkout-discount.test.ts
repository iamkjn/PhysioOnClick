import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The discount route previews NEW10 for the booking UI. A home visit is one
// whole price (lib/home-visit-pricing), so the 10% comes off that whole price.

const paymentsGet = vi.fn();
const db = {
  collection: vi.fn(() => ({
    where: () => ({ limit: () => ({ get: paymentsGet }) }),
  })),
};
vi.mock("@/lib/firebase-admin", () => ({ getAdminDb: () => db }));

import { POST } from "@/app/api/checkout/discount/route";
import { sessionPricePence } from "@/lib/home-visit-pricing";

function req(body: unknown) {
  return new Request("http://localhost/api/checkout/discount", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID = { code: "new10", email: "ada@example.com", service: "initial-assessment" };

function expected(original: number) {
  const discountAmountPence = Math.round(original * 0.1);
  return {
    percent: 10,
    originalAmountPence: original,
    discountAmountPence,
    amountPence: original - discountAmountPence,
  };
}

beforeEach(() => {
  paymentsGet.mockResolvedValue({ empty: true, docs: [] });
});
afterEach(() => vi.clearAllMocks());

describe("POST /api/checkout/discount — visit type", () => {
  it("discounts the video price when no visit type is sent", async () => {
    const res = await POST(req(VALID));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.discount).toEqual(expected(sessionPricePence("initial-assessment")));
  });

  it("discounts the video price for a video call", async () => {
    const res = await POST(req({ ...VALID, visitType: "video" }));
    expect(res.status).toBe(200);
    expect((await res.json()).discount).toEqual(expected(sessionPricePence("initial-assessment", "video")));
  });

  it("treats a null visit type as a video call", async () => {
    const res = await POST(req({ ...VALID, visitType: null }));
    expect(res.status).toBe(200);
    expect((await res.json()).discount).toEqual(expected(sessionPricePence("initial-assessment", "video")));
  });

  it("discounts the whole home-visit price for a home visit", async () => {
    const res = await POST(req({ ...VALID, visitType: "home" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    const whole = sessionPricePence("initial-assessment", "home");
    expect(json.discount).toEqual(expected(whole));
    // The whole home price is more than the video price, and all of it is discounted.
    expect(json.discount.originalAmountPence).toBeGreaterThan(sessionPricePence("initial-assessment"));
    expect(JSON.stringify(json)).not.toMatch(/travel/i);
  });

  it("discounts the whole price of a home-visit bundle", async () => {
    const res = await POST(req({ ...VALID, service: "bundle-4", visitType: "home" }));
    expect(res.status).toBe(200);
    expect((await res.json()).discount).toEqual(expected(sessionPricePence("bundle-4", "home")));
  });

  it("rejects an unknown visit type before checking the code", async () => {
    for (const visitType of ["clinic", "HOME", 1, true, {}]) {
      const res = await POST(req({ ...VALID, visitType }));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ ok: false, error: "Invalid visit type." });
    }
    expect(paymentsGet).not.toHaveBeenCalled();
  });

  it("still checks the email and service before the visit type", async () => {
    const noEmail = await POST(req({ ...VALID, email: "", visitType: "clinic" }));
    expect(noEmail.status).toBe(400);
    expect((await noEmail.json()).error).toBe("Enter your email before applying a discount code.");
    const badService = await POST(req({ ...VALID, service: "not-real", visitType: "clinic" }));
    expect(badService.status).toBe(400);
    expect((await badService.json()).error).toBe("Invalid service.");
  });

  it("still refuses NEW10 to a returning patient booking a home visit", async () => {
    paymentsGet.mockResolvedValue({ empty: false, docs: [{ data: () => ({ status: "paid" }) }] });
    const res = await POST(req({ ...VALID, visitType: "home" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("This discount code is only for new patients.");
  });

  it("rejects an unrecognised code for a home visit", async () => {
    const res = await POST(req({ ...VALID, code: "SAVE99", visitType: "home" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Discount code not recognised.");
  });
});
