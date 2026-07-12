import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const providedFirebaseConfig = {
  apiKey: "AIzaSyB2W4dHgl3mM8QEY5XYiQcSt9usFV35jSw",
  authDomain: "physioonclick.firebaseapp.com",
  projectId: "physioonclick",
  storageBucket: "physioonclick.firebasestorage.app",
  messagingSenderId: "119591358761",
  appId: "1:119591358761:web:78643d985cc47c56baa738"
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || providedFirebaseConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || providedFirebaseConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || providedFirebaseConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || providedFirebaseConfig.storageBucket,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || providedFirebaseConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || providedFirebaseConfig.appId
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
