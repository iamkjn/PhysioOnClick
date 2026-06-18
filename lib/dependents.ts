import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Dependent {
  id: string;
  ownerId: string;
  name: string;
  dob: string;
  relationship: string;
  notes: string;
  avatarUrl?: string;
}

export async function getDependents(userId: string): Promise<Dependent[]> {
  if (!db) return [];
  const q = query(
    collection(db, "dependents"),
    where("ownerId", "==", userId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Dependent));
}

export async function addDependent(
  userId: string,
  data: Omit<Dependent, "id" | "ownerId">
): Promise<string> {
  if (!db) throw new Error("Firestore not available");
  const ref = await addDoc(collection(db, "dependents"), {
    ...data,
    ownerId: userId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDependent(
  id: string,
  data: Partial<Pick<Dependent, "name" | "dob" | "relationship" | "notes" | "avatarUrl">>
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, "dependents", id), data);
}

export async function deleteDependent(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "dependents", id));
}
