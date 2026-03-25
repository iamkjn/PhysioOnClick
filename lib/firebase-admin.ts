import { readFileSync } from "node:fs";

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function ensureAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "physioonclick";
  const storageBucket = process.env.FIREBASE_ADMIN_STORAGE_BUCKET || "physioonclick.firebasestorage.app";

  if (rawServiceAccount) {
    return initializeApp({
      credential: cert(JSON.parse(rawServiceAccount)),
      projectId,
      storageBucket
    });
  }

  if (serviceAccountPath) {
    return initializeApp({
      credential: cert(JSON.parse(readFileSync(serviceAccountPath, "utf8"))),
      projectId,
      storageBucket
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
    storageBucket
  });
}

export function getAdminDb() {
  try {
    ensureAdminApp();
    return getFirestore();
  } catch {
    return null;
  }
}
