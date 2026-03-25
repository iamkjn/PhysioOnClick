import { NextResponse } from "next/server";

import { fetchDynamicPricing } from "@/lib/firestore-content";
import { getStripeServer } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

export async function POST(request: Request) {
  const { service, email } = (await request.json()) as { service?: string; email?: string };
  const pricing = await fetchDynamicPricing();
  const selected = pricing.find((item) => item.title === service);
  const stripe = getStripeServer();

  if (!selected) {
    return NextResponse.json({ error: "Unknown service selected." }, { status: 400 });
  }

  if (!stripe) {
    return NextResponse.json({
      error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY."
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    billing_address_collection: "auto",
    metadata: {
      service: selected.title
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: selected.price * 100,
          product_data: {
            name: `PhysioOnClick - ${selected.title}`,
            description: `${selected.mode} appointment (${selected.duration})`
          }
        }
      }
    ],
    success_url: absoluteUrl("/patient"),
    cancel_url: absoluteUrl("/pricing")
  });

  return NextResponse.json({ url: session.url });
}
