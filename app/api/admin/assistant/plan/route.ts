import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

import { exercises } from "@/lib/exercises";
import { type DecodedIdToken, getAdminAuth } from "@/lib/firebase-admin";
import { formatDosage, resolveDosage, type Exercise, type ExerciseDosage } from "@/lib/exercises";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

type PlanBody = {
  request?: unknown;
  patientName?: unknown;
  selectedExerciseIds?: unknown;
};

type PlannedExercise = {
  id: string;
  title: string;
  slug: string;
  bodyPart: string;
  condition: string;
  stage: string;
  reason: string;
  dosage: ExerciseDosage;
  dosageLabel: string;
};

type PlanResponse = {
  summary: string;
  safetyNotes: string[];
  exercises: PlannedExercise[];
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@physioonclick.co.uk";
const CHAT_MODELS = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
const MAX_REQUEST_CHARS = 1600;
const MAX_SELECTED = 10;
const MAX_AI_CATALOGUE = 42;
const AI_TIMEOUT_MS = 9000;

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

function words(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function scoreExercise(exercise: Exercise, request: string): number {
  const haystack = [
    exercise.title,
    exercise.bodyPart,
    exercise.condition,
    exercise.stage,
    exercise.description,
    ...(exercise.tags ?? []),
    ...(exercise.helpsWith ?? []),
    ...(exercise.aka ?? []),
  ].join(" ").toLowerCase();
  return words(request).reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);
}

function buildExercise(exercise: Exercise, reason: string, dosage?: ExerciseDosage): PlannedExercise {
  const resolved = dosage && Object.keys(dosage).length > 0 ? dosage : resolveDosage(exercise, {});
  return {
    id: exercise.id,
    title: exercise.title,
    slug: exercise.slug,
    bodyPart: exercise.bodyPart,
    condition: exercise.condition,
    stage: exercise.stage,
    reason,
    dosage: resolved,
    dosageLabel: formatDosage(resolved),
  };
}

function fallbackPlan(request: string, selectedIds: string[]): PlanResponse {
  const selected = selectedExercises(selectedIds);
  const ranked = rankedExercises(request, selectedIds)
    .filter(({ score, exercise }) => score > 0 && !selected.some((item) => item.id === exercise.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, 6 - selected.length))
    .map(({ exercise }) => exercise);
  const picked = [...selected, ...ranked].slice(0, 6);
  return {
    summary: picked.length
      ? "Drafted from matching PhysioOnClick library items. Review clinical fit, dose and safety before assigning or emailing."
      : "No strong catalogue match was found. Search manually or add more clinical detail.",
    safetyNotes: [
      "Admin must confirm this matches the assessment and current irritability.",
      "Stop or reduce if symptoms significantly worsen or the patient feels unsafe.",
      "Use urgent escalation only when red flags or progressive neurological symptoms are present.",
    ],
    exercises: picked.map((exercise) =>
      buildExercise(exercise, `Matched to "${request.slice(0, 90)}" using the PhysioOnClick exercise catalogue.`)
    ),
  };
}

function cleanJsonText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function normaliseAiPlan(text: string, request: string, selectedIds: string[]): PlanResponse {
  const fallback = fallbackPlan(request, selectedIds);
  try {
    const parsed = JSON.parse(cleanJsonText(text)) as {
      summary?: unknown;
      safetyNotes?: unknown;
      exercises?: Array<{ id?: unknown; reason?: unknown; dosage?: ExerciseDosage }>;
    };
    const chosen = (Array.isArray(parsed.exercises) ? parsed.exercises : [])
      .map((item) => {
        const id = typeof item.id === "string" ? item.id : "";
        const exercise = exercises.find((candidate) => candidate.id === id && !candidate.retired);
        if (!exercise) return null;
        return buildExercise(
          exercise,
          typeof item.reason === "string" && item.reason.trim()
            ? item.reason.trim()
            : "Selected from the PhysioOnClick exercise catalogue.",
          item.dosage,
        );
      })
      .filter((item): item is PlannedExercise => Boolean(item))
      .slice(0, 8);
    return {
      summary: typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : fallback.summary,
      safetyNotes: Array.isArray(parsed.safetyNotes)
        ? parsed.safetyNotes.filter((item): item is string => typeof item === "string").slice(0, 5)
        : fallback.safetyNotes,
      exercises: chosen.length ? chosen : fallback.exercises,
    };
  } catch {
    return fallback;
  }
}

function selectedExercises(selectedIds: string[]): Exercise[] {
  const catalogue = exercises.filter((exercise) => !exercise.retired);
  return selectedIds
    .map((id) => catalogue.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise));
}

