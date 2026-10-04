"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { track } from "@/lib/analytics";
import { auth } from "@/lib/firebase";
import { trackGrowthEvent } from "@/lib/growth-tracking";
import { pricing } from "@/lib/site-data";

// ─── Types ───────────────────────────────────────────────────────────────────

type ChatAction = { type: string; label: string; url: string };
type Msg = { isBot: boolean; text: string; action?: ChatAction };
type ChipAction =
  | "ask"
  | "services"
  | "pricing"
  | "insurance"
  | "book"
  | "location"
  | "contact"
  | "cancellation"
  | "home"
  | "copyEmail"
  | "appointments"
  | "invoices"
  | "serviceDetail";
type Chip = { emoji: string; label: string; action: ChipAction; text?: string };
type ChatApiResponse = {
  reply?: string;
  sessionId?: string;
  action?: ChatAction;
  error?: string;
};

// ─── Content ─────────────────────────────────────────────────────────────────

const EMAIL = "hello@physioonclick.co.uk";

const SERVICES = [
  {
    emoji: "💪",
    label: "Musculoskeletal Physio",
    text: "We treat back & neck pain, shoulder impingement, tendon pain, persistent sports injuries and work-related strain.\n\nOur approach includes a detailed functional assessment, manual therapy where appropriate, graduated exercise prescription and pain education.",
  },
  {
    emoji: "🦿",
    label: "Post-Surgical Rehab",
    text: "Structured rehab after knee/hip replacement, ACL reconstruction, rotator cuff repair and fracture recovery.\n\nWe guide you through post-operative milestones, strength & range-of-motion progression and return-to-function coaching.",
  },
  {
    emoji: "🧠",
    label: "Neurological Rehab",
    text: "Goal-led rehab for stroke, Parkinson's, balance difficulties and neurological deconditioning.\n\nWe focus on task-specific mobility practice, balance & gait training, and carer education.",
  },
  {
    emoji: "👶",
    label: "Paediatric Physio",
    text: "Child-centred physiotherapy for developmental delay, coordination challenges, mobility support and post-operative rehab.\n\nSessions use play-based strategies with full parent coaching. Parent attendance is encouraged.",
  },
  {
    emoji: "🚶",
    label: "Gait & Mobility",
    text: "Walking assessment and movement analysis for falls risk, balance confidence, mobility aid review and reduced walking tolerance.\n\nWe provide functional walking assessment, strength & balance prescription and outcome tracking.",
  },
  {
    emoji: "💻",
    label: "Online Rehab",
    text: "UK-wide digital physiotherapy via secure video call with tailored exercise plans, progress tracking and weekly review calls.\n\nOnline patients receive the same structured rehabilitation planning.",
  },
];

// Built from lib/site-data.ts so the chat can never quote a stale price.
const PRICING_TEXT = [
  "Online sessions (UK-wide):",
  ...pricing.filter((p) => p.mode === "Online").map((p) => `• ${p.title} (${p.duration}) — £${p.price}`),
  "",
  "Packages:",
  ...pricing.filter((p) => p.mode === "Package").map((p) => `• ${p.title} — £${p.price}`),
  "",
  "New patients can use code NEW10 at checkout for 10% off their first booking. No GP referral required — you can self-refer.",
].join("\n");

const INSURANCE_TEXT =
  "Yes, PhysioOnClick provides insurance-ready PDF invoices for paid sessions.\n\nHow to claim:\n• Download your invoice from your patient account under Invoices, or use the copy emailed after payment.\n• Submit the PDF to your UK health insurer through their claim portal or app.\n• Add your policy number, claim reference and any extra details your insurer asks for.\n\nReimbursement depends on your own policy, so it is worth checking your cover before booking if you are unsure.";

const GREETING =
  "Welcome to PhysioOnClick.\n\nI can help you choose the right online physio service, understand pricing and insurance invoices, prepare for your appointment, find exercise and self-test guidance, or get to the right booking/account page.";

const HOME_CHIPS: Chip[] = [
  { emoji: "?", label: "Which service is right?", action: "ask", text: "Which PhysioOnClick service is right for me?" },
  { emoji: "?", label: "How online physio works", action: "ask", text: "How does online physiotherapy work at PhysioOnClick?" },
  { emoji: "🏃", label: "Our services", action: "services" },
  { emoji: "💰", label: "Pricing", action: "pricing" },
  { emoji: "🧾", label: "Insurance claims", action: "insurance" },
  { emoji: "📅", label: "Book appointment", action: "book" },
  { emoji: "!", label: "Cancellation policy", action: "cancellation" },
];

