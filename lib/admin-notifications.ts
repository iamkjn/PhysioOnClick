// lib/admin-notifications.ts
// Admin-facing counterpart to lib/notifications.ts: a live subscription to
// `adminNotifications` (written by the notifyAdminUpcomingSessions Cloud
// Function — see functions/src/index.ts) plus a best-effort web-push opt-in
// that stores a single FCM token on the `admin/config` singleton doc (there's
// only ever one admin account, per lib/admin-auth.ts, so no per-admin token
// list is needed).

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  limit,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, firebaseApp, firebaseConfigValues } from "@/lib/firebase";

export interface AdminNotification {
  id: string;
  bookingId: string;
  patientName: string;
  personId: string;
  sessionDate: Date | null;
  createdAt: Date | null;
  read: boolean;
}

function toAdminNotification(id: string, data: Record<string, unknown>): AdminNotification {
  const sessionTs = data.sessionDate as { toDate?: () => Date } | undefined;
  const createdTs = data.createdAt as { toDate?: () => Date } | undefined;
  return {
    id,
    bookingId: typeof data.bookingId === "string" ? data.bookingId : "",
    patientName: typeof data.patientName === "string" ? data.patientName : "Patient",
    personId: typeof data.personId === "string" ? data.personId : "",
    sessionDate: sessionTs?.toDate ? sessionTs.toDate() : null,
    createdAt: createdTs?.toDate ? createdTs.toDate() : null,
    read: data.read === true,
  };
}

// Live subscription to admin notifications, newest first. Returns the
// unsubscribe fn (a no-op when Firebase is unconfigured) so callers can clean
// up in a useEffect.
export function subscribeAdminNotifications(
  cb: (items: AdminNotification[]) => void
): () => void {
  if (!db) {
    cb([]);
    return () => {};
  }
  const q = query(
    collection(db, "adminNotifications"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => toAdminNotification(d.id, d.data() as Record<string, unknown>))),
    (err) => {
      console.error("admin notifications subscription failed", err);
      cb([]);
    }
  );
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, "adminNotifications", id), { read: true });
}

// Requests browser notification permission, registers the messaging service
// worker and stores the resulting FCM token on admin/config so the
// notifyAdminUpcomingSessions Cloud Function can push to it. Returns false
// (never throws) whenever push isn't available — unsupported browser, denied
// permission, or NEXT_PUBLIC_FIREBASE_VAPID_KEY isn't configured — since the
// in-app bell already works via the Firestore subscription above regardless.
export async function enableAdminPushNotifications(): Promise<boolean> {
  if (!firebaseApp || !db || typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("enableAdminPushNotifications: NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set");
    return false;
  }
  try {
    const { isSupported, getMessaging, getToken } = await import("firebase/messaging");
    if (!(await isSupported())) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const swParams = new URLSearchParams(firebaseConfigValues).toString();
    const swReg = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${swParams}`
    );

    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
    if (!token) return false;

    await setDoc(doc(db, "admin", "config"), { fcmToken: token }, { merge: true });
    return true;
  } catch (err) {
    console.error("enableAdminPushNotifications failed", err);
    return false;
  }
}
