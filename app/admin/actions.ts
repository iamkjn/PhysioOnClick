"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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

export async function publishSummary(
  input: PublishSummaryInput
): Promise<{ summaryId: string }> {
  const db = getAdminDb();
  if (!db) throw new Error("Admin database unavailable");
  const ref = await db.collection("sessionSummaries").add({
    ...input,
    publishedAt: FieldValue.serverTimestamp(),
    notificationSent: false,
  });
  await db.doc(`bookings/${input.bookingId}`).update({ summaryId: ref.id });
  revalidatePath("/admin");
  return { summaryId: ref.id };
}

export async function cancelCalBooking(calBookingUid: string): Promise<void> {
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
