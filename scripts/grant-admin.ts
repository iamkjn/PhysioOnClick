/**
 * One-time script: grant admin role to a user by email.
 * Usage: npx tsx scripts/grant-admin.ts shivali@nayak.com
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS in env.
 *
 * Does two things:
 *   1. Sets custom claim  { admin: true }  on the Auth token  → web Firestore rules
 *   2. Writes  users/{uid}.role = "admin"  in Firestore       → mobile RootShell check
 */

import { readFileSync } from "node:fs";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function init() {
  if (getApps().length) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (raw) {
    initializeApp({ credential: cert(JSON.parse(raw)), projectId: "physioonclick" });
  } else if (path) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(path, "utf8"))), projectId: "physioonclick" });
  } else {
    throw new Error(
      "Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH before running this script."
    );
  }
}

async function grantAdmin(email: string) {
  init();
  const auth = getAuth();
  const db = getFirestore();

  // 1. Look up the user
  const user = await auth.getUserByEmail(email);
  console.log(`Found user: ${user.uid}  (${user.email})`);

  // 2. Set custom claim — this embeds { admin: true } in every JWT the user receives.
  //    The user must sign out and back in (or force-refresh the token) for it to take effect.
  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log("✓ Custom claim  { admin: true }  set on Auth token");

  // 3. Write role into Firestore users/{uid} — the Flutter mobile app reads this.
  await db.collection("users").doc(user.uid).set(
    { role: "admin", email: user.email, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
  console.log("✓ Firestore  users/" + user.uid + "  → role: 'admin'");

  console.log("\nDone. Ask the user to sign out and sign back in so the new token is issued.");
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/grant-admin.ts <email>");
  process.exit(1);
}

grantAdmin(email).catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
