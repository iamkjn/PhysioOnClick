import { NextResponse } from "next/server";

import { downloadObject, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

/**
 * Patient (or admin) download of the stored exercise-plan handout PDF.
 *
 * The generate route (Task 6) writes `exercise-plans/{summaryId}.pdf` to
 * Storage and stamps `sessionSummaries/{id}.planPdfPath`. This route lets the
 * booking's owner — or the practice admin — fetch that PDF back.
 *
 * Auth is `Authorization: Bearer <Firebase idToken>`. The caller is authorised
 * when their uid matches the session's booking `bookedBy`, or when their token
 * email is the configured `ADMIN_EMAIL`.
 *
 * Workers-safe: no Buffer, the `Uint8Array` from `downloadObject` is handed to
 * `NextResponse` as a `BodyInit`.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ summaryId: string }> },
) {
  const { summaryId } = await params;

  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!token || !auth || !db) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uid: string;
  let email = "";
  try {
    const decoded = await auth.verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email ?? "";
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summarySnap = await db.collection("sessionSummaries").doc(summaryId).get();
  if (!summarySnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const bookingId = (summarySnap.data() as { bookingId?: string }).bookingId;

  let bookedBy: string | undefined;
  if (bookingId) {
    const bookingSnap = await db.collection("bookings").doc(bookingId).get();
    if (bookingSnap.exists) {
      bookedBy = (bookingSnap.data() as { bookedBy?: string }).bookedBy;
    }
  }

  const isAdmin = !!email && email === (process.env.ADMIN_EMAIL ?? "hello@physioonclick.co.uk");
  if (uid !== bookedBy && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const bytes = await downloadObject(`exercise-plans/${summaryId}.pdf`);
  if (!bytes) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(bytes as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="exercise-plan.pdf"',
    },
  });
}
