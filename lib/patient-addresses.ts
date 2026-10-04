import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { validateHomeVisit } from "@/lib/home-visit";

export type SavedAddress = {
  id: string;
  ownerUid: string;
  label: string;
  line: string;
  postcode: string;
};

export const ADDRESS_LABEL_MAX = 40;

type AddressInput = { label?: string; line: string; postcode: string };

export function addressDisplay(a: Pick<SavedAddress, "label" | "line" | "postcode">): string {
  return `${a.label || a.line}, ${a.postcode}`;
}

function clean(input: AddressInput) {
  const v = validateHomeVisit(input.line, input.postcode);
  if (!v.ok) throw new Error(v.error);
  return {
    label: (input.label ?? "").trim().slice(0, ADDRESS_LABEL_MAX),
    line: v.addressLine,
    postcode: v.postcode,
  };
}

export async function getAddresses(uid: string): Promise<SavedAddress[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, "patientAddresses"), where("ownerUid", "==", uid), orderBy("createdAt", "asc"))
  );
  return snap.docs.map((d) => {
    const x = d.data() as Omit<SavedAddress, "id">;
    return { id: d.id, ownerUid: x.ownerUid, label: x.label ?? "", line: x.line, postcode: x.postcode };
  });
}

export async function addAddress(uid: string, input: AddressInput): Promise<string> {
  if (!db) throw new Error("Firestore not available");
  const ref = await addDoc(collection(db, "patientAddresses"), {
    ownerUid: uid,
    ...clean(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAddress(id: string, input: AddressInput): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, "patientAddresses", id), { ...clean(input), updatedAt: serverTimestamp() });
}

export async function deleteAddress(uid: string, id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "patientAddresses", id));
  const userSnap = await getDoc(doc(db, "users", uid));
  if (userSnap.exists() && userSnap.data()?.defaultAddressId === id) {
    await updateDoc(doc(db, "users", uid), { defaultAddressId: deleteField() });
  }
  const deps = await getDocs(
    query(collection(db, "dependents"), where("ownerId", "==", uid), where("defaultAddressId", "==", id))
  );
  for (const d of deps.docs) {
    if (d.data()?.defaultAddressId === id) {
      await updateDoc(doc(db, "dependents", d.id), { defaultAddressId: deleteField() });
    }
  }
}

export async function setUsualAddress(
  uid: string,
  personId: string | null,
  addressId: string | null
): Promise<void> {
  if (!db) return;
  const value = addressId === null ? deleteField() : addressId;
  if (personId === null) {
    await setDoc(doc(db, "users", uid), { defaultAddressId: value }, { merge: true });
  } else {
    await updateDoc(doc(db, "dependents", personId), { defaultAddressId: value });
  }
}

export async function getUsualAddressId(uid: string, personId: string | null): Promise<string | null> {
  if (!db) return null;
  const snap = await getDoc(personId === null ? doc(db, "users", uid) : doc(db, "dependents", personId));
  if (!snap.exists()) return null;
  const v = snap.data()?.defaultAddressId;
  return typeof v === "string" ? v : null;
}
