// app/patient/people/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Skeleton, SkeletonCircle } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";
import {
  getDependents,
  addDependent,
  updateDependent,
  deleteDependent,
  type Dependent,
} from "@/lib/dependents";
import { validateName, validateDob, validateOptionalText, LIMITS } from "@/lib/validation";

function validatePerson(fields: { name: string; dob: string; notes: string }) {
  const e: Record<string, string> = {};
  if (validateName(fields.name)) e.name = "Enter the person's full name.";
  const dobErr = validateDob(fields.dob);
  if (dobErr) e.dob = dobErr;
  const notesErr = validateOptionalText(fields.notes, LIMITS.note);
  if (notesErr) e.notes = notesErr;
  return e;
}

function calcAge(dob: string): number {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  )
    age--;
  return age;
}

export default function PeoplePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [dependentsLoaded, setDependentsLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    dob: "",
    relationship: "Other",
    notes: "",
  });
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/patient");
        return;
      }
      setUid(u.uid);
      setCurrentName(u.displayName || "You");
      setCurrentEmail(u.email || "");
      getDependents(u.uid).then((deps) => {
        setDependents(deps);
        setDependentsLoaded(true);
      });
    });
  }, [router]);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!uid) return;
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const dob = fd.get("dob") as string;
    const relationship = fd.get("relationship") as string;
    const notes = (fd.get("notes") as string) ?? "";

    const errs = validatePerson({ name, dob, notes });
    setAddErrors(errs);
    if (Object.keys(errs).length) {
      toast.show("Please fix the highlighted fields.", "error");
      return;
    }

    setSaving(true);
    try {
      await addDependent(uid, { name, dob, relationship, notes });
      setDependents(await getDependents(uid));
      setShowForm(false);
      setAddErrors({});
      toast.show("Person added.", "success");
    } catch {
      toast.show("Could not add this person. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(dep: Dependent) {
    setEditingId(dep.id);
    setEditErrors({});
    setEditForm({
      name: dep.name,
      dob: dep.dob,
      relationship: dep.relationship,
      notes: dep.notes,
    });
  }

  async function handleSave(id: string) {
    if (!uid) return;
    const errs = validatePerson({ name: editForm.name, dob: editForm.dob, notes: editForm.notes });
    setEditErrors(errs);
    if (Object.keys(errs).length) {
      toast.show("Please fix the highlighted fields.", "error");
      return;
    }

    setSaving(true);
    try {
      await updateDependent(id, editForm);
      setDependents(await getDependents(uid));
      setEditingId(null);
      setEditErrors({});
      toast.show("Changes saved.", "success");
    } catch {
      toast.show("Could not save changes. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDependent(id);
      if (uid) setDependents(await getDependents(uid));
      toast.show("Person removed.", "success");
    } catch {
      toast.show("Could not remove this person. Please try again.", "error");
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    borderRadius: "var(--radius-card)",
    padding: "1rem 1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    boxShadow: "var(--shadow)",
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ margin: 0, color: "var(--color-text-primary)" }}>My People</h1>
        <button onClick={() => setShowForm(true)} className="button primary small">
          + Add person
        </button>
      </div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {/* "You" card — the signed-in user, always first, not editable */}
        {uid && (
          <div style={cardStyle}>
            <Avatar name={currentName} size={52} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ color: "var(--color-text-primary)" }}>{currentName}</strong>
                <span
                  style={{
                    background: "var(--color-primary-light)",
                    color: "var(--primary)",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "2px 8px",
                  }}
                >
                  You
                </span>
              </div>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                Your account · {currentEmail}
              </span>
            </div>
          </div>
        )}

        {/* Dependents */}
        {!dependentsLoaded &&
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} style={cardStyle} className="skeleton-person-card">
              <SkeletonCircle size="52px" />
              <div style={{ flex: 1 }}>
                <Skeleton height="1em" width="140px" />
                <div style={{ marginTop: "0.4rem" }}>
                  <Skeleton height="0.8em" width="180px" />
                </div>
              </div>
            </div>
          ))}

        {dependentsLoaded &&
          dependents.map((dep) =>
          editingId === dep.id ? (
            /* Inline edit form */
            <div
              key={dep.id}
              style={{
                background: "var(--color-surface)",
                borderRadius: "var(--radius-card)",
                padding: "1.25rem",
                boxShadow: "var(--shadow)",
              }}
            >
              <h2 style={{ marginTop: 0, color: "var(--color-text-primary)", fontSize: "var(--text-md)" }}>
                Edit {dep.name}
              </h2>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <label>
                  Full name *
                  <input
                    className="input"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g. Jane Doe"
                    required
                    maxLength={LIMITS.name}
                    aria-invalid={editErrors.name ? true : undefined}
                    aria-describedby={editErrors.name ? "err-edit-name" : undefined}
                  />
                  {editErrors.name && <span className="field-error" id="err-edit-name">{editErrors.name}</span>}
                </label>
                <label>
                  Date of birth *
                  <input
                    type="date"
                    className="input"
                    value={editForm.dob}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, dob: e.target.value }))
                    }
                    required
                    aria-invalid={editErrors.dob ? true : undefined}
                    aria-describedby={editErrors.dob ? "err-edit-dob" : undefined}
                  />
                  {editErrors.dob && <span className="field-error" id="err-edit-dob">{editErrors.dob}</span>}
                </label>
                <label>
                  Relationship
                  <select
                    className="input"
                    value={editForm.relationship}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, relationship: e.target.value }))
                    }
                  >
                    {["Mother", "Father", "Son", "Daughter", "Partner", "Other"].map(
                      (r) => (
                        <option key={r}>{r}</option>
                      )
                    )}
                  </select>
                </label>
                <label>
                  Medical notes <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
                  <input
                    className="input"
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder="Any conditions we should know about"
                    maxLength={LIMITS.note}
                    aria-invalid={editErrors.notes ? true : undefined}
                    aria-describedby={editErrors.notes ? "err-edit-notes" : undefined}
                  />
                  {editErrors.notes && <span className="field-error" id="err-edit-notes">{editErrors.notes}</span>}
                </label>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={() => void handleSave(dep.id)}
                    disabled={saving || !editForm.name || !editForm.dob}
                    aria-busy={saving}
                    className="button primary"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditErrors({});
                    }}
                    className="button secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Dependent card */
            <div key={dep.id} style={cardStyle}>
              <Avatar name={dep.name} imageUrl={dep.avatarUrl} size={52} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", color: "var(--color-text-primary)" }}>
                  {dep.name}
                </strong>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  {dep.relationship} · {calcAge(dep.dob)} years old
                </span>
                {dep.notes && (
                  <span
                    style={{
                      display: "block",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    {dep.notes}
                  </span>
                )}
              </div>
              <button
                onClick={() => startEdit(dep)}
                aria-label={`Edit ${dep.name}`}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  padding: "0.65rem 0.5rem",
                  minHeight: 44,
                  borderRadius: "var(--radius-chip)",
                }}
              >
                Edit
              </button>
              <button
                onClick={() => setRemoveTarget({ id: dep.id, name: dep.name })}
                aria-label={`Remove ${dep.name}`}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-error)",
                  cursor: "pointer",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  padding: "0.65rem 0.5rem",
                  minHeight: 44,
                  borderRadius: "var(--radius-chip)",
                }}
              >
                Remove
              </button>
            </div>
          )
        )}

        {dependentsLoaded && dependents.length === 0 && !showForm && (
          <EmptyState
            illustration="people"
            title="Just you for now"
            body="Add a family member or friend to book appointments on their behalf."
            cta={{ label: 'Add person', onClick: () => setShowForm(true) }}
          />
        )}
      </div>

      {/* Add person form */}
      {showForm && (
        <div
          style={{
            marginTop: "1.5rem",
            background: "var(--color-surface)",
            borderRadius: "var(--radius-panel)",
            padding: "1.5rem",
            boxShadow: "var(--shadow)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "var(--color-text-primary)", fontSize: "var(--text-md)" }}>Add a person</h2>
          <form onSubmit={(e) => void handleAdd(e)} style={{ display: "grid", gap: "0.75rem" }}>
            <label>
              Full name *
              <input
                name="name"
                className="input"
                placeholder="e.g. Jane Doe"
                required
                maxLength={LIMITS.name}
                aria-invalid={addErrors.name ? true : undefined}
                aria-describedby={addErrors.name ? "err-add-name" : undefined}
              />
              {addErrors.name && <span className="field-error" id="err-add-name">{addErrors.name}</span>}
            </label>
            <label>
              Date of birth *
              <input
                name="dob"
                type="date"
                className="input"
                required
                aria-invalid={addErrors.dob ? true : undefined}
                aria-describedby={addErrors.dob ? "err-add-dob" : undefined}
              />
              {addErrors.dob && <span className="field-error" id="err-add-dob">{addErrors.dob}</span>}
            </label>
            <label>
              Relationship *
              <select name="relationship" className="input" required>
                {["Mother", "Father", "Son", "Daughter", "Partner", "Other"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              Medical notes <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
              <input
                name="notes"
                className="input"
                placeholder="Any conditions we should know about"
                maxLength={LIMITS.note}
                aria-invalid={addErrors.notes ? true : undefined}
                aria-describedby={addErrors.notes ? "err-add-notes" : undefined}
              />
              {addErrors.notes && <span className="field-error" id="err-add-notes">{addErrors.notes}</span>}
            </label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" disabled={saving} aria-busy={saving} className="button primary">
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setAddErrors({});
                }}
                className="button secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={removeTarget !== null}
        title="Remove this person?"
        body={removeTarget ? `${removeTarget.name} will be removed from your account. This can't be undone.` : ""}
        confirmLabel="Remove"
        confirmVariant="destructive"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          const target = removeTarget;
          setRemoveTarget(null);
          if (target) void handleDelete(target.id);
        }}
      />
    </div>
  );
}
