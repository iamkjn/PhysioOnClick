// scripts/emulator-smoke-test.ts
// Verifies the Firebase Local Emulator Suite is actually working end-to-end —
// not a substitute for real tests, just a fast "is the environment sane" check
// before relying on it for manual testing.
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

async function main() {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.error(
      "FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST are not set.\n" +
        "Refusing to run — this script must never touch the real project.\n" +
        "Make sure .env.local has the emulator vars set and `npm run emulators` is running."
    );
    process.exit(1);
  }

  if (!getApps().length) {
    initializeApp({ projectId: "physioonclick" });
  }

  console.log("Testing Firestore emulator...");
  const db = getFirestore();
  const docRef = db.collection("_smoke_test").doc("ping");
  const marker = `smoke-${Date.now()}`;
  await docRef.set({ marker });
  const snap = await docRef.get();
  if (!snap.exists || snap.data()?.marker !== marker) {
    throw new Error("Firestore round-trip failed: wrote a value, read back something different (or nothing).");
  }
  await docRef.delete();
  console.log("  Firestore emulator OK (write, read, delete all confirmed).");

  console.log("Testing Auth emulator...");
  const auth = getAuth();
  const testEmail = `smoke-test-${Date.now()}@example.com`;
  const user = await auth.createUser({ email: testEmail, password: "smoke-test-password-123" });
  const fetched = await auth.getUser(user.uid);
  if (fetched.email !== testEmail) {
    throw new Error("Auth round-trip failed: created a user, fetched a different email back.");
  }
  await auth.deleteUser(user.uid);
  console.log("  Auth emulator OK (create, fetch, delete all confirmed).");

  console.log("\nAll emulator checks passed. Safe to develop against.");
}

main().catch((err) => {
  console.error("\nEmulator smoke test FAILED:", err);
  process.exit(1);
});
