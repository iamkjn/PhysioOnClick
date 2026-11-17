import { NextResponse } from "next/server";
import { FieldValue } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-request";
import { cleanText, loadManualPackage, noStore } from "@/lib/admin-packages-server";
import { serviceLabelFor } from "@/lib/cal-services";
import { isDateKey, londonWallTimeToDate } from "@/lib/treatment-packages";

// Admin-only. Records that a visit in a physio-arranged package happened:
// writes a `bookings` doc for the date (shows as Completed once past), counts
// it against the package and, optionally, saves a private session note.
//
// The booking deliberately has reminders.reviewRequestSent = true so the
// Trustpilot invite job never emails these patients, and no followUps /
// sessionSummaries are created (those notify the patient).

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminRequest(request);
  if ("error" in gate) return gate.error;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const date = cleanText(body.date, 10);
  const time = cleanText(body.time, 5) || "12:00";
  const note = cleanText(body.note, 4000);
  if (!isDateKey(date)) return NextResponse.json({ error: "Choose the visit date." }, { status: 400 });
  if (!TIME_RE.test(time)) return NextResponse.json({ error: "Choose a valid time." }, { status: 400 });

  const loaded = await loadManualPackage(id);
  if (!loaded.ok) return loaded.response;
  const { db, data } = loaded;

  const total = Number(data.totalSessions ?? 0);
  const used = Number(data.usedSessions ?? 0);
  if (used >= total) return NextResponse.json({ error: "Every session in this package is already recorded." }, { status: 400 });

  const ownerUid = String(data.ownerUid ?? "");
  const patientId = String(data.patientId || ownerUid);
  const sessionNumber = used + 1;
  const visitType = data.visitType === "home" ? "home" : undefined;
  const service =
    sessionNumber === 1 && data.includesAssessment === true ? "initial-assessment" : "follow-up";

  // Europe/London wall time → instant. Good enough for a record: summer/winter
  // offset taken from the date itself.
  const sessionDate = londonWallTimeToDate(date, time);
  const appointmentLabel =
    sessionDate.toLocaleDateString("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }) + ` at ${time}`;

  const patientName = String(data.patientName ?? "");
  const bookingRef = await db.collection("bookings").add({
    fullName: patientName,
    email: String(data.email ?? "").toLowerCase(),
    phone: "",
    service: serviceLabelFor(service, visitType),
    appointmentDate: date,
    appointmentTime: time,
    appointmentLabel,
    sessionDate,
    notes: `Package session ${sessionNumber} of ${total}`,
    status: "upcoming",
    source: "admin-manual",
    paid: data.paymentStatus === "paid",
    amountPaidPence: 0,
    paymentProvider: "package",
    bookedBy: ownerUid,
    patientType: patientId !== ownerUid ? "dependent" : "self",
    patientId,
    patientName,
    patientAvatarUrl: "",
    ...(visitType ? { visitType } : {}),
    packageId: id,
    packageSessionNumber: sessionNumber,
    packageTotalSessions: total,
    reminders: { reviewRequestSent: true },
    recordedBy: gate.decoded.email ?? gate.decoded.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection("sessionPackages").doc(id).update({
    usedSessions: sessionNumber,
    remainingSessions: Math.max(0, total - sessionNumber),
    status: sessionNumber >= total ? "complete" : "active",
    ...(sessionNumber === 1 ? { firstBookingId: bookingRef.id } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (note) {
    await db.collection("admin").doc("clinicalHistory").collection("entries").add({
      patientUid: ownerUid,
      personId: patientId,
      visibility: "admin-only",
      type: "session-note",
      title: `Session ${sessionNumber} of ${total}`,
      documentDate: date,
      summary: note,
      bookingId: bookingRef.id,
      storagePath: "",
      contentType: "",
      size: 0,
      uploadedBy: gate.decoded.email ?? "",
      uploadedAt: FieldValue.serverTimestamp(),
    });
  }

  return NextResponse.json(
    { bookingId: bookingRef.id, sessionNumber, remainingSessions: Math.max(0, total - sessionNumber) },
    { status: 201, headers: noStore },
  );
}

