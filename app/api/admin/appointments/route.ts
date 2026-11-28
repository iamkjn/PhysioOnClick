import { NextResponse } from "next/server";
import { FieldValue, getAdminDb } from "@/lib/firebase-admin";
import { requireOwnerRequest } from "@/lib/owner-request";
import { UID_RE, cleanText, noStore } from "@/lib/admin-packages-server";
import { minutesFor, serviceLabelFor } from "@/lib/cal-services";
import { sendCalendarInvite } from "@/lib/calendar-invite";
import { validateHomeVisit } from "@/lib/home-visit";
import { MAX_PACKAGE_PRICE_PENCE, isDateKey, londonWallTimeToDate } from "@/lib/treatment-packages";

// Owner-only. An appointment the physio arranges herself: a one-session manual
// package (so the existing payment link / mark paid / record visit tools work)
// plus its timed booking. Nothing is sent to the patient.

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const SOURCE = "admin-appointment";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  const maybe = value as { toDate?: () => Date } | null | undefined;
  return maybe?.toDate ? maybe.toDate() : null;
}

export async function GET(request: Request) {
  const gate = await requireOwnerRequest(request);
  if ("error" in gate) return gate.error;
  const db = getAdminDb();
  if (!db) return bad("Unavailable", 500);

  const snap = await db.collection("bookings").where("source", "==", SOURCE).limit(500).get();
  // Keep today's earlier visits on the list for the rest of the day.
  const from = Date.now() - 12 * 3_600_000;
  const appointments = snap.docs
    .map((d) => ({ id: d.id, data: d.data(), when: toDate(d.data().sessionDate) }))
    .filter((a) => a.data.status !== "cancelled" && a.data.plannedVisit === true && a.when && a.when.getTime() >= from)
    .sort((a, b) => a.when!.getTime() - b.when!.getTime())
    .map(({ id, data }) => ({
      id,
      patientName: String(data.patientName ?? ""),
      patientUid: String(data.bookedBy ?? ""),
      personId: String(data.patientId ?? ""),
      service: String(data.service ?? ""),
      date: String(data.appointmentDate ?? ""),
      time: String(data.appointmentTime ?? ""),
      address: String(data.homeVisitAddress ?? ""),
    }));
  return NextResponse.json({ appointments }, { headers: noStore });
}

