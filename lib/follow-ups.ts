// lib/follow-ups.ts
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Written server-side by scheduleFollowUp (app/admin/actions.ts) via the
// firebase-admin REST shim, which bypasses firestore.rules; read here with
// the client SDK, gated by the patients/{userId}/followUps rule.
export interface FollowUp {
  id: string;
  dueDate: string;
  note: string;
  service?: string;
  personId?: string;
  createdAt: Date | null;
}

function toFollowUp(id: string, data: Record<string, unknown>): FollowUp {
  const ts = data.createdAt as { toDate?: () => Date } | undefined;
  return {
    id,
    dueDate: typeof data.dueDate === "string" ? data.dueDate : "",
    note: typeof data.note === "string" ? data.note : "",
    service: typeof data.service === "string" && data.service ? data.service : undefined,
    personId: typeof data.personId === "string" && data.personId ? data.personId : undefined,
    createdAt: ts?.toDate ? ts.toDate() : null,
  };
}

// Upcoming follow-ups for a patient (dueDate >= today), soonest first, scoped
// to one person. Docs live at patients/{uid}/followUps (not nested per person)
// and carry a personId field, so the person filter is applied client-side
// after the date query rather than as a second `where` — this matches how
// scheduleFollowUp writes personId (app/admin/actions.ts) without requiring a
// composite index. A follow-up with no personId predates that field and is
// treated as belonging to the account owner (uid), mirroring scheduleFollowUp's
// own `personId ?? patientUid` default, so old docs keep showing for that person.
export async function getFollowUps(uid: string, personId: string): Promise<FollowUp[]> {
  if (!db) return [];
  const today = new Date().toISOString().slice(0, 10);
  const q = query(
    collection(db, "patients", uid, "followUps"),
    where("dueDate", ">=", today),
    orderBy("dueDate", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => toFollowUp(d.id, d.data() as Record<string, unknown>))
    .filter((f) => (f.personId ?? uid) === personId);
}
