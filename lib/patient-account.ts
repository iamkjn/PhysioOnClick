"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

import { db } from "@/lib/firebase";
import { DEFAULT_DOB } from "@/lib/age";

type AppUserRole = "patient" | "admin";

// Every account must carry a date of birth so clinicians can judge age. New
// email/password sign-ups pass a real `dob`. Google sign-ups and pre-existing
// accounts have none — those are backfilled with DEFAULT_DOB on next sign-in
// (a real one already on the doc is never overwritten), and the owner asks
// those patients to correct it from their profile.
async function resolveDob(collectionName: "users" | "patients", uid: string, dob?: string): Promise<string> {
  if (dob) return dob;
  if (!db) return DEFAULT_DOB;
  try {
    const snap = await getDoc(doc(db, collectionName, uid));
    const existing = snap.exists() ? (snap.data().dob as string | undefined) : undefined;
    return existing || DEFAULT_DOB;
  } catch {
    return DEFAULT_DOB;
  }
}

async function ensureUserRecord(user: User, preferredName?: string, role: AppUserRole = "patient", dob?: string) {
  if (!db) {
    return;
  }

  const providerId = user.providerData[0]?.providerId || "password";

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email || "",
      displayName: (preferredName || user.displayName || "").trim(),
      photoUrl: user.photoURL || "",
      phoneNumber: user.phoneNumber || "",
      dob: await resolveDob("users", user.uid, dob),
      authProvider: providerId,
      role,
      lastSignInAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function ensureAppUserRecord(user: User, preferredName?: string, role: AppUserRole = "patient") {
  await ensureUserRecord(user, preferredName, role);
}

export async function ensurePatientRecord(user: User, preferredName?: string, dob?: string) {
  if (!db) {
    return;
  }

  const providerId = user.providerData[0]?.providerId || "password";

  await ensureUserRecord(user, preferredName, "patient", dob);

  await setDoc(
    doc(db, "patients", user.uid),
    {
      uid: user.uid,
      email: user.email || "",
      displayName: (preferredName || user.displayName || "").trim(),
      photoUrl: user.photoURL || "",
      phoneNumber: user.phoneNumber || "",
      dob: await resolveDob("patients", user.uid, dob),
      authProvider: providerId,
      lastSignInAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
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
    displayName: (details.fullName || user.displayName || "").trim(),
    phoneNumber: (details.phone || user.phoneNumber || "").trim(),
    ...(details.dob ? { dob: details.dob } : {}),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, "users", user.uid), shared, { merge: true });
  await setDoc(doc(db, "patients", user.uid), shared, { merge: true });
}
