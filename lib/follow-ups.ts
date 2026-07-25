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

// Upcoming follow-ups for a patient (dueDate >= today), soonest first.
export async function getFollowUps(uid: string): Promise<FollowUp[]> {
  if (!db) return [];
  const today = new Date().toISOString().slice(0, 10);
  const q = query(
    collection(db, "patients", uid, "followUps"),
    where("dueDate", ">=", today),
    orderBy("dueDate", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toFollowUp(d.id, d.data() as Record<string, unknown>));
}
