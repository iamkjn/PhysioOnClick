"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import type { CaredForPatient } from "@/lib/carer-access";

export interface CarerLinks {
  patients: CaredForPatient[];
  /**
   * True when someone has listed this user's email as a carer but the email
   * isn't verified yet (e.g. a password sign-up), so access stays locked
   * until they confirm it — see lib/email-verification.ts.
   */
  verifyEmail: boolean;
}

// One fetch of /api/patient/carer-links per signed-in uid per page load,
// shared by every PersonSwitcher / dashboard on the page.
const cache = new Map<string, Promise<CarerLinks>>();

export function fetchCarerLinks(user: Pick<User, "uid" | "getIdToken">): Promise<CarerLinks> {
  const cached = cache.get(user.uid);
  if (cached) return cached;
  const promise = (async () => {
    const token = await user.getIdToken();
    const res = await fetch("/api/patient/carer-links", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`carer-links ${res.status}`);
    const body = (await res.json()) as { patients?: CaredForPatient[]; verifyEmail?: boolean };
    return {
      patients: Array.isArray(body.patients) ? body.patients : [],
      verifyEmail: body.verifyEmail === true,
    };
  })();
  cache.set(user.uid, promise);
  // A failed lookup isn't cached, so the next mount retries.
  promise.catch(() => cache.delete(user.uid));
  return promise;
}

export function fetchCaredForPatients(user: Pick<User, "uid" | "getIdToken">): Promise<CaredForPatient[]> {
  return fetchCarerLinks(user).then((links) => links.patients);
}

/** Forget cached lookups — after the user confirms their email, and in tests. */
export function resetCaredForCache() {
  cache.clear();
}

/**
 * The full carer-links answer for the signed-in user. `null` while loading
 * (or when disabled / signed out); a failed lookup reads as "cares for
 * nobody", never a broken page.
 */
export function useCarerLinks(
  user: Pick<User, "uid" | "getIdToken"> | null | undefined,
  enabled = true
): CarerLinks | null {
  const [state, setState] = useState<{ uid: string; links: CarerLinks } | null>(null);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!enabled || !user) return;
    let cancelled = false;
    fetchCarerLinks(user)
      .then((links) => {
        if (!cancelled) setState({ uid: user.uid, links });
      })
      .catch(() => {
        if (!cancelled) setState({ uid: user.uid, links: { patients: [], verifyEmail: false } });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on uid: the User object identity changes on token refresh
  }, [uid, enabled]);

  if (!enabled || !uid) return null;
  return state && state.uid === uid ? state.links : null;
}

/**
 * Patients the signed-in user is a carer for. `null` while loading (or when
 * disabled / signed out); `[]` when none or the lookup failed.
 */
export function useCaredForPatients(
  user: Pick<User, "uid" | "getIdToken"> | null | undefined,
  enabled = true
): CaredForPatient[] | null {
  return useCarerLinks(user, enabled)?.patients ?? null;
}
