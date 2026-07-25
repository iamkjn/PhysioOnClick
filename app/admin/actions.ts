"use server";

import { revalidatePath } from "next/cache";
import { DecodedIdToken, FieldValue, Firestore, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { LIMITS } from "@/lib/validation";

// Server actions are public HTTP endpoints — the /admin page gate is client-side
// only, so every action must verify the caller's ID token itself.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@physioonclick.co.uk";

// Returns the decoded token so callers that need the admin's own uid (e.g.
// scheduleFollowUp's createdBy) don't have to verify twice.
async function requireAdmin(idToken: string): Promise<DecodedIdToken> {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Unauthorized");
  }
  const adminAuth = getAdminAuth();
  if (!adminAuth) throw new Error("Server not configured");
  let decoded: DecodedIdToken;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    throw new Error("Unauthorized");
  }
  const isAdmin = decoded.admin === true || (!!decoded.email && decoded.email === ADMIN_EMAIL);
  if (!isAdmin) throw new Error("Unauthorized");
  return decoded;
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

export interface ScheduleFollowUpInput {
  patientUid: string;
  patientName: string;
  dueDate: string;
  note: string;
  service?: string;
  personId?: string;
}

const DUE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Formats a plain "YYYY-MM-DD" string as "12 Aug 2026" without going through
// Date/toLocaleDateString — parsing the date-only string with `new Date()`
// treats it as UTC midnight, which toLocaleDateString then renders in the
// server's local timezone and can shift the day. Working on the string
// components directly keeps this deterministic wherever the Worker runs.
function prettyDate(dueDate: string): string {
  const [y, m, d] = dueDate.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function assertValidFollowUpInput(input: ScheduleFollowUpInput): void {
  const valid =
    !!input &&
    typeof input.patientUid === "string" && input.patientUid.length > 0 &&
    !input.patientUid.includes("/") &&
    typeof input.patientName === "string" && input.patientName.length > 0 &&
    typeof input.dueDate === "string" && DUE_DATE_RE.test(input.dueDate) &&
    !Number.isNaN(new Date(input.dueDate).getTime()) &&
    input.dueDate >= todayISO() &&
    typeof input.note === "string" && input.note.length <= LIMITS.clinicalNote &&
    (input.service === undefined || typeof input.service === "string") &&
    (input.personId === undefined || typeof input.personId === "string");
  if (!valid) throw new Error("Invalid follow-up input");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Mirrors app/api/enquiry's Resend pattern exactly: same from/key handling,
// and console-logs instead of failing when RESEND_API_KEY is unset (like the
// magic-link route). Never throws — the in-app notification has already
// succeeded by the time this runs, so a broken email must not undo that.
async function sendFollowUpEmail(
  db: Firestore,
  patientUid: string,
  patientName: string,
  dueDate: string,
  note: string
): Promise<void> {
  try {
    const userSnap = await db.doc(`users/${patientUid}`).get();
    const email = userSnap.data()?.email;
    if (typeof email !== "string" || !email) return;

    const pretty = prettyDate(dueDate);
    const subject = "Your physio has scheduled a follow-up";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #10233a; line-height: 1.6; max-width: 600px;">
        <h2 style="margin-bottom: 16px;">Follow-up scheduled</h2>
        <p>Hi ${escapeHtml(patientName)},</p>
        <p>Your physio has scheduled a follow-up for <strong>${escapeHtml(pretty)}</strong>.</p>
        ${note ? `<p>${escapeHtml(note).replaceAll("\n", "<br />")}</p>` : ""}
        <p><a href="${escapeHtml(siteUrl)}/patient/appointments">View your appointments</a></p>
      </div>
    `;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log(`[dev] follow-up email for ${email}: ${subject} — due ${pretty}`);
      return;
    }

    const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [email], subject, html }),
    });
    if (!res.ok) {
      console.error("Follow-up email failed", res.status, await res.text());
    }
  } catch (error) {
    console.error("Follow-up email failed", error);
  }
}

export async function scheduleFollowUp(
  input: ScheduleFollowUpInput,
  idToken: string
): Promise<void> {
  const decoded = await requireAdmin(idToken);
  assertValidFollowUpInput(input);
  const db = getAdminDb();
  if (!db) throw new Error("Admin database unavailable");

  const service = input.service ?? "";
  const personId = input.personId ?? input.patientUid;
  const pretty = prettyDate(input.dueDate);

  await db.collection(`patients/${input.patientUid}/followUps`).add({
    dueDate: input.dueDate,
    note: input.note,
    service,
    personId,
    createdBy: decoded.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection(`patients/${input.patientUid}/notifications`).add({
    title: "Follow-up scheduled",
    body: `Your physio has scheduled a follow-up for ${pretty}.${input.note ? " " + input.note : ""}`,
    kind: "appointment",
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Best-effort — never throws, see sendFollowUpEmail.
  await sendFollowUpEmail(db, input.patientUid, input.patientName, input.dueDate, input.note);
}
