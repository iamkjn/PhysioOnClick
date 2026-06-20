"use client";

import { useEffect, useRef, useState } from "react";

import { auth } from "@/lib/firebase";

type ChatMessage = {
  role: "user" | "model";
  text: string;
  action?: { type: string; label: string; url: string };
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "model",
          text: "Hi! I'm the PhysioOnClick assistant. I can help with services, pricing, appointments, or general questions. How can I help?",
        },
      ]);
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    setMessages(prev => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, sessionId, history }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { reply: string; sessionId: string; action?: ChatMessage["action"] };

      setSessionId(data.sessionId);
      setMessages(prev => [...prev, { role: "model", text: data.reply, action: data.action }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "model", text: "Sorry, something went wrong. Please try again or contact us directly." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close chat" : "Open chat assistant"}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0891B2, #0E7490)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(8,145,178,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 22,
          transition: "transform 0.15s ease",
        }}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Drawer */}
      {open && (
        <div
          role="dialog"
          aria-label="PhysioOnClick chat assistant"
          style={{
            position: "fixed",
            bottom: 92,
            right: 24,
            width: 360,
            maxWidth: "calc(100vw - 48px)",
            maxHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            background: "white",
            borderRadius: 16,
            boxShadow: "0 8px 48px rgba(0,0,0,0.16)",
            zIndex: 9998,
            overflow: "hidden",
            border: "1px solid #D8F3F9",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #0891B2, #0E7490)",
              padding: "14px 18px",
              color: "white",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>PhysioOnClick Assistant</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              Ask about services, pricing or your appointments
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 4px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "82%",
                      padding: "10px 14px",
                      borderRadius:
                        m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: m.role === "user" ? "#0891B2" : "#F0F9FB",
                      color: m.role === "user" ? "white" : "#10233A",
                      fontSize: 14,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
                {m.action && (
                  <div style={{ display: "flex", marginTop: 6 }}>
                    <a
                      href={m.action.url}
                      style={{
                        display: "inline-block",
                        padding: "8px 16px",
                        background: "linear-gradient(135deg, #0891B2, #0E7490)",
                        color: "white",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      {m.action.label} →
                    </a>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 5, padding: "6px 2px 10px" }}>
                <span className="chat-dot" />
                <span className="chat-dot" />
                <span className="chat-dot" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              borderTop: "1px solid #E8F4F7",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type a message…"
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 20,
                border: "1.5px solid #C8E8F0",
                fontSize: 14,
                outline: "none",
                background: "#FAFEFF",
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background:
                  loading || !input.trim()
                    ? "#C8E8F0"
                    : "linear-gradient(135deg, #0891B2, #0E7490)",
                border: "none",
                cursor: loading || !input.trim() ? "default" : "pointer",
                color: "white",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-label="Send"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
