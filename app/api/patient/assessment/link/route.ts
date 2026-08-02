import { NextResponse } from "next/server";
import { DecodedIdToken, FieldValue, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!auth || !db) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  let decoded: DecodedIdToken;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId, assessmentFormId } = (await request.json()) as {
    bookingId?: string;
    assessmentFormId?: string;
  };
  if (!bookingId || !assessmentFormId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const ref = db.collection("bookings").doc(bookingId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const booking = snap.data() as { bookedBy?: string } | undefined;
  if (booking?.bookedBy !== decoded.uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ref.update({ assessmentFormId, assessmentCompletedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true });
}
