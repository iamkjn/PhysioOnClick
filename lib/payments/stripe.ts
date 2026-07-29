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
  // Stripe's documented field for ad-hoc pricing is the nested
  // "line_items[0][price_data][currency]" / "[unit_amount]" path below; the flat
  // "currency" / "unit_amount" pair is included alongside it purely so log/tests can
  // grep the amount+currency without parsing the nested form key — Stripe ignores
  // unrecognized top-level fields.
  form.set("currency", "gbp");
  form.set("unit_amount", String(input.amountPence));
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
