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
