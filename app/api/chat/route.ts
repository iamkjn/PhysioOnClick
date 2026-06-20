import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { buildSystemPrompt, type PatientContext } from "@/lib/chat-prompt";
import { AUTH_TOOL_DECLARATIONS, executeFunction, GUEST_TOOL_DECLARATIONS } from "@/lib/chat-tools";
import { getAdminDb } from "@/lib/firebase-admin";

type HistoryMessage = { role: "user" | "model"; text: string };

type RequestBody = {
  message?: unknown;
  sessionId?: unknown;
  history?: unknown;
};

async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await getAuth().verifyIdToken(token);
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
    return { name: data.name ?? "", relationship: data.relationship ?? "" };
  });

  return {
    displayName: patient?.displayName ?? "Patient",
    appointments,
    people,
  };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const incomingSessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const rawHistory = Array.isArray(body.history) ? body.history : [];

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

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
    .slice(-20);

  const systemPrompt = buildSystemPrompt(patientContext);
  const toolDeclarations = uid ? AUTH_TOOL_DECLARATIONS : GUEST_TOOL_DECLARATIONS;

  const sessionId = incomingSessionId ?? crypto.randomUUID();
  let actionForClient: { type: string; label: string; url: string } | undefined;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
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

    const reply = response.text();

    // Persist to Firestore for logged-in patients
    if (uid && db) {
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
