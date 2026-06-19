# Web Account & People Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/patient/account` page mirroring the mobile Profile tab, and bring `/patient/people` to feature parity with the mobile My People screen.

**Architecture:** Two new reusable components (`RehabProgramsSection`, `SavedBlogsSection`) are built first, then assembled into a new `app/patient/account/page.tsx`. The `/patient/people` page is updated in place with a "You" card, inline edit mode, and age display. The main `/patient` page gets one new quick-link pill.

**Tech Stack:** Next.js 15 App Router, React 19, Firebase Auth + Firestore, TypeScript, inline styles (matching existing patterns in this codebase).

## Global Constraints

- No test suite configured — verification is TypeScript compilation (`npm run build`) + manual browser check at `http://localhost:3000`.
- All Firestore access via the client-side `db` from `@/lib/firebase` (guard with `if (!db) return`).
- Auth via `getAuth()` from `firebase/auth` (not imported `auth` from `@/lib/firebase` — match the pattern used in `app/patient/people/page.tsx`).
- Inline styles only — no new CSS classes, follow the pattern in `app/patient/people/page.tsx`.
- `updateDependent` already exists in `lib/dependents.ts` — no changes to that file needed.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `components/rehab-programs-section.tsx` | **Create** | Reads `rehabPrograms` by `patientEmail`, renders programme cards |
| `components/saved-blogs-section.tsx` | **Create** | Reads `patients/{uid}/favoriteBlogs`, renders saved article list |
| `app/patient/account/page.tsx` | **Create** | Account page: user card + sign-out + quick links + profile editor + rehab + blogs + uploads |
| `app/patient/page.tsx` | **Modify** | Add "My Account" quick-link pill alongside existing two |
| `app/patient/people/page.tsx` | **Modify** | Add "You" card, edit mode per dependent, age display |

---

## Task 1: RehabProgramsSection component

**Files:**
- Create: `components/rehab-programs-section.tsx`

**Interfaces:**
- Produces: `export function RehabProgramsSection({ email }: { email: string }): JSX.Element`
- Consumed by: Task 3 (`app/patient/account/page.tsx`)

- [ ] **Step 1: Create the file**

```tsx
// components/rehab-programs-section.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface RehabProgram {
  id: string;
  title: string;
  stage: string;
  notes: string;
  goals: string[];
  exerciseIds: string[];
}

export function RehabProgramsSection({ email }: { email: string }) {
  const [programs, setPrograms] = useState<RehabProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !email) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "rehabPrograms"),
      where("patientEmail", "==", email)
    );
    getDocs(q)
      .then((snap) => {
        setPrograms(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as RehabProgram))
        );
      })
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) return <p style={{ color: "#5E7A84" }}>Loading rehab programmes…</p>;

  if (programs.length === 0) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "1rem 1.25rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <p style={{ margin: 0, color: "#5E7A84" }}>No rehab programme assigned yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {programs.map((p) => (
        <div
          key={p.id}
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "1.25rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <strong style={{ display: "block", color: "#0C2A38", fontSize: 16, marginBottom: 4 }}>
            {p.title}
          </strong>
          {p.stage && (
            <span style={{ fontSize: 13, color: "#5E7A84", display: "block", marginBottom: 8 }}>
              {p.stage}
            </span>
          )}
          {p.notes && (
            <p style={{ margin: "0 0 0.75rem", fontSize: 14 }}>{p.notes}</p>
          )}
          {p.goals.length > 0 && (
            <>
              <span style={{ fontWeight: 700, fontSize: 13, display: "block", marginBottom: 6 }}>
                Goals
              </span>
              <ul style={{ margin: "0 0 0.75rem", paddingLeft: "1.25rem" }}>
                {p.goals.map((g, i) => (
                  <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>
                    {g}
                  </li>
                ))}
              </ul>
            </>
          )}
          {p.exerciseIds.length > 0 && (
            <span style={{ fontSize: 12, color: "#5E7A84" }}>
              {p.exerciseIds.length} exercise{p.exerciseIds.length !== 1 ? "s" : ""} assigned
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error|RehabPrograms"
```

Expected: no errors mentioning `rehab-programs-section`.

