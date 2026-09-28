import { NextResponse } from "next/server";

import { buildExercisePlanPdf } from "@/lib/exercise-plan-pdf";
import { sendExercisePlanEmail } from "@/lib/emails/exercise-plan-email";
import { downloadObject, type DecodedIdToken, getAdminAuth } from "@/lib/firebase-admin";
import { exercises, formatDosage, resolveDosage, type ExerciseDosage } from "@/lib/exercises";
import { founder } from "@/lib/site-data";
import { EMAIL_RE, LIMITS } from "@/lib/validation";

type PlanExerciseInput = {
  id?: unknown;
  dosage?: unknown;
  reason?: unknown;
};

type RequestBody = {
  toEmail?: unknown;
  patientName?: unknown;
  note?: unknown;
  exercises?: unknown;
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@physioonclick.co.uk";
const MAX_EXERCISES = 12;
const MAX_EMBEDDED_IMAGE_BYTES = 900_000;

function isAdmin(decoded: DecodedIdToken): boolean {
  return decoded.admin === true || (!!decoded.email && decoded.email === ADMIN_EMAIL);
}

async function requireAdmin(authHeader: string | null): Promise<DecodedIdToken | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const auth = getAdminAuth();
  if (!auth) return null;
  try {
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    return isAdmin(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function cleanString(value: unknown, max: number = LIMITS.message): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanDosage(value: unknown): ExerciseDosage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const dosage: ExerciseDosage = {};
  for (const key of ["sets", "reps", "holdSeconds", "minutes", "perDay", "perWeek"] as const) {
    const raw = source[key];
    if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) dosage[key] = raw;
  }
  if (typeof source.tempo === "string" && source.tempo.trim()) dosage.tempo = source.tempo.trim().slice(0, 80);
  if (typeof source.notes === "string" && source.notes.trim()) dosage.notes = source.notes.trim().slice(0, 280);
  return Object.keys(dosage).length ? dosage : undefined;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(bin);
}

async function downloadPdfImage(exerciseId: string): Promise<Uint8Array | null> {
  const bytes =
    (await downloadObject(`exercise-images/${exerciseId}-pdf.png`).catch(() => null)) ??
    (await downloadObject(`exercise-images/${exerciseId}.png`).catch(() => null));
  if (!bytes) return null;
  if (bytes.byteLength > MAX_EMBEDDED_IMAGE_BYTES) {
    console.warn("[admin-assistant-email] exercise image too large for PDF embed; using vector fallback", exerciseId, bytes.byteLength);
    return null;
  }
  return bytes;
}

export async function POST(request: Request) {
  const decoded = await requireAdmin(request.headers.get("Authorization"));
  if (!decoded) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const toEmail = cleanString(body.toEmail, LIMITS.email).toLowerCase();
  const patientName = cleanString(body.patientName, LIMITS.name) || "Patient";
  const note = cleanString(body.note, 800);
  const rawExercises = Array.isArray(body.exercises) ? body.exercises.slice(0, MAX_EXERCISES) as PlanExerciseInput[] : [];

  if (!EMAIL_RE.test(toEmail)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (rawExercises.length === 0) {
    return NextResponse.json({ error: "Select at least one exercise." }, { status: 400 });
  }

  const selected = rawExercises
    .map((item) => {
      const id = typeof item.id === "string" ? item.id : "";
      const exercise = exercises.find((candidate) => candidate.id === id && !candidate.retired);
      if (!exercise) return null;
      return {
        exercise,
        dosage: cleanDosage(item.dosage),
        reason: cleanString(item.reason, 360),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (selected.length === 0) {
    return NextResponse.json({ error: "No valid exercises found in the library." }, { status: 400 });
  }

  const imageByExerciseId: Record<string, Uint8Array | null> = {};
  await Promise.all(
    selected.map(async ({ exercise }) => {
      imageByExerciseId[exercise.id] = await downloadPdfImage(exercise.id);
    }),
  );

  const cards = selected.map(({ exercise, dosage, reason }, index) => {
    const resolved = resolveDosage(exercise, dosage ? { dosage } : {});
    const reasonNote = reason ? `Why selected: ${reason}` : null;
    const extraNote = note && index === 0 ? note : null;
    return {
      index: index + 1,
      title: exercise.title,
      imageBytes: imageByExerciseId[exercise.id] ?? null,
      pose: exercise.pose,
      setup: exercise.setup ?? exercise.description ?? null,
      steps: exercise.steps ?? [],
      cues: (exercise.cues ?? []).slice(0, 3),
      safetyLine: (exercise.mistakes ?? []).find((item) => item.startsWith("Stop") || item.includes("physio")) ?? null,
      doseText: formatDosage(resolved),
      physioNote: [reasonNote, extraNote].filter(Boolean).join(" ") || (dosage?.notes ?? exercise.defaultDosage?.notes ?? null),
    };
  });

  let pdf: Uint8Array;
  try {
    pdf = await buildExercisePlanPdf({
      patientName,
      patientEmail: toEmail,
      physioName: founder.name,
      sessionDateISO: new Date().toISOString(),
      cards,
      oneExercisePerPage: true,
    });
  } catch (error) {
    console.error("[admin-assistant-email] PDF generation failed", error);
    return NextResponse.json({ error: "Could not create the exercise plan PDF. Please try again." }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://physioonclick.co.uk";
  const result = await sendExercisePlanEmail({
    to: toEmail,
    patientName,
    planUrl: `${siteUrl}/patient/exercises`,
    exerciseCount: cards.length,
    pdf: {
      filename: `${patientName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "patient"}-exercise-plan.pdf`,
      base64: bytesToBase64(pdf),
    },
  });

  if (!result.sent) {
    return NextResponse.json({ error: result.error || "Email failed. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sent: result.sent, exercises: cards.length });
}
