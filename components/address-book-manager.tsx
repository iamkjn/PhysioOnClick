"use client";

import { useCallback, useEffect, useState } from "react";

import { AddressLookup } from "@/components/address-lookup";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { isCoveredPostcode } from "@/lib/home-visit-area";
import { HOME_ADDRESS_MAX, HOME_POSTCODE_MAX, normalisePostcode, validateHomeVisit } from "@/lib/home-visit";
import {
  ADDRESS_LABEL_MAX,
  addAddress,
  addressDisplay,
  deleteAddress,
  getAddresses,
  updateAddress,
  type SavedAddress,
} from "@/lib/patient-addresses";

/**
 * Account → Addresses. Saved home-visit addresses for the signed-in patient.
 * Addresses are personal data: never logged, tracked or put in URLs.
 */
type FormState = { id: string | null; label: string; postcode: string; line: string };

const EMPTY_FORM: FormState = { id: null, label: "", postcode: "", line: "" };

/** Shape-valid and inside the home-visit area: only then may we use the lookup. */
function canLookup(postcode: string): boolean {
  const pc = normalisePostcode(postcode);
  if (!pc || !isCoveredPostcode(pc)) return false;
  // validateHomeVisit checks the postcode shape; a placeholder line isolates that check.
  return validateHomeVisit("x", pc).ok;
}

export function AddressBookManager({ uid }: { uid: string }) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SavedAddress | null>(null);

  const reload = useCallback(async () => {
    try {
      setAddresses(await getAddresses(uid));
    } catch {
      setError("Could not load your addresses. Please try again.");
    } finally {
      setLoaded(true);
    }
  }, [uid]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    const input = { label: form.label.trim(), line: form.line, postcode: normalisePostcode(form.postcode) };
    try {
      if (form.id) await updateAddress(form.id, input);
      else await addAddress(uid, input);
      setForm(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Could not save this address. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(target: SavedAddress) {
    setError("");
    try {
      await deleteAddress(uid, target.id);
      await reload();
    } catch {
      setError("Could not delete this address. Please try again.");
    }
  }

  const lookup = form ? canLookup(form.postcode) : false;

  return (
    <div className="stack">
      {loaded && addresses.length === 0 && !form && (
        <p className="muted">No saved addresses yet. Add one to book home visits faster.</p>
      )}

      {addresses.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "var(--space-2, 0.5rem)" }}>
          {addresses.map((a) => {
            const name = addressDisplay(a);
            return (
              <li key={a.id} className="panel" style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: "block", color: "var(--color-text-primary)" }}>{name}</strong>
                  {a.label && <span className="muted" style={{ fontSize: "var(--text-sm)" }}>{a.line}</span>}
                  {!isCoveredPostcode(a.postcode) && (
                    <span
                      style={{
                        display: "inline-block",
                        marginLeft: a.label ? 8 : 0,
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 999,
                        padding: "2px 8px",
                        background: "var(--color-primary-light)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Outside our home-visit area
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="button secondary small"
                  aria-label={`Edit ${name}`}
                  onClick={() => {
                    setError("");
                    setForm({ id: a.id, label: a.label, postcode: a.postcode, line: a.line });
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="button secondary small"
                  aria-label={`Delete ${name}`}
                  style={{ color: "var(--color-error)" }}
                  onClick={() => setDeleteTarget(a)}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && !form && <p className="field-error" role="alert">{error}</p>}

      {form ? (
        <form className="panel" onSubmit={(e) => void handleSave(e)} style={{ display: "grid", gap: "0.75rem" }}>
          <h3 style={{ margin: 0 }}>{form.id ? "Edit address" : "Add an address"}</h3>
          <label>
            Label <span className="muted" style={{ fontWeight: 400 }}>(optional, e.g. Home or Mum&apos;s)</span>
            <input
              className="input"
              value={form.label}
              maxLength={ADDRESS_LABEL_MAX}
              onChange={(e) => setForm((f) => f && { ...f, label: e.target.value })}
            />
          </label>
          <label>
            Postcode
            <input
              className="input"
              value={form.postcode}
              maxLength={HOME_POSTCODE_MAX}
              autoComplete="postal-code"
              onChange={(e) => setForm((f) => f && { ...f, postcode: e.target.value })}
            />
          </label>
          {lookup ? (
            <AddressLookup
              postcode={normalisePostcode(form.postcode)}
              addressLine={form.line}
              onAddressLineChange={(v) => setForm((f) => f && { ...f, line: v })}
              onPostcodeResolved={(pc) => setForm((f) => f && { ...f, postcode: pc })}
              inputId="address-book-line"
            />
          ) : (
            <label htmlFor="address-book-line">
              Address
              <input
                id="address-book-line"
                className="input"
                value={form.line}
                maxLength={HOME_ADDRESS_MAX}
                autoComplete="street-address"
                onChange={(e) => setForm((f) => f && { ...f, line: e.target.value })}
              />
            </label>
          )}
          {error && <p className="field-error" role="alert">{error}</p>}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="button primary" disabled={saving} aria-busy={saving}>
              {saving ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setForm(null);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div>
          <button
            type="button"
            className="button secondary small"
            onClick={() => {
              setError("");
              setForm(EMPTY_FORM);
            }}
          >
            Add an address
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete this address?"
        body="It will be removed from your address book and from anyone who uses it as their usual address."
        confirmLabel="Delete"
        confirmVariant="destructive"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const t = deleteTarget;
          setDeleteTarget(null);
          if (t) void handleDelete(t);
        }}
      />
    </div>
  );
}
