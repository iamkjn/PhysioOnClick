# Recovery Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/patient/recovery` dashboard where patients log daily pain scores and exercise adherence, physios record clinical assessments, and both can export a full PDF report — with multi-person support and a matching Flutter admin section.

**Architecture:** All recovery data lives under `patients/{uid}/people/{personId}/` sub-collections in Firestore (4 collections: `painLogs`, `clinicalAssessments`, `assignedExercises`, `exerciseLogs`). The web layer uses client-side Firestore reads/writes matching the existing `PatientLiveOverview` pattern. The Flutter admin section extends `RootShell` with a role-gated 5th tab.

**Tech Stack:** Next.js 15 App Router, React 19, Firebase Firestore (client SDK), Recharts (already installed), `html2canvas` + `jspdf` (new), Flutter 3.x + `cloud_firestore`.

## Global Constraints

- No test suite — verify with `npm run dev` (web) and `flutter run` (mobile) and manual UI checks
- All Firestore writes are client-side — no server functions or API routes
- Follow existing patterns: components are `"use client"` when they use hooks/Firestore; pages are server components
- `personId === uid` for the account holder; `personId === dependent.id` for dependents (from the `dependents` Firestore collection)
- Admin role detected via `request.auth.token.admin == true || request.auth.token.email == "admin@physioonclick.co.uk"` in Firestore rules; in Flutter, read `users/{uid}.role` from Firestore on sign-in
- Date keys use `YYYY-MM-DD` format (ISO local date, not UTC)
- Recharts is already installed — do not add another charting library
- Teal line = patient self-reported (`#0891B2`); Navy line = physio clinical (`#0C2A38`)

---

## File Map

**New — web**
- `lib/recovery.ts` — all TypeScript types + Firestore helpers for recovery sub-collections
- `components/person-switcher.tsx` — dropdown: "Me" + dependents, emits `personId`
- `components/pain-check-in.tsx` — slider 0–10 + note + submit, idempotent daily write
- `components/recovery-chart.tsx` — Recharts LineChart over 56 days of real data
- `components/assigned-exercises.tsx` — assigned exercise cards with daily checkboxes
- `components/adherence-bar.tsx` — "N of 7 days this week" progress bar
- `components/download-report-button.tsx` — html2canvas + jsPDF export
- `components/admin-patient-selector.tsx` — search patients, pick person
- `components/admin-exercise-assigner.tsx` — assign/remove exercises per person
- `components/admin-clinical-entry.tsx` — physio post-session form
- `components/admin-recovery-chart.tsx` — read-only RecoveryChart wrapper
- `app/patient/recovery/page.tsx` — patient-facing recovery page
- `app/admin/recovery/page.tsx` — physio admin recovery management page

**Modified — web**
- `firestore.rules` — add `clinicalAssessments` write-protection rule
- `app/patient/page.tsx` — add "My Recovery" nav pill, remove `ProgressChart` import

**New — Flutter**
- `mobile_app/lib/src/features/admin/recovery/recovery_service.dart` — Dart Firestore helpers mirroring `lib/recovery.ts`
- `mobile_app/lib/src/features/admin/recovery/admin_patient_list_screen.dart` — patient search screen
- `mobile_app/lib/src/features/admin/recovery/admin_recovery_panel_screen.dart` — exercise assign + clinical entry + read-only chart

**Modified — Flutter**
- `mobile_app/lib/src/features/root/root_shell.dart` — dynamic 5th "Manage" tab for admin role

---

## Task 1: Firestore security rules — clinical assessment write protection

**Files:**
- Modify: `firestore.rules`

**Interfaces:**
- Produces: `clinicalAssessments` sub-path is read-only for patients, write-only for admins

- [ ] **Step 1: Add the specific rule before the wildcard**

Open `firestore.rules`. Find the existing wildcard rule:
```
match /patients/{userId}/{document=**} {
  allow read, write: if isAdmin() || (isSignedIn() && request.auth.uid == userId);
}
```

Add this block immediately **before** that wildcard rule (Firestore uses the most specific match):

```
match /patients/{userId}/people/{personId}/clinicalAssessments/{date} {
  allow read: if isAdmin() || (isSignedIn() && request.auth.uid == userId);
  allow write: if isAdmin();
}
```

The wildcard below it handles all other sub-collection paths (painLogs, assignedExercises, exerciseLogs) with patient read/write access.

- [ ] **Step 2: Deploy rules**

```bash
firebase deploy --only firestore:rules
```

Expected: `Deploy complete!`

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat(recovery): restrict clinicalAssessments writes to admin only"
```

---

## Task 2: Recovery data library (`lib/recovery.ts`)

**Files:**
- Create: `lib/recovery.ts`

**Interfaces:**
- Produces:
  - `PainLog { date: string; score: number; note: string; loggedAt: Date }`
  - `ClinicalAssessment { date: string; painScore: number; mobilityScore: number; physioNotes: string; sessionId: string; recordedAt: Date }`
  - `AssignedExercise { exerciseId: string; assignedAt: Date; assignedBy: string; active: boolean }`
  - `ExerciseLog { date: string; completions: Record<string, boolean>; loggedAt: Date }`
  - `recoveryPaths(uid, personId)` → Firestore `CollectionReference` helpers
  - `logPainScore(uid, personId, score, note?)` → `Promise<void>`
  - `getTodayPainLog(uid, personId)` → `Promise<PainLog | null>`
  - `getPainLogs(uid, personId, days?)` → `Promise<PainLog[]>`
  - `getClinicalAssessments(uid, personId, days?)` → `Promise<ClinicalAssessment[]>`
  - `getAssignedExercises(uid, personId)` → `Promise<AssignedExercise[]>`
  - `getTodayExerciseLog(uid, personId)` → `Promise<ExerciseLog | null>`
  - `toggleExerciseCompletion(uid, personId, exerciseId, done)` → `Promise<void>`
  - `getExerciseLogs(uid, personId, days?)` → `Promise<ExerciseLog[]>`
  - `assignExercise(uid, personId, exerciseId, physioUid)` → `Promise<void>`
  - `removeExercise(uid, personId, exerciseId)` → `Promise<void>`
  - `addClinicalAssessment(uid, personId, data)` → `Promise<void>`

- [ ] **Step 1: Create the file**

```typescript
// lib/recovery.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PainLog {
  date: string;
  score: number;
  note: string;
  loggedAt: Date;
}

export interface ClinicalAssessment {
  date: string;
  painScore: number;
  mobilityScore: number;
  physioNotes: string;
  sessionId: string;
  recordedAt: Date;
}

export interface AssignedExercise {
  exerciseId: string;
  assignedAt: Date;
  assignedBy: string;
  active: boolean;
}

export interface ExerciseLog {
  date: string;
  completions: Record<string, boolean>;
  loggedAt: Date;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function personBase(uid: string, personId: string) {
  if (!db) throw new Error("Firestore not available");
  return doc(db, "patients", uid, "people", personId);
}

export async function logPainScore(
  uid: string,
  personId: string,
  score: number,
  note = ""
): Promise<void> {
  const ref = doc(personBase(uid, personId), "painLogs", todayKey());
  await setDoc(ref, { score, note, loggedAt: serverTimestamp() }, { merge: true });
}

export async function getTodayPainLog(
  uid: string,
  personId: string
): Promise<PainLog | null> {
  const ref = doc(personBase(uid, personId), "painLogs", todayKey());
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    date: snap.id,
    score: d.score as number,
    note: (d.note as string) ?? "",
    loggedAt: (d.loggedAt as { toDate(): Date })?.toDate() ?? new Date(),
  };
}

