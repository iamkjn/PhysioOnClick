"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Avatar } from "@/components/avatar";
import {
  getDependents,
  addDependent,
  deleteDependent,
  type Dependent,
} from "@/lib/dependents";

export default function PeoplePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/patient");
        return;
      }
      setUid(u.uid);
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
        {dependents.map((dep) => (
          <div
            key={dep.id}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <Avatar name={dep.name} imageUrl={dep.avatarUrl} size={52} />
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", color: "#0C2A38" }}>{dep.name}</strong>
              <span style={{ fontSize: 13, color: "#5E7A84" }}>
                {dep.relationship} · DOB {dep.dob}
              </span>
              {dep.notes && (
                <span
                  style={{ display: "block", fontSize: 12, color: "#9CA3AF", marginTop: 2 }}
                >
                  {dep.notes}
                </span>
              )}
            </div>
            <button
              onClick={() => handleDelete(dep.id, dep.name)}
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
        ))}
        {dependents.length === 0 && !showForm && (
          <p style={{ color: "#5E7A84" }}>
            No people added yet. Add a family member or friend to book on their behalf.
          </p>
        )}
      </div>

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
          <form onSubmit={handleAdd} style={{ display: "grid", gap: "0.75rem" }}>
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
