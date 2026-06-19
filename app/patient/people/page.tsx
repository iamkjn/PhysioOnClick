// app/patient/people/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Avatar } from "@/components/avatar";
import {
  getDependents,
  addDependent,
  updateDependent,
  deleteDependent,
  type Dependent,
} from "@/lib/dependents";

function calcAge(dob: string): number {
  const d = new Date(dob);
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
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    dob: "",
    relationship: "Other",
    notes: "",
  });
  const router = useRouter();

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
      getDependents(u.uid).then(setDependents);
    });
  }, [router]);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      await addDependent(uid, {
        name: fd.get("name") as string,
        dob: fd.get("dob") as string,
        relationship: fd.get("relationship") as string,
        notes: (fd.get("notes") as string) ?? "",
      });
      setDependents(await getDependents(uid));
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(dep: Dependent) {
    setEditingId(dep.id);
    setEditForm({
      name: dep.name,
      dob: dep.dob,
      relationship: dep.relationship,
      notes: dep.notes,
    });
  }

  async function handleSave(id: string) {
    if (!uid) return;
    setSaving(true);
    try {
      await updateDependent(id, editForm);
      setDependents(await getDependents(uid));
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from your account?`)) return;
    await deleteDependent(id);
    if (uid) setDependents(await getDependents(uid));
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.6rem 0.85rem",
    border: "1px solid #D1E8EE",
    borderRadius: 10,
    fontSize: 15,
    width: "100%",
    boxSizing: "border-box",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    padding: "1rem 1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
        <h1 style={{ margin: 0, color: "#0C2A38" }}>My People</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: "#0891B2",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "0.5rem 1.25rem",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
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
                <strong style={{ color: "#0C2A38" }}>{currentName}</strong>
                <span
                  style={{
                    background: "#D8F3F9",
                    color: "#0E7490",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "2px 8px",
                  }}
                >
                  You
                </span>
              </div>
              <span style={{ fontSize: 13, color: "#5E7A84" }}>
                Your account · {currentEmail}
              </span>
            </div>
          </div>
        )}

        {/* Dependents */}
        {dependents.map((dep) =>
          editingId === dep.id ? (
            /* Inline edit form */
            <div
              key={dep.id}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "1.25rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#0C2A38", fontSize: 16 }}>
                Edit {dep.name}
              </h3>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Full name"
                  required
                  style={inputStyle}
                />
                <input
                  type="date"
                  value={editForm.dob}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, dob: e.target.value }))
                  }
                  required
                  style={inputStyle}
                />
                <select
                  value={editForm.relationship}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, relationship: e.target.value }))
                  }
                  style={inputStyle}
                >
                  {["Mother", "Father", "Son", "Daughter", "Partner", "Other"].map(
                    (r) => (
                      <option key={r}>{r}</option>
                    )
                  )}
                </select>
                <input
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Medical notes (optional)"
                  style={inputStyle}
                />
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={() => void handleSave(dep.id)}
                    disabled={saving || !editForm.name || !editForm.dob}
                    style={{
                      background: "#0891B2",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      padding: "0.6rem 1.5rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      background: "none",
                      border: "1px solid #D1E8EE",
                      borderRadius: 12,
                      padding: "0.6rem 1.25rem",
                      cursor: "pointer",
                      color: "#5E7A84",
                    }}
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
                <strong style={{ display: "block", color: "#0C2A38" }}>
                  {dep.name}
                </strong>
                <span style={{ fontSize: 13, color: "#5E7A84" }}>
                  {dep.relationship} · {calcAge(dep.dob)} years old
                </span>
                {dep.notes && (
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "#9CA3AF",
                      marginTop: 2,
                    }}
                  >
                    {dep.notes}
                  </span>
                )}
              </div>
              <button
                onClick={() => startEdit(dep)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#5E7A84",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Edit
              </button>
              <button
                onClick={() => void handleDelete(dep.id, dep.name)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#DC2626",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Remove
              </button>
            </div>
          )
        )}

        {dependents.length === 0 && !showForm && (
          <p style={{ color: "#5E7A84" }}>
            No people added yet. Add a family member or friend to book on their behalf.
          </p>
        )}
      </div>

      {/* Add person form */}
      {showForm && (
        <div
          style={{
            marginTop: "1.5rem",
            background: "#fff",
            borderRadius: 18,
            padding: "1.5rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#0C2A38" }}>Add a person</h3>
          <form onSubmit={(e) => void handleAdd(e)} style={{ display: "grid", gap: "0.75rem" }}>
            <input name="name" placeholder="Full name" required style={inputStyle} />
            <input name="dob" type="date" required style={inputStyle} />
            <select name="relationship" required style={inputStyle}>
              {["Mother", "Father", "Son", "Daughter", "Partner", "Other"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <input
              name="notes"
              placeholder="Medical notes (optional)"
              style={inputStyle}
            />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: "#0891B2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "0.6rem 1.5rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  background: "none",
                  border: "1px solid #D1E8EE",
                  borderRadius: 12,
                  padding: "0.6rem 1.25rem",
                  cursor: "pointer",
                  color: "#5E7A84",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
