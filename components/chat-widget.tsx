"use client";

import { useEffect, useRef, useState } from "react";

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
    text: "UK-wide digital physiotherapy via secure video call with tailored exercise plans, progress tracking and weekly review calls.\n\nOnline patients receive the same structured rehabilitation planning as in-person sessions.",
  },
];

const PRICING_TEXT =
  "In-person sessions (Glasgow):\n• Initial Assessment (45 min) — £65\n• Follow-Up Session (30 min) — £50\n• Extended Session (60 min) — £80\n\nOnline sessions (UK-wide):\n• Initial Online Assessment (60 min) — £50\n• Online Follow-Up (30 min) — £40\n\nPackages:\n• 4-Session Bundle — £180\n• 8-Session Bundle — £340\n\nNo GP referral required — you can self-refer.";

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
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

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
    window.location.href = "/book";
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
    if (chip.action === "appointments") window.location.href = "/patient/appointments";
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
      {copied && (
        <div style={{
          position: "fixed", bottom: 90, right: 24, zIndex: 10000,
          background: "#164E63", color: "white", fontSize: 13, fontWeight: 500,
          padding: "8px 16px", borderRadius: 20,
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          animation: "fadeIn 0.15s ease",
        }}>
          Email copied ✓
        </div>
      )}

      {/* Floating trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close chat" : "Open chat assistant"}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #0891B2, #0E7490)",
          border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(8,145,178,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: 22,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Drawer */}
      {open && (
        <div
          role="dialog"
          aria-label="PhysioOnClick chat assistant"
          style={{
            position: "fixed", bottom: 92, right: 24,
            width: 360, maxWidth: "calc(100vw - 48px)",
            maxHeight: "72vh",
            display: "flex", flexDirection: "column",
            background: "white", borderRadius: 18,
            boxShadow: "0 8px 48px rgba(0,0,0,0.16)",
            zIndex: 9998, overflow: "hidden",
            border: "1px solid #D8F3F9",
          }}
        >
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #0891B2, #0E7490)",
            padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>
              🛡️
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>
                PhysioOnClick Assistant
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 1, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
                Online · Always here to help
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 8px", background: "#F8FEFF" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.isBot ? "flex-start" : "flex-end",
                alignItems: "flex-end",
                gap: 8,
                marginBottom: 10,
              }}>
                {m.isBot && (
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "linear-gradient(135deg, #0891B2, #0E7490)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, flexShrink: 0, marginBottom: 2,
                  }}>🛡️</div>
                )}
                <div style={{
                  maxWidth: "78%",
                  padding: "10px 14px",
                  borderRadius: m.isBot ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                  background: m.isBot ? "white" : "linear-gradient(135deg, #0891B2, #0E7490)",
                  color: m.isBot ? "#164E63" : "white",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  boxShadow: m.isBot
                    ? "0 2px 8px rgba(0,0,0,0.07)"
                    : "0 2px 8px rgba(8,145,178,0.28)",
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Chips */}
          <div style={{
            padding: "10px 12px 14px",
            borderTop: "1px solid #E0F7FA",
            background: "white",
            display: "flex", flexWrap: "wrap", gap: 7,
          }}>
            {chips.map((c, i) => (
              <button
                key={i}
                onClick={() => onChipClick(c)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 12px",
                  borderRadius: 20,
                  border: "1.5px solid #A5F3FC",
                  background: "white",
                  color: "#164E63",
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                  boxShadow: "0 1px 4px rgba(8,145,178,0.1)",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = "#0891B2";
                  el.style.color = "white";
                  el.style.borderColor = "#0891B2";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = "white";
                  el.style.color = "#164E63";
                  el.style.borderColor = "#A5F3FC";
                }}
              >
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
