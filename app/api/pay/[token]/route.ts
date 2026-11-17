import { NextResponse } from "next/server";
import { getPaymentRequest } from "@/lib/package-payment";
import { createStripeCheckout } from "@/lib/payments/stripe";

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const payUrl = new URL(`/pay/${token}`, siteUrl);
  const successUrl = new URL(payUrl);
  successUrl.searchParams.set("paid", "1");

  const sessionsLabel = `${view.totalSessions} ${view.visitType === "home" ? "home visit" : "video session"}${view.totalSessions === 1 ? "" : "s"}`;
  const result = await createStripeCheckout({
    intent: {
      // Required by the shared BookingIntent shape; not used for a package payment.
      service: "follow-up",
      startISO: "",
      name: view.patientName,
      email: view.email,
      timeZone: "Europe/London",
      visitType: view.visitType,
    },
    amountPence: view.amountPence,
    serviceLabel: `${view.title} (${sessionsLabel})`,
    successUrl: successUrl.toString(),
    cancelUrl: payUrl.toString(),
    metadataOverride: {
      kind: "package-payment",
      paymentRequestId: token,
      packageId: view.packageId,
      name: view.patientName,
      email: view.email,
    },
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ url: result.url });
}
