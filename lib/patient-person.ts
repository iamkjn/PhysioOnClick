import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getPatientPersonDob(uid: string, personId: string): Promise<string> {
  if (!db) return "";
  const ref = personId === uid ? doc(db, "patients", uid) : doc(db, "dependents", personId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return "";
  const dob = snap.data().dob;
  return typeof dob === "string" ? dob : "";
}
