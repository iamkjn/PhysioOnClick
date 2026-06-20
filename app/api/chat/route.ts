import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

import { buildSystemPrompt } from "@/lib/chat-prompt";

type HistoryMessage = { role: "user" | "model"; text: string };

type RequestBody = {
  message?: unknown;
  sessionId?: unknown;
  history?: unknown;
};

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

  const history: HistoryMessage[] = rawHistory
    .filter(
      (m): m is HistoryMessage =>
        typeof m === "object" &&
        m !== null &&
        ((m as HistoryMessage).role === "user" || (m as HistoryMessage).role === "model")
    )
    .slice(-20);

  const systemPrompt = buildSystemPrompt();

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    const sessionId = incomingSessionId ?? crypto.randomUUID();

    return NextResponse.json({ reply, sessionId });
  } catch (err) {
    console.error("[/api/chat] Gemini error:", err);
    return NextResponse.json(
      { reply: "Sorry, I'm having trouble right now. Please call us or use the contact form.", sessionId: incomingSessionId ?? crypto.randomUUID() },
      { status: 200 }
    );
  }
}
