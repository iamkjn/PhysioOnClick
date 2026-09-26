import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

import { buildSystemPrompt, type PatientContext } from "@/lib/chat-prompt";
import { AUTH_TOOL_DECLARATIONS, executeFunction, GUEST_TOOL_DECLARATIONS } from "@/lib/chat-tools";
import { FieldValue, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { formatPersonName } from "@/lib/name-format";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

type HistoryMessage = { role: "user" | "model"; text: string };

type RequestBody = {
  message?: unknown;
  sessionId?: unknown;
  history?: unknown;
};

async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const auth = getAdminAuth();
  if (!auth) return null;
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

async function fetchPatientContext(uid: string): Promise<PatientContext | undefined> {
  const db = getAdminDb();
  if (!db) return undefined;

  const [patientSnap, bookingsSnap, peopleSnap] = await Promise.all([
    db.collection("patients").doc(uid).get(),
    db
      .collection("bookings")
      .where("patientId", "==", uid)
      .where("status", "in", ["confirmed", "pending"])
      .orderBy("appointmentDate", "asc")
      .limit(10)
      .get(),
    db.collection("patients").doc(uid).collection("people").get(),
  ]);

  const patient = patientSnap.data();
  const appointments = bookingsSnap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      calBookingUid: data.calBookingUid ?? "",
      service: data.service ?? "",
      appointmentLabel: data.appointmentLabel ?? data.appointmentDate ?? "",
      appointmentDate: data.appointmentDate ?? "",
      status: data.status ?? "",
    };
  });

  const people = peopleSnap.docs.map(d => {
    const data = d.data();
    return { name: formatPersonName(data.name, ""), relationship: data.relationship ?? "" };
  });

  return {
    displayName: formatPersonName(patient?.displayName),
    appointments,
    people,
  };
}

// Caps on what a single request can send to Gemini, so one client can't run
// up the model bill with huge prompts.
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_TEXT_CHARS = 2000;

// Tried in order. Google retires/overloads models without notice, so a busy
// or removed primary falls through to the next. Both must support the
// @google/generative-ai function-calling flow below (the newest 3.8 models
// reject its "function" role and need the @google/genai SDK instead).
const CHAT_MODELS = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];

function isRetryableModelError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return /\[(404|429|500|503)\b/.test(text);
}

export async function POST(req: NextRequest) {
  if (await isRateLimited("CHAT_RATE_LIMITER", clientIp(req))) {
    return NextResponse.json(
      { error: "You're sending messages too quickly. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const body = (await req.json()) as RequestBody;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const incomingSessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const rawHistory = Array.isArray(body.history) ? body.history : [];

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json(
      { error: `Please keep messages under ${MAX_MESSAGE_CHARS} characters.` },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const sessionId = incomingSessionId ?? crypto.randomUUID();
  let actionForClient: { type: string; label: string; url: string } | undefined;

  try {
    const uid = await verifyToken(req.headers.get("Authorization"));
    const patientContext = uid ? await fetchPatientContext(uid) : undefined;
    const db = getAdminDb();

    const history: HistoryMessage[] = rawHistory
      .filter(
        (m): m is HistoryMessage =>
          typeof m === "object" &&
          m !== null &&
          ((m as HistoryMessage).role === "user" || (m as HistoryMessage).role === "model") &&
          typeof (m as HistoryMessage).text === "string"
      )
      .slice(-20)
      .map((m) => ({ ...m, text: m.text.slice(0, MAX_HISTORY_TEXT_CHARS) }));

    const systemPrompt = buildSystemPrompt(patientContext);
    const toolDeclarations = uid ? AUTH_TOOL_DECLARATIONS : GUEST_TOOL_DECLARATIONS;

    const genAI = new GoogleGenerativeAI(apiKey);

    // One model turn plus at most one function call. Re-run from scratch on
    // the next model if Google is overloaded/unavailable for this one.
    const runTurn = async (modelName: string) => {
      actionForClient = undefined;
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: toolDeclarations }],
      });

      const chat = model.startChat({
        history: history.map(m => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
      });

      let result = await chat.sendMessage(message);
      let response = result.response;

      // Function call loop (handles one call per turn)
      const calls = response.functionCalls();
      if (calls?.length) {
        const call = calls[0];
        const fnArgs = (call.args ?? {}) as Record<string, string>;

        if (call.name === "redirect" && fnArgs.url) {
          actionForClient = {
            type: call.name,
            label: fnArgs.label ?? "Go →",
            url: fnArgs.url,
          };
        } else if (call.name === "open_booking") {
          actionForClient = {
            type: "open_booking",
            label: fnArgs.service ? `Book ${fnArgs.service}` : "Book a session",
            url: "/book",
          };
        }

        const fnResult = db
          ? await executeFunction(call.name, fnArgs, uid ?? "", db)
          : JSON.stringify({ error: "Database unavailable" });

        result = await chat.sendMessage([
          {
            functionResponse: {
              name: call.name,
              response: { result: fnResult },
            },
          },
        ]);
        response = result.response;
      }
      return response;
    };

    let response: Awaited<ReturnType<typeof runTurn>> | undefined;
    let lastError: unknown;
    for (const modelName of CHAT_MODELS) {
      try {
        response = await runTurn(modelName);
        break;
      } catch (error) {
        lastError = error;
        if (!isRetryableModelError(error)) throw error;
        console.warn(`[/api/chat] ${modelName} unavailable, trying next model`);
      }
    }
    if (!response) throw lastError;

    const reply = response.text();

    // Persist to Firestore for logged-in patients. Scoped in its own try/catch so a
    // write failure is logged but doesn't discard an already-generated valid reply.
    if (uid && db) {
      try {
        const sessionRef = db
          .collection("patients")
          .doc(uid)
          .collection("chatSessions")
          .doc(sessionId);

        const sessionSnap = await sessionRef.get();
        if (!sessionSnap.exists) {
          await sessionRef.set({
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            messages: [
              { role: "user", text: message, timestamp: new Date().toISOString() },
              {
                role: "model",
                text: reply,
                timestamp: new Date().toISOString(),
                ...(actionForClient ? { action: actionForClient } : {}),
              },
            ],
          });
        } else {
          await sessionRef.update({
            updatedAt: FieldValue.serverTimestamp(),
            messages: FieldValue.arrayUnion(
              { role: "user", text: message, timestamp: new Date().toISOString() },
              {
                role: "model",
                text: reply,
                timestamp: new Date().toISOString(),
                ...(actionForClient ? { action: actionForClient } : {}),
              }
            ),
          });
        }
      } catch (persistErr) {
        console.error("[/api/chat] failed to persist chat history:", persistErr);
      }
    }

    return NextResponse.json({ reply, sessionId, ...(actionForClient ? { action: actionForClient } : {}) });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return NextResponse.json(
      {
        reply: "Sorry, I'm having trouble right now. Please call us or use the contact form.",
        sessionId,
      },
      { status: 200 }
    );
  }
}