- [ ] **Step 3: Commit**

```bash
git add components/rehab-programs-section.tsx
git commit -m "feat(patient): add RehabProgramsSection component"
```

---

## Task 2: SavedBlogsSection component

**Files:**
- Create: `components/saved-blogs-section.tsx`

**Interfaces:**
- Produces: `export function SavedBlogsSection({ uid }: { uid: string }): JSX.Element`
- Consumed by: Task 3 (`app/patient/account/page.tsx`)

- [ ] **Step 1: Create the file**

```tsx
// components/saved-blogs-section.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface SavedBlog {
  id: string;
  title: string;
  category: string;
}

export function SavedBlogsSection({ uid }: { uid: string }) {
  const [blogs, setBlogs] = useState<SavedBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !uid) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "patients", uid, "favoriteBlogs"),
      orderBy("savedAt", "desc")
    );
    getDocs(q)
      .then((snap) => {
        setBlogs(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedBlog))
        );
      })
      .finally(() => setLoading(false));
  }, [uid]);

  if (loading) return <p style={{ color: "#5E7A84" }}>Loading saved articles…</p>;

  if (blogs.length === 0) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "1rem 1.25rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <p style={{ margin: 0, color: "#5E7A84" }}>
          No saved articles yet. Star a blog article to add it here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {blogs.map((b) => (
        <div
          key={b.id}
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <span style={{ color: "#E0A106", fontSize: 18, lineHeight: 1 }}>★</span>
          <div>
            <strong style={{ display: "block", fontSize: 14, color: "#0C2A38" }}>
              {b.title}
            </strong>
            {b.category && (
              <span style={{ fontSize: 12, color: "#5E7A84" }}>{b.category}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error|SavedBlogs"
```

Expected: no errors mentioning `saved-blogs-section`.

- [ ] **Step 3: Commit**

```bash
git add components/saved-blogs-section.tsx
git commit -m "feat(patient): add SavedBlogsSection component"
```

---

## Task 3: New `/patient/account` page

**Files:**
- Create: `app/patient/account/page.tsx`

**Interfaces:**
- Consumes: `RehabProgramsSection({ email })` from Task 1
- Consumes: `SavedBlogsSection({ uid })` from Task 2
- Consumes: `PatientProfileEditor()` from `components/patient-profile-editor.tsx` (existing, no props)
- Consumes: `UploadPanel()` from `components/upload-panel.tsx` (existing, no props)
- Consumes: `getAuth`, `onAuthStateChanged`, `signOut` from `firebase/auth`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p app/patient/account
```

```tsx
// app/patient/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";

import { PatientProfileEditor } from "@/components/patient-profile-editor";
import { RehabProgramsSection } from "@/components/rehab-programs-section";
import { SavedBlogsSection } from "@/components/saved-blogs-section";
import { UploadPanel } from "@/components/upload-panel";

export default function AccountPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/patient");
        return;
      }
      setUid(user.uid);
      setDisplayName(user.displayName || "Patient");
      setEmail(user.email || "");
    });
  }, [router]);

  async function handleSignOut() {
    const auth = getAuth();
    await signOut(auth);
    router.push("/patient");
  }

  if (!uid) return null;

  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "#D8F3F9",
    color: "#0E7490",
    padding: "0.6rem 1.25rem",
    borderRadius: 999,
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
  };

  const sectionHeadingStyle: React.CSSProperties = {
    color: "#0C2A38",
    fontSize: 18,
    fontWeight: 700,
    margin: "0 0 0.75rem",
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      {/* User info card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
        }}
      >
        <h1 style={{ margin: "0 0 0.25rem", color: "#0C2A38", fontSize: 22 }}>
          {displayName}
        </h1>
        <p style={{ margin: "0 0 1rem", color: "#5E7A84", fontSize: 14 }}>{email}</p>
        <button
          onClick={() => void handleSignOut()}
          style={{
            background: "none",
            border: "1px solid #D1E8EE",
            borderRadius: 10,
            padding: "0.5rem 1.25rem",
            cursor: "pointer",
            color: "#5E7A84",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Sign out
        </button>
      </div>

      {/* Quick links */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "2rem",
        }}
      >
        <Link href="/patient/people" style={pillStyle}>👨‍👩‍👧 My People</Link>
        <Link href="/patient/appointments" style={pillStyle}>📋 My Appointments</Link>
      </div>

      {/* Profile details */}
      <div style={{ marginBottom: "2rem" }}>
        <PatientProfileEditor />
      </div>

      {/* Rehab programmes */}
      <h2 style={sectionHeadingStyle}>Rehab programmes</h2>
      <div style={{ marginBottom: "2rem" }}>
        <RehabProgramsSection email={email} />
      </div>

      {/* Saved articles */}
      <h2 style={sectionHeadingStyle}>Saved articles</h2>
      <div style={{ marginBottom: "2rem" }}>
        <SavedBlogsSection uid={uid} />
      </div>

      {/* Uploads */}
      <h2 style={sectionHeadingStyle}>Secure document uploads</h2>
      <UploadPanel />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error|account"