const BACK_CHIPS: Chip[] = [
  { emoji: "📅", label: "Book appointment", action: "book" },
  { emoji: "🏠", label: "Main menu", action: "home" },
];

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
    if (content) {
      sections.push(<p key={`p-${sections.length}`}>{renderInlineText(content)}</p>);
    }
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

function chatMessagePreview(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 160);
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export function ChatWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Initialise on first open
  useEffect(() => {
    if (open && !initializedRef.current) {
      initializedRef.current = true;
      setMsgs([{ isBot: true, text: GREETING }]);
      setChips(HOME_CHIPS);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, chips]);

  // Close on Escape while the drawer is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Move focus into the drawer on open, and back to the trigger on close
  useEffect(() => {
    if (open) {
      const first = drawerRef.current?.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      first?.focus();
    } else if (wasOpenRef.current) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  // Trap Tab within the drawer while open
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusable = drawer.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (pathname?.startsWith("/admin")) return null;

  // ── Tap handlers ───────────────────────────────────────────────────────────

  function tapHome() {
    setMsgs([{ isBot: true, text: GREETING }]);
    setChips(HOME_CHIPS);
  }

  function tapServices() {
    addBot(
      "We offer 6 specialised physiotherapy services. Which one would you like to know more about?",
      [
        ...SERVICES.map(s => ({
          emoji: s.emoji,
          label: s.label,
          action: "serviceDetail" as const,
          text: s.text,
        })),
        { emoji: "↩", label: "Main menu", action: "home" as const },
      ],
    );
  }

  function tapServiceDetail(label: string, text: string) {
    addBot(text, [
      { emoji: "📅", label: "Book this service", action: "book" },
      { emoji: "💰", label: "See pricing", action: "pricing" },
      { emoji: "↩", label: "Back to services", action: "services" },
      { emoji: "🏠", label: "Main menu", action: "home" },
    ]);
  }

  function tapPricing() {
    addBot(PRICING_TEXT, BACK_CHIPS);
  }

  function tapInsurance() {
    addBot(INSURANCE_TEXT, [
      { emoji: "🧾", label: "My invoices", action: "invoices" },
      { emoji: "📅", label: "Book appointment", action: "book" },
      { emoji: "🏠", label: "Main menu", action: "home" },
    ]);
  }

  function tapBook() {
    trackGrowthEvent("chat_booking_intent", { source: "chat_chip" });
    router.push("/book");
  }

  async function sendMessage(text: string) {
    const clean = text.trim();
    if (!clean || sending) return;

    const history = msgs.map((m) => ({
      role: m.isBot ? "model" : "user",
      text: m.text,
    }));

    setInput("");
    setSending(true);
    setMsgs((prev) => [...prev, { isBot: false, text: clean }]);
    setChips([]);
    trackGrowthEvent("chat_message_sent", {
      message_length: clean.length,
      message_preview: chatMessagePreview(clean),
      intent: /book|appointment|price|cost|pain|physio|service/i.test(clean) ? "commercial_or_clinical" : "general",
    });
    if (/book|appointment|checkout|assessment/i.test(clean)) {
      trackGrowthEvent("chat_booking_intent", { source: "free_text" });
    }

    try {
      const token = await auth?.currentUser?.getIdToken().catch(() => null);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: clean, history, sessionId }),
      });
      const data = (await response.json().catch(() => ({}))) as ChatApiResponse;
      if (!response.ok) throw new Error(data.error ?? "Chat failed");
      if (data.sessionId) setSessionId(data.sessionId);
      setMsgs((prev) => [
        ...prev,
        {
          isBot: true,
          text: data.reply?.trim() || "I can help with services, pricing, booking, online physio, exercise plans and account questions.",
          action: data.action,
        },
      ]);
      setChips([
        { emoji: "📅", label: "Book appointment", action: "book" },
        { emoji: "🏃", label: "Our services", action: "services" },
        { emoji: "🏠", label: "Main menu", action: "home" },
      ]);
    } catch {
      setMsgs((prev) => [
        ...prev,
        {
          isBot: true,
          text: `Sorry, I could not reach the smart assistant just now. You can still book online, browse services, or email ${EMAIL}.`,
        },
      ]);
      setChips([
        { emoji: "📅", label: "Book appointment", action: "book" },
        { emoji: "🏃", label: "Our services", action: "services" },
        { emoji: "📞", label: "Contact us", action: "contact" },
      ]);
    } finally {
      setSending(false);
    }
  }

  function tapLocation() {
    addBot(
      "We're based in Glasgow, UK and also offer online physiotherapy across the whole UK via secure video call.\n\nAppointments are available Monday–Saturday. No GP referral is required — you can self-refer directly.",
      BACK_CHIPS,
    );
  }

  function tapContact() {
    addBot(
      `You can reach us at:\n\n📧  ${EMAIL}\n\nOr book directly through the site and we'll be in touch to confirm your session.`,
      [
        {
          emoji: "📋",
          label: "Copy email",
          action: "copyEmail",
        },
        { emoji: "📅", label: "Book appointment", action: "book" },
        { emoji: "🏠", label: "Main menu", action: "home" },
      ],
    );
  }

  function tapCancellation() {
    addBot(
      `Please cancel at least 24 hours in advance to avoid a cancellation fee.\n\nYou can manage your bookings in your patient account, or contact us at ${EMAIL}.`,
      [
        { emoji: "👤", label: "My appointments", action: "appointments" },
        { emoji: "🏠", label: "Main menu", action: "home" },
      ],
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function addBot(text: string, nextChips: Chip[]) {
    setMsgs(prev => [...prev, { isBot: true, text }]);
    setChips(nextChips);
  }

  function addUser(label: string) {
    setMsgs(prev => [...prev, { isBot: false, text: label }]);
  }

  function onChipClick(chip: Chip) {
    if (chip.action === "ask" && chip.text) {
      void sendMessage(chip.text);
      return;
    }
    const silent = ["Copy email", "Main menu", "Back to services"];
    if (!silent.includes(chip.label)) addUser(chip.label);
    if (chip.action === "services") tapServices();
    if (chip.action === "pricing") tapPricing();
    if (chip.action === "insurance") tapInsurance();
    if (chip.action === "book") tapBook();
    if (chip.action === "location") tapLocation();
    if (chip.action === "contact") tapContact();
    if (chip.action === "cancellation") tapCancellation();
    if (chip.action === "home") tapHome();
    if (chip.action === "appointments") router.push("/patient/appointments");
    if (chip.action === "invoices") router.push("/patient/invoices");
    if (chip.action === "serviceDetail" && chip.text) tapServiceDetail(chip.label, chip.text);
    if (chip.action === "copyEmail") {
      navigator.clipboard.writeText(EMAIL).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Copied toast */}
      {copied && <div className="chat-toast">Email copied ✓</div>}

      {/* Floating trigger */}
      <button
        ref={triggerRef}
        className="chat-trigger"
        onClick={() =>
          setOpen(o => {
            if (!o) {
              trackGrowthEvent("chat_opened", { source: "widget" });
              track("chat_open", { source: "widget" });
            }
            return !o;
          })
        }
        aria-label={open ? "Close chat" : "Open chat assistant"}
      >
        <span className="chat-trigger-icon" aria-hidden="true">
          <svg
            width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            {open ? (
              <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </>
            ) : (
              <>
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                <path d="M8 12h.01" />
                <path d="M12 12h.01" />
                <path d="M16 12h.01" />
              </>
            )}
          </svg>
        </span>
        {!open && <span className="chat-trigger-label">Ask our physio assistant</span>}
      </button>

      {/* Drawer */}
      {open && (
        <div ref={drawerRef} className="chat-drawer" role="dialog" aria-modal="true" aria-label="PhysioOnClick chat assistant">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-avatar">P</div>
            <div>
              <div className="chat-header-eyebrow">Online physiotherapy across the UK</div>
              <div className="chat-header-title">PhysioOnClick Assistant</div>
              <div className="chat-header-status">
                <span className="chat-header-status-dot" />
                Smart help for services, booking, recovery and account questions
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages" role="log" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-message-row ${m.isBot ? "is-bot" : "is-user"}`}>
                {m.isBot && <div className="chat-message-avatar">P</div>}
                <div className={`chat-bubble ${m.isBot ? "is-bot" : "is-user"}`}>
                  {m.isBot ? <div className="chat-rich-text">{renderChatText(m.text)}</div> : m.text}
                  {m.action && (
                    <button
                      type="button"
                      className="chat-action"
                      onClick={() => router.push(m.action!.url)}
                    >
                      {m.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="chat-message-row is-bot">
                <div className="chat-message-avatar">P</div>
                <div className="chat-bubble is-bot chat-typing" aria-label="Assistant is typing">
                  <span className="chat-dot" />
                  <span className="chat-dot" />
                  <span className="chat-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="chat-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <label className="sr-only" htmlFor="chat-assistant-input">Ask the PhysioOnClick assistant</label>
            <input
              id="chat-assistant-input"
              value={input}
              maxLength={1000}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about services, pricing, exercises..."
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()}>
              Send
            </button>
          </form>

          {/* Chips */}
          <div className="chat-chips">
            {chips.map((c, i) => (
              <button className="chat-chip" key={i} onClick={() => onChipClick(c)}>
                <span>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
