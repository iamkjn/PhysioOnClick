"use server";

// Admin-only management of carer access (lib/carer-access.ts). The admin
// saves the FULL list of carer emails for a patient; firestore.rules lets the
// patient remove entries themselves but never add one, so this is the only
// way a carer is ever granted access. No emails are sent from here.

import { DecodedIdToken, FieldValue, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { normalizeCarerEmails } from "@/lib/carer-access";

// Server actions are public HTTP endpoints — the /admin page gate is client-side
// only, so every action must verify the caller's ID token itself. Mirrors
// requireAdmin in app/admin/actions.ts (a "use server" file can only export
// async functions, so it can't be shared from there).
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@physioonclick.co.uk";

async function requireAdmin(idToken: string): Promise<DecodedIdToken> {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Unauthorized");
  }
  const adminAuth = getAdminAuth();
  if (!adminAuth) throw new Error("Server not configured");
  let decoded: DecodedIdToken;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    throw new Error("Unauthorized");
  }
  const isAdmin = decoded.admin === true || (!!decoded.email && decoded.email === ADMIN_EMAIL);
  if (!isAdmin) throw new Error("Unauthorized");
  return decoded;
}

/**
 * Replaces `patients/{patientUid}.carerEmails` with the validated, normalised
 * list (lower-cased, de-duplicated, at most MAX_CARER_EMAILS, never the
 * patient's own email). Returns the list as saved.
 */
export async function setPatientCarerEmails(
  patientUid: string,
  emails: string[],
  idToken: string
): Promise<string[]> {
  const decoded = await requireAdmin(idToken);

  if (
    typeof patientUid !== "string" ||
    patientUid.length === 0 ||
    patientUid.length > 128 ||
    patientUid.includes("/")
  ) {
    throw new Error("Invalid patient id");
  }

  const db = getAdminDb();
  if (!db) throw new Error("Admin database unavailable");

  const ref = db.collection("patients").doc(patientUid);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Patient not found");
  const patient = snap.data() ?? {};
  const ownerEmail = typeof patient.email === "string" ? patient.email : undefined;

  const { emails: carerEmails, error } = normalizeCarerEmails(emails, ownerEmail);
  if (error) throw new Error(error);

  await ref.update({
    carerEmails,
    carerEmailsUpdatedAt: FieldValue.serverTimestamp(),
    carerEmailsUpdatedBy: decoded.email ?? decoded.uid,
  });

  return carerEmails;
}