```

Expected: no errors mentioning `account`.

- [ ] **Step 3: Manual browser check**

Start dev server (`npm run dev`), sign in at `http://localhost:3000/patient`, then navigate to `http://localhost:3000/patient/account`.

Verify:
- User's name and email appear in the card
- Sign Out button works (redirects to `/patient`)
- My People and My Appointments links work
- PatientProfileEditor loads
- Rehab section shows "No rehab programme assigned yet." or actual programmes
- Saved articles section shows "No saved articles yet." or actual articles
- Upload panel renders

- [ ] **Step 4: Commit**

```bash
git add app/patient/account/page.tsx
git commit -m "feat(patient): add /patient/account page with user card, rehab, blogs, uploads"
```

---

## Task 4: Add "My Account" link to `/patient` page

**Files:**
- Modify: `app/patient/page.tsx` (lines 40–75, the quick-link section)

**Interfaces:**
- No new interfaces. Adds one `<Link>` using the exact same inline style as the existing two pills.

- [ ] **Step 1: Add the third quick-link pill**

In `app/patient/page.tsx`, find this block (around line 56):

```tsx
        <Link
          href="/patient/people"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#D8F3F9",
            color: "#0E7490",
            padding: "0.6rem 1.25rem",
            borderRadius: 999,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          👨‍👩‍👧 My People
        </Link>
```

Add the following immediately after that `</Link>`:

```tsx
        <Link
          href="/patient/account"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#D8F3F9",
            color: "#0E7490",
            padding: "0.6rem 1.25rem",
            borderRadius: 999,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          👤 My Account
        </Link>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep "error"
```

Expected: no errors.

- [ ] **Step 3: Manual browser check**

Navigate to `http://localhost:3000/patient`. Verify the three pills — My Appointments, My People, My Account — all appear and the My Account link navigates to `/patient/account`.

- [ ] **Step 4: Commit**

```bash
git add app/patient/page.tsx
git commit -m "feat(patient): add My Account quick-link on patient dashboard"
```

---

## Task 5: Update `/patient/people` — "You" card, edit mode, age display

**Files:**
- Modify: `app/patient/people/page.tsx` (full rewrite of the file)

**Interfaces:**
- Consumes: `updateDependent(id: string, data: Partial<Pick<Dependent, "name" | "dob" | "relationship" | "notes" | "avatarUrl">>): Promise<void>` from `@/lib/dependents` (already exported)
- Consumes: `Avatar` from `@/components/avatar` (already used in this file)

- [ ] **Step 1: Replace the file with the updated version**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep "error"
```

Expected: no errors.

- [ ] **Step 3: Manual browser check**

Navigate to `http://localhost:3000/patient/people` while signed in. Verify:
- Your own name appears at the top with a "You" badge
- Each dependent shows `{relationship} · {N} years old` (not raw DOB)
- Clicking Edit on a dependent expands the inline form pre-filled with their data
- Saving the edit form updates the card and collapses the form
- Cancel collapses the form without saving
- Add person and Remove still work as before

- [ ] **Step 4: Commit**

```bash
git add app/patient/people/page.tsx
git commit -m "feat(patient): My People — You card, edit mode, age display"
```
