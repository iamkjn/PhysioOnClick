import { NextResponse } from "next/server";
import { isCoveredPostcode, outwardCode } from "@/lib/home-visit-area";
import { validateHomeVisit } from "@/lib/home-visit";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (await isRateLimited("ADDRESS_RATE_LIMITER", clientIp(request))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { postcode?: unknown };
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object") throw new Error("bad body");
    body = parsed as { postcode?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Reuse the booking validator's postcode rules; the address line is irrelevant here.
  const shape = validateHomeVisit("placeholder", body.postcode);
  if (!shape.ok) return NextResponse.json({ error: "Enter a valid postcode." }, { status: 400 });

  const pc = shape.postcode;
  return NextResponse.json({
    covered: isCoveredPostcode(pc),
    outwardCode: outwardCode(pc),
    postcode: pc,
  });
}
