// components/admin-carer-access.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { doc, getDoc } from "firebase/firestore";
import { UserCheck, UserPlus } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  MAX_CARER_EMAILS,
  normalizeCarerEmail,
  normalizeCarerEmails,
  readCarerContact,
  readCarerEmails,
  type CarerContact,
} from "@/lib/carer-access";
import { setPatientCarerEmails } from "@/app/admin/carer-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface Props {
  patientUid: string;
  patientName: string;
}

interface CarerRecord {
  emails: string[];
  contact: CarerContact | null;
  ownerEmail: string;
}

/**
 * Admin → patient record → "Carer access". Lists who may sign in with their
 * own email and act on this account holder's recovery record
 * (patients/{uid}.carerEmails, see lib/carer-access.ts). Every change saves
 * the whole list through the setPatientCarerEmails server action.
 */
export function AdminCarerAccess({ patientUid, patientName }: Props) {
  const toast = useToast();
  // Tagged with the uid it was read for, so switching patients shows the
  // loading state again without resetting state synchronously in the effect.
  const [loaded, setLoaded] = useState<{ uid: string; record: CarerRecord | null } | null>(null);
  const [email, setEmail] = useState("");
  const [inputError, setInputError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    let live = true;
    getDoc(doc(db, "patients", patientUid))
      .then((snap) => {
        if (!live) return;
        const data = snap.exists() ? (snap.data() as Record<string, unknown>) : undefined;
        setLoaded({
          uid: patientUid,
          record: {
            emails: readCarerEmails(data),
            contact: readCarerContact(data),
            ownerEmail: normalizeCarerEmail(data?.email),
          },
        });
      })
      .catch(() => { if (live) setLoaded({ uid: patientUid, record: null }); });
    return () => { live = false; };
  }, [patientUid]);

  // undefined = loading, null = couldn't load.
  const record: CarerRecord | null | undefined = !db
    ? null
    : loaded && loaded.uid === patientUid
      ? loaded.record
      : undefined;

  async function save(next: string[], successMessage: string): Promise<boolean> {
    setSaving(true);
    try {
      const idToken = await auth?.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in");
      const saved = await setPatientCarerEmails(patientUid, next, idToken);
      setLoaded((prev) =>
        prev && prev.uid === patientUid && prev.record
          ? { ...prev, record: { ...prev.record, emails: saved } }
          : prev
      );
      toast.show(successMessage, "success");
      return true;
    } catch {
      toast.show("Could not update carer access. Try again.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (record === undefined) {
    return (
      <div className="panel admin-patient-card stack">
        <SkeletonRow count={2} />
      </div>
    );
  }

  const emails = record?.emails ?? [];
  const contact = record?.contact ?? null;
  const ownerEmail = record?.ownerEmail ?? "";
  const atLimit = emails.length >= MAX_CARER_EMAILS;
  const suggestion =
    contact && contact.email && !emails.includes(contact.email) && contact.email !== ownerEmail && !atLimit
      ? contact
      : null;

  function relationshipFor(carerEmail: string): string {
    if (!contact || contact.email !== carerEmail) return "";
    return [contact.name, contact.relationship].filter(Boolean).join(" · ");
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const value = normalizeCarerEmail(email);
    if (!value) { setInputError("Enter the carer's email address."); return; }
    if (emails.includes(value)) { setInputError("That email already has access."); return; }
    const { emails: next, error } = normalizeCarerEmails([...emails, value], ownerEmail);
    if (error) { setInputError(error); return; }
    setInputError("");
    if (await save(next, "Carer access given.")) setEmail("");
  }

  async function handleGiveAccess(c: CarerContact) {
    if (saving) return;
    const { emails: next, error } = normalizeCarerEmails([...emails, c.email], ownerEmail);
    if (error) { toast.show(error, "error"); return; }
    await save(next, "Carer access given.");
  }

  function handleRemoveConfirm() {
    const target = removeTarget;
    setRemoveTarget(null);
    if (!target) return;
    void save(emails.filter((e) => e !== target), "Carer access removed.");
  }

  const suggestionLabel = suggestion
    ? [suggestion.name, suggestion.relationship ? `(${suggestion.relationship})` : ""].filter(Boolean).join(" ")
    : "";

  return (
    <section className="panel admin-patient-card stack" aria-labelledby="admin-carer-access-title">
      <div className="admin-patient-section-head">
        <div>
          <span className="dashboard-eyebrow">Account holder: {patientName}</span>
          <h2 id="admin-carer-access-title">Carer access</h2>
        </div>
        {record ? (
          <span className="dashboard-table-count">
            {emails.length} of {MAX_CARER_EMAILS}
          </span>
        ) : null}
      </div>

      <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        People listed here can sign in with their own email and see {patientName}&apos;s exercises and progress, tick
        exercises off and log pain. They can&apos;t see bookings, invoices, documents, assessments or clinical history.
      </p>

      {record === null ? (
        <p role="alert" style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: 0 }}>
          Could not load carer access.
        </p>
      ) : (
        <>
          {emails.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>No carers yet.</p>
          ) : (
            <ul className="admin-patient-bookings" aria-label="Carers with access" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {emails.map((carerEmail) => {
                const relationship = relationshipFor(carerEmail);
                return (
                  <li key={carerEmail} className="admin-patient-booking-row">
                    <span className="admin-patient-booking-icon" aria-hidden="true">
                      <UserCheck />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ overflowWrap: "anywhere" }}>{carerEmail}</strong>
                      {relationship ? <span>{relationship}</span> : null}
                    </div>
                    <div className="admin-patient-row-actions">
                      <button
                        type="button"
                        className="button small admin-danger-button"
                        disabled={saving}
                        aria-label={`Remove carer access for ${carerEmail}`}
                        onClick={() => setRemoveTarget(carerEmail)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {suggestion ? (
            <div className="admin-patient-booking-row">
              <span className="admin-patient-booking-icon" aria-hidden="true">
                <UserPlus />
              </span>
              <div style={{ minWidth: 0 }}>
                <strong style={{ overflowWrap: "anywhere" }}>
                  On file: {suggestionLabel ? `${suggestionLabel} · ` : ""}{suggestion.email}
                </strong>
                <span>Saved carer contact. Not given access yet.</span>
              </div>
              <div className="admin-patient-row-actions">
                <button
                  type="button"
                  className="button small"
                  disabled={saving}
                  aria-label={`Give carer access to ${suggestion.email}`}
                  onClick={() => void handleGiveAccess(suggestion)}
                >
                  Give access
                </button>
              </div>
            </div>
          ) : null}

          {atLimit ? (
            <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
              This account has the maximum of {MAX_CARER_EMAILS} carers. Remove one to add another.
            </p>
          ) : (
            <form onSubmit={(e) => void handleAdd(e)} noValidate style={{ display: "grid", gap: "var(--space-2)" }}>
              <label htmlFor={`carer-email-${patientUid}`} style={{ fontSize: "var(--text-sm)" }}>
                Carer&apos;s email
              </label>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  id={`carer-email-${patientUid}`}
                  className="input"
                  type="email"
                  autoComplete="off"
                  value={email}
                  disabled={saving}
                  aria-invalid={inputError ? true : undefined}
                  aria-describedby={inputError ? `carer-email-error-${patientUid}` : undefined}
                  onChange={(e) => { setEmail(e.target.value); if (inputError) setInputError(""); }}
                  style={{ flex: "1 1 220px", minWidth: 0 }}
                />
                <button type="submit" className="button small" disabled={saving} aria-busy={saving}>
                  {saving ? "Saving…" : "Add carer"}
                </button>
              </div>
              {inputError ? (
                <p id={`carer-email-error-${patientUid}`} className="field-error" role="alert" style={{ margin: 0 }}>
                  {inputError}
                </p>
              ) : null}
            </form>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={removeTarget !== null}
        title="Remove carer access?"
        body={removeTarget ? `${removeTarget} will no longer be able to see ${patientName}'s exercises and progress.` : ""}
        confirmLabel="Remove access"
        confirmVariant="destructive"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirm}
      />
    </section>
  );
}
