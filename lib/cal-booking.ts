import { CAL_USERNAME, calServiceFor } from "@/lib/cal-services";
import type { BookServiceId } from "@/lib/site-data";
import type { VisitType } from "@/lib/home-visit";

export type CreateCalBookingInput = {
  service: BookServiceId;
  startISO: string;
  name: string;
  email: string;
  timeZone: string;
  focusAreas?: string[];
  /** Only "home" changes the payload; video bookings are sent exactly as before. */
  visitType?: VisitType;
  homeVisitAddress?: string;
};

export type CreateCalBookingResult =
  | { ok: true; uid: string }
  | { ok: false; status: number; error: string };

async function postToCal(payload: Record<string, unknown>): Promise<Response> {
  return fetch("https://api.cal.com/v2/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "cal-api-version": "2024-08-13" },
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

export async function createCalBooking(
  input: CreateCalBookingInput,
): Promise<CreateCalBookingResult> {
  // Prefer a live env read (so tests using vi.stubEnv see the change without
  // re-importing lib/cal-services), falling back to cal-services' own
  // CAL_USERNAME export — which existing tests mock directly.
  const calUsername = process.env.NEXT_PUBLIC_CAL_USERNAME || CAL_USERNAME;
  if (!calUsername) {
    return { ok: false, status: 503, error: "Booking calendar is not configured." };
  }

  const calSlug = calServiceFor(input.service).calSlug;
  const basePayload: Record<string, unknown> = {
    start: input.startISO,
    attendee: { name: input.name, email: input.email, timeZone: input.timeZone },
    eventTypeSlug: calSlug,
    username: calUsername,
  };
  const cleanedFocus = input.focusAreas?.filter((f) => f.trim().length > 0);
  const metadata: Record<string, string> = {};
  if (cleanedFocus && cleanedFocus.length > 0) metadata.focusAreas = cleanedFocus.join(", ");
  if (input.visitType === "home" && input.homeVisitAddress) {
    // Same calendar and event types as video; Cal.com only records the visit
    // type + address in metadata so the practitioner sees where to go.
    metadata.visitType = "home";
    metadata.homeVisitAddress = input.homeVisitAddress;
  }
  const payloadWithMetadata =
    Object.keys(metadata).length > 0 ? { ...basePayload, metadata } : basePayload;

  let response: Response;
  try {
    response = await postToCal(payloadWithMetadata);
    if (!response.ok && payloadWithMetadata !== basePayload && response.status === 400) {
      response = await postToCal(basePayload);
    }
  } catch (error) {
    console.error("Cal.com booking request failed", error);
    return { ok: false, status: 502, error: "Unable to create booking." };
  }

  if (!response.ok) {
    // Cal.com error bodies can echo the request back; never let that put a
    // home-visit address in the logs.
    const detail = metadata.homeVisitAddress ? "[body withheld: home visit]" : await safeText(response);
    console.error("Cal.com booking error status", response.status, detail);
    return { ok: false, status: 502, error: "Unable to create booking." };
  }

  let json: { data?: { uid?: unknown } };
  try {
    json = (await response.json()) as { data?: { uid?: unknown } };
  } catch {
    return { ok: false, status: 502, error: "Unable to create booking." };
  }

  const uid = json?.data?.uid;
  if (typeof uid !== "string" || !uid) {
    return { ok: false, status: 502, error: "Unable to create booking." };
  }
  return { ok: true, uid };
}
