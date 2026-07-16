"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

type Msg = { isBot: boolean; text: string };
type ChipAction =
  | "services"
  | "pricing"
  | "book"
  | "location"
  | "contact"
  | "cancellation"
  | "home"
  | "copyEmail"
  | "appointments"
  | "serviceDetail";
type Chip = { emoji: string; label: string; action: ChipAction; text?: string };

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

const PRICING_TEXT =
  "Online sessions (UK-wide):\n• Initial Online Assessment (60 min) — £50\n• Online Follow-Up (30 min) — £40\n\nPackages:\n• 4-Session Bundle — £180\n• 8-Session Bundle — £340\n\nNo GP referral required — you can self-refer.";

const GREETING =
  "Hi! I'm your PhysioOnClick assistant 👋\n\nHow can I help you today?";

const HOME_CHIPS: Chip[] = [
  { emoji: "🏃", label: "Our services", action: "services" },
  { emoji: "💰", label: "Pricing", action: "pricing" },
  { emoji: "📅", label: "Book appointment", action: "book" },
  { emoji: "📍", label: "Location", action: "location" },
  { emoji: "📞", label: "Contact us", action: "contact" },
  { emoji: "❌", label: "Cancellation policy", action: "cancellation" },
];

const BACK_CHIPS: Chip[] = [
  { emoji: "📅", label: "Book appointment", action: "book" },
  { emoji: "🏠", label: "Main menu", action: "home" },
];

// ─── Widget ───────────────────────────────────────────────────────────────────

export function ChatWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
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

  function tapBook() {
    router.push("/book");
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
    const silent = ["Copy email", "Main menu", "Back to services"];
    if (!silent.includes(chip.label)) addUser(chip.label);
    if (chip.action === "services") tapServices();
    if (chip.action === "pricing") tapPricing();
    if (chip.action === "book") tapBook();
    if (chip.action === "location") tapLocation();
    if (chip.action === "contact") tapContact();
    if (chip.action === "cancellation") tapCancellation();
    if (chip.action === "home") tapHome();
    if (chip.action === "appointments") router.push("/patient/appointments");
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
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close chat" : "Open chat assistant"}
      >
        <svg
          width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          {open ? (
            <>
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </>
          ) : (
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          )}
        </svg>
      </button>

      {/* Drawer */}
      {open && (
        <div ref={drawerRef} className="chat-drawer" role="dialog" aria-modal="true" aria-label="PhysioOnClick chat assistant">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-avatar">🛡️</div>
            <div>
              <div className="chat-header-title">PhysioOnClick Assistant</div>
              <div className="chat-header-status">
                <span className="chat-header-status-dot" />
                Online · Always here to help
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages" role="log" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-message-row ${m.isBot ? "is-bot" : "is-user"}`}>
                {m.isBot && <div className="chat-message-avatar">🛡️</div>}
                <div className={`chat-bubble ${m.isBot ? "is-bot" : "is-user"}`}>{m.text}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

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
