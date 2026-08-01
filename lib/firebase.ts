import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

// Prod-project (physioonclick-prod) fallback, used only when the NEXT_PUBLIC_*
// build-time vars are absent. Dev runs override these via .env.local; the prod
// build sets them via .env.prod (same values as here).
const providedFirebaseConfig = {
  apiKey: "AIzaSyB_CW6l9VKMCfcu3HHCVNtcy_BGU2TFQ7k",
  authDomain: "physioonclick-prod.firebaseapp.com",
  projectId: "physioonclick-prod",
  storageBucket: "physioonclick-prod.firebasestorage.app",
  messagingSenderId: "816942766820",
  appId: "1:816942766820:web:a65bf3927bb1d65f1eaaf1"
};

// measurementId (the "G-XXXXXXX" id from Firebase console -> Project settings)
// is only used by Firebase Analytics and is optional. It is a BUILD-time var on
// this stack (NEXT_PUBLIC_* are inlined at build; setting it at runtime on the
// Worker does nothing). It must NOT gate firebaseEnabled -- Auth/Firestore/
// Storage work fine without it -- so it is spread into the config only when set,
// and analytics no-ops when it is empty (see lib/analytics.ts).
export const firebaseMeasurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || providedFirebaseConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || providedFirebaseConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || providedFirebaseConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || providedFirebaseConfig.storageBucket,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || providedFirebaseConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || providedFirebaseConfig.appId,
  // Only include when set so the empty-string fallback can't flip firebaseEnabled false.
  ...(firebaseMeasurementId ? { measurementId: firebaseMeasurementId } : {})
};

export const firebaseEnabled = Object.values(firebaseConfig).every(Boolean);

export function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseEnabled) {
    return null;
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const firebaseApp = getFirebaseApp();
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;

// Route the client SDK to the local Firebase Emulator Suite instead of the real
// project when developing locally. Guarded against Next.js Fast Refresh re-running
// this module and trying to connect twice, which throws.
declare global {
  // eslint-disable-next-line no-var
  var __firebaseEmulatorsConnected: boolean | undefined;
}

if (
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
  !globalThis.__firebaseEmulatorsConnected &&
  auth &&
  db &&
  storage
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  globalThis.__firebaseEmulatorsConnected = true;
}
