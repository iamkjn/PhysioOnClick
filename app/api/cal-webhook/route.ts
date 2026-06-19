import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  try {
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

function toLondonParts(isoString: string): {
  appointmentDate: string;
  appointmentTime: string;
  appointmentLabel: string;
} {
  const date = new Date(isoString);
  // Parse into London local time components reliably
  const londonStr = date.toLocaleString("en-GB", { timeZone: "Europe/London" });
  // en-GB locale returns "DD/MM/YYYY, HH:MM:SS"
  const [datePart, timePart] = londonStr.split(", ");
  const [day, month, year] = datePart.split("/");
  const [hour, minute] = timePart.split(":");
  const appointmentDate = `${year}-${month}-${day}`;
  const appointmentTime = `${hour}:${minute}`;
  const appointmentLabel = date.toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
  }) + ` at ${hour}:${minute}`;
  return { appointmentDate, appointmentTime, appointmentLabel };
}

type CalAttendee = { name: string; email: string; phoneNumber?: string };
type CalBookingPayload = {
  uid: string;
  startTime: string;
  attendees: CalAttendee[];
  eventType: { title: string };
  responses?: { notes?: { value?: string } };
  rescheduledFromUid?: string;
};
type CalWebhookBody = {
  triggerEvent: string;
  payload?: CalBookingPayload;
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Cal-Signature-256") ?? "";
  const secret = process.env.CAL_WEBHOOK_SECRET ?? "";

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: CalWebhookBody;
  try {
    body = JSON.parse(rawBody) as CalWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { triggerEvent, payload: booking } = body;

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  if (triggerEvent === "BOOKING_CREATED" && booking) {
    const { appointmentDate, appointmentTime, appointmentLabel } = toLondonParts(booking.startTime);
    const attendee = booking.attendees[0] ?? { name: "", email: "" };

    const bookingRef = await db.collection("bookings").add({
      fullName: attendee.name,
      email: attendee.email,
      phone: attendee.phoneNumber ?? "",
      service: booking.eventType.title,
      appointmentDate,
      appointmentTime,
      appointmentLabel,
      sessionDate: new Date(booking.startTime),
      notes: booking.responses?.notes?.value ?? "",
      status: "upcoming",
      source: "cal-com",
      calBookingUid: booking.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Link booking to Firebase user and merge dependent selection if present.
    // Mobile-only users are in the `patients` collection; web users are in `users`.
    // Check both so bookings link correctly regardless of which platform the patient used to sign up.
    const usersSnap = await db
      .collection("users")
      .where("email", "==", attendee.email)
      .limit(1)
      .get();

    let resolvedUserId: string | null = null;
    if (!usersSnap.empty) {
      resolvedUserId = usersSnap.docs[0].id;
    } else {
      const patientsSnap = await db
        .collection("patients")
        .where("email", "==", attendee.email)
        .limit(1)
        .get();
      if (!patientsSnap.empty) resolvedUserId = patientsSnap.docs[0].id;
    }

    if (resolvedUserId !== null) {
      const userId = resolvedUserId;
      const selectionSnap = await db.doc(`pendingSelections/${userId}`).get();

      if (selectionSnap.exists) {
        const sel = selectionSnap.data()!;
        await bookingRef.update({
          bookedBy: userId,
          patientType: sel.patientType,
          patientId: sel.patientId,
          patientName: sel.patientName,
          patientAvatarUrl: sel.patientAvatarUrl ?? "",
        });
        await db.doc(`pendingSelections/${userId}`).delete();
      } else {
        await bookingRef.update({
          bookedBy: userId,
          patientType: "self",
          patientId: userId,
          patientName: attendee.name,
          patientAvatarUrl: "",
        });
      }
    }
  } else if (triggerEvent === "BOOKING_CANCELLED" && booking) {
    const snapshot = await db
      .collection("bookings")
      .where("calBookingUid", "==", booking.uid)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({ status: "cancelled" });
    }
  } else if (triggerEvent === "BOOKING_RESCHEDULED" && booking) {
    const { appointmentDate, appointmentTime, appointmentLabel } = toLondonParts(booking.startTime);
    const originalUid = booking.rescheduledFromUid ?? booking.uid;
    const snapshot = await db
      .collection("bookings")
      .where("calBookingUid", "==", originalUid)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        appointmentDate,
        appointmentTime,
        appointmentLabel,
        sessionDate: new Date(booking.startTime),
        calBookingUid: booking.uid,
      });
    }
  }

  return NextResponse.json({ received: true });
}
