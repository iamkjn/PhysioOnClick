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
import { formatPersonName } from "@/lib/name-format";

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
  return snap.docs.map((d) => {
    const data = d.data() as Omit<Dependent, "id">;
    return { id: d.id, ...data, name: formatPersonName(data.name) } as Dependent;
  });
}

export async function addDependent(
  userId: string,
  data: Omit<Dependent, "id" | "ownerId">
): Promise<string> {
  if (!db) throw new Error("Firestore not available");
  const ref = await addDoc(collection(db, "dependents"), {
    ...data,
    name: formatPersonName(data.name),
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
  await updateDoc(doc(db, "dependents", id), {
    ...data,
    ...(data.name ? { name: formatPersonName(data.name) } : {}),
  });
}

export async function deleteDependent(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "dependents", id));
}
