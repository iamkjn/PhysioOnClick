/**
 * Seed a full demo dataset for ONE real signed-in account so the patient portal
 * has something to show: the recovery charts (pain / adherence / streak), My
 * Appointments, and the notifications screen.
 *
 * Run it AFTER the owner has signed in once (so the auth account exists),
 * identifying the account by email or uid:
 *
 *   npx tsx --env-file=.env.local scripts/seed-demo-user.ts --email=hello@physioonclick.co.uk
 *   npx tsx --env-file=.env.local scripts/seed-demo-user.ts --uid=<authUid>
 *
 * Self-contained: writes the recovery subcollections directly (this branch's
 * seed-firestore.ts has no recovery target). Idempotent — every document has a
 * fixed id / date-key and is written with merge, and all dates are relative to
 * run time so the demo never goes stale.
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON (or FIREBASE_SERVICE_ACCOUNT_PATH).
 */

import { readFileSync } from "node:fs";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function init() {
  if (getApps().length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (raw) {
    initializeApp({ credential: cert(JSON.parse(raw)), projectId: "physioonclick" });
  } else if (path) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(path, "utf8"))), projectId: "physioonclick" });
  } else {
    throw new Error("Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH first.");
  }
}

// The four exercise ids the web "Your exercises" checklist maps against
// (lib/site-data.ts). Using these lights the checklist up.
const EXERCISE_IDS = ["ex-1", "ex-2", "ex-3", "ex-4"] as const;
// Days of recovery history to write. The most recent RECENT_STREAK days are a
// clean completed run so the streak + adherence cards read impressively.
const RECOVERY_DAYS = 21;
const RECENT_STREAK = 14;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local (not UTC) YYYY-MM-DD, matching lib/recovery.ts localDateKey. */
function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A date `daysAgo` before today, at a fixed local time. */
function daysAgo(n: number, hour = 9, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function resolveUid(email: string | null, uid: string | null): Promise<{ uid: string; name: string }> {
  if (uid) {
    const user = await getAuth().getUser(uid).catch(() => null);
    return { uid, name: user?.displayName || user?.email || "Demo Patient" };
  }
  if (email) {
    const user = await getAuth().getUserByEmail(email);
    return { uid: user.uid, name: user.displayName || user.email || "Demo Patient" };
  }
  throw new Error("Pass --email=<address> or --uid=<authUid>.");
}

// Recovery journey under patients/{uid}/people/{uid}/ — the account holder's
// personId is their own uid (RecoveryPage sets personId = uid). Shapes match
// lib/recovery.ts reads: painLogs {score,note,loggedAt}, exerciseLogs
// {completions,loggedAt}, assignedExercises {exerciseId,assignedBy,active}.
async function seedRecovery(db: Firestore, uid: string): Promise<number> {
  const person = db.collection("patients").doc(uid).collection("people").doc(uid);
  const batch = db.batch();
  let count = 0;

  for (const [order, exId] of EXERCISE_IDS.entries()) {
    batch.set(
      person.collection("assignedExercises").doc(exId),
      { exerciseId: exId, assignedAt: daysAgo(RECOVERY_DAYS), assignedBy: "demo-seed", active: true, order },
      { merge: true }
    );
    count += 1;
  }

  // offset 0 = today, offset RECOVERY_DAYS-1 = oldest. Pain trends down over
  // time (recovery); the most recent RECENT_STREAK days are all completed.
  for (let offset = 0; offset < RECOVERY_DAYS; offset += 1) {
    const day = daysAgo(offset);
    const key = dateKey(day);
    const score = Math.min(9, Math.max(1, 2 + Math.round(offset * 0.35)));

    batch.set(
      person.collection("painLogs").doc(key),
      { score, note: "", loggedAt: daysAgo(offset, 20, 0) },
      { merge: true }
    );
    count += 1;

    // Completed every day within the recent streak; a couple of older misses.
    const completedDay = offset < RECENT_STREAK || offset % 3 !== 0;
    const completions: Record<string, boolean> = {};
    for (const [i, exId] of EXERCISE_IDS.entries()) {
      completions[exId] = completedDay && (offset < RECENT_STREAK || i < 3);
    }
    batch.set(
      person.collection("exerciseLogs").doc(key),
      { date: key, completions, loggedAt: daysAgo(offset, 9, 30) },
      { merge: true }
    );
    count += 1;
  }

  await batch.commit();
  return count;
}

// Booking shape mirrors app/api/cal-webhook. getPatientBookings filters
// bookedBy == uid AND patientId == personId (= uid) and orders by sessionDate.
async function seedBookings(db: Firestore, uid: string, name: string): Promise<number> {
  const rows = [
    { id: "assessment", service: "Initial Online Assessment", when: daysAgo(12, 9, 0), status: "completed" },
    { id: "followup-past", service: "Online Follow-Up", when: daysAgo(3, 14, 30), status: "completed" },
    { id: "followup-next", service: "Online Follow-Up", when: daysAgo(-6, 11, 0), status: "upcoming" },
  ];
  const batch = db.batch();
  for (const row of rows) {
    batch.set(
      db.collection("bookings").doc(`demo-${uid}-${row.id}`),
      {
        fullName: name,
        patientName: name,
        email: "",
        service: row.service,
        appointmentDate: dateKey(row.when),
        appointmentTime: `${pad(row.when.getHours())}:${pad(row.when.getMinutes())}`,
        appointmentLabel: `${dateKey(row.when)} ${pad(row.when.getHours())}:${pad(row.when.getMinutes())}`,
        sessionDate: row.when,
        status: row.status,
        source: "demo-seed",
        bookedBy: uid,
        patientId: uid,
        patientType: "self",
        createdAt: daysAgo(20),
      },
      { merge: true }
    );
  }
  await batch.commit();
  return rows.length;
}

// Notifications at patients/{uid}/notifications/{id}; shape matches
// lib/notifications.ts (title/body/kind/read/createdAt).
async function seedNotifications(db: Firestore, uid: string): Promise<number> {
  const rows = [
    { id: "n1", kind: "milestone", title: "Milestone unlocked", body: "Full extension achieved — great progress this week.", read: false, when: daysAgo(0, 8, 30) },
    { id: "n2", kind: "appointment", title: "Upcoming appointment", body: "Online follow-up in 6 days. Tap My Appointments for details.", read: false, when: daysAgo(0, 7, 15) },
    { id: "n3", kind: "message", title: "Message from your physio", body: "Let's bump your stationary bike to 12 minutes this week.", read: false, when: daysAgo(1, 16, 0) },
    { id: "n4", kind: "adherence", title: "Adherence dipping", body: "You missed 2 sessions last week — a short set still counts.", read: true, when: daysAgo(2, 19, 0) },
    { id: "n5", kind: "system", title: "Recovery report ready", body: "Your latest recovery summary is available to download.", read: true, when: daysAgo(4, 10, 0) },
  ];
  const batch = db.batch();
  const col = db.collection("patients").doc(uid).collection("notifications");
  for (const row of rows) {
    batch.set(
      col.doc(row.id),
      { title: row.title, body: row.body, kind: row.kind, read: row.read, createdAt: row.when },
      { merge: true }
    );
  }
  await batch.commit();
  return rows.length;
}

async function main() {
  const argv = process.argv.slice(2);
  const email = argv.find((a) => a.startsWith("--email="))?.replace("--email=", "").trim() || null;
  const uidArg = argv.find((a) => a.startsWith("--uid="))?.replace("--uid=", "").trim() || null;

  init();
  const db = getFirestore();
  const { uid, name } = await resolveUid(email, uidArg);

  const recovery = await seedRecovery(db, uid);
  const bookings = await seedBookings(db, uid, name);
  const notifications = await seedNotifications(db, uid);

  console.log(
    `Seeded for ${name} (${uid}): ${recovery} recovery docs, ${bookings} bookings, ${notifications} notifications.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
