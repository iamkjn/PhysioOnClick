import {
  addDoc,
  collection,
  getCountFromServer,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function saveEnquiry(payload: Record<string, string>) {
  if (!db) {
    throw new Error("Firestore is not configured.");
  }

  // Mirror the doc shape /api/enquiry writes — firestore.rules requires
  // status == "new" on client-side enquiry creates.
  await addDoc(collection(db, "enquiries"), {
    ...payload,
    emailLower: (payload.email || "").toLowerCase(),
    status: "new",
    source: "website-contact-form",
    createdAt: serverTimestamp()
  });
}

export function subscribeCollectionCount(collectionName: string, onValue: (count: number) => void) {
  if (!db) {
    onValue(0);
    return () => undefined;
  }

  const ref = collection(db, collectionName);
  getCountFromServer(ref)
    .then((snapshot) => onValue(snapshot.data().count))
    .catch(() => onValue(0));

  return onSnapshot(ref, (snapshot) => onValue(snapshot.size));
}

export function subscribeUserCollection<T extends { id: string }>(
  collectionName: string,
  value: string,
  mapDoc: (doc: Record<string, unknown>, id: string) => T,
  onValue: (items: T[]) => void,
  filterField: string | false = "email"
) {
  if (!db) {
    onValue([]);
    return () => undefined;
  }

  const ref =
    filterField === false
      ? query(collection(db, collectionName), orderBy("savedAt", "desc"))
      : query(collection(db, collectionName), where(filterField, "==", value), orderBy("createdAt", "desc"));
  return onSnapshot(ref, (snapshot) => {
    onValue(snapshot.docs.map((doc) => mapDoc(doc.data(), doc.id)));
  });
}
