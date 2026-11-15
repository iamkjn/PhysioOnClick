// components/patient-carer-access.tsx
"use client";

import { useEffect, useState } from "react";
import { arrayRemove, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { readCarerContact, readCarerEmails, type CarerContact } from "@/lib/carer-access";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface CarerState {
  emails: string[];
  contact: CarerContact | null;
}

/**
 * Account → "Who can see your recovery". Lists the carers the clinic has
 * given access to (patients/{uid}.carerEmails, see lib/carer-access.ts). The
 * patient can remove a carer (withdraw consent) but not add one — firestore.rules
 * only allows removals here; adding goes through the physio.
 */
export function PatientCarerAccess({ uid }: { uid: string }) {
  const toast = useToast();
  // Tagged with the uid it was read for, so a uid change shows the loading
  // state again without resetting state synchronously in the effect.
  const [loaded, setLoaded] = useState<{ uid: string; state: CarerState | null } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    let live = true;
    getDoc(doc(db, "patients", uid))
      .then((snap) => {
        if (!live) return;
        const data = snap.exists() ? (snap.data() as Record<string, unknown>) : undefined;
        setLoaded({ uid, state: { emails: readCarerEmails(data), contact: readCarerContact(data) } });
      })
      .catch(() => { if (live) setLoaded({ uid, state: null }); });
    return () => { live = false; };
  }, [uid]);

  // undefined = loading, null = couldn't load.
  const state: CarerState | null | undefined = !db
    ? { emails: [], contact: null }
    : loaded && loaded.uid === uid
      ? loaded.state
      : undefined;

  async function handleRemove(email: string) {
    if (!db) return;
    setRemoving(email);
    try {
      await updateDoc(doc(db, "patients", uid), { carerEmails: arrayRemove(email) });
      setLoaded((prev) =>
        prev && prev.uid === uid && prev.state
          ? { ...prev, state: { ...prev.state, emails: prev.state.emails.filter((e) => e !== email) } }
          : prev
      );
      toast.show("Access removed.", "success");
    } catch {
      toast.show("Could not remove access. Try again.", "error");
    } finally {
      setRemoving(null);
    }
  }

  if (state === undefined) return <SkeletonRow count={1} />;

  if (state === null) {
    return <p className="muted">We couldn&apos;t load who can see your recovery right now.</p>;
  }

  if (state.emails.length === 0) {
    return (
      <p className="muted">
        Only you can see your recovery. If a partner or family member helps with your exercises, ask your physio to
        give them access.
      </p>
    );
  }

  const { contact } = state;

  return (
    <div className="stack">
      <p className="muted">
        These people can sign in with their own email to see your exercises and progress, tick exercises off and log
        pain for you. They can&apos;t see your bookings, invoices or documents.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "var(--space-2, 0.5rem)" }}>
        {state.emails.map((email) => {
          const named = contact && contact.email === email
            ? [contact.name, contact.relationship].filter(Boolean).join(" · ")
            : "";
          return (
            <li key={email} className="panel" style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: "block", color: "var(--color-text-primary)", overflowWrap: "anywhere" }}>
                  {named || email}
                </strong>
                {named ? <span className="muted" style={{ fontSize: "var(--text-sm)", overflowWrap: "anywhere" }}>{email}</span> : null}
              </div>
              <button
                type="button"
                className="button secondary small"
                style={{ color: "var(--color-error)" }}
                disabled={removing !== null}
                aria-label={`Remove access for ${email}`}
                onClick={() => setRemoveTarget(email)}
              >
                {removing === email ? "Removing…" : "Remove access"}
              </button>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        isOpen={removeTarget !== null}
        title="Remove access?"
        body={
          removeTarget
            ? `${removeTarget} will no longer be able to see your recovery. Your physio can give access again if you change your mind.`
            : ""
        }
        confirmLabel="Remove access"
        confirmVariant="destructive"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          const target = removeTarget;
          setRemoveTarget(null);
          if (target) void handleRemove(target);
        }}
      />
    </div>
  );
}
