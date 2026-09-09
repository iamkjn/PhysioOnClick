import { NextResponse } from "next/server";

import { sendConditionPlanEmail } from "@/lib/emails/condition-plan-email";
import { getCondition, programForCondition } from "@/lib/exercise-library";
import { buildPlanCards } from "@/lib/exercise-plan";
import { buildExercisePlanPdf } from "@/lib/exercise-plan-pdf";
import { founder } from "@/lib/site-data";
import { absoluteUrl } from "@/lib/utils";

/**
 * Public "Get this plan as a PDF" email-capture endpoint for the exercise
 * library. Anyone reading a condition hub can ask for the whole staged
 * programme as the same illustrated PDF a patient gets after a session.
 *
 * `POST { conditionSlug, email, website? }`:
 *  - `website` is a honeypot — a non-empty value means a bot filled a hidden
 *    field, so return a clean 200 and do nothing.
 *  - A missing/invalid `email` is a 400, an unknown `conditionSlug` a 404.
 *  - Abuse guard: a module-scoped sliding window, max 3 requests per IP per
 *    10 minutes, then 429. A cold Worker isolate resets it — acceptable for
 *    a soft guard on a free giveaway.
 *  - Once past validation this is best-effort: any PDF/email failure is logged
 *    and still returns `200 { ok: false }` so a public caller never sees an
 *    internal error.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;
const rateHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (rateHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  rateHits.set(ip, recent);
  // Bound the map: `x-forwarded-for` is caller-controlled, so evict IPs whose
  // window has fully expired rather than letting keys accumulate forever.
  if (rateHits.size > 5000) {
    for (const [key, hits] of rateHits) {
      if (hits.every((t) => now - t >= RATE_WINDOW_MS)) rateHits.delete(key);
    }
  }
  return recent.length > RATE_MAX;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const body = (await request.json().catch(() => ({}))) as {
    conditionSlug?: string;
    email?: string;
    website?: string;
  };

  // Honeypot: a filled hidden field means a bot. Look successful, do nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  const slug = typeof body.conditionSlug === "string" ? body.conditionSlug : "";
  const condition = getCondition(slug);
  if (!condition) {
    return NextResponse.json({ error: "Unknown condition" }, { status: 404 });
  }

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests, please try again later" }, { status: 429 });
  }

  try {
    const assigned = programForCondition(slug)
      .flatMap((stage) => stage.exercises)
      .map((exercise) => ({ exerciseId: exercise.id }));
    const cards = buildPlanCards(assigned, {});

    const pdf = await buildExercisePlanPdf({
      patientName: "",
      physioName: founder.name,
      sessionDateISO: null,
      cards,
    });

    // base64 without Buffer (Workers-safe); a condition plan is a few hundred KB.
    let bin = "";
    pdf.forEach((b) => (bin += String.fromCharCode(b)));
    const b64 = btoa(bin);

    // Lead line for now; a Firestore `leads` collection is Phase 2. Logs only
    // the non-identifying facts - never the requester email next to a named
    // medical condition (PII in Worker logs).
    console.info(
      `[condition-pdf] plan requested: ${slug} (${cards.length} exercises)`,
    );

    await sendConditionPlanEmail({
      to: email,
      conditionName: condition.name,
      exerciseCount: cards.length,
      libraryUrl: absoluteUrl(`/exercises/for/${slug}`),
      pdf: { filename: `${slug}-exercise-plan.pdf`, base64: b64 },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("condition-pdf failed", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
