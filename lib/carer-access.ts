// lib/carer-access.ts
//
// Carer access: a second person (e.g. an elderly patient's partner) signs in
// with their OWN email and acts on the patient's recovery record.
//
// Source of truth is `patients/{uid}.carerEmails` — a lower-cased list managed
// by the admin (app/admin/carer-actions.ts). The patient may remove a carer
// themselves but never add one (firestore.rules enforces both). A carer can
// only ever reach the patient's own record, `patients/{uid}/people/{uid}/...`,
// and within it only the recovery collections listed in firestore.rules —
// never the account doc, assessment forms, notifications, uploads, bookings,
// invoices, or admin/clinical history.
//
// Shared by the server (admin action, /api/patient/carer-links) and client.

import { validateEmail } from "@/lib/validation";

export const MAX_CARER_EMAILS = 5;

/** A patient the signed-in user is a carer for (returned by /api/patient/carer-links). */
export interface CaredForPatient {
  uid: string;
  name: string;
  /** From the patient's `carerContact` when it names this carer, else "". */
  relationship: string;
}

/** The single carer contact saved on a patient record (pre-dates carerEmails). */
export interface CarerContact {
  name: string;
  email: string;
  relationship: string;
}

export function normalizeCarerEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** Tolerant reader for `carerEmails` on a patient doc: always a clean string list. */
export function readCarerEmails(data: Record<string, unknown> | undefined | null): string[] {
  const raw = data?.carerEmails;
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const email = normalizeCarerEmail(item);
    if (email && !out.includes(email)) out.push(email);
  }
  return out;
}

/** Tolerant reader for `carerContact` on a patient doc. */
export function readCarerContact(data: Record<string, unknown> | undefined | null): CarerContact | null {
  const raw = data?.carerContact;
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const email = normalizeCarerEmail(c.email);
  const name = typeof c.name === "string" ? c.name.trim() : "";
  const relationship = typeof c.relationship === "string" ? c.relationship.trim() : "";
  if (!email && !name) return null;
  return { name, email, relationship };
}

/** The carer's relationship to the patient, when the patient's carerContact names them. */
export function carerRelationshipFor(data: Record<string, unknown> | undefined | null, carerEmail: string): string {
  const contact = readCarerContact(data);
  if (!contact || !contact.email) return "";
  return contact.email === normalizeCarerEmail(carerEmail) ? contact.relationship : "";
}

/**
 * Validates and normalises a full carer-email list before it is saved:
 * lower-cases, trims, de-duplicates, checks each address, caps the count and
 * refuses the patient's own email (they already own the record).
 */
export function normalizeCarerEmails(
  input: unknown,
  ownerEmail?: string
): { emails: string[]; error: string | null } {
  if (!Array.isArray(input)) return { emails: [], error: "Carer emails must be a list." };
  const owner = normalizeCarerEmail(ownerEmail);
  const emails: string[] = [];
  for (const item of input) {
    const email = normalizeCarerEmail(item);
    if (!email) continue;
    if (validateEmail(email) !== null) return { emails: [], error: `"${email}" is not a valid email address.` };
    if (owner && email === owner) {
      return { emails: [], error: "That is the patient's own email. Add the carer's email instead." };
    }
    if (!emails.includes(email)) emails.push(email);
  }
  if (emails.length > MAX_CARER_EMAILS) {
    return { emails: [], error: `A patient can have at most ${MAX_CARER_EMAILS} carers.` };
  }
  return { emails, error: null };
}
