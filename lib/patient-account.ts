"use client";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

import { db } from "@/lib/firebase";

type AppUserRole = "patient" | "admin";

async function ensureUserRecord(user: User, preferredName?: string, role: AppUserRole = "patient") {
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

export async function ensurePatientRecord(user: User, preferredName?: string) {
  if (!db) {
    return;
  }

  const providerId = user.providerData[0]?.providerId || "password";

  await ensureUserRecord(user, preferredName, "patient");

  await setDoc(
    doc(db, "patients", user.uid),
    {
      uid: user.uid,
      email: user.email || "",
      displayName: (preferredName || user.displayName || "").trim(),
      photoUrl: user.photoURL || "",
      phoneNumber: user.phoneNumber || "",
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
  }
) {
  if (!db) {
    return;
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: details.email || user.email || "",
      displayName: (details.fullName || user.displayName || "").trim(),
      phoneNumber: (details.phone || user.phoneNumber || "").trim(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "patients", user.uid),
    {
      uid: user.uid,
      email: details.email || user.email || "",
      displayName: (details.fullName || user.displayName || "").trim(),
      phoneNumber: (details.phone || user.phoneNumber || "").trim(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
