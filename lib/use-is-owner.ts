"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isOwnerEmail } from "@/lib/owner";

/** null while sign-in is still being checked. */
export function useIsOwner(): boolean | null {
  const [owner, setOwner] = useState<boolean | null>(null);
  useEffect(() => {
    if (!auth) {
      setOwner(false);
      return;
    }
    return onAuthStateChanged(auth, (user) => setOwner(isOwnerEmail(user?.email)));
  }, []);
  return owner;
}
