// components/person-provider.tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "pooc:activePerson";

export interface PersonContextValue {
  /**
   * The active dependent's id, or `null` when the account holder ("self")
   * is the active person. Callers that need a concrete id for Firestore
   * paths (`patients/{uid}/people/{personId}`) should fall back to their
   * own `uid` when this is `null`, e.g. `personCtx?.personId ?? uid`.
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
}

const PersonContext = createContext<PersonContextValue | undefined>(undefined);

function readStored(): { personId: string | null; personName: string } {
  if (typeof window === "undefined") return { personId: null, personName: "" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { personId: null, personName: "" };
    const parsed = JSON.parse(raw) as { personId?: unknown; personName?: unknown };
    if (typeof parsed.personId === "string" || parsed.personId === null) {
      return {
        personId: parsed.personId ?? null,
        personName: typeof parsed.personName === "string" ? parsed.personName : ""
      };
    }
  } catch {
    // Malformed/unavailable storage — fall back to self.
  }
  return { personId: null, personName: "" };
}

function writeStored(personId: string | null, personName: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ personId, personName }));
  } catch {
    // Storage may be unavailable (private browsing quota, etc.) — the
    // in-memory context state still works for the current page load.
  }
}

export function PersonProvider({ children }: { children: ReactNode }) {
  // Server-rendered default is always "self"; the real persisted value (if
  // any) is hydrated from localStorage after mount.
  const [personId, setPersonId] = useState<string | null>(null);
  const [personName, setPersonName] = useState("");

  useEffect(() => {
    const stored = readStored();
    setPersonId(stored.personId);
    setPersonName(stored.personName);
  }, []);

  const setPerson = useCallback((nextId: string | null, nextName: string) => {
    const name = nextId ? nextName : "";
    setPersonId(nextId);
    setPersonName(name);
    writeStored(nextId, name);
  }, []);

  const reconcile = useCallback((uid: string, dependentIds: string[]) => {
    setPersonId((current) => {
      if (current === null || current === uid || dependentIds.includes(current)) {
        return current;
      }
      // Stale selection (removed dependent, or a different account signed
      // in) — fall back to self and clear the persisted value too.
      setPersonName("");
      writeStored(null, "");
      return null;
    });
  }, []);

  return (
    <PersonContext.Provider value={{ personId, personName, setPerson, reconcile }}>
      {children}
    </PersonContext.Provider>
  );
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