export async function getPainLogs(
  uid: string,
  personId: string,
  days = 56
): Promise<PainLog[]> {
  const col = collection(personBase(uid, personId), "painLogs");
  const q = query(col, orderBy("__name__", "desc"), limit(days));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    date: d.id,
    score: d.data().score as number,
    note: (d.data().note as string) ?? "",
    loggedAt: (d.data().loggedAt as { toDate(): Date })?.toDate() ?? new Date(),
  })).reverse();
}

export async function getClinicalAssessments(
  uid: string,
  personId: string,
  days = 56
): Promise<ClinicalAssessment[]> {
  const col = collection(personBase(uid, personId), "clinicalAssessments");
  const q = query(col, orderBy("__name__", "desc"), limit(days));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    date: d.id,
    painScore: d.data().painScore as number,
    mobilityScore: d.data().mobilityScore as number,
    physioNotes: (d.data().physioNotes as string) ?? "",
    sessionId: (d.data().sessionId as string) ?? "",
    recordedAt: (d.data().recordedAt as { toDate(): Date })?.toDate() ?? new Date(),
  })).reverse();
}

export async function getAssignedExercises(
  uid: string,
  personId: string
): Promise<AssignedExercise[]> {
  const col = collection(personBase(uid, personId), "assignedExercises");
  const snap = await getDocs(col);
  return snap.docs
    .map((d) => ({
      exerciseId: d.id,
      assignedAt: (d.data().assignedAt as { toDate(): Date })?.toDate() ?? new Date(),
      assignedBy: (d.data().assignedBy as string) ?? "",
      active: (d.data().active as boolean) ?? true,
    }))
    .filter((e) => e.active);
}

export async function getTodayExerciseLog(
  uid: string,
  personId: string
): Promise<ExerciseLog | null> {
  const ref = doc(personBase(uid, personId), "exerciseLogs", todayKey());
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return {
    date: snap.id,
    completions: (snap.data().completions as Record<string, boolean>) ?? {},
    loggedAt: (snap.data().loggedAt as { toDate(): Date })?.toDate() ?? new Date(),
  };
}

export async function toggleExerciseCompletion(
  uid: string,
  personId: string,
  exerciseId: string,
  done: boolean
): Promise<void> {
  const ref = doc(personBase(uid, personId), "exerciseLogs", todayKey());
  await setDoc(
    ref,
    { completions: { [exerciseId]: done }, loggedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getExerciseLogs(
  uid: string,
  personId: string,
  days = 7
): Promise<ExerciseLog[]> {
  const col = collection(personBase(uid, personId), "exerciseLogs");
  const q = query(col, orderBy("__name__", "desc"), limit(days));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    date: d.id,
    completions: (d.data().completions as Record<string, boolean>) ?? {},
    loggedAt: (d.data().loggedAt as { toDate(): Date })?.toDate() ?? new Date(),
  })).reverse();
}

export async function assignExercise(
  uid: string,
  personId: string,
  exerciseId: string,
  physioUid: string
): Promise<void> {
  const ref = doc(personBase(uid, personId), "assignedExercises", exerciseId);
  await setDoc(ref, {
    exerciseId,
    assignedAt: serverTimestamp(),
    assignedBy: physioUid,
    active: true,
  });
}

export async function removeExercise(
  uid: string,
  personId: string,
  exerciseId: string
): Promise<void> {
  const ref = doc(personBase(uid, personId), "assignedExercises", exerciseId);
  await updateDoc(ref, { active: false });
}

