import { NextResponse } from "next/server";
import { resolveAddress } from "@/lib/address-lookup";
import { isCoveredPostcode } from "@/lib/home-visit-area";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

const STATUS = { not_found: 404, rate_limited: 429, unconfigured: 503, provider_error: 503 } as const;
const ERROR = { not_found: "not_found", rate_limited: "rate_limited", unconfigured: "unavailable", provider_error: "unavailable" } as const;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

export async function POST(request: Request) {
  if (await isRateLimited("ADDRESS_RATE_LIMITER", clientIp(request))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  let body: { id?: unknown };
  try {
    body = (await request.json()) as { id?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof body.id !== "string" || !ID_PATTERN.test(body.id)) {
    return NextResponse.json({ error: "Invalid address id." }, { status: 400 });
  }
  const result = await resolveAddress(body.id);
  if (!result.ok) return NextResponse.json({ error: ERROR[result.reason] }, { status: STATUS[result.reason] });
  if (!isCoveredPostcode(result.value.postcode)) return NextResponse.json({ error: "not_covered" }, { status: 422 });
  return NextResponse.json({ addressLine: result.value.addressLine, postcode: result.value.postcode });
}
