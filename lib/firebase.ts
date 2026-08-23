import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

// measurementId (the "G-XXXXXXX" id from Firebase console -> Project settings)
// is only used by Firebase Analytics and is optional. It is a BUILD-time var on
// this stack (NEXT_PUBLIC_* are inlined at build; setting it at runtime on the
// Worker does nothing). It must NOT gate firebaseEnabled -- Auth/Firestore/
// Storage work fine without it -- so it is spread into the config only when set,
// and analytics no-ops when it is empty (see lib/analytics.ts).
export const firebaseMeasurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "";

// No hardcoded fallback: a build that's missing NEXT_PUBLIC_FIREBASE_* env
// vars must fail safe (firebaseEnabled=false, everything below becomes null)
// rather than silently defaulting to real production credentials — a
// misconfigured dev/preview build talking to prod data by accident is worse
// than one that just doesn't work. This also means there's no live API key
// literal in source for secret scanners to (correctly, if harmlessly — see
// firebaseConfig.apiKey's own restrictions in Google Cloud Console) flag.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
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
