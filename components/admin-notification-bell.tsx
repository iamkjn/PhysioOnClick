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

  const unread = items.filter((n) => !n.read).length;

  async function handleEnablePush() {
    setPushState("requesting");
    const ok = await enableAdminPushNotifications();
    setPushState(ok ? "enabled" : "unavailable");
  }

  async function handleSelect(n: AdminNotification) {
    const isPast = n.sessionDate ? n.sessionDate.getTime() < Date.now() : false;
    if (isPast) return;
    if (!n.read) await markAdminNotificationRead(n.id);
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
        onClick={() => setOpen((o) => !o)}
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
                      className={`admin-notification-item${n.read ? "" : " is-unread"}${isPast ? " is-past" : ""}`}
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
