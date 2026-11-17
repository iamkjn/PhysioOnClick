// Server-only: may the signed-in user see / pay for this patient's
// physio-arranged treatment plans? The patient themself, or a carer whose
// VERIFIED email is in patients/{uid}.carerEmails (same bar as
// firestore.rules isCarerOf and /api/patient/carer-links).
import { getAdminAuth, getAdminDb, type DecodedIdToken } from "@/lib/firebase-admin";
import { normalizeCarerEmail, readCarerEmails } from "@/lib/carer-access";
import { isPhysioManagedAccount } from "@/lib/treatment-packages";

export const OWNER_RE = /^[A-Za-z0-9_-]{6,128}$/;

export async function resolvePlanAccess(
  request: Request,
  ownerUid: string,
): Promise<
  | { ok: true; decoded: DecodedIdToken; db: NonNullable<ReturnType<typeof getAdminDb>>; managedByPhysio: boolean }
  | { ok: false; status: number }
> {
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!auth || !db) return { ok: false, status: 500 };
  if (!token) return { ok: false, status: 401 };
  let decoded: DecodedIdToken;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return { ok: false, status: 401 };
  }
  if (!OWNER_RE.test(ownerUid)) return { ok: false, status: 400 };
  const snap = await db.collection("patients").doc(ownerUid).get();
  // Payment for a plan only applies to accounts the admin created: customers
  // who sign up themselves pay when they book.
  const managedByPhysio = snap.exists && isPhysioManagedAccount(snap.data());
  if (decoded.uid === ownerUid) return { ok: true, decoded, db, managedByPhysio };

  const email = normalizeCarerEmail(decoded.email);
  if (!email || decoded.email_verified !== true) return { ok: false, status: 403 };
  if (!snap.exists || !readCarerEmails(snap.data()).includes(email)) return { ok: false, status: 403 };
  return { ok: true, decoded, db, managedByPhysio };
}
