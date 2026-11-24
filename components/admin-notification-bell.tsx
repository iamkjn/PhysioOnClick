"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  subscribeAdminNotifications,
  markAdminNotificationRead,
  enableAdminPushNotifications,
  type AdminNotification,
} from "@/lib/admin-notifications";
import { BellIcon } from "@/components/icons";

// Mirrors components/notification-bell.tsx (the patient-facing bell) for the
// admin side: a live unread-count badge fed by adminNotifications (written by
// the notifyAdminUpcomingSessions Cloud Function), with a dropdown panel and
// a one-off "enable push" affordance. Mounted in AdminShell so it's visible
// across every /admin/* route.
export function AdminNotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);
  // Ids that were unread when the panel was last opened: they keep their
  // "new" highlight for that viewing even though they're marked read on open.
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
  // Ids marked read locally, so the badge clears instantly instead of waiting
  // for the Firestore round-trip.
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  const [pushState, setPushState] = useState<"idle" | "requesting" | "enabled" | "unavailable">("idle");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeAdminNotifications(setItems), []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const unreadItems = items.filter((n) => !n.read && !seenIds.has(n.id));
  const unread = unreadItems.length;

  // Opening the panel counts as having seen every notification in it (past
  // sessions included, which can't be clicked), so the badge resets to 0.
  function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const ids = unreadItems.map((n) => n.id);
    setFreshIds(new Set(ids));
    if (ids.length > 0) {
      setSeenIds((prev) => new Set([...prev, ...ids]));
      for (const id of ids) {
        markAdminNotificationRead(id).catch((err) =>
          console.error("mark admin notification read failed", err)
        );
      }
    }
    setOpen(true);
  }

  async function handleEnablePush() {
    setPushState("requesting");
    const ok = await enableAdminPushNotifications();
    setPushState(ok ? "enabled" : "unavailable");
  }

  async function handleSelect(n: AdminNotification) {
    const isPast = n.sessionDate ? n.sessionDate.getTime() < Date.now() : false;
    if (isPast) return;
    if (!n.read && !seenIds.has(n.id)) await markAdminNotificationRead(n.id);
    setOpen(false);
    router.push(`/admin/session/${n.bookingId}#self-assessment`);
  }

  return (
    <div className="admin-notification-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notification-bell admin-notification-bell"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        onClick={handleToggle}
      >
        <span aria-hidden="true" className="notification-bell-icon"><BellIcon /></span>
        {unread > 0 && (
          <span className="notification-bell-badge" aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="admin-notification-panel" role="menu">
          <div className="admin-notification-panel-head">
            <strong>Upcoming sessions</strong>
            {pushState !== "enabled" && (
              <button
                type="button"
                className="admin-notification-push-btn"
                disabled={pushState === "requesting"}
                onClick={() => void handleEnablePush()}
              >
                {pushState === "requesting"
                  ? "Requesting…"
                  : pushState === "unavailable"
                    ? "Push unavailable"
                    : "Enable push"}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="admin-notification-empty">No notifications yet.</p>
          ) : (
            <ul className="admin-notification-list">
              {items.map((n) => {
                const isPast = n.sessionDate ? n.sessionDate.getTime() < Date.now() : false;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`admin-notification-item${freshIds.has(n.id) ? " is-unread" : ""}${isPast ? " is-past" : ""}`}
                      disabled={isPast}
                      onClick={() => void handleSelect(n)}
                    >
                      <span className="admin-notification-item-title">{n.patientName}</span>
                      <span className="admin-notification-item-meta">
                        {n.sessionDate
                          ? n.sessionDate.toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Session time unknown"}
                        {isPast ? " · past" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
