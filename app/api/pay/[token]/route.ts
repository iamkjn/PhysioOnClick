import { NextResponse } from "next/server";
import { getPaymentRequest, startPackageCheckout } from "@/lib/package-payment";

// Public. Starts a fresh Stripe Checkout session for a package payment
// request each time the payer presses "Pay", so the /pay link never expires
// the way a single Checkout session (24h) would. The amount always comes from
// the package doc, never from the request.

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await getPaymentRequest(token);
  if (!view) return NextResponse.json({ error: "This payment link isn't valid." }, { status: 404 });
  if (view.status === "paid") return NextResponse.json({ error: "This has already been paid." }, { status: 409 });
  if (view.status !== "open") return NextResponse.json({ error: "This payment link isn't available." }, { status: 400 });

  const result = await startPackageCheckout(view);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ url: result.url });
}
