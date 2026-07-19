"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { LIMITS } from "@/lib/validation";

// Server actions are public HTTP endpoints — the /admin page gate is client-side
// only, so every action must verify the caller's ID token itself.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@physioonclick.co.uk";

async function requireAdmin(idToken: string): Promise<void> {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Unauthorized");
  }
  const adminAuth = getAdminAuth();
  if (!adminAuth) throw new Error("Server not configured");
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    throw new Error("Unauthorized");
  }
  const isAdmin = decoded.admin === true || (!!decoded.email && decoded.email === ADMIN_EMAIL);
  if (!isAdmin) throw new Error("Unauthorized");
}

export interface PublishSummaryInput {
  bookingId: string;
  patientId: string;
  patientType: string;
  patientName: string;
  workedOn: string;
  exercises: string;
  nextSteps: string;
  followUpWeeks: number;
  service: string;
  painScore: number;
  recoveryPercent: number;
  sessionOutcome: "improving" | "stable" | "setback";
}

const OUTCOMES = ["improving", "stable", "setback"] as const;

function assertValidSummaryInput(input: PublishSummaryInput): void {
  const strings: (keyof PublishSummaryInput)[] = [
    "bookingId", "patientId", "patientType", "patientName",
    "workedOn", "exercises", "nextSteps", "service",
  ];
  const notes = ["workedOn", "exercises", "nextSteps"] as const;
  const valid =
    !!input &&
    strings.every((k) => typeof input[k] === "string") &&
    input.bookingId.length > 0 &&
    !input.bookingId.includes("/") &&
    input.patientId.length > 0 &&
    notes.every((k) => input[k].trim().length > 0 && input[k].length <= LIMITS.clinicalNote) &&
    Number.isFinite(input.followUpWeeks) &&
    Number.isFinite(input.painScore) && input.painScore >= 0 && input.painScore <= 10 &&
    Number.isInteger(input.recoveryPercent) && input.recoveryPercent >= 0 && input.recoveryPercent <= 100 &&
    OUTCOMES.includes(input.sessionOutcome);
  if (!valid) throw new Error("Invalid summary input");
}

export async function publishSummary(
  input: PublishSummaryInput,
  idToken: string
): Promise<{ summaryId: string }> {
  await requireAdmin(idToken);
  assertValidSummaryInput(input);
  const db = getAdminDb();
  if (!db) throw new Error("Admin database unavailable");
  // Whitelist fields explicitly — never spread client-controlled input into Firestore.
  const ref = await db.collection("sessionSummaries").add({
    bookingId: input.bookingId,
    patientId: input.patientId,
    patientType: input.patientType,
    patientName: input.patientName,
    workedOn: input.workedOn,
    exercises: input.exercises,
    nextSteps: input.nextSteps,
    followUpWeeks: input.followUpWeeks,
    service: input.service,
    painScore: input.painScore,
    recoveryPercent: input.recoveryPercent,
    sessionOutcome: input.sessionOutcome,
    publishedAt: FieldValue.serverTimestamp(),
    notificationSent: false,
  });
  await db.doc(`bookings/${input.bookingId}`).update({ summaryId: ref.id });
  revalidatePath("/admin");
  return { summaryId: ref.id };
}

export async function cancelCalBooking(
  calBookingUid: string,
  idToken: string
): Promise<void> {
  await requireAdmin(idToken);
  if (typeof calBookingUid !== "string" || !/^[A-Za-z0-9_-]+$/.test(calBookingUid)) {
    throw new Error("Invalid booking uid");
  }
  const res = await fetch(
    `https://api.cal.com/v2/bookings/${calBookingUid}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CAL_API_KEY}`,
        "cal-api-version": "2024-08-13",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancellationReason: "Cancelled by clinic admin" }),
    }
  );

  if (!res.ok) {
    throw new Error(`Cal.com cancel failed: ${res.status}`);
  }

  revalidatePath("/admin");
}
