// lib/exercise-videos.ts
//
// Patient-added YouTube reference links, one per assigned exercise. Lives in
// the patient's OWN subcollection (patients/{uid}/people/{personId}/exerciseVideos/{exerciseId}),
// isolated from the admin-owned assignedExercises collection — a patient can attach
// their own reference link but can never alter what the physio actually assigned.
import { collection, doc, deleteDoc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Mirrors the personBase pattern in lib/recovery.ts (and lib/goals.ts); kept
// private/duplicated here rather than imported since recovery.ts doesn't export it.
function personBase(uid: string, personId: string) {
  if (!db) throw new Error("Firestore not available");
  return doc(db, "patients", uid, "people", personId);
}

function videoRef(uid: string, personId: string, exerciseId: string) {
  return doc(personBase(uid, personId), "exerciseVideos", exerciseId);
}

// Accepts only real YouTube watch/short/embed links over http(s) — never
// javascript:, data:, or other schemes/hosts. The url is only ever rendered as
// an <a href> (target=_blank, rel="noopener noreferrer"), never embedded, but
// it's still validated up front so nothing bogus gets saved in the first place.
export function isYouTubeUrl(url: string): boolean {
  if (typeof url !== "string" || url.trim() === "") return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();

  if (host === "youtu.be" || host === "www.youtu.be") {
    return parsed.pathname.length > 1;
  }

  if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
    if (parsed.pathname === "/watch") {
      const v = parsed.searchParams.get("v");
      return typeof v === "string" && v.length > 0;
    }
    if (parsed.pathname.startsWith("/embed/")) {
      return parsed.pathname.length > "/embed/".length;
    }
    return false;
  }

  return false;
}

// Reads the whole exerciseVideos subcollection into an { [exerciseId]: url } map.
export async function getExerciseVideos(
  uid: string,
  personId: string
): Promise<Record<string, string>> {
  const col = collection(personBase(uid, personId), "exerciseVideos");
  const snap = await getDocs(col);
  const result: Record<string, string> = {};
  for (const d of snap.docs) {
    const url = d.data().url;
    if (typeof url === "string") result[d.id] = url;
  }
  return result;
}

export async function setExerciseVideo(
  uid: string,
  personId: string,
  exerciseId: string,
  url: string
): Promise<void> {
  if (!isYouTubeUrl(url)) {
    throw new Error("Please enter a valid YouTube link.");
  }
  await setDoc(
    videoRef(uid, personId, exerciseId),
    { url, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function removeExerciseVideo(
  uid: string,
  personId: string,
  exerciseId: string
): Promise<void> {
  await deleteDoc(videoRef(uid, personId, exerciseId));
}
