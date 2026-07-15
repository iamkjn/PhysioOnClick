import { NextResponse } from "next/server";

import { CAL_USERNAME, calServiceFor, isBookServiceId } from "@/lib/cal-services";

/**
 * Real Cal.com booking creation for the custom /book calendar.
 *
 * Cal.com's public v2 /bookings endpoint authenticates by `eventTypeSlug` +
 * `username` and needs no API key — see lib/cal-services.ts for why
 * CAL_API_KEY is deliberately not used here.
 *
 * IMPORTANT: this route deliberately does NOT write to Firestore. Cal.com
 * fires a BOOKING_CREATED webhook for every booking it creates (including
 * ones made here), and app/api/cal-webhook/route.ts already persists that
 * event to the `bookings` collection. Writing here too would double-record
 * the booking.
 */

const DEFAULT_TIMEZONE = "Europe/London";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 200;
const MAX_TIMEZONE_LENGTH = 64;
const MAX_FOCUS_AREAS = 10;
const MAX_FOCUS_AREA_LENGTH = 40;

type BookRequestBody = {
  service?: unknown;
  start?: unknown;
  name?: unknown;
  email?: unknown;
  timeZone?: unknown;
  focusAreas?: unknown;
};

function sanitizeFocusAreas(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  if (value.length > MAX_FOCUS_AREAS) return undefined;
  if (!value.every((entry) => typeof entry === "string" && entry.length <= MAX_FOCUS_AREA_LENGTH)) {
    return undefined;
  }
  const cleaned = value.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  return cleaned.length > 0 ? cleaned : undefined;
}

async function postToCal(payload: Record<string, unknown>): Promise<Response> {
  return fetch("https://api.cal.com/v2/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "cal-api-version": "2024-08-13",
    },
    body: JSON.stringify(payload),
  });
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  let body: BookRequestBody;
  try {
    body = (await request.json()) as BookRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const { service, start, name, email, timeZone, focusAreas } = body;

  if (!isBookServiceId(service)) {
    return NextResponse.json({ ok: false, error: "Invalid or missing service." }, { status: 400 });
  }

  if (typeof start !== "string" || start.trim() === "") {
    return NextResponse.json({ ok: false, error: "Invalid or missing start time." }, { status: 400 });
  }
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ ok: false, error: "Invalid start time." }, { status: 400 });
  }
  if (startDate.getTime() <= Date.now()) {
    return NextResponse.json({ ok: false, error: "start must be in the future." }, { status: 400 });
  }

  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName || trimmedName.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ ok: false, error: "Invalid or missing name." }, { status: 400 });
  }

  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  if (!trimmedEmail || trimmedEmail.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(trimmedEmail)) {
    return NextResponse.json({ ok: false, error: "Invalid or missing email." }, { status: 400 });
  }

  let resolvedTimeZone = DEFAULT_TIMEZONE;
  if (timeZone !== undefined && timeZone !== null) {
    if (typeof timeZone !== "string" || timeZone.trim() === "" || timeZone.length > MAX_TIMEZONE_LENGTH) {
      return NextResponse.json({ ok: false, error: "Invalid timeZone." }, { status: 400 });
    }
    resolvedTimeZone = timeZone;
  }

  const cleanedFocusAreas = sanitizeFocusAreas(focusAreas);

  const calSlug = calServiceFor(service).calSlug;

  if (!CAL_USERNAME) {
    return NextResponse.json(
      { ok: false, error: "Booking calendar is not configured. Please contact us to book an appointment." },
      { status: 503 },
    );
  }

  const basePayload: Record<string, unknown> = {
    start: startDate.toISOString(),
    attendee: {
      name: trimmedName,
      email: trimmedEmail,
      timeZone: resolvedTimeZone,
    },
    eventTypeSlug: calSlug,
    username: CAL_USERNAME,
  };

  const payloadWithMetadata = cleanedFocusAreas
    ? { ...basePayload, metadata: { focusAreas: cleanedFocusAreas.join(", ") } }
    : basePayload;

  let response: Response;
  try {
    response = await postToCal(payloadWithMetadata);
  } catch (error) {
    console.error("Cal.com booking request failed", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create booking. Please try again or contact us directly." },
      { status: 502 },
    );
  }

  // Best-effort metadata: if Cal rejects the request and we sent metadata,
  // retry once without it rather than failing the whole booking.
  if (!response.ok && payloadWithMetadata !== basePayload && response.status === 400) {
    console.error("Cal.com booking rejected metadata, retrying without it", await safeText(response));
    try {
      response = await postToCal(basePayload);
    } catch (error) {
      console.error("Cal.com booking retry request failed", error);
      return NextResponse.json(
        { ok: false, error: "Unable to create booking. Please try again or contact us directly." },
        { status: 502 },
      );
    }
  }

  if (!response.ok) {
    console.error("Cal.com booking request returned an error status", response.status, await safeText(response));
    return NextResponse.json(
      { ok: false, error: "Unable to create booking. Please try again or contact us directly." },
      { status: 502 },
    );
  }

  let json: { data?: { uid?: unknown } };
  try {
    json = (await response.json()) as { data?: { uid?: unknown } };
  } catch (error) {
    console.error("Cal.com booking response was not valid JSON", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create booking. Please try again or contact us directly." },
      { status: 502 },
    );
  }

  const uid = json?.data?.uid;
  if (typeof uid !== "string" || !uid) {
    console.error("Cal.com booking response missing uid", json);
    return NextResponse.json(
      { ok: false, error: "Unable to create booking. Please try again or contact us directly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, uid, start: startDate.toISOString(), service });
}
