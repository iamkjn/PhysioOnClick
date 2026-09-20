import { NextResponse } from "next/server";

import { cancelCalBooking } from "@/app/admin/actions";

/**
 * Thin REST wrapper around the `cancelCalBooking` server action, for the
 * mobile app (which can't call Next.js Server Actions directly). Auth:
 * `Authorization: Bearer <idToken>` — `cancelCalBooking` itself verifies
 * admin access. Firestore's own `bookings.status` is updated by
 * `app/api/cal-webhook`'s BOOKING_CANCELLED handler once Cal.com fires it,
 * not here.
 */
export async function POST(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { calBookingUid } = (await request.json().catch(() => ({}))) as { calBookingUid?: string };
  if (!calBookingUid) return NextResponse.json({ error: "Missing calBookingUid" }, { status: 400 });

  try {
    await cancelCalBooking(calBookingUid, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancel failed";
    const status = message === "Unauthorized" ? 401 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
