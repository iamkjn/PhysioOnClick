import { NextResponse } from "next/server";
import { findAddresses } from "@/lib/address-lookup";
import { isCoveredPostcode } from "@/lib/home-visit-area";
import { validateHomeVisit } from "@/lib/home-visit";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

const STATUS = { not_found: 404, rate_limited: 429, unconfigured: 503, provider_error: 503 } as const;
const ERROR = { not_found: "not_found", rate_limited: "rate_limited", unconfigured: "unavailable", provider_error: "unavailable" } as const;

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
  if (!isCoveredPostcode(shape.postcode)) return NextResponse.json({ error: "not_covered" }, { status: 422 });
  const result = await findAddresses(shape.postcode);
  if (!result.ok) return NextResponse.json({ error: ERROR[result.reason] }, { status: STATUS[result.reason] });
  return NextResponse.json({ addresses: result.value });
}