export async function POST(request: Request) {
  const gate = await requireOwnerRequest(request);
  if ("error" in gate) return gate.error;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("Bad request");
  }

  const uid = cleanText(body.uid, 128);
  const personId = cleanText(body.personId, 128) || uid;
  if (!UID_RE.test(uid) || !UID_RE.test(personId)) return bad("Choose a patient.");
  const service = body.service === "follow-up" ? "follow-up" : "initial-assessment";
  if (body.visitType !== "home" && body.visitType !== "video") return bad("Choose home visit or video.");
  const visitType = body.visitType;
  const date = cleanText(body.date, 10);
  const time = cleanText(body.time, 5);
  if (!isDateKey(date)) return bad("Choose the date.");
  if (!TIME_RE.test(time)) return bad("Choose the time.");
  const start = londonWallTimeToDate(date, time);
  if (start.getTime() < Date.now()) return bad("That date and time has already passed.");
  const pricePence = Number(body.pricePence);
  if (!Number.isInteger(pricePence) || pricePence < 0 || pricePence > MAX_PACKAGE_PRICE_PENCE) {
    return bad("Enter a valid price.");
  }
  const notes = cleanText(body.notes, 600);

  let home: { addressLine: string; postcode: string; homeVisitAddress: string } | null = null;
  if (visitType === "home") {
    const checked = validateHomeVisit(body.addressLine, body.postcode);
    if (!checked.ok) return bad(checked.error);
    home = checked;
  }

  const db = getAdminDb();
  if (!db) return bad("Unavailable", 500);

  const patientSnap = await db.collection("patients").doc(uid).get();
  if (!patientSnap.exists) return bad("Patient not found", 404);
  const patient = patientSnap.data() ?? {};
  let patientName = String(patient.displayName ?? "");
  if (personId !== uid) {
    const dep = await db.collection("dependents").doc(personId).get();
    if (!dep.exists || dep.data()?.ownerId !== uid) return bad("Person not found", 404);
    patientName = String(dep.data()?.name ?? patientName);
  }
  const email = String(patient.email ?? "").toLowerCase();
  const phone = String(patient.phoneNumber ?? "");

  const minutes = minutesFor(service, visitType);
  if (body.allowOverlap !== true) {
    const sameDay = await db.collection("bookings").where("appointmentDate", "==", date).get();
    const clash = sameDay.docs
      .map((d) => d.data())
      .find((b) => {
        const other = toDate(b.sessionDate);
        if (!other || b.status === "cancelled" || b.dateOnly === true || b.source === "admin-manual") return false;
        // Stored bookings carry no length; assume an hour.
        const gap = other.getTime() - start.getTime();
        return gap < minutes * 60_000 && gap > -60 * 60_000;
      });
    if (clash) {
      return NextResponse.json(
        { error: `${String(clash.patientName || clash.fullName || "Someone")} is already booked at ${String(clash.appointmentTime)}.`, clash: true },
        { status: 409 },
      );
    }
  }

  const label = serviceLabelFor(service, visitType);
  const createdBy = gate.decoded.email ?? gate.decoded.uid;
  const packageRef = await db.collection("sessionPackages").add({
    ownerUid: uid,
    patientId: personId,
    patientName,
    email,
    title: label,
    visitType,
    totalSessions: 1,
    includesAssessment: service === "initial-assessment",
    startDate: date,
    endDate: date,
    pricePence,
    notes,
    usedSessions: 0,
    remainingSessions: 1,
    status: "active",
    manual: true,
    paymentStatus: pricePence > 0 ? "unpaid" : "paid",
    ...(pricePence > 0 ? {} : { paidMethod: "no-charge" }),
    bookingUids: [],
    createdBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const day = start.toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const bookingRef = await db.collection("bookings").add({
    fullName: patientName,
    email,
    phone,
    service: label,
    appointmentDate: date,
    appointmentTime: time,
    appointmentLabel: `${day} at ${time}`,
    sessionDate: start,
    notes,
    status: "upcoming",
    source: SOURCE,
    plannedVisit: true,
    paid: false,
    amountPaidPence: 0,
    paymentProvider: "package",
    bookedBy: uid,
    patientType: personId !== uid ? "dependent" : "self",
    patientId: personId,
    patientName,
    patientAvatarUrl: "",
    visitType,
    ...(home ? { homeVisitAddress: home.homeVisitAddress } : {}),
    packageId: packageRef.id,
    packageSessionNumber: 1,
    packageTotalSessions: 1,
    // Never send a review invite for a visit that hasn't been recorded.
    reminders: { reviewRequestSent: true },
    recordedBy: createdBy,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Keep the address on the patient's account, once. Not worth failing over.
  if (home) {
    try {
      const saved = await db.collection("patientAddresses").where("ownerUid", "==", uid).limit(50).get();
      const known = saved.docs.some((d) => d.data().line === home.addressLine && d.data().postcode === home.postcode);
      if (!known) {
        await db.collection("patientAddresses").add({
          ownerUid: uid,
          label: "",
          line: home.addressLine,
          postcode: home.postcode,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("admin appointment: saving address failed", error instanceof Error ? error.message : error);
    }
  }

  const invite = await sendCalendarInvite({
    id: bookingRef.id,
    start,
    minutes,
    title: `${patientName}: ${label}`,
    location: home?.homeVisitAddress,
    details: [phone ? `Phone: ${phone}` : "", email ? `Email: ${email}` : ""].filter(Boolean),
  });

  return NextResponse.json(
    { bookingId: bookingRef.id, packageId: packageRef.id, calendarSent: invite.sent },
    { status: 201, headers: noStore },
  );
}

export async function DELETE(request: Request) {
  const gate = await requireOwnerRequest(request);
  if ("error" in gate) return gate.error;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UID_RE.test(id)) return bad("Bad request");
  const db = getAdminDb();
  if (!db) return bad("Unavailable", 500);

  const ref = db.collection("bookings").doc(id);
  const snap = await ref.get();
  const booking = snap.data();
  if (!snap.exists || !booking || booking.source !== SOURCE) return bad("Appointment not found", 404);
  if (booking.plannedVisit !== true) return bad("This visit has already been recorded.");

  await ref.update({ status: "cancelled" });

  // An unpaid, unused one-visit package goes with it, so the patient is not
  // asked to pay for a cancelled visit (and any /pay link stops working).
  // Money already taken is kept on record for a refund or a new date.
  let paidKept = false;
  const packageId = String(booking.packageId ?? "");
  if (packageId) {
    const pkgRef = db.collection("sessionPackages").doc(packageId);
    const pkg = (await pkgRef.get()).data();
    if (pkg) {
      const moneyTaken = pkg.paymentStatus === "paid" && pkg.paidMethod !== "no-charge";
      if (moneyTaken) paidKept = true;
      else if (Number(pkg.usedSessions ?? 0) === 0 && pkg.totalSessions === 1) await pkgRef.delete();
    }
  }

  const start = toDate(booking.sessionDate);
  const invite = start
    ? await sendCalendarInvite({
        id,
        start,
        title: `${String(booking.patientName ?? "")}: ${String(booking.service ?? "Appointment")}`,
        cancelled: true,
      })
    : { sent: false };

  return NextResponse.json({ ok: true, paidKept, calendarSent: invite.sent }, { headers: noStore });
}
