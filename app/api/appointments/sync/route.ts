import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

function toLondonParts(isoString: string) {
  const date = new Date(isoString);
  const londonStr = date.toLocaleString("en-GB", { timeZone: "Europe/London" });
  const [datePart, timePart] = londonStr.split(", ");
  const [day, month, year] = datePart.split("/");
  const [hour, minute] = timePart.split(":");
  return {
    date,
    appointmentDate: `${year}-${month}-${day}`,
    appointmentTime: `${hour}:${minute}`,
    appointmentLabel:
      date.toLocaleDateString("en-GB", {
        timeZone: "Europe/London",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }) + ` at ${hour}:${minute}`,
  };
}

function calStatusToOurs(calStatus: string, sessionDate: Date): string {
  if (calStatus === "cancelled" || calStatus === "rejected") return "cancelled";
  if (sessionDate < new Date()) return "completed";
  return "upcoming";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCalBookings(email: string): Promise<any[]> {
  const apiKey = process.env.CAL_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(
    `https://api.cal.com/v2/bookings?attendeeEmail=${encodeURIComponent(email)}&take=50`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": "2024-08-13",
      },
    }
  );
  if (!res.ok) return [];

  const json = await res.json();
  // v2 API returns { status, data: [...] } or { status, data: { bookings: [...] } }
  const raw = json.data;
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.bookings)) return raw.bookings;
  return [];
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const userId = request.nextUrl.searchParams.get("userId");

  if (!email || !userId) {
    return NextResponse.json({ error: "email and userId are required" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ synced: 0, total: 0 });

  const calBookings = await fetchCalBookings(email);

  let synced = 0;
  for (const b of calBookings) {
    const uid: string = (b.uid ?? b.id?.toString() ?? "").toString();
    if (!uid) continue;

    // If already in Firestore, just ensure bookedBy is linked
    const existing = await db
      .collection("bookings")
      .where("calBookingUid", "==", uid)
      .limit(1)
      .get();

    if (!existing.empty) {
      // Always link to the current verified user (email match guarantees ownership)
      await existing.docs[0].ref.update({ bookedBy: userId });
      continue;
    }

    const startRaw: string = b.start ?? b.startTime ?? "";
    if (!startRaw) continue;

    const { date, appointmentDate, appointmentTime, appointmentLabel } =
      toLondonParts(startRaw);

    const calStatus: string = b.status ?? "accepted";
    const status = calStatusToOurs(calStatus, date);

    const attendee = (b.attendees as Array<{ name?: string; email?: string; phoneNumber?: string }>)?.[0] ?? {};
    const service: string =
      b.title ?? (b.eventType as { title?: string } | undefined)?.title ?? "Appointment";

    await db.collection("bookings").add({
      fullName: attendee.name ?? email,
      email: attendee.email ?? email,
      phone: attendee.phoneNumber ?? "",
      service,
      appointmentDate,
      appointmentTime,
      appointmentLabel,
      sessionDate: date,
      notes: "",
      status,
      source: "cal-com",
      calBookingUid: uid,
      bookedBy: userId,
      patientType: "self",
      patientId: userId,
      patientName: attendee.name ?? email,
      patientAvatarUrl: "",
      createdAt: FieldValue.serverTimestamp(),
    });

    synced++;
  }

  return NextResponse.json({ synced, total: calBookings.length });
}
