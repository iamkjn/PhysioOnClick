import { NextResponse } from "next/server";
import { FieldValue } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-request";
import { loadManualPackage, noStore } from "@/lib/admin-packages-server";
import { serviceLabelFor } from "@/lib/cal-services";
import { sendCalendarInvite } from "@/lib/calendar-invite";
import { isDateKey, londonWallTimeToDate } from "@/lib/treatment-packages";

// Admin-only. Puts planned (future) visit dates for a physio-arranged package
// on the patient's appointments, date only. Recording a visit on that date
// (POST .../visit) turns the planned booking into the recorded one.
//
// Planned bookings carry adminNotifiedAt so the 5-minute "upcoming session"
// admin push (functions notifyAdminUpcomingSessions, which quotes a time)
// skips them, and reviewRequestSent so no review invite is ever sent.

const MAX_DATES = 30;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminRequest(request);
  if ("error" in gate) return gate.error;
  const { id } = await params;

  let body: { dates?: unknown };
  try {
    body = (await request.json()) as { dates?: unknown };
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const dates = Array.isArray(body.dates) ? [...new Set(body.dates.filter(isDateKey))].sort() : [];
  if (!dates.length || dates.length > MAX_DATES) return NextResponse.json({ error: "Choose at least one valid date." }, { status: 400 });

  const loaded = await loadManualPackage(id);
  if (!loaded.ok) return loaded.response;
  const { db, data } = loaded;

  const existing = (await db.collection("bookings").where("packageId", "==", id).get()).docs.map((d) => d.data());
  const takenDates = new Set(existing.filter((b) => b.status !== "cancelled").map((b) => String(b.appointmentDate)));
  const plannedOpen = existing.filter((b) => b.plannedVisit === true && b.status !== "cancelled").length;
  const total = Number(data.totalSessions ?? 0);
  const used = Number(data.usedSessions ?? 0);
  const fresh = dates.filter((d) => !takenDates.has(d));
  if (used + plannedOpen + fresh.length > total) {
    return NextResponse.json(
      { error: `Only ${Math.max(0, total - used - plannedOpen)} more visit(s) can be planned in this package.` },
      { status: 400 },
    );
  }

  const ownerUid = String(data.ownerUid ?? "");
  const patientId = String(data.patientId || ownerUid);
  const patientName = String(data.patientName ?? "");
  const visitType = data.visitType === "home" ? "home" : undefined;
  const created: string[] = [];
  for (const date of fresh) {
    const sessionDate = londonWallTimeToDate(date, "18:00");
    const ref = await db.collection("bookings").add({
      fullName: patientName,
      email: String(data.email ?? "").toLowerCase(),
      phone: "",
      service: serviceLabelFor("follow-up", visitType),
      appointmentDate: date,
      appointmentTime: "18:00",
      appointmentLabel: sessionDate.toLocaleDateString("en-GB", {
        timeZone: "Europe/London",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      sessionDate,
      notes: "Planned visit",
      status: "upcoming",
      source: "admin-manual",
      dateOnly: true,
      plannedVisit: true,
      // Not a paid booking of its own: keeps every assessment prompt away
      // from a planned visit. Recording the visit sets the real flag.
      paid: false,
      amountPaidPence: 0,
      paymentProvider: "package",
      bookedBy: ownerUid,
      patientType: patientId !== ownerUid ? "dependent" : "self",
      patientId,
      patientName,
      patientAvatarUrl: "",
      ...(visitType ? { visitType } : {}),
      packageId: id,
      packageTotalSessions: total,
      reminders: { reviewRequestSent: true },
      adminNotifiedAt: FieldValue.serverTimestamp(),
      recordedBy: gate.decoded.email ?? gate.decoded.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    created.push(ref.id);
    await sendCalendarInvite({
      id: ref.id,
      date,
      title: `${patientName}: ${serviceLabelFor("follow-up", visitType)}`,
    });
  }
  return NextResponse.json({ created: created.length, skipped: dates.length - fresh.length }, { status: 201, headers: noStore });
}
