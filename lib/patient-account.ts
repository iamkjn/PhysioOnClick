"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

import { db } from "@/lib/firebase";
import { DEFAULT_DOB } from "@/lib/age";
import { formatPersonName } from "@/lib/name-format";

type AppUserRole = "patient" | "admin";

// Every account must carry a date of birth so clinicians can judge age. New
// email/password sign-ups pass a real `dob`. Google sign-ups and pre-existing
// accounts have none — those are backfilled with DEFAULT_DOB on next sign-in
// (a real one already on the doc is never overwritten), and the owner asks
// those patients to correct it from their profile.
//
// Sign-in runs this on every visit, so it must never blank details already
// saved on the record. Firebase Auth usually has no phone number (and often no
// photo or name), and writing `user.phoneNumber || ""` used to wipe the phone
// the physio had entered for a managed patient the first time they signed in.
// Saved values win; Auth values only fill gaps, and createdAt is written once.

type ExistingDoc = Record<string, unknown> | null | "unknown";

async function readExisting(collectionName: "users" | "patients", uid: string): Promise<ExistingDoc> {
  if (!db) return "unknown";
  try {
    const snap = await getDoc(doc(db, collectionName, uid));
    return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
  } catch {
    return "unknown";
  }
}

function hasValue(existing: ExistingDoc, key: string): boolean {
  if (existing === "unknown") return true; // couldn't read it: never risk blanking
  const value = existing?.[key];
  return typeof value === "string" ? value.trim() !== "" : value !== undefined && value !== null;
}

// The profile fields to write on sign-in. `explicit` values (a name typed at
// sign-up) always apply; values from the Auth user only fill fields the record
// doesn't have yet, and an empty one is only written onto a brand-new record.
function profileFields(
  existing: ExistingDoc,
  fromAuth: { displayName: string; photoUrl: string; phoneNumber: string },
  explicit: { displayName?: string },
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of ["displayName", "photoUrl", "phoneNumber"] as const) {
    const chosen = key === "displayName" && explicit.displayName ? explicit.displayName : "";
    if (chosen) out[key] = chosen;
    else if (!hasValue(existing, key) && (fromAuth[key] || existing === null)) out[key] = fromAuth[key];
  }
  return out;
}

function resolveDob(existing: ExistingDoc, dob?: string): string | undefined {
  if (dob) return dob;
  if (existing === "unknown") return undefined; // leave whatever is stored alone
  const stored = existing?.dob;
  return typeof stored === "string" && stored ? stored : DEFAULT_DOB;
}

async function writeAccountDoc(
  collectionName: "users" | "patients",
  user: User,
  preferredName: string | undefined,
  dob: string | undefined,
  extra: Record<string, unknown>,
) {
  if (!db) return;
  const existing = await readExisting(collectionName, user.uid);
  const resolvedDob = resolveDob(existing, dob);
  await setDoc(
    doc(db, collectionName, user.uid),
    {
      uid: user.uid,
      email: user.email || "",
      ...profileFields(
        existing,
        {
          displayName: formatPersonName(user.displayName || "", ""),
          photoUrl: user.photoURL || "",
          phoneNumber: user.phoneNumber || "",
        },
        { displayName: formatPersonName(preferredName || "", "") },
      ),
      ...(resolvedDob ? { dob: resolvedDob } : {}),
      authProvider: user.providerData[0]?.providerId || "password",
      ...extra,
      lastSignInAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(existing === null ? { createdAt: serverTimestamp() } : {}),
    },
    { merge: true }
  );
}

async function ensureUserRecord(user: User, preferredName?: string, role: AppUserRole = "patient", dob?: string) {
  await writeAccountDoc("users", user, preferredName, dob, { role });
}

export async function ensureAppUserRecord(user: User, preferredName?: string, role: AppUserRole = "patient") {
  await ensureUserRecord(user, preferredName, role);
}

export async function ensurePatientRecord(user: User, preferredName?: string, dob?: string) {
  if (!db) {
    return;
  }
  await ensureUserRecord(user, preferredName, "patient", dob);
  await writeAccountDoc("patients", user, preferredName, dob, {});
}

export async function mergePatientProfileDetails(
  user: User,
  details: {
    fullName?: string;
    phone?: string;
    email?: string;
    dob?: string;
  }
) {
  if (!db) {
    return;
  }

  const shared = {
    uid: user.uid,
    email: details.email || user.email || "",
    displayName: formatPersonName(details.fullName || user.displayName || "", ""),
    phoneNumber: (details.phone || user.phoneNumber || "").trim(),
    ...(details.dob ? { dob: details.dob } : {}),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, "users", user.uid), shared, { merge: true });
  await setDoc(doc(db, "patients", user.uid), shared, { merge: true });
}
