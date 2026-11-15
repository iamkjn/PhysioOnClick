"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import type { CaredForPatient } from "@/lib/carer-access";

// One fetch of /api/patient/carer-links per signed-in uid per page load,
// shared by every PersonSwitcher / dashboard on the page.
const cache = new Map<string, Promise<CaredForPatient[]>>();

export function fetchCaredForPatients(user: Pick<User, "uid" | "getIdToken">): Promise<CaredForPatient[]> {
  const cached = cache.get(user.uid);
  if (cached) return cached;
  const promise = (async () => {
    const token = await user.getIdToken();
    const res = await fetch("/api/patient/carer-links", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`carer-links ${res.status}`);
    const body = (await res.json()) as { patients?: CaredForPatient[] };
    return Array.isArray(body.patients) ? body.patients : [];
  })();
  cache.set(user.uid, promise);
  // A failed lookup isn't cached, so the next mount retries.
  promise.catch(() => cache.delete(user.uid));
  return promise;
}

/** Test hook: forget cached lookups. */
export function resetCaredForCache() {
  cache.clear();
}

/**
 * Patients the signed-in user is a carer for. `null` while loading (or when
 * disabled / signed out); `[]` when none or the lookup failed — a failed
 * lookup just means no "Caring for" options, never a broken page.
 */
export function useCaredForPatients(
  user: Pick<User, "uid" | "getIdToken"> | null | undefined,
  enabled = true
): CaredForPatient[] | null {
  const [state, setState] = useState<{ uid: string; patients: CaredForPatient[] } | null>(null);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!enabled || !user) return;
    let cancelled = false;
    fetchCaredForPatients(user)
      .then((patients) => {
        if (!cancelled) setState({ uid: user.uid, patients });
      })
      .catch(() => {
        if (!cancelled) setState({ uid: user.uid, patients: [] });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on uid: the User object identity changes on token refresh
  }, [uid, enabled]);

  if (!enabled || !uid) return null;
  return state && state.uid === uid ? state.patients : null;
}
