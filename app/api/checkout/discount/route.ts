import { NextResponse } from "next/server";

import { isBookServiceId } from "@/lib/cal-services";
import { validateCheckoutDiscount } from "@/lib/checkout-discounts";
import { isVisitType } from "@/lib/home-visit";
import { EMAIL_RE, LIMITS } from "@/lib/validation";

type Body = {
  code?: unknown;
  email?: unknown;
  service?: unknown;
  visitType?: unknown;
};

function bad(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > LIMITS.email || !EMAIL_RE.test(email)) {
    return bad("Enter your email before applying a discount code.");
  }
  if (!isBookServiceId(body.service)) return bad("Invalid service.");
  if (body.visitType !== undefined && body.visitType !== null && !isVisitType(body.visitType)) {
    return bad("Invalid visit type.");
  }

  const discount = await validateCheckoutDiscount({
    code: body.code,
    email,
    service: body.service,
    ...(isVisitType(body.visitType) ? { visitType: body.visitType } : {}),
  });
  if (!discount.ok) return bad(discount.error);

  return NextResponse.json({
    ok: true,
    discount: {
      percent: discount.percent,
      amountPence: discount.amountPence,
      discountAmountPence: discount.discountAmountPence,
      originalAmountPence: discount.originalAmountPence,
    },
  });
}
