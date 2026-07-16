import { NextRequest, NextResponse } from "next/server";

import { CAL_USERNAME, calServiceFor, isBookServiceId } from "@/lib/cal-services";

/**
 * Real Cal.com availability for the custom /book calendar.
 *
 * Cal.com's public v2 /slots endpoint authenticates by `eventTypeSlug` +
 * `username` and needs no API key — see lib/cal-services.ts for why
 * CAL_API_KEY is deliberately not used here.
 */

const MAX_RANGE_DAYS = 62;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Guards against auto-rolled dates like 2026-02-30 -> 2026-03-02.
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

type CalSlotsResponse = {
  data?: Record<string, Array<{ start?: unknown }> | undefined>;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const service = searchParams.get("service");
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  if (!isBookServiceId(service)) {
    return NextResponse.json({ error: "Invalid or missing service." }, { status: 400 });
  }

  if (!isValidDateString(start) || !isValidDateString(end)) {
    return NextResponse.json(
      { error: "start and end must be valid YYYY-MM-DD dates." },
      { status: 400 },
    );
  }

  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);

  if (endDate < startDate) {
    return NextResponse.json({ error: "end must not be before start." }, { status: 400 });
  }

  const rangeDays = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
  if (rangeDays > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { error: `Date range must not exceed ${MAX_RANGE_DAYS} days.` },
      { status: 400 },
    );
  }

  if (!CAL_USERNAME) {
    return NextResponse.json(
      { error: "Booking calendar is not configured. Please contact us to book an appointment." },
      { status: 503 },
    );
  }

  const calSlug = calServiceFor(service).calSlug;

  const url = new URL("https://api.cal.com/v2/slots");
  url.searchParams.set("eventTypeSlug", calSlug);
  url.searchParams.set("username", CAL_USERNAME);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "cal-api-version": "2024-09-04" },
      next: { revalidate: 60 },
    });
  } catch (error) {
    console.error("Cal.com slots request failed", error);
    return NextResponse.json({ error: "Unable to reach the booking calendar." }, { status: 502 });
  }

  if (!response.ok) {
    console.error("Cal.com slots request returned an error status", response.status, await safeText(response));
    return NextResponse.json({ error: "Unable to load available times." }, { status: 502 });
  }

  let json: CalSlotsResponse;
  try {
    json = (await response.json()) as CalSlotsResponse;
  } catch (error) {
    console.error("Cal.com slots response was not valid JSON", error);
    return NextResponse.json({ error: "Unable to load available times." }, { status: 502 });
  }

  const raw = json?.data;
  const slots: Record<string, string[]> = {};

  if (raw && typeof raw === "object") {
    for (const [date, entries] of Object.entries(raw)) {
      if (!Array.isArray(entries)) continue;
      const isoStarts = entries
        .map((entry) => (entry && typeof entry === "object" ? entry.start : undefined))
        .filter((value): value is string => typeof value === "string");
      if (isoStarts.length > 0) {
        slots[date] = isoStarts;
      }
    }
  }

  return NextResponse.json({ slots });
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
