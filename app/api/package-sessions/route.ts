import { NextRequest, NextResponse } from "next/server";

import { createCalBooking } from "@/lib/cal-booking";
import { serviceLabelFor } from "@/lib/cal-services";
import { FieldValue, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import type { VisitType } from "@/lib/home-visit";

const DEFAULT_TIMEZONE = "Europe/London";

type PackageDoc = {
  ownerUid?: string;
  patientId?: string;
  patientName?: string;
  email?: string;
  title?: string;
  totalSessions?: number;
  usedSessions?: number;
  remainingSessions?: number;
  status?: string;
  bookingUids?: string[];
  /** Set by the payments webhook for a bundle bought as a home visit. */
  visitType?: VisitType;
  homeVisitAddress?: string;
};

type FollowUpCheckIn = {
  painScore: number;
  progress: "better" | "same" | "worse";
  exercises: "yes" | "partly" | "no";
  newSymptoms: boolean;
  changeNote: string;
  focus: string;
};

function cleanString(value: unknown, max = 600) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanCheckIn(value: unknown): FollowUpCheckIn | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const painScore = Number(input.painScore);
  const progress = cleanString(input.progress, 20);
  const exercises = cleanString(input.exercises, 20);
  if (!Number.isFinite(painScore) || painScore < 0 || painScore > 10) return null;
  if (!["better", "same", "worse"].includes(progress)) return null;
  if (!["yes", "partly", "no"].includes(exercises)) return null;
  return {
    painScore: Math.round(painScore),
    progress: progress as FollowUpCheckIn["progress"],
    exercises: exercises as FollowUpCheckIn["exercises"],
    newSymptoms: input.newSymptoms === true,
    changeNote: cleanString(input.changeNote),
    focus: cleanString(input.focus),
  };
}

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

async function requireUser(request: NextRequest) {
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const auth = getAdminAuth();
  if (!token || !auth) return null;
  try {
    return await auth.verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const snap = await db
    .collection("sessionPackages")
    .where("ownerUid", "==", user.uid)
    .limit(20)
    .get();

  const packages = snap.docs
    .map((doc) => {
      const data = doc.data() as PackageDoc;
      return {
        id: doc.id,
        title: data.title ?? "Session package",
        patientName: data.patientName ?? "Patient",
        totalSessions: data.totalSessions ?? 0,
        usedSessions: data.usedSessions ?? 0,
        remainingSessions: data.remainingSessions ?? 0,
        status: data.status ?? "active",
        // Lets the portal show home-visit times. The address never leaves the server.
        ...(data.visitType === "home" ? { visitType: "home" as const } : {}),
      };
    })
    .filter((item) => item.totalSessions > 1);

  return NextResponse.json({ packages });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  let body: { packageId?: unknown; start?: unknown; timeZone?: unknown; checkIn?: unknown };
  try {
    body = (await request.json()) as { packageId?: unknown; start?: unknown; timeZone?: unknown; checkIn?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const packageId = typeof body.packageId === "string" ? body.packageId.trim() : "";
  const start = typeof body.start === "string" ? body.start.trim() : "";
  const timeZone = typeof body.timeZone === "string" && body.timeZone.trim() ? body.timeZone.trim() : DEFAULT_TIMEZONE;
  if (!packageId || packageId.includes("/")) return NextResponse.json({ error: "Invalid package." }, { status: 400 });
  const startDate = new Date(start);
  if (!start || Number.isNaN(startDate.getTime()) || startDate.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Choose a future time." }, { status: 400 });
  }
  const checkIn = cleanCheckIn(body.checkIn);
  if (!checkIn) return NextResponse.json({ error: "Complete the follow-up check-in first." }, { status: 400 });

  const packageRef = db.collection("sessionPackages").doc(packageId);
  const packageSnap = await packageRef.get();
  if (!packageSnap.exists) return NextResponse.json({ error: "Package not found." }, { status: 404 });

  const pack = packageSnap.data() as PackageDoc;
  if (pack.ownerUid !== user.uid) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const remaining = Number(pack.remainingSessions ?? 0);
  const total = Number(pack.totalSessions ?? 0);
  const used = Number(pack.usedSessions ?? 0);
  if (pack.status === "complete" || remaining <= 0 || total <= 1) {
    return NextResponse.json({ error: "No package sessions remaining." }, { status: 400 });
  }

  const name = String(pack.patientName || user.email || "Patient");
  const email = String(pack.email || user.email || "");
  if (!email) return NextResponse.json({ error: "Package email is missing." }, { status: 400 });

  // A bundle bought as a home visit books every later session as a home
  // visit. The address stays server-side: never logged or returned.
  const homeVisit =
    pack.visitType === "home" && typeof pack.homeVisitAddress === "string" && pack.homeVisitAddress.trim()
      ? { visitType: "home" as const, homeVisitAddress: pack.homeVisitAddress.trim() }
      : null;

  const booking = await createCalBooking({
    service: "follow-up",
    startISO: startDate.toISOString(),
    name,
    email,
    timeZone,
    focusAreas: ["Package session"],
    ...(homeVisit ?? {}),
  });
  if (!booking.ok) {
    return NextResponse.json({ error: booking.error }, { status: booking.status || 502 });
  }

  const { date, appointmentDate, appointmentTime, appointmentLabel } = toLondonParts(startDate.toISOString());
  const sessionNumber = used + 1;
  const checkInRef = await db.collection("packageFollowUpCheckIns").add({
    packageId,
    ownerUid: user.uid,
    patientId: pack.patientId || user.uid,
    patientName: name,
    email: email.trim().toLowerCase(),
    sessionNumber,
    totalSessions: total,
    calBookingUid: booking.uid,
    appointmentDate,
    appointmentTime,
    sessionDate: date,
    ...checkIn,
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection("bookings").add({
    fullName: name,
    email: email.trim().toLowerCase(),
    phone: "",
    service: serviceLabelFor("follow-up", homeVisit?.visitType),
    appointmentDate,
    appointmentTime,
    appointmentLabel,
    sessionDate: date,
    notes: `Package session ${sessionNumber} of ${total}`,
    status: "upcoming",
    source: "package-credit",
    calBookingUid: booking.uid,
    paid: true,
    amountPaidPence: 0,
    paymentProvider: "package-credit",
    bookedBy: user.uid,
    patientType: pack.patientId && pack.patientId !== user.uid ? "dependent" : "self",
    patientId: pack.patientId || user.uid,
    patientName: name,
    patientAvatarUrl: "",
    packageId,
    packageSessionNumber: sessionNumber,
    packageTotalSessions: total,
    packageFollowUpCheckInId: checkInRef.id,
    ...(homeVisit ?? {}),
    createdAt: FieldValue.serverTimestamp(),
  });

  const bookingUids = Array.isArray(pack.bookingUids) ? [...pack.bookingUids, booking.uid] : [booking.uid];
  await packageRef.update({
    usedSessions: sessionNumber,
    remainingSessions: Math.max(0, total - sessionNumber),
    status: sessionNumber >= total ? "complete" : "active",
    bookingUids,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, calBookingUid: booking.uid, sessionNumber, remainingSessions: Math.max(0, total - sessionNumber) });
}
