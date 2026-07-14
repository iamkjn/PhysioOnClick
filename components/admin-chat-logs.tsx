"use client";

import { useEffect, useState } from "react";

import { db } from "@/lib/firebase";
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { SkeletonRow } from "@/components/skeleton";

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
  updatedAt?: { seconds: number };
  messages: ChatMessage[];
};

export function AdminChatLogs() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    async function load() {
      if (!db) return;
      try {
        const q = query(collectionGroup(db, "chatSessions"), orderBy("updatedAt", "desc"));
        const snap = await getDocs(q);

        const results: ChatSession[] = [];

        for (const sessionDoc of snap.docs) {
          const patientId = sessionDoc.ref.parent.parent?.id ?? "";
          const data = sessionDoc.data();

          let patientName = patientId;
          try {
            const patientSnap = await getDoc(doc(db, "patients", patientId));
            if (patientSnap.exists()) patientName = patientSnap.data().displayName ?? patientId;
          } catch {
            // non-fatal
          }

          results.push({
            sessionId: sessionDoc.id,
            patientId,
            patientName,
            updatedAt: data.updatedAt,
            messages: data.messages ?? [],
          });
        }

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
      s.messages.some(m => m.text.toLowerCase().includes(q))
    );
  });

  if (loading) return <SkeletonRow count={4} />;

  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by patient name or message…"
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          border: "1.5px solid #C8E8F0",
          fontSize: 14,
          marginBottom: 20,
          boxSizing: "border-box",
        }}
      />

      {filtered.length === 0 ? (
        <p>No chat sessions found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(s => {
          const date = s.updatedAt
            ? new Date(s.updatedAt.seconds * 1000).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—";
          const preview = s.messages.find(m => m.role === "user")?.text ?? "—";
          const isOpen = expanded === s.sessionId;

          return (
            <div
              key={s.sessionId}
              style={{
                border: "1px solid #D8F3F9",
                borderRadius: 12,
                overflow: "hidden",
                background: "white",
              }}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : s.sessionId)}
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
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#10233A" }}>
                    {s.patientName}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#5E7A84",
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
                  <div style={{ fontSize: 12, color: "#5E7A84" }}>{date}</div>
                  <div style={{ fontSize: 12, color: "#0891B2", marginTop: 2 }}>
                    {s.messages.length} messages
                  </div>
                </div>
                <span style={{ color: "#0891B2", fontSize: 18 }}>{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div style={{ borderTop: "1px solid #E8F4F7", padding: "14px 18px" }}>
                  {s.messages.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 10,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: m.role === "user" ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "8px 12px",
                          borderRadius:
                            m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                          background: m.role === "user" ? "#0891B2" : "#F0F9FB",
                          color: m.role === "user" ? "white" : "#10233A",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        {m.text}
                      </div>
                      {m.action && (
                        <div style={{ marginTop: 4, fontSize: 12, color: "#0891B2" }}>
                          → {m.action.label} ({m.action.url})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
