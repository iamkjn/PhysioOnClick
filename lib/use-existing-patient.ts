"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isPhysioManagedAccount } from "@/lib/treatment-packages";

/**
 * True when the signed-in user is a patient the physio added themselves, who
 * needs no "get in touch" prompts. False for visitors, self sign-ups, and
 * while that is still being worked out (or cannot be).
 */
export function useExistingPatient(): boolean {
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    if (!auth || !db) return;
    const database = db;
    let current: string | null = null;
    const stop = onAuthStateChanged(auth, (user) => {
      current = user?.uid ?? null;
      setExisting(false);
      if (!user) return;
      getDoc(doc(database, "patients", user.uid))
        .then((snap) => {
          if (current === user.uid) setExisting(isPhysioManagedAccount(snap.data()));
        })
        .catch(() => {});
    });
    return () => {
      current = null;
      stop();
    };
  }, []);

  return existing;
}
