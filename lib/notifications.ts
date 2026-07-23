import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type NotificationKind =
  | "appointment"
  | "message"
  | "milestone"
  | "adherence"
  | "system";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  read: boolean;
  createdAt: Date | null;
}

function toNotification(id: string, data: Record<string, unknown>): AppNotification {
  const ts = data.createdAt as { toDate?: () => Date } | undefined;
  return {
    id,
    title: typeof data.title === "string" ? data.title : "Notification",
    body: typeof data.body === "string" ? data.body : "",
    kind: (data.kind as NotificationKind) ?? "system",
    read: data.read === true,
    createdAt: ts?.toDate ? ts.toDate() : null,
  };
}

// Live subscription to a patient's notifications, newest first. Returns the
// unsubscribe fn (a no-op when Firebase is unconfigured) so callers can clean
// up in a useEffect.
export function subscribeNotifications(
  uid: string,
  cb: (items: AppNotification[]) => void
): () => void {
  if (!db) {
    cb([]);
    return () => {};
  }
  const q = query(
    collection(db, "patients", uid, "notifications"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => toNotification(d.id, d.data() as Record<string, unknown>))),
    (err) => {
      console.error("notifications subscription failed", err);
      cb([]);
    }
  );
}

// Marks every currently-unread notification as read in a single batch. No-ops
// when there's nothing to update so it's cheap to call from a button.
export async function markAllRead(uid: string, items: AppNotification[]): Promise<void> {
  if (!db) return;
  const unread = items.filter((n) => !n.read);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  for (const n of unread) {
    batch.update(doc(db, "patients", uid, "notifications", n.id), { read: true });
  }
  await batch.commit();
}
