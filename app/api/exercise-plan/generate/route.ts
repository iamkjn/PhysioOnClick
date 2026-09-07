import { NextResponse } from "next/server";

import { sendExercisePlanEmail } from "@/lib/emails/exercise-plan-email";
import { exerciseImageUrl } from "@/lib/exercise-images";
import { buildPlanCards } from "@/lib/exercise-plan";
import { buildExercisePlanPdf } from "@/lib/exercise-plan-pdf";
import { type ExerciseDosage } from "@/lib/exercises";
import { FieldValue, getAdminDb, uploadObject } from "@/lib/firebase-admin";
import { founder } from "@/lib/site-data";

type SummaryDoc = {
  bookingId?: string;
  patientName?: string;
  patientId?: string;
  planEmailedAt?: unknown;
};

type BookingDoc = {
  bookedBy?: string;
  patientId?: string;
  email?: string;
  sessionDate?: { toDate(): Date };
};

/**
 * Summary-publish handler: reads the session summary -> its booking -> the
 * patient's assigned exercises, builds the illustrated plan PDF, stores it in
 * Storage, emails it, and stamps `planEmailedAt`.
 *
 * Best-effort by design — once the summary loads, any downstream failure is
 * logged and still returns HTTP 200 so the calling Cloud Function does not
 * retry-storm. Idempotent on `planEmailedAt` unless `force: true`.
 */
export async function POST(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("x-cron-secret") !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { summaryId, force } = (await request.json()) as {
    summaryId?: string;
    force?: boolean;
  };
  if (!summaryId) {
    return NextResponse.json({ error: "Missing summaryId" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const summarySnap = await db.collection("sessionSummaries").doc(summaryId).get();
  if (!summarySnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const summary = summarySnap.data() as SummaryDoc;
  if (summary.planEmailedAt && !force) {
    return NextResponse.json({ ok: true, skipped: "already-emailed" });
  }

  try {
    if (!summary.bookingId) {
      return NextResponse.json({ ok: true, skipped: "no-booking" });
    }

    const bookingSnap = await db.collection("bookings").doc(summary.bookingId).get();
    if (!bookingSnap.exists) {
      return NextResponse.json({ ok: true, skipped: "no-booking" });
    }
    const booking = bookingSnap.data() as BookingDoc;

    const personId = summary.patientId ?? booking.patientId ?? booking.bookedBy;
    if (!booking.bookedBy || !personId || !booking.email) {
      return NextResponse.json({ ok: true, skipped: "incomplete" });
    }

    const assignedSnap = await db
      .collection("patients")
      .doc(booking.bookedBy)
      .collection(`people/${personId}/assignedExercises`)
      .get();
    const assigned = assignedSnap.docs
      .map((d) => ({
        exerciseId: d.id,
        ...(d.data() as { active?: boolean; dosage?: ExerciseDosage }),
      }))
      .filter((a) => a.active !== false);
    if (assigned.length === 0) {
      return NextResponse.json({ ok: true, skipped: "no-exercises" });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // Fetch each illustration. Task 1's route serves a placeholder SVG on a
    // miss, so keep the bytes only when the response is an actual PNG.
    const imageByExerciseId: Record<string, Uint8Array | null> = {};
    await Promise.all(
      assigned.map(async (a) => {
        try {
          const r = await fetch(`${siteUrl}${exerciseImageUrl(a.exerciseId)}`);
          imageByExerciseId[a.exerciseId] =
            r.ok && r.headers.get("content-type") === "image/png"
              ? new Uint8Array(await r.arrayBuffer())
              : null;
        } catch {
          imageByExerciseId[a.exerciseId] = null;
        }
      }),
    );

    const cards = buildPlanCards(assigned, imageByExerciseId);
    const pdf = await buildExercisePlanPdf({
      patientName: summary.patientName ?? "",
      physioName: founder.name,
      sessionDateISO: booking.sessionDate?.toDate
        ? booking.sessionDate.toDate().toISOString()
        : null,
      cards,
    });

    await uploadObject(`exercise-plans/${summaryId}.pdf`, pdf, "application/pdf");

    // base64 without Buffer (Workers-safe). Fine for a few-hundred-KB PDF; if
    // plans ever grow large, chunk this loop.
    let bin = "";
    pdf.forEach((b) => (bin += String.fromCharCode(b)));
    const base64 = btoa(bin);

    await sendExercisePlanEmail({
      to: booking.email,
      patientName: summary.patientName ?? "",
      planUrl: `${siteUrl}/patient/exercises`,
      exerciseCount: cards.length,
      pdf: { filename: "exercise-plan.pdf", base64 },
    });

    await summarySnap.ref.update({
      planEmailedAt: FieldValue.serverTimestamp(),
      planPdfPath: `exercise-plans/${summaryId}.pdf`,
    });

    return NextResponse.json({ ok: true, exercises: cards.length });
  } catch (err) {
    console.error("exercise-plan/generate failed", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
