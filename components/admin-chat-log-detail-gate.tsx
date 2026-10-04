"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { isAdminUser } from "@/lib/admin-auth";
import { auth, db } from "@/lib/firebase";
import { formatPersonName } from "@/lib/name-format";
import { AdminShell } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-sign-in";
import { SkeletonRow, SkeletonStatGrid } from "@/components/skeleton";

type ChatMessage = {
  role: "user" | "model";
  text: string;
  timestamp?: string;
  action?: { label?: string; url?: string };
};

type ChatDetail = {
  title: string;
  subtitle: string;
  notes: string[];
  messages: ChatMessage[];
};

function formatTime(value?: string) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLabel(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseThreadId(threadId: string) {
  const decoded = decodeURIComponent(threadId);
  const [kind, ...parts] = decoded.split(":");
  if (kind === "history" && parts.length >= 2) {
    return { kind, patientId: parts[0], sessionId: parts.slice(1).join(":") };
  }
  if (kind === "growth" && parts.length >= 1) {
    return { kind, sessionId: parts.join(":") };
  }
  return { kind: "unknown", sessionId: decoded };
}

export function AdminChatLogDetailGate({ threadId }: { threadId: string }) {
  const [status, setStatus] = useState<"loading" | "out" | "forbidden" | "in">("loading");

  useEffect(() => {
    if (!auth) {
      setStatus("out");
      return;
    }
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("out");
        return;
      }
      try {
        const isAdmin = await isAdminUser(user);
        setStatus(isAdmin ? "in" : "forbidden");
      } catch {
        setStatus("out");
      }
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="admin-gate-screen admin-gate-screen-wide">
        <div className="admin-gate-card admin-gate-card-wide">
          <div className="admin-gate-icon" />
          <SkeletonStatGrid count={4} />
        </div>
      </div>
    );
  }

  if (status === "out") return <AdminSignIn />;

  if (status === "forbidden") {
    return (
      <div className="admin-gate-screen">
        <div className="admin-gate-card admin-gate-card-centered">
          <p className="admin-gate-message">
            This account doesn&apos;t have admin access to PhysioOnClick.
          </p>
          <button onClick={() => auth && signOut(auth)} className="admin-gate-button">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminShell backHref="/admin" backLabel="← Dashboard">
      <main className="admin-standard-page">
        <AdminChatLogDetail threadId={threadId} />
      </main>
    </AdminShell>
  );
}

function AdminChatLogDetail({ threadId }: { threadId: string }) {
  const [detail, setDetail] = useState<ChatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const parsed = useMemo(() => parseThreadId(threadId), [threadId]);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      setError("Database is not available.");
      return;
    }

    async function load() {
      if (!db) return;
      const database = db;
      setLoading(true);
      setError("");

      try {
        if (parsed.kind === "history" && "patientId" in parsed && parsed.patientId) {
          const [sessionSnap, patientSnap] = await Promise.all([
            getDoc(doc(database, "patients", parsed.patientId, "chatSessions", parsed.sessionId)),
            getDoc(doc(database, "patients", parsed.patientId)),
          ]);

          if (!sessionSnap.exists()) throw new Error("Chat session was not found.");
          const session = sessionSnap.data();
          const patientName = patientSnap.exists()
            ? formatPersonName(patientSnap.data().displayName as string | undefined, parsed.patientId)
            : parsed.patientId;
          const messages = Array.isArray(session.messages) ? (session.messages as ChatMessage[]) : [];

          setDetail({
            title: patientName,
            subtitle: `Saved patient chat · Session ${parsed.sessionId.slice(0, 12)}`,
            notes: [
              `${messages.length} total message${messages.length === 1 ? "" : "s"}`,
              `Patient ID: ${parsed.patientId}`,
            ],
            messages,
          });
          return;
        }

        if (parsed.kind === "growth") {
          const eventsQuery = query(collection(database, "growthEvents"), where("sessionId", "==", parsed.sessionId), limit(80));
          const snap = await getDocs(eventsQuery);
          const events = snap.docs
            .map((eventDoc) => eventDoc.data())
            .filter((event) => event.event === "chat_message_sent")
            .sort((a, b) => new Date(String(a.createdAtIso ?? 0)).getTime() - new Date(String(b.createdAtIso ?? 0)).getTime());

          const messages: ChatMessage[] = events.map((event) => ({
            role: "user",
            text:
              typeof event.params?.message_preview === "string"
                ? event.params.message_preview
                : "Question preview was not captured for this older chat event.",
            timestamp: typeof event.createdAtIso === "string" ? event.createdAtIso : undefined,
          }));
          const latest = events[events.length - 1];

          setDetail({
            title: "Website assistant guest session",
            subtitle: `Growth tracked chat · Session ${parsed.sessionId.slice(0, 12)}`,
            notes: [
              "Only patient questions are available for guest website assistant sessions.",
              latest?.params?.intent ? `Intent: ${formatLabel(String(latest.params.intent))}` : "Intent: General",
            ],
            messages,
          });
          return;
        }

        throw new Error("Unknown chat detail link.");
      } catch (loadError) {
        setDetail(null);
        setError(loadError instanceof Error ? loadError.message : "Chat detail could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [parsed]);

  if (loading) return <SkeletonRow count={5} />;

  if (error || !detail) {
    return (
      <section className="admin-chat-detail-page">
        <div className="admin-chat-detail-page-head">
          <span className="dashboard-eyebrow">Patient assistant conversation</span>
          <h1>Chat detail unavailable</h1>
          <p>{error || "This chat session could not be found."}</p>
          <Link className="button button-secondary" href="/admin">
            Back to Growth
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-chat-detail-page">
      <div className="admin-chat-detail-page-head">
        <div>
          <span className="dashboard-eyebrow">Patient assistant conversation</span>
          <h1>{detail.title}</h1>
          <p>{detail.subtitle}</p>
        </div>
        <Link className="button button-secondary" href="/admin">
          Back to Growth
        </Link>
      </div>

      <div className="admin-chat-detail-meta">
        {detail.notes.map((note) => (
          <span key={note}>{note}</span>
        ))}
      </div>

      <div className="admin-chat-detail-messages admin-chat-detail-messages--page">
        {detail.messages.length ? (
          detail.messages.map((message, index) => (
            <article
              key={`${message.timestamp ?? "message"}-${index}`}
              className={message.role === "user" ? "is-user" : "is-model"}
            >
              <span>{message.role === "user" ? "Patient" : "PhysioOnClick assistant"}</span>
              <p>{message.text}</p>
              {message.action?.url ? (
                <small>
                  Action: {message.action.label ?? "Open link"} ({message.action.url})
                </small>
              ) : null}
              <small>{formatTime(message.timestamp)}</small>
            </article>
          ))
        ) : (
          <p className="muted">No messages were saved for this session.</p>
        )}
      </div>
    </section>
  );
}
