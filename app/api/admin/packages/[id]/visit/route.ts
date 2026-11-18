import { NextResponse } from "next/server";
import { FieldValue } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-request";
import { cleanText, loadManualPackage, noStore } from "@/lib/admin-packages-server";
import { serviceLabelFor } from "@/lib/cal-services";
import { isDateKey, londonWallTimeToDate } from "@/lib/treatment-packages";

// Admin-only. Records that a visit in a physio-arranged package happened.
// Only the DATE matters for these visits: the time is stored as 18:00 for the
// record and never shown (dateOnly: true).
// writes a `bookings` doc for the date (shows as Completed once past), counts
// it against the package and, optionally, saves a private session note.
//
// The booking deliberately has reminders.reviewRequestSent = true so the
// Trustpilot invite job never emails these patients, and no followUps /
// sessionSummaries are created (those notify the patient).

const RECORD_TIME = "18:00";

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
  const time = RECORD_TIME;
  const note = cleanText(body.note, 4000);
  if (!isDateKey(date)) return NextResponse.json({ error: "Choose the visit date." }, { status: 400 });

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
    });

  const patientName = String(data.patientName ?? "");
  // A visit planned in advance for this date (POST .../plan) becomes the
  // recorded one, so it never shows twice.
  const plannedSnap = await db.collection("bookings").where("packageId", "==", id).get();
  const planned = plannedSnap.docs.find((d) => d.data().plannedVisit === true && d.data().appointmentDate === date);
  const fields = {
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
    dateOnly: true,
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
  };
  let bookingRef: { id: string };
  if (planned) {
    await planned.ref.set({ ...fields, plannedVisit: false, recordedAt: FieldValue.serverTimestamp() }, { merge: true });
    bookingRef = planned.ref;
  } else {
    bookingRef = await db.collection("bookings").add({ ...fields, createdAt: FieldValue.serverTimestamp() });
  }

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

