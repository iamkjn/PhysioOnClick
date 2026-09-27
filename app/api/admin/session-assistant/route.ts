import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

import type { AdminClinicalAssistantResponse } from "@/lib/admin-clinical-assistant";
import { type DecodedIdToken, getAdminAuth } from "@/lib/firebase-admin";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

type HistoryMessage = { role: "user" | "model"; text: string };

type RequestBody = {
  bookingId?: unknown;
  message?: unknown;
  history?: unknown;
  context?: unknown;
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@physioonclick.co.uk";
const CHAT_MODELS = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
const MAX_MESSAGE_CHARS = 1400;
const MAX_HISTORY_TEXT_CHARS = 1800;
const MAX_CONTEXT_CHARS = 14000;

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

function isRetryableModelError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return /\[(404|429|500|503)\b/.test(text);
}

function safeJson(value: unknown, limit = MAX_CONTEXT_CHARS): string {
  try {
    return JSON.stringify(value ?? {}, null, 2).slice(0, limit);
  } catch {
    return "{}";
  }
}

function cleanJsonText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  return trimmed;
}

function parseAssistantResponse(text: string): AdminClinicalAssistantResponse {
  try {
    const parsed = JSON.parse(cleanJsonText(text)) as Partial<AdminClinicalAssistantResponse>;
    return {
      reply: typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "I reviewed the session context. Use your clinical judgement and complete any missing safety, assessment, exercise and documentation steps before publishing.",
      checks: Array.isArray(parsed.checks) ? parsed.checks.filter((item): item is string => typeof item === "string").slice(0, 6) : [],
      priority: parsed.priority === "urgent" || parsed.priority === "attention" || parsed.priority === "routine"
        ? parsed.priority
        : "routine",
      summaryPatch: parsed.summaryPatch && typeof parsed.summaryPatch === "object"
        ? {
            workedOn: typeof parsed.summaryPatch.workedOn === "string" ? parsed.summaryPatch.workedOn : undefined,
            nextSteps: typeof parsed.summaryPatch.nextSteps === "string" ? parsed.summaryPatch.nextSteps : undefined,
            safetyNettingNotes: typeof parsed.summaryPatch.safetyNettingNotes === "string" ? parsed.summaryPatch.safetyNettingNotes : undefined,
          }
        : null,
    };
  } catch {
    return {
      reply: text.trim() || "I reviewed the session context. Check safety screening, patient goals, objective tests, exercise dosage, safety-netting and follow-up before publishing.",
      checks: [],
      priority: "routine",
      summaryPatch: null,
    };
  }
}

function buildSystemPrompt(): string {
  return `You are PhysioOnClick Clinical Co-pilot, an admin-only assistant inside the PhysioOnClick Start Session workflow.

Purpose:
- Help the clinician use the PhysioOnClick website tools well: assessment review, screening, self-test library, clinical impression, exercise library, streak goal, follow-up and session summary.
- Audit the live session context for missing steps, but always convert that audit into concrete actions the clinician can do inside this website.
- Suggest exact self-tests and exercises from the provided PhysioOnClick libraries. Use their names/slugs/stages/dosage from context.
- Draft summary fields that can be applied to the existing "What we worked on", "Next steps & advice", and "Safety-netting" textareas.

Clinical governance:
- You are decision support, not the treating clinician. The clinician's judgement is authoritative.
- Do not diagnose. Phrase possibilities as "consider", "may be relevant", or "check whether".
- Do NOT default to "contact GP" or "A&E". Only recommend GP/111/A&E/urgent medical advice when the context shows urgent red flags, severe unexplained/systemic symptoms, progressive neurological deficit, cauda equina/cervical vascular/MSCC-type flags, or the clinician specifically asks about escalation.
- If there are no urgent red flags, focus on PhysioOnClick next actions: which self-tests to record, which exercise-library items to assign, which safety-netting wording to document, what follow-up/streak goal to set, and what summary text to apply.
- Align advice with UK clinical governance principles: HCPC standards, consent, accurate records, scope of practice, evidence-based reasoning, patient-centred goals, outcome review, safeguarding, safety-netting, and appropriate referral.
- For condition guidance, avoid inventing exact NICE/CSP wording. If uncertain, tell the clinician to check current NICE/CSP/local pathway guidance.
- For exercise suggestions, prefer the provided "exercises.suggested" list. Mention exact exercise titles and stage. If dosage is provided, include it. If no suggestions are provided, recommend using the website exercise library search rather than inventing titles.
- For self-tests, prefer "selfTests.recommended" and "selfTests.selected". Mention exact test names and why they fit.
- If asked to update/autofill the summary, return a non-null summaryPatch. The text must be ready to apply but still require clinician review.

Response style:
- Be concise, practical and clinician-facing.
- Use natural chat formatting: short paragraphs and up to 5 bullets.
- Start with the most useful website action, not generic reassurance.
- Highlight missing website steps first: unrecorded self-tests, no confirmed impression, no exercises assigned, no safety-netting, no follow-up, or empty summary fields.
- When useful, include a mini checklist labelled "Do next in this screen".

Return JSON only in this shape:
{
  "reply": "clinician-facing answer with Markdown-style bullets allowed",
  "priority": "routine" | "attention" | "urgent",
  "checks": ["missing or completed checks, max 6"],
  "summaryPatch": {
    "workedOn": "optional suggested text",
    "nextSteps": "optional suggested text",
    "safetyNettingNotes": "optional suggested text"
  } | null
}`;
}

export async function POST(req: NextRequest) {
  if (await isRateLimited("CHAT_RATE_LIMITER", clientIp(req))) {
    return NextResponse.json({ error: "Too many assistant requests. Please wait a minute and try again." }, { status: 429 });
  }

  const decoded = await requireAdmin(req.headers.get("Authorization"));
  if (!decoded) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as RequestBody;
  const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const rawHistory = Array.isArray(body.history) ? body.history : [];

  if (!bookingId || bookingId.includes("/")) return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: `Please keep messages under ${MAX_MESSAGE_CHARS} characters.` }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const history: HistoryMessage[] = rawHistory
    .filter(
      (m): m is HistoryMessage =>
        typeof m === "object" &&
        m !== null &&
        ((m as HistoryMessage).role === "user" || (m as HistoryMessage).role === "model") &&
        typeof (m as HistoryMessage).text === "string",
    )
    .slice(-12)
    .map((m) => ({ ...m, text: m.text.slice(0, MAX_HISTORY_TEXT_CHARS) }));
  while (history.length > 0 && history[0].role !== "user") history.shift();

  const contextJson = safeJson(body.context);
  const userPrompt = `Clinician request: ${message}

Booking ID: ${bookingId}

Live session context:
${contextJson}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown;

  for (const modelName of CHAT_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildSystemPrompt(),
        generationConfig: { responseMimeType: "application/json" },
      });
      const chat = model.startChat({
        history: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      });
      const result = await chat.sendMessage(userPrompt);
      return NextResponse.json(parseAssistantResponse(result.response.text()));
    } catch (error) {
      lastError = error;
      if (!isRetryableModelError(error)) break;
      console.warn(`[/api/admin/session-assistant] ${modelName} unavailable, trying next model`);
    }
  }

  console.error("[/api/admin/session-assistant] error:", lastError);
  return NextResponse.json({
    reply: "I could not review the session just now. Please manually check red flags, consent, objective findings, exercise suitability, safety-netting and follow-up before publishing.",
    checks: [],
    priority: "attention",
    summaryPatch: null,
  } satisfies AdminClinicalAssistantResponse);
}
