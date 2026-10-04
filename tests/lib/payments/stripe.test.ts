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
    expect(body).toContain("%5Bcurrency%5D=gbp");
    expect(body).toContain("%5Bunit_amount%5D=5000");
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

  it("withholds Stripe's error body when the request carries a home address", async () => {
    // Stripe echoes request params (metadata) in some error bodies.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response('{"error":{"message":"bad metadata[homeVisitAddress]=7 Example Street, G31 4HS"}}', { status: 400 }),
    ));
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await createStripeCheckout({
      ...INPUT,
      intent: { ...INPUT.intent, visitType: "home" as const, homeVisitAddress: "7 Example Street, G31 4HS" },
    });
    expect(result.ok).toBe(false);
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).toContain("400");
    expect(logged).not.toContain("Example Street");
    expect(logged).not.toContain("G31 4HS");
  });

  it("still logs Stripe's error body for a video booking", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("no such price", { status: 400 })));
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await createStripeCheckout(INPUT);
    expect(JSON.stringify(errorSpy.mock.calls)).toContain("no such price");
  });
});


describe("createStripeCheckout line items", () => {
  const intent = {
    service: "initial-assessment" as const,
    startISO: "2999-01-01T10:00:00.000Z",
    name: "Ada",
    email: "ada@example.com",
    timeZone: "Europe/London",
  };
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
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
