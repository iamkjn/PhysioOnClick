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