export async function addClinicalAssessment(
  uid: string,
  personId: string,
  data: {
    date: string;
    painScore: number;
    mobilityScore: number;
    physioNotes: string;
    sessionId?: string;
  }
): Promise<void> {
  const ref = doc(personBase(uid, personId), "clinicalAssessments", data.date);
  await setDoc(ref, {
    painScore: data.painScore,
    mobilityScore: data.mobilityScore,
    physioNotes: data.physioNotes,
    sessionId: data.sessionId ?? "",
    recordedAt: serverTimestamp(),
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -40
```

Expected: No errors in `lib/recovery.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/recovery.ts
git commit -m "feat(recovery): add Firestore recovery data library"
```

---

## Task 3: PersonSwitcher component

**Files:**
- Create: `components/person-switcher.tsx`

**Interfaces:**
- Consumes: `getDependents(uid)` from `lib/dependents` (existing), `auth` from `lib/firebase`
- Produces: `<PersonSwitcher uid={string} onSelect={(personId: string, name: string) => void} />` — renders a `<select>` with "Me" first, then each dependent

- [ ] **Step 1: Create the component**

```tsx
// components/person-switcher.tsx
"use client";

import { useEffect, useState } from "react";
import { getDependents, type Dependent } from "@/lib/dependents";

interface Props {
  uid: string;
  displayName: string;
  onSelect: (personId: string, name: string) => void;
}

export function PersonSwitcher({ uid, displayName, onSelect }: Props) {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [selected, setSelected] = useState(uid);

  useEffect(() => {
    getDependents(uid).then(setDependents);
  }, [uid]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelected(val);
    const name = val === uid ? displayName : (dependents.find((d) => d.id === val)?.name ?? "");
    onSelect(val, name);
  }

  if (dependents.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <label style={{ fontWeight: 600, fontSize: 14, color: "#0C2A38" }}>
        Viewing recovery for:
      </label>
      <select
        value={selected}
        onChange={handleChange}
        style={{
          padding: "0.4rem 0.75rem",
          borderRadius: 10,
          border: "1px solid #D1E8EE",
          fontSize: 14,
          color: "#0C2A38",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        <option value={uid}>{displayName} (Me)</option>
        {dependents.map((dep) => (
          <option key={dep.id} value={dep.id}>
            {dep.name} ({dep.relationship})
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/person-switcher.tsx
git commit -m "feat(recovery): add PersonSwitcher component"
```

---

## Task 4: PainCheckIn component

**Files:**
- Create: `components/pain-check-in.tsx`

**Interfaces:**
- Consumes: `logPainScore`, `getTodayPainLog` from `lib/recovery`
- Produces: `<PainCheckIn uid={string} personId={string} />` — slider + submit, disabled if today already logged

- [ ] **Step 1: Create the component**

```tsx
// components/pain-check-in.tsx
"use client";

import { useEffect, useState } from "react";
import { getTodayPainLog, logPainScore, type PainLog } from "@/lib/recovery";

interface Props {
  uid: string;
  personId: string;
}

const COLOURS = ["#16a34a","#22c55e","#4ade80","#86efac","#fbbf24","#fb923c","#f97316","#ef4444","#dc2626","#b91c1c","#7f1d1d"];

export function PainCheckIn({ uid, personId }: Props) {
  const [score, setScore] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [todayLog, setTodayLog] = useState<PainLog | null | undefined>(undefined);

  useEffect(() => {
    setTodayLog(undefined);
    getTodayPainLog(uid, personId).then(setTodayLog);
  }, [uid, personId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await logPainScore(uid, personId, score, note);
      setTodayLog({ date: new Date().toISOString().slice(0, 10), score, note, loggedAt: new Date() });
    } finally {
      setSaving(false);
    }
  }

  if (todayLog === undefined) {
    return (
      <div className="panel stack">
        <h3>Today&apos;s pain check-in</h3>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (todayLog !== null) {
    return (
      <div className="panel stack">
        <h3>Today&apos;s pain check-in</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: COLOURS[todayLog.score],
            }}
          >
            {todayLog.score}
          </span>
          <span style={{ color: "#5E7A84", fontSize: 14 }}>/10</span>
        </div>
        {todayLog.note && <p className="muted">{todayLog.note}</p>}
        <p className="muted" style={{ fontSize: 12 }}>
          Logged today — come back tomorrow to log again.
        </p>
      </div>
    );
  }

  return (
    <div className="panel stack">
      <h3>Today&apos;s pain check-in</h3>
      <p className="muted">How is your pain right now? 0 = no pain, 10 = worst possible.</p>
      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#5E7A84" }}>No pain (0)</span>
            <span
              style={{ fontSize: 28, fontWeight: 800, color: COLOURS[score] }}
            >
              {score}
            </span>
            <span style={{ fontSize: 13, color: "#5E7A84" }}>Worst (10)</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            style={{ width: "100%", accentColor: COLOURS[score] }}
          />
        </div>
        <input
          type="text"
          placeholder="Optional note (e.g. sharp pain when walking)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            padding: "0.6rem 0.85rem",
            border: "1px solid #D1E8EE",
            borderRadius: 10,
            fontSize: 14,
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            background: "#0891B2",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "0.65rem 1.5rem",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: 15,
          }}
        >
          {saving ? "Saving…" : "Log pain score"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/pain-check-in.tsx
git commit -m "feat(recovery): add PainCheckIn component"
```

---

## Task 5: RecoveryChart component

**Files:**
- Create: `components/recovery-chart.tsx`

**Interfaces:**
- Consumes: `getPainLogs`, `getClinicalAssessments` from `lib/recovery`
- Produces: `<RecoveryChart uid={string} personId={string} chartRef?: React.RefObject<HTMLDivElement> />` — live Recharts line chart, two lines, 56 days

- [ ] **Step 1: Create the component**

```tsx
// components/recovery-chart.tsx
"use client";

import { useEffect, useState, forwardRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getPainLogs, getClinicalAssessments } from "@/lib/recovery";

interface ChartPoint {
  date: string;
  patientPain?: number;
  physioScore?: number;
}

interface Props {
  uid: string;
  personId: string;
}

export const RecoveryChart = forwardRef<HTMLDivElement, Props>(
  function RecoveryChart({ uid, personId }, ref) {
    const [data, setData] = useState<ChartPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      setLoading(true);
      Promise.all([
        getPainLogs(uid, personId, 56),
        getClinicalAssessments(uid, personId, 56),
      ]).then(([painLogs, assessments]) => {
        const map = new Map<string, ChartPoint>();
        for (const log of painLogs) {
          map.set(log.date, { date: log.date, patientPain: log.score });
        }
        for (const a of assessments) {
          const existing = map.get(a.date) ?? { date: a.date };
          map.set(a.date, { ...existing, physioScore: a.painScore });
        }
        const sorted = Array.from(map.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        );
        setData(sorted);
        setLoading(false);
      });
    }, [uid, personId]);

    return (
      <div className="panel stack" ref={ref}>
        <h3>Recovery progress</h3>
        <p className="muted">Pain score trend over the last 56 days.</p>
        {loading ? (
          <p className="muted">Loading chart…</p>
        ) : data.length === 0 ? (
          <p className="muted">No data yet — log your first pain check-in above.</p>
        ) : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data}>
                <XAxis
                  dataKey="date"
                  stroke="#51708d"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis stroke="#51708d" domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="patientPain"
                  name="Self-reported"
                  stroke="#0891B2"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="physioScore"
                  name="Physio assessment"
                  stroke="#0C2A38"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  }
);
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/recovery-chart.tsx
git commit -m "feat(recovery): add live RecoveryChart with Recharts"
```

---

## Task 6: AssignedExercises + AdherenceBar components

**Files:**
- Create: `components/assigned-exercises.tsx`
- Create: `components/adherence-bar.tsx`

**Interfaces:**
- Consumes: `getAssignedExercises`, `getTodayExerciseLog`, `toggleExerciseCompletion`, `getExerciseLogs` from `lib/recovery`; `exercises` from `lib/site-data` (existing static array, has `id`, `title`, `bodyPart`, `description`)
- Produces:
  - `<AssignedExercises uid={string} personId={string} />` — exercise cards with daily checkboxes
  - `<AdherenceBar uid={string} personId={string} />` — "N of 7 days this week" bar

- [ ] **Step 1: Check the exercise data shape**

```bash
grep -A 8 "exercises" /Users/iamkjn/Documents/Playground/lib/site-data.ts | head -30
```

Confirm each exercise has at minimum: `id: string`, `title: string`, `bodyPart: string`, `description: string`.

- [ ] **Step 2: Create AssignedExercises**

```tsx
// components/assigned-exercises.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getAssignedExercises,
  getTodayExerciseLog,
  toggleExerciseCompletion,
  type AssignedExercise,
  type ExerciseLog,
} from "@/lib/recovery";
import { exercises } from "@/lib/site-data";

interface Props {
  uid: string;
  personId: string;
}

export function AssignedExercises({ uid, personId }: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[]>([]);
  const [todayLog, setTodayLog] = useState<ExerciseLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAssignedExercises(uid, personId),
      getTodayExerciseLog(uid, personId),
    ]).then(([a, log]) => {
      setAssigned(a);
      setTodayLog(log);
      setLoading(false);
    });
  }, [uid, personId]);

  async function handleToggle(exerciseId: string, done: boolean) {
    await toggleExerciseCompletion(uid, personId, exerciseId, done);
    setTodayLog((prev) => ({
      date: new Date().toISOString().slice(0, 10),
      completions: { ...(prev?.completions ?? {}), [exerciseId]: done },
      loggedAt: new Date(),
    }));
  }

  if (loading) return <p className="muted">Loading exercises…</p>;
  if (assigned.length === 0)
    return (
      <div className="panel stack">
        <h3>Your exercises</h3>
        <p className="muted">No exercises assigned yet — your physio will add them after your session.</p>
      </div>
    );

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  return (
    <div className="panel stack">
      <h3>Your exercises</h3>
      <p className="muted">Tick off each exercise as you complete it today.</p>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {assigned.map((ae) => {
          const ex = exerciseMap.get(ae.exerciseId);
          if (!ex) return null;
          const done = todayLog?.completions?.[ae.exerciseId] ?? false;
          return (
            <label
              key={ae.exerciseId}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                background: done ? "#F0FDF4" : "#F8FBFD",
                border: `1px solid ${done ? "#86efac" : "#D1E8EE"}`,
                borderRadius: 12,
                padding: "0.85rem 1rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => void handleToggle(ae.exerciseId, e.target.checked)}
                style={{ marginTop: 3, accentColor: "#0891B2", width: 18, height: 18 }}
              />
              <div>
                <strong style={{ display: "block", color: "#0C2A38" }}>{ex.title}</strong>
                <span style={{ fontSize: 13, color: "#5E7A84" }}>
                  {ex.bodyPart} · {ex.description}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create AdherenceBar**

```tsx
// components/adherence-bar.tsx
"use client";

import { useEffect, useState } from "react";
import { getExerciseLogs } from "@/lib/recovery";

interface Props {
  uid: string;
  personId: string;
}

export function AdherenceBar({ uid, personId }: Props) {
  const [daysCompleted, setDaysCompleted] = useState<number | null>(null);

  useEffect(() => {
    getExerciseLogs(uid, personId, 7).then((logs) => {
      const completed = logs.filter((log) =>
        Object.values(log.completions).some(Boolean)
      ).length;
      setDaysCompleted(completed);
    });
  }, [uid, personId]);

  if (daysCompleted === null) return null;

  const pct = Math.round((daysCompleted / 7) * 100);

  return (
    <div className="panel stack">
      <h3>This week&apos;s adherence</h3>
      <p className="muted">{daysCompleted} of 7 days with exercises completed.</p>
      <div
        style={{
          background: "#E0F2FE",
          borderRadius: 999,
          height: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: pct >= 70 ? "#0891B2" : pct >= 40 ? "#f59e0b" : "#ef4444",
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: "#5E7A84" }}>{pct}% this week</span>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add components/assigned-exercises.tsx components/adherence-bar.tsx
git commit -m "feat(recovery): add AssignedExercises and AdherenceBar components"
```

---

## Task 7: DownloadReportButton component + PDF export

**Files:**
- Create: `components/download-report-button.tsx`

**Interfaces:**
- Consumes: `getPainLogs`, `getClinicalAssessments`, `getAssignedExercises`, `getExerciseLogs` from `lib/recovery`; `html2canvas` and `jspdf` (new deps)
- Produces: `<DownloadReportButton uid={string} personId={string} personName={string} chartRef: React.RefObject<HTMLDivElement> />` — button that captures the chart div and generates a PDF

- [ ] **Step 1: Install pdf dependencies**

```bash
npm install html2canvas jspdf
```

Expected: Both packages added to `package.json`.

- [ ] **Step 2: Create the component**

```tsx
// components/download-report-button.tsx
"use client";

import { useRef, useState } from "react";
import {
  getPainLogs,
  getClinicalAssessments,
  getAssignedExercises,
  getExerciseLogs,
} from "@/lib/recovery";
import { exercises as allExercises } from "@/lib/site-data";

interface Props {
  uid: string;
  personId: string;
  personName: string;
  chartRef: React.RefObject<HTMLDivElement | null>;
}

export function DownloadReportButton({ uid, personId, personName, chartRef }: Props) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      const [html2canvas, { jsPDF }] = await Promise.all([
        import("html2canvas").then((m) => m.default),
        import("jspdf"),
      ]);

      const [painLogs, assessments, assignedExercises, exerciseLogs] = await Promise.all([
        getPainLogs(uid, personId, 56),
        getClinicalAssessments(uid, personId, 56),
        getAssignedExercises(uid, personId),
        getExerciseLogs(uid, personId, 56),
      ]);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = margin;

      const brand = "#0891B2";
      const dark = "#0C2A38";
      const muted = "#5E7A84";

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(dark);
      pdf.text("PhysioOnClick Recovery Report", margin, y);
      y += 8;
      pdf.setFontSize(11);
      pdf.setTextColor(muted);
      pdf.text(`Patient: ${personName}`, margin, y);
      y += 6;
      pdf.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, margin, y);
      y += 10;

      // Chart image
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const imgH = (canvas.height / canvas.width) * contentW;
        pdf.addImage(imgData, "PNG", margin, y, contentW, imgH);
        y += imgH + 8;
      }

      // Pain log table
      if (painLogs.length > 0) {
        if (y > 240) { pdf.addPage(); y = margin; }
        pdf.setFontSize(13);
        pdf.setTextColor(dark);
        pdf.text("Self-Reported Pain Log", margin, y);
        y += 6;
        pdf.setFontSize(9);
        pdf.setTextColor(muted);
        painLogs.slice(-20).forEach((log) => {
          if (y > 270) { pdf.addPage(); y = margin; }
          pdf.text(`${log.date}  Score: ${log.score}/10${log.note ? `  Note: ${log.note}` : ""}`, margin, y);
          y += 5;
        });
        y += 4;
      }

      // Clinical assessments table
      if (assessments.length > 0) {
        if (y > 240) { pdf.addPage(); y = margin; }
        pdf.setFontSize(13);
        pdf.setTextColor(dark);
        pdf.text("Physio Clinical Assessments", margin, y);
        y += 6;
        pdf.setFontSize(9);
        pdf.setTextColor(muted);
        assessments.forEach((a) => {
          if (y > 270) { pdf.addPage(); y = margin; }
          pdf.text(`${a.date}  Pain: ${a.painScore}/10  Mobility: ${a.mobilityScore}/10`, margin, y);
          y += 5;
          if (a.physioNotes) {
            const lines = pdf.splitTextToSize(`Notes: ${a.physioNotes}`, contentW);
            pdf.text(lines as string[], margin, y);
            y += (lines as string[]).length * 5;
          }
        });
        y += 4;
      }

      // Adherence summary
      if (exerciseLogs.length > 0) {
        if (y > 240) { pdf.addPage(); y = margin; }
        pdf.setFontSize(13);
        pdf.setTextColor(dark);
        pdf.text("Exercise Adherence", margin, y);
        y += 6;
        pdf.setFontSize(9);
        pdf.setTextColor(muted);
        exerciseLogs.forEach((log) => {
          if (y > 270) { pdf.addPage(); y = margin; }
          const count = Object.values(log.completions).filter(Boolean).length;
          const total = Object.keys(log.completions).length;
          pdf.text(`${log.date}  ${count}/${total} exercises completed`, margin, y);
          y += 5;
        });
        y += 4;
      }

      // Assigned exercises list
      if (assignedExercises.length > 0) {
        if (y > 240) { pdf.addPage(); y = margin; }
        pdf.setFontSize(13);
        pdf.setTextColor(dark);
        pdf.text("Assigned Exercises", margin, y);
        y += 6;
        pdf.setFontSize(9);
        pdf.setTextColor(muted);
        const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));
        assignedExercises.forEach((ae) => {
          if (y > 270) { pdf.addPage(); y = margin; }
          const ex = exerciseMap.get(ae.exerciseId);
          if (ex) {
            pdf.text(`• ${ex.title} (${ex.bodyPart})`, margin, y);
            y += 5;
          }
        });
      }

      pdf.save(`${personName.replace(/\s+/g, "_")}_recovery_report.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      onClick={() => void handleDownload()}
      disabled={generating}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        background: generating ? "#D1E8EE" : "#0C2A38",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        padding: "0.6rem 1.25rem",
        fontWeight: 700,
        fontSize: 14,
        cursor: generating ? "not-allowed" : "pointer",
      }}
    >
      {generating ? "Generating PDF…" : "Download PDF report"}
    </button>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: No errors. `html2canvas` and `jspdf` are dynamic imports so they don't affect SSR.

- [ ] **Step 4: Commit**

```bash
git add components/download-report-button.tsx package.json package-lock.json
git commit -m "feat(recovery): add PDF report download with html2canvas + jspdf"
```

---

## Task 8: Patient recovery page

**Files:**
- Create: `app/patient/recovery/page.tsx`

**Interfaces:**
- Consumes: all patient-facing components from Tasks 3–7; `auth` from `lib/firebase`
- Produces: `/patient/recovery` — auth-gated page composing all recovery components

- [ ] **Step 1: Create the page**

```tsx
// app/patient/recovery/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PersonSwitcher } from "@/components/person-switcher";
import { PainCheckIn } from "@/components/pain-check-in";
import { RecoveryChart } from "@/components/recovery-chart";
import { AssignedExercises } from "@/components/assigned-exercises";
import { AdherenceBar } from "@/components/adherence-bar";
import { DownloadReportButton } from "@/components/download-report-button";

export default function RecoveryPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [personId, setPersonId] = useState<string | null>(null);
  const [personName, setPersonName] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setPersonId(user.uid);
        const name = user.displayName || user.email || "Patient";
        setDisplayName(name);
        setPersonName(name);
      } else {
        setUid(null);
        setPersonId(null);
      }
    });
  }, []);

  if (!uid || !personId) {
    return (
      <div className="site-shell">
        <section className="page-section stack">
          <p className="muted">Please sign in to view your recovery dashboard.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Recovery dashboard</span>
          <h1>Track your recovery progress.</h1>
          <p className="lead">Log daily pain scores, tick off exercises, and download your full report.</p>
        </div>
      </section>

      <section className="page-section stack" style={{ gap: "0.5rem" }}>
        <PersonSwitcher
          uid={uid}
          displayName={displayName}
          onSelect={(id, name) => {
            setPersonId(id);
            setPersonName(name);
          }}
        />
        <DownloadReportButton
          uid={uid}
          personId={personId}
          personName={personName}
          chartRef={chartRef}
        />
      </section>

      <section className="page-section dashboard-grid">
        <PainCheckIn uid={uid} personId={personId} />
        <AdherenceBar uid={uid} personId={personId} />
      </section>

      <section className="page-section">
        <RecoveryChart ref={chartRef} uid={uid} personId={personId} />
      </section>

      <section className="page-section">
        <AssignedExercises uid={uid} personId={personId} />
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/patient/recovery/page.tsx
git commit -m "feat(recovery): add /patient/recovery page"
```

---

## Task 9: Update patient portal nav + retire dummy ProgressChart

**Files:**
- Modify: `app/patient/page.tsx`

**Interfaces:**
- Produces: "My Recovery" pill in nav; `ProgressChart` import removed

- [ ] **Step 1: Add nav pill and remove ProgressChart**

In `app/patient/page.tsx`:

1. Remove this import:
```tsx
import { ProgressChart } from "@/components/progress-chart";
```

2. Add a new `<Link>` pill after the "My People" pill (copy the same inline style):
```tsx
<Link
  href="/patient/recovery"
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
  📈 My Recovery
</Link>
```

3. Remove the `<ProgressChart />` JSX element and its containing grid section (or replace with a teaser card linking to `/patient/recovery`).

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: No errors. (`progress-chart.tsx` file can stay on disk for now — it's simply unused.)

- [ ] **Step 3: Start dev server and verify the link appears**

```bash
npm run dev
```

Open `http://localhost:3000/patient`. Confirm "My Recovery" pill appears in the nav row and clicking it navigates to `/patient/recovery`.

- [ ] **Step 4: Commit**

```bash
git add app/patient/page.tsx
git commit -m "feat(recovery): add My Recovery nav link to patient portal"
```

---

## Task 10: Admin web components

**Files:**
- Create: `components/admin-patient-selector.tsx`
- Create: `components/admin-exercise-assigner.tsx`
- Create: `components/admin-clinical-entry.tsx`
- Create: `components/admin-recovery-chart.tsx`

**Interfaces:**
- Consumes: `getDocs`, `collection` from firebase/firestore; `assignExercise`, `removeExercise`, `addClinicalAssessment`, `getAssignedExercises` from `lib/recovery`; `exercises` from `lib/site-data`; `getDependents` from `lib/dependents`; `RecoveryChart` from Task 5
- Produces:
  - `<AdminPatientSelector onSelect={(uid, personId, personName) => void} />`
  - `<AdminExerciseAssigner adminUid={string} patientUid={string} personId={string} />`
  - `<AdminClinicalEntry patientUid={string} personId={string} />`
  - `<AdminRecoveryChart patientUid={string} personId={string} />`

- [ ] **Step 1: Create AdminPatientSelector**

```tsx
// components/admin-patient-selector.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDependents } from "@/lib/dependents";

interface PatientRecord {
  uid: string;
  displayName: string;
  email: string;
}

interface Props {
  onSelect: (patientUid: string, personId: string, personName: string) => void;
}

export function AdminPatientSelector({ onSelect }: Props) {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [personOptions, setPersonOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!db) return;
    getDocs(collection(db, "patients")).then((snap) => {
      setPatients(
        snap.docs.map((d) => ({
          uid: d.id,
          displayName: (d.data().displayName as string) || "Unnamed",
          email: (d.data().email as string) || "",
        }))
      );
    });
  }, []);

  async function selectPatient(p: PatientRecord) {
    setSelectedPatient(p);
    const deps = await getDependents(p.uid);
    const options = [
      { id: p.uid, name: `${p.displayName} (account holder)` },
      ...deps.map((d) => ({ id: d.id, name: `${d.name} (${d.relationship})` })),
    ];
    setPersonOptions(options);
    onSelect(p.uid, p.uid, p.displayName);
  }

  const filtered = patients.filter(
    (p) =>
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="panel stack">
      <h3>Select patient</h3>
      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "0.6rem 0.85rem",
          border: "1px solid #D1E8EE",
          borderRadius: 10,
          fontSize: 14,
          width: "100%",
          boxSizing: "border-box",
        }}
      />
      {!selectedPatient && (
        <div style={{ display: "grid", gap: "0.5rem", maxHeight: 240, overflowY: "auto" }}>
          {filtered.map((p) => (
            <button
              key={p.uid}
              onClick={() => void selectPatient(p)}
              style={{
                textAlign: "left",
                background: "#F8FBFD",
                border: "1px solid #D1E8EE",
                borderRadius: 10,
                padding: "0.6rem 0.85rem",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              <strong style={{ color: "#0C2A38" }}>{p.displayName}</strong>
              <span style={{ color: "#5E7A84", marginLeft: 8 }}>{p.email}</span>
            </button>
          ))}
        </div>
      )}
      {selectedPatient && personOptions.length > 1 && (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <p className="muted">Select person:</p>
          {personOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(selectedPatient.uid, opt.id, opt.name)}
              style={{
                textAlign: "left",
                background: "#F8FBFD",
                border: "1px solid #D1E8EE",
                borderRadius: 10,
                padding: "0.6rem 0.85rem",
                cursor: "pointer",
                fontSize: 14,
                color: "#0C2A38",
              }}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
      {selectedPatient && (
        <button
          onClick={() => { setSelectedPatient(null); setPersonOptions([]); }}
          style={{ background: "none", border: "none", color: "#0891B2", cursor: "pointer", fontSize: 13, textAlign: "left" }}
        >
          ← Change patient
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create AdminExerciseAssigner**

```tsx
// components/admin-exercise-assigner.tsx
"use client";

import { useEffect, useState } from "react";
import { assignExercise, removeExercise, getAssignedExercises, type AssignedExercise } from "@/lib/recovery";
import { exercises as allExercises } from "@/lib/site-data";

interface Props {
  adminUid: string;
  patientUid: string;
  personId: string;
}

export function AdminExerciseAssigner({ adminUid, patientUid, personId }: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    getAssignedExercises(patientUid, personId).then(setAssigned);
  }, [patientUid, personId]);

  const assignedIds = new Set(assigned.map((a) => a.exerciseId));
  const unassigned = allExercises.filter((e) => !assignedIds.has(e.id));
  const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));

  async function handleAssign(exerciseId: string) {
    setSaving(exerciseId);
    await assignExercise(patientUid, personId, exerciseId, adminUid);
    const updated = await getAssignedExercises(patientUid, personId);
    setAssigned(updated);
    setSaving(null);
  }

  async function handleRemove(exerciseId: string) {
    setSaving(exerciseId);
    await removeExercise(patientUid, personId, exerciseId);
    const updated = await getAssignedExercises(patientUid, personId);
    setAssigned(updated);
    setSaving(null);
  }

  return (
    <div className="panel stack">
      <h3>Assigned exercises</h3>
      {assigned.length === 0 && <p className="muted">None assigned yet.</p>}
      {assigned.map((ae) => {
        const ex = exerciseMap.get(ae.exerciseId);
        return (
          <div key={ae.exerciseId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #E8F4F8" }}>
            <span style={{ fontSize: 14, color: "#0C2A38" }}>{ex?.title ?? ae.exerciseId}</span>
            <button
              onClick={() => void handleRemove(ae.exerciseId)}
              disabled={saving === ae.exerciseId}
              style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              {saving === ae.exerciseId ? "…" : "Remove"}
            </button>
          </div>
        );
      })}
      {unassigned.length > 0 && (
        <>
          <h4 style={{ marginBottom: 0, color: "#0C2A38" }}>Add exercise</h4>
          {unassigned.map((ex) => (
            <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid #E8F4F8" }}>
              <span style={{ fontSize: 13, color: "#5E7A84" }}>{ex.title} · {ex.bodyPart}</span>
              <button
                onClick={() => void handleAssign(ex.id)}
                disabled={saving === ex.id}
                style={{ background: "#0891B2", color: "#fff", border: "none", borderRadius: 8, padding: "0.3rem 0.75rem", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >
                {saving === ex.id ? "…" : "Assign"}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create AdminClinicalEntry**

```tsx
// components/admin-clinical-entry.tsx
"use client";

import { useState } from "react";
import { addClinicalAssessment } from "@/lib/recovery";

interface Props {
  patientUid: string;
  personId: string;
}

export function AdminClinicalEntry({ patientUid, personId }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [painScore, setPainScore] = useState(5);
  const [mobilityScore, setMobilityScore] = useState(5);
  const [physioNotes, setPhysioNotes] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await addClinicalAssessment(patientUid, personId, { date, painScore, mobilityScore, physioNotes, sessionId });
    setSaved(true);
    setSaving(false);
    setPhysioNotes("");
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.6rem 0.85rem",
    border: "1px solid #D1E8EE",
    borderRadius: 10,
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div className="panel stack">
      <h3>Add clinical assessment</h3>
      {saved && <p style={{ color: "#16a34a", fontSize: 14 }}>Saved successfully.</p>}
      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "grid", gap: "0.75rem" }}>
        <label style={{ fontSize: 13, color: "#5E7A84" }}>
          Session date
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSaved(false); }} style={{ ...inputStyle, marginTop: 4 }} required />
        </label>
        <label style={{ fontSize: 13, color: "#5E7A84" }}>
          Pain score: <strong style={{ color: "#0C2A38" }}>{painScore}/10</strong>
          <input type="range" min={0} max={10} value={painScore} onChange={(e) => setPainScore(Number(e.target.value))} style={{ width: "100%", marginTop: 4, accentColor: "#0891B2" }} />
        </label>
        <label style={{ fontSize: 13, color: "#5E7A84" }}>
          Mobility score: <strong style={{ color: "#0C2A38" }}>{mobilityScore}/10</strong>
          <input type="range" min={0} max={10} value={mobilityScore} onChange={(e) => setMobilityScore(Number(e.target.value))} style={{ width: "100%", marginTop: 4, accentColor: "#0891B2" }} />
        </label>
        <label style={{ fontSize: 13, color: "#5E7A84" }}>
          Clinical notes
          <textarea
            value={physioNotes}
            onChange={(e) => { setPhysioNotes(e.target.value); setSaved(false); }}
            rows={3}
            placeholder="What was worked on, patient response, next steps…"
            style={{ ...inputStyle, marginTop: 4, resize: "vertical" }}
          />
        </label>
        <label style={{ fontSize: 13, color: "#5E7A84" }}>
          Booking ID (optional)
          <input type="text" value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="bookings/…" style={{ ...inputStyle, marginTop: 4 }} />
        </label>
        <button
          type="submit"
          disabled={saving}
          style={{ background: "#0C2A38", color: "#fff", border: "none", borderRadius: 12, padding: "0.65rem 1.5rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 15 }}
        >
          {saving ? "Saving…" : "Save assessment"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create AdminRecoveryChart (thin wrapper)**

```tsx
// components/admin-recovery-chart.tsx
"use client";

import { RecoveryChart } from "@/components/recovery-chart";

interface Props {
  patientUid: string;
  personId: string;
}

export function AdminRecoveryChart({ patientUid, personId }: Props) {
  return <RecoveryChart uid={patientUid} personId={personId} />;
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add components/admin-patient-selector.tsx components/admin-exercise-assigner.tsx components/admin-clinical-entry.tsx components/admin-recovery-chart.tsx
git commit -m "feat(recovery): add admin web components for recovery management"
```

---

## Task 11: Admin recovery web page

**Files:**
- Create: `app/admin/recovery/page.tsx`

**Interfaces:**
- Consumes: all admin components from Task 10; `auth` from `lib/firebase`
- Produces: `/admin/recovery` — physio management page

- [ ] **Step 1: Check existing admin page pattern**

```bash
ls /Users/iamkjn/Documents/Playground/app/admin/
```

Note the folder structure and any existing layout or auth-guard patterns in sibling pages.

- [ ] **Step 2: Create the admin recovery page**

```tsx
// app/admin/recovery/page.tsx
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AdminPatientSelector } from "@/components/admin-patient-selector";
import { AdminExerciseAssigner } from "@/components/admin-exercise-assigner";
import { AdminClinicalEntry } from "@/components/admin-clinical-entry";
import { AdminRecoveryChart } from "@/components/admin-recovery-chart";

export default function AdminRecoveryPage() {
  const [adminUid, setAdminUid] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ patientUid: string; personId: string; personName: string } | null>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      setAdminUid(user?.uid ?? null);
    });
  }, []);

  if (!adminUid) {
    return (
      <div className="site-shell">
        <section className="page-section stack">
          <p className="muted">Admin access required.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Admin</span>
          <h1>Patient recovery management</h1>
          <p className="lead">Assign exercises and record clinical assessments for any patient.</p>
        </div>
      </section>

      <section className="page-section dashboard-grid">
        <AdminPatientSelector
          onSelect={(patientUid, personId, personName) =>
            setSelection({ patientUid, personId, personName })
          }
        />
        {selection && (
          <AdminRecoveryChart
            patientUid={selection.patientUid}
            personId={selection.personId}
          />
        )}
      </section>

      {selection && (
        <section className="page-section dashboard-grid">
          <AdminExerciseAssigner
            adminUid={adminUid}
            patientUid={selection.patientUid}
            personId={selection.personId}
          />
          <AdminClinicalEntry
            patientUid={selection.patientUid}
            personId={selection.personId}
          />
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build and smoke test**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Then:
```bash
npm run dev
```

Open `http://localhost:3000/admin/recovery`. Sign in with the admin account. Confirm: patient selector appears, selecting a patient shows the chart + assigner + clinical entry panels.

- [ ] **Step 4: Commit**

```bash
git add app/admin/recovery/page.tsx
git commit -m "feat(recovery): add /admin/recovery page for physio management"
```

---

## Task 12: Flutter recovery data service

**Files:**
- Create: `mobile_app/lib/src/features/admin/recovery/recovery_service.dart`

**Interfaces:**
- Produces (Dart):
  - `class RecoveryService` with static methods mirroring `lib/recovery.ts`:
    - `static CollectionReference<Map<String,dynamic>> _personBase(String uid, String personId)`
    - `static Future<void> addClinicalAssessment(String uid, String personId, {...})`
    - `static Future<void> assignExercise(String uid, String personId, String exerciseId, String physioUid)`
    - `static Future<void> removeExercise(String uid, String personId, String exerciseId)`
    - `static Stream<QuerySnapshot> watchPainLogs(String uid, String personId, int days)`
    - `static Stream<QuerySnapshot> watchClinicalAssessments(String uid, String personId, int days)`
    - `static Stream<QuerySnapshot> watchAssignedExercises(String uid, String personId)`
    - `static Future<List<Map<String,dynamic>>> getPatients()`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p /Users/iamkjn/Documents/Playground/mobile_app/lib/src/features/admin/recovery
```

- [ ] **Step 2: Create the service**

```dart
// mobile_app/lib/src/features/admin/recovery/recovery_service.dart
import 'package:cloud_firestore/cloud_firestore.dart';

class RecoveryService {
  RecoveryService._();

  static final _db = FirebaseFirestore.instance;

  static DocumentReference<Map<String, dynamic>> _personBase(
      String uid, String personId) {
    return _db
        .collection('patients')
        .doc(uid)
        .collection('people')
        .doc(personId);
  }

  static Future<void> addClinicalAssessment(
    String uid,
    String personId, {
    required String date,
    required int painScore,
    required int mobilityScore,
    required String physioNotes,
    String sessionId = '',
  }) async {
    await _personBase(uid, personId)
        .collection('clinicalAssessments')
        .doc(date)
        .set({
      'painScore': painScore,
      'mobilityScore': mobilityScore,
      'physioNotes': physioNotes,
      'sessionId': sessionId,
      'recordedAt': FieldValue.serverTimestamp(),
    });
  }

  static Future<void> assignExercise(
    String uid,
    String personId,
    String exerciseId,
    String physioUid,
  ) async {
    await _personBase(uid, personId)
        .collection('assignedExercises')
        .doc(exerciseId)
        .set({
      'exerciseId': exerciseId,
      'assignedAt': FieldValue.serverTimestamp(),
      'assignedBy': physioUid,
      'active': true,
    });
  }

  static Future<void> removeExercise(
      String uid, String personId, String exerciseId) async {
    await _personBase(uid, personId)
        .collection('assignedExercises')
        .doc(exerciseId)
        .update({'active': false});
  }

  static Stream<QuerySnapshot<Map<String, dynamic>>> watchPainLogs(
      String uid, String personId, int days) {
    return _personBase(uid, personId)
        .collection('painLogs')
        .orderBy(FieldPath.documentId, descending: true)
        .limit(days)
        .snapshots();
  }

  static Stream<QuerySnapshot<Map<String, dynamic>>> watchClinicalAssessments(
      String uid, String personId, int days) {
    return _personBase(uid, personId)
        .collection('clinicalAssessments')
        .orderBy(FieldPath.documentId, descending: true)
        .limit(days)
        .snapshots();
  }

  static Stream<QuerySnapshot<Map<String, dynamic>>> watchAssignedExercises(
      String uid, String personId) {
    return _personBase(uid, personId)
        .collection('assignedExercises')
        .where('active', isEqualTo: true)
        .snapshots();
  }

  static Future<List<Map<String, dynamic>>> getPatients() async {
    final snap = await _db.collection('patients').get();
    return snap.docs
        .map((d) => {'uid': d.id, ...d.data()})
        .toList();
  }
}
```

- [ ] **Step 3: Verify Dart analysis**

```bash
cd /Users/iamkjn/Documents/Playground/mobile_app && dart analyze lib/src/features/admin/recovery/recovery_service.dart 2>&1
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add mobile_app/lib/src/features/admin/recovery/recovery_service.dart
git commit -m "feat(recovery): add Flutter RecoveryService Firestore layer"
```

---

## Task 13: Flutter admin screens

**Files:**
- Create: `mobile_app/lib/src/features/admin/recovery/admin_patient_list_screen.dart`
- Create: `mobile_app/lib/src/features/admin/recovery/admin_recovery_panel_screen.dart`

**Interfaces:**
- Consumes: `RecoveryService` from Task 12; `PeopleRepository` (existing at `lib/src/features/people/people_repository.dart`); `Dependent` model (existing)
- Produces:
  - `class AdminPatientListScreen extends StatefulWidget` — searchable list → taps into `AdminRecoveryPanelScreen`
  - `class AdminRecoveryPanelScreen extends StatefulWidget` requiring `String patientUid`, `String patientName`, `String personId`, `String personName` — shows chart streams, exercise assigner, clinical entry form

- [ ] **Step 1: Create AdminPatientListScreen**

```dart
// mobile_app/lib/src/features/admin/recovery/admin_patient_list_screen.dart
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../features/people/people_repository.dart';
import 'recovery_service.dart';
import 'admin_recovery_panel_screen.dart';

class AdminPatientListScreen extends StatefulWidget {
  const AdminPatientListScreen({super.key});

  @override
  State<AdminPatientListScreen> createState() => _AdminPatientListScreenState();
}

class _AdminPatientListScreenState extends State<AdminPatientListScreen> {
  List<Map<String, dynamic>> _patients = [];
  String _search = '';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    RecoveryService.getPatients().then((list) {
      setState(() {
        _patients = list;
        _loading = false;
      });
    });
  }

  void _selectPatient(Map<String, dynamic> patient) async {
    final uid = patient['uid'] as String;
    final name = (patient['displayName'] as String?) ?? 'Patient';
    final deps = await PeopleRepository().watchDependents(uid).first;

    if (!mounted) return;

    if (deps.isEmpty) {
      Navigator.push(context, MaterialPageRoute(builder: (_) =>
        AdminRecoveryPanelScreen(
          patientUid: uid, patientName: name,
          personId: uid, personName: name,
        )));
      return;
    }

    final options = [
      {'id': uid, 'name': '$name (account holder)'},
      ...deps.map((d) => {'id': d.id, 'name': '${d.name} (${d.relationship})'}),
    ];

    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      builder: (_) => ListView(
        shrinkWrap: true,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('Select person', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          ...options.map((opt) => ListTile(
            title: Text(opt['name']!),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(context, MaterialPageRoute(builder: (_) =>
                AdminRecoveryPanelScreen(
                  patientUid: uid, patientName: name,
                  personId: opt['id']!, personName: opt['name']!,
                )));
            },
          )),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _patients.where((p) {
      final n = ((p['displayName'] as String?) ?? '').toLowerCase();
      final e = ((p['email'] as String?) ?? '').toLowerCase();
      return n.contains(_search.toLowerCase()) || e.contains(_search.toLowerCase());
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Patient Recovery')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search by name or email…',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          if (_loading)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else
            Expanded(
              child: ListView.builder(
                itemCount: filtered.length,
                itemBuilder: (_, i) {
                  final p = filtered[i];
                  return ListTile(
                    leading: const CircleAvatar(child: Icon(Icons.person)),
                    title: Text((p['displayName'] as String?) ?? 'Unnamed'),
                    subtitle: Text((p['email'] as String?) ?? ''),
                    onTap: () => _selectPatient(p),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 2: Create AdminRecoveryPanelScreen**

```dart
// mobile_app/lib/src/features/admin/recovery/admin_recovery_panel_screen.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'recovery_service.dart';

class AdminRecoveryPanelScreen extends StatefulWidget {
  const AdminRecoveryPanelScreen({
    super.key,
    required this.patientUid,
    required this.patientName,
    required this.personId,
    required this.personName,
  });

  final String patientUid;
  final String patientName;
  final String personId;
  final String personName;

  @override
  State<AdminRecoveryPanelScreen> createState() => _AdminRecoveryPanelScreenState();
}

class _AdminRecoveryPanelScreenState extends State<AdminRecoveryPanelScreen> {
  final _notesCtrl = TextEditingController();
  int _painScore = 5;
  int _mobilityScore = 5;
  String _date = DateTime.now().toIso8601String().substring(0, 10);
  bool _saving = false;
  bool _saved = false;

  Future<void> _saveClinical() async {
    setState(() { _saving = true; _saved = false; });
    await RecoveryService.addClinicalAssessment(
      widget.patientUid, widget.personId,
      date: _date,
      painScore: _painScore,
      mobilityScore: _mobilityScore,
      physioNotes: _notesCtrl.text.trim(),
    );
    setState(() { _saving = false; _saved = true; _notesCtrl.clear(); });
  }

  Future<void> _assign(String exerciseId) async {
    final physio = FirebaseAuth.instance.currentUser;
    if (physio == null) return;
    await RecoveryService.assignExercise(
        widget.patientUid, widget.personId, exerciseId, physio.uid);
  }

  Future<void> _remove(String exerciseId) async {
    await RecoveryService.removeExercise(
        widget.patientUid, widget.personId, exerciseId);
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.personName),
        subtitle: Text(widget.patientName, style: const TextStyle(fontSize: 12)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Pain trend (last 14 days)
          const Text('Pain trend (last 14 days)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
            stream: RecoveryService.watchPainLogs(widget.patientUid, widget.personId, 14),
            builder: (_, snap) {
              if (!snap.hasData) return const LinearProgressIndicator();
              final docs = snap.data!.docs.reversed.toList();
              if (docs.isEmpty) return const Text('No pain logs yet.', style: TextStyle(color: Colors.grey));
              return Column(
                children: docs.map((d) {
                  final score = d.data()['score'] as int? ?? 0;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    child: Row(children: [
                      SizedBox(width: 80, child: Text(d.id, style: const TextStyle(fontSize: 12, color: Colors.grey))),
                      Expanded(child: LinearProgressIndicator(value: score / 10, color: const Color(0xFF0891B2), backgroundColor: const Color(0xFFE0F2FE))),
                      const SizedBox(width: 8),
                      Text('$score/10', style: const TextStyle(fontWeight: FontWeight.bold)),
                    ]),
                  );
                }).toList(),
              );
            },
          ),
          const Divider(height: 32),

          // Clinical assessment form
          const Text('Add clinical assessment', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          if (_saved) const Text('Saved!', style: TextStyle(color: Color(0xFF16a34a))),
          Text('Pain score: $_painScore/10'),
          Slider(value: _painScore.toDouble(), min: 0, max: 10, divisions: 10, label: '$_painScore', onChanged: (v) => setState(() => _painScore = v.round()), activeColor: const Color(0xFF0891B2)),
          Text('Mobility score: $_mobilityScore/10'),
          Slider(value: _mobilityScore.toDouble(), min: 0, max: 10, divisions: 10, label: '$_mobilityScore', onChanged: (v) => setState(() => _mobilityScore = v.round()), activeColor: const Color(0xFF0891B2)),
          TextField(
            controller: _notesCtrl,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Clinical notes…',
              border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
            ),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: _saving ? null : () => _saveClinical(),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0C2A38), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: Text(_saving ? 'Saving…' : 'Save assessment'),
          ),
          const Divider(height: 32),

          // Assigned exercises
          const Text('Assigned exercises', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
            stream: RecoveryService.watchAssignedExercises(widget.patientUid, widget.personId),
            builder: (_, snap) {
              if (!snap.hasData) return const LinearProgressIndicator();
              final assigned = snap.data!.docs;
              if (assigned.isEmpty) return const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('None assigned.', style: TextStyle(color: Colors.grey)));
              return Column(
                children: assigned.map((d) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(d.id),
                  trailing: TextButton(
                    onPressed: () => _remove(d.id),
                    child: const Text('Remove', style: TextStyle(color: Colors.red)),
                  ),
                )).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 3: Verify Dart analysis**

```bash
cd /Users/iamkjn/Documents/Playground/mobile_app && dart analyze lib/src/features/admin/ 2>&1
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add mobile_app/lib/src/features/admin/
git commit -m "feat(recovery): add Flutter admin patient list and recovery panel screens"
```

---

## Task 14: Flutter RootShell — dynamic admin tab

**Files:**
- Modify: `mobile_app/lib/src/features/root/root_shell.dart`

**Interfaces:**
- Consumes: `AdminPatientListScreen` from Task 13; `FirebaseFirestore` for role lookup; `FirebaseAuth` for current user
- Produces: `RootShell` dynamically shows 5th "Manage" tab when `users/{uid}.role == "admin"`

- [ ] **Step 1: Update RootShell**

Replace `mobile_app/lib/src/features/root/root_shell.dart` with:

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../admin/recovery/admin_patient_list_screen.dart';
import '../booking/booking_screen.dart';
import '../booking/who_is_this_for_screen.dart';
import '../chat/chat_page.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../services/services_screen.dart';

class RootShell extends StatefulWidget {
  const RootShell({super.key});

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int currentIndex = 0;
  bool isAdmin = false;

  @override
  void initState() {
    super.initState();
    _checkAdminRole();
  }

  Future<void> _checkAdminRole() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final snap = await FirebaseFirestore.instance.collection('users').doc(user.uid).get();
    final role = snap.data()?['role'] as String?;
    if (role == 'admin' && mounted) {
      setState(() => isAdmin = true);
    }
  }

  List<Widget> get _screens => [
    const HomeScreen(),
    const ServicesScreen(),
    const BookingScreen(),
    const ProfileScreen(),
    if (isAdmin) const AdminPatientListScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screens = _screens;

    // clamp index in case admin tab disappears on sign-out
    final safeIndex = currentIndex.clamp(0, screens.length - 1);

    return Scaffold(
      body: IndexedStack(
        index: safeIndex,
        children: screens,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const ChatPage()),
          );
        },
        backgroundColor: const Color(0xFF0891B2),
        foregroundColor: Colors.white,
        tooltip: 'Ask the assistant',
        child: const Icon(Icons.chat_bubble_rounded),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: const Color(0xFFC8E8F0), width: 1),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavItem(icon: Icons.home_rounded, label: 'Home', selected: safeIndex == 0, onTap: () => setState(() => currentIndex = 0), primaryColor: theme.colorScheme.primary),
                _NavItem(icon: Icons.healing_rounded, label: 'Services', selected: safeIndex == 1, onTap: () => setState(() => currentIndex = 1), primaryColor: theme.colorScheme.primary),
                _NavItem(icon: Icons.calendar_month_rounded, label: 'Booking', selected: safeIndex == 2,
                  onTap: () {
                    final user = FirebaseAuth.instance.currentUser;
                    if (user != null) {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const WhoIsThisForScreen()));
                    } else {
                      setState(() => currentIndex = 2);
                    }
                  },
                  primaryColor: theme.colorScheme.primary, isHighlighted: true),
                _NavItem(icon: Icons.person_rounded, label: 'Profile', selected: safeIndex == 3, onTap: () => setState(() => currentIndex = 3), primaryColor: theme.colorScheme.primary),
                if (isAdmin)
                  _NavItem(icon: Icons.admin_panel_settings_rounded, label: 'Manage', selected: safeIndex == 4, onTap: () => setState(() => currentIndex = 4), primaryColor: theme.colorScheme.primary),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
    required this.primaryColor,
    this.isHighlighted = false,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color primaryColor;
  final bool isHighlighted;

  @override
  Widget build(BuildContext context) {
    if (isHighlighted && !selected) {
      return GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56, height: 36,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF0891B2), Color(0xFF0E7490)]),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(icon, color: Colors.white, size: 22),
            ),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: primaryColor)),
          ],
        ),
      );
    }

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 56, height: 36,
              decoration: BoxDecoration(
                color: selected ? primaryColor.withValues(alpha: 0.12) : Colors.transparent,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(icon, color: selected ? primaryColor : const Color(0xFF5E7A84), size: 22),
            ),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 11, fontWeight: selected ? FontWeight.w700 : FontWeight.w500, color: selected ? primaryColor : const Color(0xFF5E7A84))),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Verify Dart analysis**

```bash
cd /Users/iamkjn/Documents/Playground/mobile_app && dart analyze lib/src/features/root/root_shell.dart 2>&1
```

Expected: No errors.

- [ ] **Step 3: Run Flutter and verify admin tab**

```bash
cd /Users/iamkjn/Documents/Playground/mobile_app && flutter run
```

Sign in with the admin account (`admin@physioonclick.co.uk` or an account with `role: "admin"` in Firestore). Confirm:
- "Manage" tab appears in the bottom nav
- Tapping it opens `AdminPatientListScreen`
- Searching and tapping a patient pushes to `AdminRecoveryPanelScreen`
- Clinical entry saves to Firestore and shows "Saved!"

Sign in with a patient account — confirm "Manage" tab is absent.

- [ ] **Step 4: Commit**

```bash
git add mobile_app/lib/src/features/root/root_shell.dart
git commit -m "feat(recovery): add dynamic admin Manage tab to Flutter RootShell"
```
