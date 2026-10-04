"use client";

import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";
import { formatPersonName } from "@/lib/name-format";
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import Link from "next/link";
import { SkeletonRow } from "@/components/skeleton";

const CHAT_LOG_PAGE_SIZE = 10;

type ChatMessage = {
  role: "user" | "model";
  text: string;
  timestamp?: string;
  action?: { label: string; url: string };
};

type ChatSession = {
  sessionId: string;
  patientId: string;
  patientName?: string;
  sourceLabel: string;
  href: string;
  sortAt: number;
  messages: ChatMessage[];
  notes?: string[];
};

export function AdminChatLogs() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!db) return;

    async function load() {
      if (!db) return;
      // narrowing on the module-level `db` is lost inside the nested async callbacks below
      const database = db;
      try {
        const [historySnap, growthSnap] = await Promise.all([
          getDocs(query(collectionGroup(database, "chatSessions"), orderBy("updatedAt", "desc"), limit(100))),
          getDocs(query(collection(database, "growthEvents"), orderBy("createdAtIso", "desc"), limit(180))),
        ]);

        const patientIds = Array.from(
          new Set(historySnap.docs.map(sessionDoc => sessionDoc.ref.parent.parent?.id ?? ""))
        );
        const patientNameCache = new Map<string, string>();
        await Promise.all(
          patientIds.map(async patientId => {
            let patientName = patientId;
            try {
              const patientSnap = await getDoc(doc(database, "patients", patientId));
              if (patientSnap.exists()) patientName = formatPersonName(patientSnap.data().displayName as string | undefined, patientId);
            } catch {
              // non-fatal
            }
            patientNameCache.set(patientId, patientName);
          })
        );

        const savedChats: ChatSession[] = historySnap.docs.map(sessionDoc => {
          const patientId = sessionDoc.ref.parent.parent?.id ?? "";
          const data = sessionDoc.data();
          const updatedAt = data.updatedAt?.seconds ? data.updatedAt.seconds * 1000 : 0;

          return {
            sessionId: sessionDoc.id,
            patientId,
            patientName: formatPersonName(patientNameCache.get(patientId), patientId),
            sourceLabel: "Saved patient account chat",
            href: `/admin/chat-logs/${encodeURIComponent(`history:${patientId}:${sessionDoc.id}`)}`,
            sortAt: updatedAt,
            messages: data.messages ?? [],
            notes: [patientId ? `Patient ID: ${patientId}` : ""].filter(Boolean),
          };
        });

        const growthGroups = new Map<string, ChatSession>();
        growthSnap.docs.forEach(eventDoc => {
          const event = eventDoc.data();
          if (event.event !== "chat_message_sent" || typeof event.sessionId !== "string" || !event.sessionId) return;
          const createdAtIso = typeof event.createdAtIso === "string" ? event.createdAtIso : undefined;
          const sortAt = createdAtIso ? new Date(createdAtIso).getTime() : 0;
          const preview =
            typeof event.params?.message_preview === "string" && event.params.message_preview.trim()
              ? event.params.message_preview.trim()
              : "Question preview was not captured for this older chat event.";
          const existing = growthGroups.get(event.sessionId);
          const message: ChatMessage = { role: "user", text: preview, timestamp: createdAtIso };
          const intent =
            typeof event.params?.intent === "string" && event.params.intent
              ? event.params.intent.replaceAll("-", " ")
              : "general";

          if (existing) {
            existing.messages.push(message);
            existing.sortAt = Math.max(existing.sortAt, sortAt);
            return;
          }

          growthGroups.set(event.sessionId, {
            sessionId: event.sessionId,
            patientId: "",
            patientName: "Website assistant guest session",
            sourceLabel: "Growth tracked website chat",
            href: `/admin/chat-logs/${encodeURIComponent(`growth:${event.sessionId}`)}`,
            sortAt,
            messages: [message],
            notes: [`Intent: ${intent}`],
          });
        });

        const guestChats = Array.from(growthGroups.values()).map(session => ({
          ...session,
          messages: session.messages.sort(
            (a, b) => new Date(a.timestamp ?? 0).getTime() - new Date(b.timestamp ?? 0).getTime(),
          ),
        }));

        const results = [...savedChats, ...guestChats].sort((a, b) => b.sortAt - a.sortAt);
        setSessions(results);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = sessions.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.patientName?.toLowerCase().includes(q) ||
      s.sourceLabel.toLowerCase().includes(q) ||
      s.notes?.some(note => note.toLowerCase().includes(q)) ||
      s.messages.some(m => m.text.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / CHAT_LOG_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * CHAT_LOG_PAGE_SIZE;
  const visibleSessions = filtered.slice(pageStart, pageStart + CHAT_LOG_PAGE_SIZE);
  const pageEnd = Math.min(pageStart + CHAT_LOG_PAGE_SIZE, filtered.length);

  if (loading) return <SkeletonRow count={4} />;

  return (
    <div>
      <input
        className="input"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by patient name or message…"
        aria-label="Search chat sessions by patient name or message"
        style={{ marginBottom: 20 }}
      />

      {filtered.length === 0 ? (
        <p>No chat sessions found.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {visibleSessions.map(s => {
          const date = s.sortAt
            ? new Date(s.sortAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—";
          const preview = s.messages.find(m => m.role === "user")?.text ?? "—";

          return (
            <Link
              key={s.sessionId}
              href={s.href}
              style={{
                border: "1px solid var(--color-primary-light)",
                borderRadius: 12,
                overflow: "hidden",
                background: "white",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <div
                className="admin-chat-session-toggle"
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  gap: "var(--space-3)",
                  transition: "background-color 140ms ease",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                    {s.patientName}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--primary)", marginTop: 2, fontWeight: 700 }}>
                    {s.sourceLabel}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-secondary)",
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {preview}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{date}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-primary-dark)", marginTop: 2 }}>
                    {s.messages.length} messages
                  </div>
                </div>
                <span aria-hidden="true" style={{ color: "var(--color-primary-dark)", fontSize: 18 }}>›</span>
              </div>
            </Link>
          );
        })}
          </div>

          <div className="admin-pagination" aria-label="Chat log pagination">
            <span>
              Showing {pageStart + 1}-{pageEnd} of {filtered.length} chat session{filtered.length === 1 ? "" : "s"}
            </span>
            <div>
              <button
                type="button"
                onClick={() => setPage(value => Math.max(1, value - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <strong>Page {currentPage} of {totalPages}</strong>
              <button
                type="button"
                onClick={() => setPage(value => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Scoped hover affordance for session toggles — dashboard-table shares
          this pattern via a global rule; this list predates that, so it's
          local until a shared list-row hover class exists (see report). */}
      <style>{`
        .admin-chat-session-toggle:hover { background: var(--surface-alt) !important; }
      `}</style>
    </div>
  );
}
