// components/person-provider.tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { resolvePatientTarget, type PatientTarget } from "@/lib/patient-target";
import { formatPersonName } from "@/lib/name-format";

const STORAGE_KEY = "pooc:activePerson";

export interface PersonContextValue {
  /**
   * The active dependent's id, or `null` when the account holder ("self")
   * is the active person. Callers that need a concrete id for Firestore
   * paths (`patients/{uid}/people/{personId}`) should fall back to their
   * own `uid` when this is `null`, e.g. `personCtx?.personId ?? uid`.
   * Always `null` while in carer mode — use `usePatientTarget` on recovery
   * pages, which resolves carer mode too.
   */
  personId: string | null;
  /** Display name for the active person. Empty when `personId` is `null` —
   *  consumers already know their own display name for the self case. */
  personName: string;
  setPerson: (personId: string | null, personName: string) => void;
  /**
   * Reconcile guard: given the signed-in user's uid and their currently
   * loaded dependent ids, resets the active person back to self if the
   * stored personId is stale (e.g. the dependent was removed, or a
   * different account is now signed in).
   */
  reconcile: (uid: string, dependentIds: string[]) => void;
  /**
   * Carer mode: the patient (another account) whose recovery record the
   * signed-in user is acting on, or `null`. See lib/carer-access.ts.
   */
  careForUid: string | null;
  careForName: string;
  /** The signed-in uid that picked `careForUid` (guards a shared browser). */
  careForViewerUid: string | null;
  /** Switch into carer mode for `patientUid`. Clears any dependent selection. */
  setCareFor: (patientUid: string, patientName: string, viewerUid: string) => void;
  /**
   * Carer reconcile guard: leaves carer mode when the stored patient is no
   * longer one this user cares for (access removed) or was picked by a
   * different account on this browser.
   */
  reconcileCareFor: (viewerUid: string, allowedPatientUids: string[]) => void;
  /**
   * Whether a person choice was ever persisted on this browser. `null` until
   * the stored value has been read after mount. Used to default a carer with
   * no plan of their own into carer mode on their first visit only.
   */
  hasStoredChoice: boolean | null;
}

const PersonContext = createContext<PersonContextValue | undefined>(undefined);

interface StoredSelection {
  personId: string | null;
  personName: string;
  careForUid: string | null;
  careForName: string;
  careForViewerUid: string | null;
}

const EMPTY: StoredSelection = {
  personId: null,
  personName: "",
  careForUid: null,
  careForName: "",
  careForViewerUid: null
};

function readStored(): { value: StoredSelection; found: boolean } {
  if (typeof window === "undefined") return { value: EMPTY, found: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { value: EMPTY, found: false };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.personId === "string" || parsed.personId === null) {
      const careForUid = typeof parsed.careForUid === "string" && parsed.careForUid ? parsed.careForUid : null;
      return {
        found: true,
        value: {
          personId: careForUid ? null : ((parsed.personId as string | null) ?? null),
          personName: typeof parsed.personName === "string" ? parsed.personName : "",
          careForUid,
          careForName: careForUid && typeof parsed.careForName === "string" ? parsed.careForName : "",
          careForViewerUid:
            careForUid && typeof parsed.careForViewerUid === "string" ? parsed.careForViewerUid : null
        }
      };
    }
  } catch {
    // Malformed/unavailable storage — fall back to self.
  }
  return { value: EMPTY, found: false };
}

function writeStored(value: StoredSelection) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage may be unavailable (private browsing quota, etc.) — the
    // in-memory context state still works for the current page load.
  }
}

export function PersonProvider({ children }: { children: ReactNode }) {
  // Server-rendered default is always "self"; the real persisted value (if
  // any) is hydrated from localStorage after mount.
  const [selection, setSelection] = useState<StoredSelection>(EMPTY);
  const [hasStoredChoice, setHasStoredChoice] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = readStored();
    setSelection(stored.value);
    setHasStoredChoice(stored.found);
  }, []);

  const setPerson = useCallback((nextId: string | null, nextName: string) => {
    const next: StoredSelection = { ...EMPTY, personId: nextId, personName: nextId ? nextName : "" };
    setSelection(next);
    setHasStoredChoice(true);
    writeStored(next);
  }, []);

  const setCareFor = useCallback((patientUid: string, patientName: string, viewerUid: string) => {
    const next: StoredSelection = {
      ...EMPTY,
      careForUid: patientUid,
      careForName: patientName,
      careForViewerUid: viewerUid
    };
    setSelection(next);
    setHasStoredChoice(true);
    writeStored(next);
  }, []);

  const reconcile = useCallback((uid: string, dependentIds: string[]) => {
    setSelection((current) => {
      const id = current.personId;
      if (id === null || id === uid || dependentIds.includes(id)) {
        return current;
      }
      // Stale selection (removed dependent, or a different account signed
      // in) — fall back to self and clear the persisted value too.
      const next = { ...current, personId: null, personName: "" };
      writeStored(next);
      return next;
    });
  }, []);

  const reconcileCareFor = useCallback((viewerUid: string, allowedPatientUids: string[]) => {
    setSelection((current) => {
      if (current.careForUid === null) return current;
      const sameViewer = current.careForViewerUid === null || current.careForViewerUid === viewerUid;
      if (sameViewer && allowedPatientUids.includes(current.careForUid)) return current;
      // Access was removed, or another account picked this on a shared
      // browser — back to the signed-in user's own record.
      writeStored(EMPTY);
      return EMPTY;
    });
  }, []);

  const value = useMemo<PersonContextValue>(
    () => ({
      personId: selection.personId,
      personName: selection.personName,
      setPerson,
      reconcile,
      careForUid: selection.careForUid,
      careForName: selection.careForName,
      careForViewerUid: selection.careForViewerUid,
      setCareFor,
      reconcileCareFor,
      hasStoredChoice
    }),
    [selection, setPerson, reconcile, setCareFor, reconcileCareFor, hasStoredChoice]
  );

  return <PersonContext.Provider value={value}>{children}</PersonContext.Provider>;
}

/**
 * Reads the shared active-person context. Returns `undefined` when no
 * `PersonProvider` is mounted (e.g. admin pages, or components rendered in
 * isolation in tests) — callers must treat the result as optional and use
 * `personCtx?.foo` rather than assuming a provider is always present.
 */
export function usePerson(): PersonContextValue | undefined {
  return useContext(PersonContext);
}

export interface ActivePatient extends PatientTarget {
  /** Display name of the person whose record is in view. */
  name: string;
}

/**
 * Resolves the record a recovery page should read and write for the
 * signed-in user — their own, a dependent's, or (carer mode) another
 * patient's. Pass the result's `ownerUid` as the `uid` prop of recovery
 * components, never the raw `user.uid`. Returns `null` until signed in.
 */
export function usePatientTarget(
  authUid: string | null | undefined,
  selfName = ""
): ActivePatient | null {
  const ctx = usePerson();
  const personId = ctx?.personId ?? null;
  const personName = ctx?.personName ?? "";
  const careForUid = ctx?.careForUid ?? null;
  const careForName = ctx?.careForName ?? "";
  const careForViewerUid = ctx?.careForViewerUid ?? null;
  return useMemo(() => {
    if (!authUid) return null;
    const target = resolvePatientTarget(authUid, { personId, careForUid, careForViewerUid });
    const name =
      target.mode === "carer"
        ? formatPersonName(careForName, "Patient")
        : target.mode === "dependent"
          ? formatPersonName(personName, "")
          : selfName;
    return { ...target, name };
  }, [authUid, personId, personName, careForUid, careForName, careForViewerUid, selfName]);
}
