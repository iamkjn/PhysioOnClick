// public/firebase-messaging-sw.js
// Background-message handler for the admin push opt-in (lib/admin-notifications.ts).
// A static file in public/ can't read Next's build-time NEXT_PUBLIC_FIREBASE_*
// env vars, so the page passes the Firebase config as query params when it
// registers this worker (`/firebase-messaging-sw.js?apiKey=...&...`).
importScripts("https://www.gstatic.com/firebasejs/11.5.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.5.0/firebase-messaging-compat.js");

const params = new URLSearchParams(self.location.search);

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  self.registration.showNotification(notification.title || "PhysioOnClick", {
    body: notification.body || "",
    icon: "/icon-192.png",
    data: payload.data || {},
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const bookingId = event.notification.data && event.notification.data.bookingId;
  const url = bookingId ? `/admin/session/${bookingId}` : "/admin/sessions";
  event.waitUntil(self.clients.openWindow(url));
});
