"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { subscribeNotifications } from "@/lib/notifications";
import { BellIcon } from "@/components/icons";

// Header bell that shows the signed-in patient's unread notification count and
// links to the notifications screen. Renders nothing when signed out.
export function NotificationBell() {
  const [uid, setUid] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => setUid(user ? user.uid : null));
  }, []);

  useEffect(() => {
    if (!uid) {
      setUnread(0);
      return;
    }
    return subscribeNotifications(uid, (items) => setUnread(items.filter((n) => !n.read).length));
  }, [uid]);

  if (!uid) return null;

  return (
    <Link
      href="/patient/notifications"
      className="notification-bell"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
    >
      <span aria-hidden="true" className="notification-bell-icon"><BellIcon /></span>
      {unread > 0 && (
        <span className="notification-bell-badge" aria-hidden="true">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