function rankedExercises(request: string, selectedIds: string[]): Array<{ exercise: Exercise; score: number }> {
  const selected = new Set(selectedIds);
  return exercises
    .filter((exercise) => !exercise.retired && !selected.has(exercise.id))
    .map((exercise) => ({ exercise, score: scoreExercise(exercise, request) }))
    .sort((a, b) => b.score - a.score || a.exercise.title.localeCompare(b.exercise.title));
}

function catalogueForAi(request: string, selectedIds: string[]): Exercise[] {
  const selected = selectedExercises(selectedIds);
  const ranked = rankedExercises(request, selectedIds)
    .filter(({ score }) => score > 0)
    .slice(0, Math.max(0, MAX_AI_CATALOGUE - selected.length))
    .map(({ exercise }) => exercise);
  const withFallback = ranked.length
    ? ranked
    : rankedExercises(request, selectedIds).slice(0, Math.max(0, MAX_AI_CATALOGUE - selected.length)).map(({ exercise }) => exercise);
  return [...selected, ...withFallback].slice(0, MAX_AI_CATALOGUE);
}

function systemPrompt(aiCatalogue: Exercise[]): string {
  const catalogue = aiCatalogue
    .map((exercise) => ({
      id: exercise.id,
      title: exercise.title,
      bodyPart: exercise.bodyPart,
      condition: exercise.condition,
      stage: exercise.stage,
      tags: exercise.tags,
      helpsWith: exercise.helpsWith,
      defaultDosage: exercise.defaultDosage,
    }));
  return `You are the admin-only PhysioOnClick AI assistant.

Task: help a clinician draft an exercise plan using ONLY the provided PhysioOnClick exercise catalogue.
Do not invent exercise IDs. Return only catalogue IDs.
The clinician will review before assigning or emailing.
Suggest a practical starting dose using defaultDosage where appropriate, adjusting only cautiously for early/irritable cases.
Avoid generic GP/A&E advice unless red flags are explicitly present.

Catalogue JSON:
${JSON.stringify(catalogue)}

Return JSON only:
{
  "summary": "short clinical-admin summary",
  "safetyNotes": ["max 5 safety/review notes"],
  "exercises": [
    {
      "id": "catalogue exercise id",
      "reason": "why this fits",
      "dosage": { "sets": 2, "reps": 10, "perDay": 1, "perWeek": 5, "tempo": "optional", "notes": "optional" }
    }
  ]
}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function POST(req: NextRequest) {
  if (await isRateLimited("CHAT_RATE_LIMITER", clientIp(req))) {
    return NextResponse.json({ error: "Too many assistant requests. Please wait a minute and try again." }, { status: 429 });
  }
  const decoded = await requireAdmin(req.headers.get("Authorization"));
  if (!decoded) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as PlanBody;
  const request = typeof body.request === "string" ? body.request.trim().slice(0, MAX_REQUEST_CHARS) : "";
  const patientName = typeof body.patientName === "string" ? body.patientName.trim().slice(0, 120) : "";
  const selectedIds = Array.isArray(body.selectedExerciseIds)
    ? body.selectedExerciseIds.filter((item): item is string => typeof item === "string").slice(0, MAX_SELECTED)
    : [];

  if (!request && selectedIds.length === 0) {
    return NextResponse.json({ error: "Tell the assistant what the patient needs, or select exercises first." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json(fallbackPlan(request || patientName || "exercise plan", selectedIds));
  const aiCatalogue = catalogueForAi(request || patientName || "exercise plan", selectedIds);
  if (aiCatalogue.length === 0) return NextResponse.json(fallbackPlan(request || patientName || "exercise plan", selectedIds));

  const userPrompt = [
    patientName ? `Patient: ${patientName}` : "",
    selectedIds.length ? `Clinician already selected exercise IDs: ${selectedIds.join(", ")}` : "",
    `Clinician request: ${request}`,
  ].filter(Boolean).join("\n");

  const genAI = new GoogleGenerativeAI(apiKey);
  for (const modelName of CHAT_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt(aiCatalogue) });
      const result = await withTimeout(model.generateContent(userPrompt), AI_TIMEOUT_MS);
      return NextResponse.json(normaliseAiPlan(result.response.text(), request, selectedIds));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === "AI_TIMEOUT") return NextResponse.json(fallbackPlan(request || patientName || "exercise plan", selectedIds));
      if (!/\[(404|429|500|503)\b/.test(message)) break;
    }
  }

  return NextResponse.json(fallbackPlan(request || patientName || "exercise plan", selectedIds));
}
