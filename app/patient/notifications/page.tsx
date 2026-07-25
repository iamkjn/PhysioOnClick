"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { EmptyState } from "@/components/empty-state";
import { SkeletonRow } from "@/components/skeleton";
import { subscribeNotifications, markAllRead, type AppNotification, type NotificationKind } from "@/lib/notifications";

const KIND_ICON: Record<NotificationKind, string> = {
  appointment: "📅",
  message: "💬",
  milestone: "🏆",
  adherence: "📉",
  system: "🔔",
};

function timeAgo(date: Date | null): string {
  if (!date) return "";
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default function NotificationsPage() {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setUid(null);
      return;
    }
    return onAuthStateChanged(auth, (user) => setUid(user ? user.uid : null));
  }, []);

  useEffect(() => {
    if (uid === null) router.push("/patient");
  }, [uid, router]);

  useEffect(() => {
    if (!uid) return;
    return subscribeNotifications(uid, setItems);
  }, [uid]);

  // Opening the page clears the unread badge: mark the first loaded batch read
  // once. The header bell listens to the same collection, so it updates live.
  const autoMarked = useRef(false);
  useEffect(() => {
    if (!uid || items === null || autoMarked.current) return;
    // Trip on the first loaded batch so only what was present when the page
    // opened gets cleared; notifications that arrive live afterward stay unread.
    autoMarked.current = true;
    if (items.some((n) => !n.read)) void markAllRead(uid, items);
  }, [uid, items]);

  if (uid === undefined || (uid && items === null)) {
    return (
      <div className="site-shell patient-page">
        <section className="page-section stack">
          <SkeletonRow count={4} />
        </section>
      </div>
    );
  }

  if (uid === null) return null;

  const unreadCount = (items ?? []).filter((n) => !n.read).length;

  return (
    <div className="site-shell patient-page">
      <div className="notifications-head">
        <div>
          <span className="eyebrow">Notifications</span>
          <h1 style={{ margin: "var(--space-1) 0 0", color: "var(--color-text-primary)" }}>Your updates</h1>
        </div>
        <button
          type="button"
          className="button secondary small"
          disabled={unreadCount === 0}
          onClick={() => void markAllRead(uid, items ?? [])}
          style={{ opacity: unreadCount === 0 ? 0.5 : 1 }}
        >
          Mark all read
        </button>
      </div>

      {(items ?? []).length === 0 ? (
        <EmptyState
          illustration="chat"
          title="No notifications yet"
          body="Appointment reminders, milestones and messages from your physio will appear here."
        />
      ) : (
        <div className="notification-list">
          {(items ?? []).map((n) => (
            <div key={n.id} className={`notification-item${n.read ? "" : " unread"}`}>
              <span className="notification-item-icon" aria-hidden="true">{KIND_ICON[n.kind] ?? "🔔"}</span>
              <div className="notification-item-body">
                <div className="notification-item-head">
                  <strong>{n.title}</strong>
                  <span className="notification-item-time">{timeAgo(n.createdAt)}</span>
                </div>
                <p>{n.body}</p>
              </div>
              {!n.read && <span className="notification-item-dot" aria-label="Unread" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
