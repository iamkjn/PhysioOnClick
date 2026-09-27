import { NextResponse } from "next/server";

import { renderEmailLayout, toPlainText } from "@/lib/emails/email-layout";
import { type DecodedIdToken, getAdminAuth } from "@/lib/firebase-admin";
import { formatPersonName } from "@/lib/name-format";
import { EMAIL_RE, LIMITS } from "@/lib/validation";

type ShareExerciseBody = {
  toEmail?: unknown;
  toName?: unknown;
  exerciseTitle?: unknown;
  exerciseSlug?: unknown;
  exerciseDescription?: unknown;
  setup?: unknown;
  steps?: unknown;
  cues?: unknown;
  note?: unknown;
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@physioonclick.co.uk";
const MAX_ITEMS = 12;

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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanString(value: unknown, max: number = LIMITS.message): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

function listHtml(title: string, items: string[]): string {
  if (!items.length) return "";
  return `
    <p style="margin:20px 0 8px; font-weight:700;">${escapeHtml(title)}</p>
    <ul style="margin:0 0 16px; padding-left:20px;">
      ${items.map((item) => `<li style="margin:0 0 6px;">${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

export async function POST(request: Request) {
  const decoded = await requireAdmin(request.headers.get("Authorization"));
  if (!decoded) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as ShareExerciseBody;
  const toEmail = cleanString(body.toEmail, LIMITS.email).toLowerCase();
  const toName = formatPersonName(cleanString(body.toName, LIMITS.name), "");
  const exerciseTitle = cleanString(body.exerciseTitle, 160);
  const exerciseSlug = cleanString(body.exerciseSlug, 160);
  const exerciseDescription = cleanString(body.exerciseDescription, 1200);
  const setup = cleanString(body.setup, 1200);
  const steps = cleanList(body.steps);
  const cues = cleanList(body.cues);
  const note = cleanString(body.note, 800);

  if (!EMAIL_RE.test(toEmail)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!exerciseTitle) {
    return NextResponse.json({ error: "Exercise title is required." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://physioonclick.co.uk";
  const publicUrl = exerciseSlug ? `${siteUrl}/exercises/${encodeURIComponent(exerciseSlug)}` : "";
  const patientGreeting = toName ? `Hi ${escapeHtml(toName)},` : "Hello,";
  const sender = formatPersonName(decoded.name as string | undefined, decoded.email ?? "Your physiotherapist");
  const subject = `${exerciseTitle} from PhysioOnClick`;
  const preheader = `Your physiotherapist shared ${exerciseTitle}`;

  const bodyHtml = `
    <p style="margin:0 0 16px;">${patientGreeting}</p>
    <p style="margin:0 0 16px;">Your physiotherapist has shared this exercise from the PhysioOnClick library.</p>
    <div style="border:1px solid #DDE7EE; border-radius:12px; padding:18px; background:#F8FBFD; margin:0 0 18px;">
      <p style="margin:0 0 6px; color:#0A77A8; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.08em;">Exercise</p>
      <h2 style="margin:0 0 10px; font-size:22px; line-height:1.2;">${escapeHtml(exerciseTitle)}</h2>
      ${exerciseDescription ? `<p style="margin:0 0 12px;">${escapeHtml(exerciseDescription)}</p>` : ""}
      ${setup ? `<p style="margin:0;"><strong>Set-up:</strong> ${escapeHtml(setup)}</p>` : ""}
    </div>
    ${listHtml("How to do it", steps)}
    ${listHtml("Key cues", cues)}
    ${note ? `<p style="margin:20px 0 16px;"><strong>Note from ${escapeHtml(sender)}:</strong><br />${escapeHtml(note).replaceAll("\n", "<br />")}</p>` : ""}
    ${
      publicUrl
        ? `<p style="margin:20px 0 0;"><a href="${escapeHtml(publicUrl)}" style="display:inline-block; background:#0EA5E9; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:700;">Open exercise guide</a></p>`
        : ""
    }
    <p style="margin:20px 0 0; font-size:13px; color:#5B7184;">Only do this exercise as advised by your physiotherapist. Stop and seek advice if symptoms worsen or you feel unsafe.</p>
  `;

  const html = renderEmailLayout({ preheader, bodyHtml });
  const text = toPlainText(
    [
      toName ? `Hi ${toName},` : "Hello,",
      "",
      `Your physiotherapist has shared this exercise from the PhysioOnClick library: ${exerciseTitle}.`,
      exerciseDescription,
      setup ? `Set-up: ${setup}` : "",
      steps.length ? `How to do it:\n${steps.map((item, index) => `${index + 1}. ${item}`).join("\n")}` : "",
      cues.length ? `Key cues:\n${cues.map((item) => `- ${item}`).join("\n")}` : "",
      note ? `Note from ${sender}:\n${note}` : "",
      publicUrl ? `Open exercise guide: ${publicUrl}` : "",
      "Only do this exercise as advised by your physiotherapist. Stop and seek advice if symptoms worsen or you feel unsafe.",
    ]
      .filter(Boolean)
      .join("\n\n")
  );

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[dev] exercise share email for ${toEmail}: ${subject}`);
    return NextResponse.json({ ok: true, sent: false, reason: "email-not-configured" });
  }

  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [toEmail], subject, html, text }),
  });

  if (!response.ok) {
    console.error("[share-exercise] Resend error", response.status, await response.text());
    return NextResponse.json({ error: "Could not send this exercise email." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sent: true });
}
