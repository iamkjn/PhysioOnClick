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
    await db.collection("bookings").add({
      fullName: attendee.name,
      email: attendee.email,
      phone: attendee.phoneNumber ?? "",
      service: booking.eventType.title,
      appointmentDate,
      appointmentTime,
      appointmentLabel,
      notes: booking.responses?.notes?.value ?? "",
      status: "confirmed",
      source: "cal-com",
      calBookingUid: booking.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
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
    const snapshot = await db
      .collection("bookings")
      .where("calBookingUid", "==", booking.uid)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({ appointmentDate, appointmentTime, appointmentLabel });
    }
  }

  return NextResponse.json({ received: true });
}
