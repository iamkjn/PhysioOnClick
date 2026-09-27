"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Bot, ClipboardCheck, Send, X } from "lucide-react";

import { auth } from "@/lib/firebase";
import type {
  AdminClinicalAssistantContext,
  AdminClinicalAssistantResponse,
  AdminClinicalSummaryPatch,
} from "@/lib/admin-clinical-assistant";

type Msg = {
  isBot: boolean;
  text: string;
  priority?: AdminClinicalAssistantResponse["priority"];
  checks?: string[];
  summaryPatch?: AdminClinicalSummaryPatch | null;
};

type QuickPrompt = {
  label: string;
  prompt: string;
};

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: "Smart next steps",
    prompt: "Using the live PhysioOnClick session context, tell me exactly what to do next in this Start Session screen. Focus on missing self-tests, clinical impression, exercise-library assignments, safety-netting, follow-up and summary fields.",
  },
  {
    label: "Pick self-tests",
    prompt: "Use the PhysioOnClick self-test library in the session context. Which exact tests should I record or add for this patient, and why?",
  },
  {
    label: "Pick exercises",
    prompt: "Use the PhysioOnClick exercise suggestions in the session context. Recommend exact exercise-library items to assign or avoid, including stage and dose if present.",
  },
  {
    label: "Autofill summary",
    prompt: "Draft ready-to-apply text for the session summary fields using the current assessment, self-tests, clinical impression and assigned/suggested exercises. Return summaryPatch for workedOn, nextSteps and safetyNettingNotes.",
  },
];

const GREETING =
  "Clinical co-pilot ready. I can use this session's assessment, self-test library, exercise library and summary fields to suggest exact next steps and applyable summary text.";

function renderInlineText(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderChatText(text: string): ReactNode {
  const sections: ReactNode[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const content = paragraph.join(" ").trim();
    if (content) sections.push(<p key={`p-${sections.length}`}>{renderInlineText(content)}</p>);
    paragraph = [];
  };

  const flushBullets = () => {
    if (!bullets.length) return;
    sections.push(
      <ul key={`ul-${sections.length}`}>
        {bullets.map((item, index) => (
          <li key={index}>{renderInlineText(item)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushBullets();
      continue;
    }
    const bullet = line.match(/^(?:[-*•]\s+)(.+)$/);
    if (bullet) {
      flushParagraph();
      bullets.push(bullet[1].trim());
      continue;
    }
    flushBullets();
    paragraph.push(line);
  }

  flushParagraph();
  flushBullets();
  return sections.length ? sections : renderInlineText(text);
}

function patchHasContent(patch?: AdminClinicalSummaryPatch | null) {
  return Boolean(
    patch?.workedOn?.trim() ||
      patch?.nextSteps?.trim() ||
      patch?.safetyNettingNotes?.trim(),
  );
}

export function AdminClinicalAssistant({
  bookingId,
  context,
  onApplySummaryPatch,
}: {
  bookingId: string;
  context: AdminClinicalAssistantContext;
  onApplySummaryPatch: (patch: AdminClinicalSummaryPatch) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ isBot: true, text: GREETING, priority: "routine" }]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, sending]);

  async function sendMessage(text: string) {
    const clean = text.trim();
    if (!clean || sending) return;

    const history = messages.map((m) => ({
      role: m.isBot ? "model" : "user",
      text: m.text,
    }));

    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { isBot: false, text: clean }]);

    try {
      const token = await auth?.currentUser?.getIdToken().catch(() => null);
      if (!token) throw new Error("Not signed in");
      const res = await fetch("/api/admin/session-assistant", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId, message: clean, history, context }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<AdminClinicalAssistantResponse> & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Assistant failed");
      setMessages((prev) => [
        ...prev,
        {
          isBot: true,
          text: data.reply || "I reviewed the session. Check safety, assessment, exercises, documentation and follow-up before publishing.",
          priority: data.priority,
          checks: data.checks,
          summaryPatch: data.summaryPatch ?? null,
        },
      ]);
    } catch {
      const exerciseText = context.exercises.suggested.slice(0, 3).map((item) => item.title).join(", ");
      const testText = context.selfTests.recommended.slice(0, 3).map((item) => item.name).join(", ");
      setMessages((prev) => [
        ...prev,
        {
          isBot: true,
          priority: "attention",
          text: [
            "I could not reach the clinical assistant just now, but here is the local session checklist.",
            testText ? `Consider recording these self-tests from the library: ${testText}.` : "Check whether any self-tests need recording before impression.",
            exerciseText ? `Exercise-library suggestions currently include: ${exerciseText}.` : "No exercise-library suggestions are in context yet; confirm impression or search the library.",
            "Before publishing, confirm safety-netting, follow-up, and that summary fields reflect the assessment and plan.",
          ].join("\n\n"),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="admin-ai-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close clinical co-pilot" : "Open clinical co-pilot"}
      >
        {open ? <X size={20} /> : <Bot size={20} />}
        <span>Clinical co-pilot</span>
      </button>

      {open && (
        <aside className="admin-ai-panel" aria-label="Clinical co-pilot">
          <header className="admin-ai-header">
            <div className="admin-ai-header__icon"><ClipboardCheck size={19} /></div>
            <div>
              <span>Admin only</span>
              <strong>Clinical co-pilot</strong>
              <small>Checks safety, tests, exercises and notes before publish</small>
            </div>
          </header>

          <div className="admin-ai-body" role="log" aria-live="polite">
            {messages.map((message, index) => (
              <div key={index} className={`admin-ai-message ${message.isBot ? "is-bot" : "is-user"}`}>
                {message.isBot && message.priority && (
                  <span className={`admin-ai-priority is-${message.priority}`}>{message.priority}</span>
                )}
                <div className="admin-ai-rich-text">{renderChatText(message.text)}</div>
                {message.isBot && message.checks && message.checks.length > 0 && (
                  <ul className="admin-ai-checks">
                    {message.checks.slice(0, 6).map((check, checkIndex) => (
                      <li key={checkIndex}>{check}</li>
                    ))}
                  </ul>
                )}
                {message.isBot && patchHasContent(message.summaryPatch) && (
                  <button
                    type="button"
                    className="admin-ai-apply"
                    onClick={() => onApplySummaryPatch(message.summaryPatch!)}
                  >
                    Apply suggested summary text
                  </button>
                )}
              </div>
            ))}
            {sending && (
              <div className="admin-ai-message is-bot">
                <div className="admin-ai-typing" aria-label="Clinical co-pilot is reviewing">
                  <span className="chat-dot" />
                  <span className="chat-dot" />
                  <span className="chat-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="admin-ai-prompts">
            {QUICK_PROMPTS.map((item) => (
              <button key={item.label} type="button" onClick={() => void sendMessage(item.prompt)} disabled={sending}>
                {item.label}
              </button>
            ))}
          </div>

          <form
            className="admin-ai-input"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <label className="sr-only" htmlFor="admin-clinical-assistant-input">Ask clinical co-pilot</label>
            <input
              id="admin-clinical-assistant-input"
              value={input}
              maxLength={1400}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask what is missing, what to test, or draft notes..."
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()} aria-label="Send to clinical co-pilot">
              <Send size={17} />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
