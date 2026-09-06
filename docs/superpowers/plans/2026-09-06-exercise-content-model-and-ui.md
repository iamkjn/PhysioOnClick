# Exercise Content Model + UI — Implementation Plan (Plan 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a structured how-to + default-plus-override dosage model to the exercise catalogue, and rebuild the patient exercise card and admin assign-flow to surface it — degrading gracefully for exercises whose write-ups don't exist yet.

**Architecture:** `exercises` moves from `lib/site-data.ts` into a focused `lib/exercises.ts` that also owns the `ExerciseDosage` type and the pure `resolveDosage` / `formatDosage` / `validateDosage` helpers. `site-data.ts` re-exports `{ exercises, type Exercise }` so no consumer import changes. Per-patient dose overrides live on `assignedExercises/{exerciseId}.dosage` in Firestore; a per-field merge with the catalogue default gives the effective dose. The patient card uses progressive disclosure (dose + actions always visible, how-to one tap away).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Firebase Web SDK (`firebase/firestore`), Vitest + @testing-library/react (jsdom), jspdf (PDF report).

## Global Constraints

- **No `description` rename** — the field stays; mobile `ExerciseVideo.fromMap`, `seedExerciseVideos`, `suggestExercises` and the PDF all read it.
- **New `Exercise` fields are OPTIONAL** for the whole of this plan (`equipment?`, `setup?`, `steps?`, `cues?`, `mistakes?`, `defaultDosage?`, `pose?`, `retired?`). Plan 2's final batch tightens them to required.
- **No Firestore rules changes** — `assignedExercises` is already `allow read: if isAdmin() || (isSignedIn() && request.auth.uid == userId)` / `allow write: if isAdmin()` with no shape validation.
- **No mobile changes** — Flutter is web-first-then-follows; unknown Firestore fields are ignored by `fromMap`.
- **Exercise IDs are never deleted or renumbered.**
- **Dosage caps (verbatim):** `sets ≤ 10`, `reps ≤ 100`, `holdSeconds ≤ 600`, `perDay ≤ 10`, `perWeek` in `1..7`; `notes ≤ 300` chars; all numbers are non-negative integers.
- **Commit after every task.** Run `npm run test:run` before each commit; the tasks below only assert on files they touch because `tests/components/booking-flow.test.tsx` and `tests/components/toast-provider.test.tsx` have **pre-existing, unrelated flaky failures** (analytics/consent global state) — do not try to fix them here, but do not add to them.
- Branch: work on `master` (repo is trunk-based); deploy to dev with `npm run deploy:dev` after the plan completes, not per-task.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `lib/exercises.ts` (new) | `Exercise` + `ExerciseDosage` + `PoseName` types, the `exercises` array (moved verbatim), `resolveDosage`, `formatDosage`, `validateDosage` | 1 |
| `lib/site-data.ts` (modify) | remove the `exercises` array + `Exercise` type body; `export { exercises, type Exercise } from "./exercises"` | 1 |
| `tests/lib/exercises.test.ts` (new) | unit tests for the three pure helpers | 1 |
| `lib/recovery.ts` (modify) | `AssignedExercise.dosage`, `getAssignedExercises` reads it, `assignExercise(…, dosage?)`, new `setAssignedDosage` | 2 |
| `tests/lib/recovery-dosage.test.ts` (new) | mocked-Firestore tests for the recovery dosage helpers | 2 |
| `components/assigned-exercises.tsx` (modify) | dose line, per-patient note, "How to do it" expander (setup/steps/cues/mistakes/equipment) | 3 |
| `tests/components/assigned-exercises.test.tsx` (modify) | dose line + expander assertions | 3 |
| `components/admin-exercise-assigner.tsx` (modify) | effective dose per assigned row, "Edit dose" inline form, "Reset to default", hide `retired` from the picker | 4 |
| `tests/components/admin-exercise-assigner.test.tsx` (modify) | edit-dose form assertions | 4 |
| `components/download-report-button.tsx` (modify) | Assigned Exercises table → `[title, dose, description]` | 5 |
| `components/exercise-figure.tsx` (modify) | accept optional `pose` prop; `export type PoseName` | 6 |
| `tests/components/exercise-figure.test.tsx` (modify) | explicit pose honoured; unknown falls back | 6 |
| `tests/lib/exercise-content-shape.test.ts` (new) | structural safety net over all catalogue entries | 7 |

---

## Task 1: `lib/exercises.ts` — types + catalogue move + pure dosage helpers

**Files:**
- Create: `lib/exercises.ts`
- Modify: `lib/site-data.ts` (delete lines 48–61 `Exercise` type, delete lines 437–929 `exercises` array; add re-export)
- Test: `tests/lib/exercises.test.ts`

**Interfaces:**
- Produces:
  - `type ExerciseDosage = { sets?: number; reps?: number; holdSeconds?: number; perDay?: number; perWeek?: number; tempo?: string; notes?: string }`
  - `type Exercise` — existing fields plus optional `equipment?: string[]`, `setup?: string`, `steps?: string[]`, `cues?: string[]`, `mistakes?: string[]`, `defaultDosage?: ExerciseDosage`, `pose?: string`, `retired?: boolean`
  - `const exercises: Exercise[]`
  - `function resolveDosage(ex: Exercise, assigned?: { dosage?: ExerciseDosage }): ExerciseDosage`
  - `function formatDosage(d: ExerciseDosage): string`
  - `function validateDosage(d: ExerciseDosage): string | null` — returns an error message or `null`
- Consumes: `ClinicalArea` from `@/lib/assessment-forms`

`pose` is typed as `string` here (not a union) so `lib/exercises.ts` never imports from a component. Valid values are the `SPECS` keys in `components/exercise-figure.tsx`; `tests/lib/exercise-content-shape.test.ts` (Task 7) enforces that any `pose` set on a catalogue entry is a real one, and `ExerciseFigure` ignores an unknown value (falls back to name-guessing).

- [ ] **Step 1: Write the failing test**

Create `tests/lib/exercises.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveDosage, formatDosage, validateDosage, exercises, type Exercise } from '@/lib/exercises'

const base = (over: Partial<Exercise> = {}): Exercise => ({
  id: 'ex-test', title: 'Test', bodyPart: 'Knee', clinicalArea: 'lower_limb',
  tags: [], condition: '', stage: 'Early rehab', description: 'x', ...over,
})

describe('resolveDosage', () => {
  it('returns the exercise default when there is no override', () => {
    const ex = base({ defaultDosage: { sets: 3, reps: 10 } })
    expect(resolveDosage(ex)).toEqual({ sets: 3, reps: 10 })
  })
  it('merges per field — override wins, unspecified fields fall back', () => {
    const ex = base({ defaultDosage: { sets: 3, reps: 10, perDay: 1 } })
    expect(resolveDosage(ex, { dosage: { reps: 15 } })).toEqual({ sets: 3, reps: 15, perDay: 1 })
  })
  it('handles a missing default', () => {
    expect(resolveDosage(base(), { dosage: { holdSeconds: 30 } })).toEqual({ holdSeconds: 30 })
  })
  it('returns {} when neither side has anything', () => {
    expect(resolveDosage(base())).toEqual({})
  })
})

describe('formatDosage', () => {
  it('sets × reps', () => expect(formatDosage({ sets: 3, reps: 12 })).toBe('3 sets × 12 reps'))
  it('reps only', () => expect(formatDosage({ reps: 12 })).toBe('12 reps'))
  it('hold with sets', () => expect(formatDosage({ sets: 3, holdSeconds: 30 })).toBe('Hold 30s × 3'))
  it('hold only', () => expect(formatDosage({ holdSeconds: 30 })).toBe('Hold 30s'))
  it('adds once a day', () => expect(formatDosage({ sets: 3, reps: 12, perDay: 1 })).toBe('3 sets × 12 reps · once a day'))
  it('adds twice a day', () => expect(formatDosage({ reps: 10, perDay: 2 })).toBe('10 reps · twice a day'))
  it('adds N times a day', () => expect(formatDosage({ reps: 10, perDay: 3 })).toBe('10 reps · 3 times a day'))
  it('adds days a week', () => expect(formatDosage({ reps: 10, perWeek: 4 })).toBe('10 reps · 4 days a week'))
  it('empty → As advised by your physio', () => expect(formatDosage({})).toBe('As advised by your physio'))
})

describe('validateDosage', () => {
  it('accepts a normal dose', () => expect(validateDosage({ sets: 3, reps: 12, perDay: 2 })).toBeNull())
  it('rejects sets over 10', () => expect(validateDosage({ sets: 11 })).toMatch(/sets/i))
  it('rejects reps over 100', () => expect(validateDosage({ reps: 101 })).toMatch(/reps/i))
  it('rejects hold over 600', () => expect(validateDosage({ holdSeconds: 601 })).toMatch(/hold/i))
  it('rejects perWeek 0', () => expect(validateDosage({ perWeek: 0 })).toMatch(/week/i))
  it('rejects perWeek 8', () => expect(validateDosage({ perWeek: 8 })).toMatch(/week/i))
  it('rejects negative', () => expect(validateDosage({ reps: -1 })).toMatch(/whole number|negative/i))
  it('rejects non-integer', () => expect(validateDosage({ reps: 2.5 })).toMatch(/whole number/i))
  it('rejects a 301-char note', () => expect(validateDosage({ notes: 'a'.repeat(301) })).toMatch(/note/i))
})

describe('catalogue move', () => {
  it('still exports 150 exercises with stable ids', () => {
    expect(exercises.length).toBe(150)
    expect(exercises[0].id).toBe('ex-1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/exercises.test.ts`
Expected: FAIL — `Cannot find module '@/lib/exercises'`.

- [ ] **Step 3: Create `lib/exercises.ts` — move the catalogue and add helpers**

1. Create `lib/exercises.ts` starting with:

```ts
import type { ClinicalArea } from "@/lib/assessment-forms";

export type ExerciseDosage = {
  sets?: number;
  reps?: number;
  holdSeconds?: number;
  perDay?: number;
  perWeek?: number;
  tempo?: string;
  notes?: string;
};

export type Exercise = {
  id: string;
  title: string;
  bodyPart: string;
  clinicalArea: ClinicalArea;
  tags: string[];
  condition: string;
  stage: string;
  description: string;
  videoUrl?: string;
  equipment?: string[];
  setup?: string;
  steps?: string[];
  cues?: string[];
  mistakes?: string[];
  defaultDosage?: ExerciseDosage;
  pose?: string; // one of the SPECS keys in components/exercise-figure.tsx; validated by Task 7's test
  retired?: boolean;
};
```

2. Move the entire `export const exercises: Exercise[] = [ … ];` block (currently `lib/site-data.ts` lines 437–929) into `lib/exercises.ts` **unchanged**.

3. Append the helpers:

```ts
export function resolveDosage(
  ex: Exercise,
  assigned?: { dosage?: ExerciseDosage },
): ExerciseDosage {
  return { ...(ex.defaultDosage ?? {}), ...(assigned?.dosage ?? {}) };
}

function frequencyClause(d: ExerciseDosage): string | null {
  if (d.perDay != null) {
    if (d.perDay === 1) return "once a day";
    if (d.perDay === 2) return "twice a day";
    return `${d.perDay} times a day`;
  }
  if (d.perWeek != null) return `${d.perWeek} days a week`;
  return null;
}

export function formatDosage(d: ExerciseDosage): string {
  let core: string | null = null;
  if (d.holdSeconds != null) {
    core = d.sets != null ? `Hold ${d.holdSeconds}s × ${d.sets}` : `Hold ${d.holdSeconds}s`;
  } else if (d.reps != null) {
    core = d.sets != null ? `${d.sets} sets × ${d.reps} reps` : `${d.reps} reps`;
  } else if (d.sets != null) {
    core = `${d.sets} sets`;
  }
  if (core == null) return "As advised by your physio";
  const freq = frequencyClause(d);
  return freq ? `${core} · ${freq}` : core;
}

const CAPS: { key: keyof ExerciseDosage; max: number; label: string }[] = [
  { key: "sets", max: 10, label: "Sets" },
  { key: "reps", max: 100, label: "Reps" },
  { key: "holdSeconds", max: 600, label: "Hold" },
  { key: "perDay", max: 10, label: "Times per day" },
];

export function validateDosage(d: ExerciseDosage): string | null {
  for (const { key, max, label } of CAPS) {
    const v = d[key];
    if (v == null) continue;
    if (typeof v !== "number" || !Number.isInteger(v)) return `${label} must be a whole number.`;
    if (v < 0) return `${label} cannot be negative.`;
    if (v > max) return `${label} cannot be more than ${max}.`;
  }
  if (d.perWeek != null) {
    if (!Number.isInteger(d.perWeek) || d.perWeek < 1 || d.perWeek > 7) {
      return "Days per week must be between 1 and 7.";
    }
  }
  if (d.notes != null && d.notes.length > 300) return "Keep the patient note to 300 characters or fewer.";
  return null;
}
```

4. In `lib/site-data.ts`: delete the `Exercise` type (lines ~48–61) and the `exercises` array (lines ~437–929). Add near the other exports:

```ts
export { exercises, type Exercise } from "./exercises";
```

Keep `ClinicalArea` importing/usage in `site-data.ts` only if still referenced after the move; otherwise remove the now-unused import (run `npm run lint` to confirm).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/exercises.test.ts tests/lib/site-data.test.ts tests/lib/exercise-suggestions.test.ts`
Expected: PASS (all).

Run: `npx tsc --noEmit -p tsconfig.json` — expected: no new errors (there is a known pre-existing set in `tests/api/*` and `tests/lib/follow-ups.test.ts` / `tests/lib/motion.test.ts` — ignore those, confirm nothing new in `lib/` or `components/`).

- [ ] **Step 5: Commit**

```bash
git add lib/exercises.ts lib/site-data.ts tests/lib/exercises.test.ts
git commit -m "feat(exercises): extract lib/exercises.ts with dosage model + helpers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `lib/recovery.ts` — per-patient dosage on assignments

**Files:**
- Modify: `lib/recovery.ts` (`AssignedExercise` interface ~79, `getAssignedExercises` ~200, `assignExercise` ~270; add `setAssignedDosage`)
- Test: `tests/lib/recovery-dosage.test.ts` (new)

**Interfaces:**
- Consumes: `ExerciseDosage` from `@/lib/exercises` (Task 1)
- Produces:
  - `interface AssignedExercise { exerciseId; assignedAt; assignedBy; active; dosage?: ExerciseDosage }`
  - `assignExercise(uid, personId, exerciseId, physioUid, dosage?: ExerciseDosage): Promise<void>` — writes `dosage` only when passed
  - `setAssignedDosage(uid, personId, exerciseId, dosage: ExerciseDosage): Promise<void>` — `setDoc(ref, { dosage }, { merge: true })`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/recovery-dosage.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const setDoc = vi.fn().mockResolvedValue(undefined)
vi.mock('firebase/firestore', () => ({
  collection: (...a: unknown[]) => ({ __col: a }),
  doc: (...a: unknown[]) => ({ __doc: a }),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: (...a: unknown[]) => setDoc(...a),
  updateDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: () => '__ts',
}))
vi.mock('@/lib/firebase', () => ({ db: {} }))

import { assignExercise, setAssignedDosage } from '@/lib/recovery'

beforeEach(() => setDoc.mockClear())

describe('assignExercise', () => {
  it('does not write a dosage field when none is passed', async () => {
    await assignExercise('u', 'p', 'ex-1', 'admin')
    expect(setDoc.mock.calls[0][1]).not.toHaveProperty('dosage')
  })
  it('writes the dosage when passed', async () => {
    await assignExercise('u', 'p', 'ex-1', 'admin', { sets: 3, reps: 12 })
    expect(setDoc.mock.calls[0][1]).toMatchObject({ dosage: { sets: 3, reps: 12 } })
  })
})

describe('setAssignedDosage', () => {
  it('merges just the dosage field', async () => {
    await setAssignedDosage('u', 'p', 'ex-1', { reps: 15 })
    expect(setDoc.mock.calls[0][1]).toEqual({ dosage: { reps: 15 } })
    expect(setDoc.mock.calls[0][2]).toEqual({ merge: true })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/recovery-dosage.test.ts`
Expected: FAIL — `setAssignedDosage` is not exported; `assignExercise` has arity 4.

- [ ] **Step 3: Implement**

In `lib/recovery.ts`:

1. Add the import: `import type { ExerciseDosage } from "@/lib/exercises";`

2. `AssignedExercise` interface — add `dosage?: ExerciseDosage;`.

3. `getAssignedExercises` map callback — add:
```ts
      dosage: (d.data().dosage as ExerciseDosage | undefined),
```

4. `assignExercise` — new signature + conditional field:
```ts
export async function assignExercise(
  uid: string,
  personId: string,
  exerciseId: string,
  physioUid: string,
  dosage?: ExerciseDosage,
): Promise<void> {
  const ref = doc(personBase(uid, personId), "assignedExercises", exerciseId);
  await setDoc(ref, {
    exerciseId,
    assignedAt: serverTimestamp(),
    assignedBy: physioUid,
    active: true,
    ...(dosage ? { dosage } : {}),
  });
}
```

5. Add after `removeExercise`:
```ts
// Set (or replace) the per-patient dosage override on one assigned exercise.
export async function setAssignedDosage(
  uid: string,
  personId: string,
  exerciseId: string,
  dosage: ExerciseDosage,
): Promise<void> {
  const ref = doc(personBase(uid, personId), "assignedExercises", exerciseId);
  await setDoc(ref, { dosage }, { merge: true });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/recovery-dosage.test.ts tests/lib/recovery.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/recovery.ts tests/lib/recovery-dosage.test.ts
git commit -m "feat(recovery): per-patient exercise dosage override

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Patient card — dose line + "How to do it" expander

**Files:**
- Modify: `components/assigned-exercises.tsx`
- Test: `tests/components/assigned-exercises.test.tsx`

**Interfaces:**
- Consumes: `resolveDosage`, `formatDosage` from `@/lib/exercises`; `AssignedExercise.dosage` from `@/lib/recovery` (Task 2)
- Produces: no new exports — internal component change

- [ ] **Step 1: Write the failing test**

The component (Step 3) is changed to import `exercises` from `@/lib/exercises` directly (not the `@/lib/site-data` re-export), so the test mocks `@/lib/exercises` with a **fixture catalogue + the real pure helpers** via `importActual`. Add near the top of `tests/components/assigned-exercises.test.tsx`:

```ts
const FIXTURE_EX = {
  id: 'ex-fix', title: 'Fixture Raise', bodyPart: 'Ankle', clinicalArea: 'lower_limb',
  tags: [], condition: '', stage: 'Strength phase',
  description: 'A fixture exercise.', videoUrl: 'https://www.youtube.com/embed/abc',
  setup: 'Stand tall.', steps: ['Rise onto your toes', 'Lower slowly'],
  cues: ['Keep knees soft'], mistakes: ['Do not rush'],
  defaultDosage: { sets: 3, reps: 12, perDay: 1 },
}
vi.mock('@/lib/exercises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/exercises')>()
  return { ...actual, exercises: [FIXTURE_EX] }
})
```

The existing tests reference `exercises[0]` as `EXERCISE` via `import { exercises } from '@/lib/site-data'` — change that import to `'@/lib/exercises'` so all tests in the file see the fixture (`EXERCISE` becomes `FIXTURE_EX`). Adjust the existing assertions that used the old `exercises[0]` (`EXERCISE.title` → `'Fixture Raise'`, `EXERCISE.videoUrl` → the fixture's) accordingly.

Then add:

```ts
it('shows the effective dose line', async () => {
  getAssignedExercisesMock.mockResolvedValue([{ ...assignedExercise(), dosage: { reps: 15 } }])
  getTodayExerciseLogMock.mockResolvedValue(null)
  render(<AssignedExercises uid="u1" personId="p1" />)
  await waitFor(() => expect(screen.getByText('3 sets × 15 reps · once a day')).toBeInTheDocument())
})

it('reveals setup / steps / cues / mistakes on "How to do it"', async () => {
  getAssignedExercisesMock.mockResolvedValue([assignedExercise()])
  getTodayExerciseLogMock.mockResolvedValue(null)
  render(<AssignedExercises uid="u1" personId="p1" />)
  await waitFor(() => expect(screen.getByText('Fixture Raise')).toBeInTheDocument())
  expect(screen.queryByText('Rise onto your toes')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /how to do it/i }))
  expect(screen.getByText('Stand tall.')).toBeInTheDocument()
  expect(screen.getByText('Rise onto your toes')).toBeInTheDocument()
  expect(screen.getByText('Keep knees soft')).toBeInTheDocument()
  expect(screen.getByText('Do not rush')).toBeInTheDocument()
})
```

`assignedExercise()` must be updated to `{ exerciseId: FIXTURE_EX.id, … }`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/assigned-exercises.test.tsx`
Expected: FAIL — no dose line text; "How to do it" button absent.

- [ ] **Step 3: Implement**

In `components/assigned-exercises.tsx`:

1. Import: change `import { exercises } from "@/lib/site-data";` to `import { exercises, resolveDosage, formatDosage } from "@/lib/exercises";` (import the catalogue directly from `@/lib/exercises`, not the `@/lib/site-data` re-export — this is what lets the test mock a fixture catalogue).

2. Add per-card expand state: `const [expanded, setExpanded] = useState<Set<string>>(new Set());` with a toggle helper.

3. In the card body, after the `<span>{ex.bodyPart} · {ex.stage}</span>` line, add the dose line:

```tsx
<span className="exercise-dose-line">{formatDosage(resolveDosage(ex, ae))}</span>
{ae.dosage?.notes && <span className="exercise-physio-note">Physio note: {ae.dosage.notes}</span>}
```

4. In `.exercise-card-actions`, before the "Done today" toggle, add the expander button when there's anything to show:

```tsx
{(ex.setup || ex.steps?.length || ex.cues?.length || ex.mistakes?.length || ex.equipment?.length) && (
  <button
    type="button"
    className="exercise-howto-toggle"
    aria-expanded={expanded.has(ae.exerciseId)}
    onClick={() => toggleExpanded(ae.exerciseId)}
  >
    {expanded.has(ae.exerciseId) ? "Hide how-to ▴" : "How to do it ▾"}
  </button>
)}
```

5. After `.exercise-card-actions`, render the detail panel when expanded:

```tsx
{expanded.has(ae.exerciseId) && (
  <div className="exercise-howto">
    {ex.equipment && ex.equipment.length > 0 && (
      <p><strong>You'll need:</strong> {ex.equipment.join(", ")}</p>
    )}
    {ex.setup && <p><strong>Get set up:</strong> {ex.setup}</p>}
    {ex.steps && ex.steps.length > 0 && (
      <div><strong>The movement</strong><ol>{ex.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></div>
    )}
    {ex.cues && ex.cues.length > 0 && (
      <div><strong>Good form</strong><ul className="exercise-howto-cues">{ex.cues.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
    )}
    {ex.mistakes && ex.mistakes.length > 0 && (
      <div><strong>Ease off or stop if</strong><ul className="exercise-howto-mistakes">{ex.mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
    )}
    <p className="exercise-howto-foot muted">Your physio set this dose — tell her at your next session if it's too easy or too hard.</p>
  </div>
)}
```

6. Add CSS to `app/globals.css` near the other `.exercise-*` rules:

```css
.exercise-dose-line { font-size: 13px; font-weight: 700; color: var(--primary-dark); margin-top: 2px; }
.exercise-physio-note { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
.exercise-howto-toggle {
  flex: 0 0 auto; min-height: 42px; padding: 0 0.85rem; border-radius: var(--radius-input);
  border: 1.5px solid var(--color-border); background: transparent; color: var(--color-navy);
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.exercise-howto-toggle:hover { background: var(--surface-alt); }
.exercise-howto { display: grid; gap: 0.6rem; padding-top: 0.4rem; font-size: 13px; line-height: 1.55; color: var(--color-text-secondary); }
.exercise-howto p, .exercise-howto div { margin: 0; }
.exercise-howto strong { color: var(--color-navy); }
.exercise-howto ol, .exercise-howto ul { margin: 0.25rem 0 0; padding-left: 1.2rem; display: grid; gap: 0.2rem; }
.exercise-howto-mistakes { list-style: none; padding-left: 0; }
.exercise-howto-mistakes li::before { content: "⚠ "; color: var(--color-warning); }
.exercise-howto-foot { font-size: 12px; margin-top: 0.2rem; }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/assigned-exercises.test.tsx`
Expected: PASS (all — the 5 existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add components/assigned-exercises.tsx tests/components/assigned-exercises.test.tsx app/globals.css
git commit -m "feat(patient): exercise dose line + how-to expander on the card

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Admin — edit-dose inline form on each assigned exercise

**Files:**
- Modify: `components/admin-exercise-assigner.tsx`
- Test: `tests/components/admin-exercise-assigner.test.tsx`

**Interfaces:**
- Consumes: `resolveDosage`, `formatDosage`, `validateDosage`, `exercises` from `@/lib/exercises` / `@/lib/site-data`; `setAssignedDosage`, `assignExercise` (Task 2)
- Produces: internal component change only

- [ ] **Step 1: Write the failing test**

Add to `tests/components/admin-exercise-assigner.test.tsx`. Extend the `@/lib/recovery` mock:

```ts
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...args: unknown[]) => getAssignedExercisesMock(...args),
  assignExercise: vi.fn(),
  removeExercise: vi.fn(),
  setAssignedDosage: (...args: unknown[]) => setAssignedDosageMock(...args),
}))
const setAssignedDosageMock = vi.fn().mockResolvedValue(undefined)
```

Add tests:

```ts
it('shows the effective dose on an assigned row and opens an edit form', async () => {
  // pick a catalogue exercise and give it a default in a spy, or use one that will get a default in Plan 2.
  getAssignedExercisesMock.mockResolvedValue([
    { exerciseId: 'ex-1', assignedAt: new Date(), assignedBy: 'a1', active: true, dosage: { sets: 3, reps: 10 } },
  ])
  const { getByText, getByRole, findByLabelText } = render(
    <AdminExerciseAssigner adminUid="a1" patientUid="p1" personId="p1" />
  )
  await waitFor(() => expect(getByText(/3 sets × 10 reps/)).toBeInTheDocument())
  fireEvent.click(getByRole('button', { name: /edit dose/i }))
  const reps = await findByLabelText(/reps/i)
  fireEvent.change(reps, { target: { value: '12' } })
  fireEvent.click(getByRole('button', { name: /save dose/i }))
  await waitFor(() =>
    expect(setAssignedDosageMock).toHaveBeenCalledWith('p1', 'p1', 'ex-1', expect.objectContaining({ reps: 12 })),
  )
})

it('blocks a save that fails validation', async () => {
  getAssignedExercisesMock.mockResolvedValue([
    { exerciseId: 'ex-1', assignedAt: new Date(), assignedBy: 'a1', active: true },
  ])
  const { getByRole, findByLabelText, getByText } = render(
    <AdminExerciseAssigner adminUid="a1" patientUid="p1" personId="p1" />
  )
  await waitFor(() => expect(getByRole('button', { name: /edit dose/i })).toBeInTheDocument())
  fireEvent.click(getByRole('button', { name: /edit dose/i }))
  fireEvent.change(await findByLabelText(/^sets/i), { target: { value: '11' } })
  fireEvent.click(getByRole('button', { name: /save dose/i }))
  expect(getByText(/Sets cannot be more than 10/i)).toBeInTheDocument()
  expect(setAssignedDosageMock).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/admin-exercise-assigner.test.tsx`
Expected: FAIL — no "Edit dose" control.

- [ ] **Step 3: Implement**

In `components/admin-exercise-assigner.tsx`:

1. Imports: add `resolveDosage, formatDosage, validateDosage` from `@/lib/exercises`; add `setAssignedDosage` from `@/lib/recovery`.

2. Filter `retired` out of the "Add exercise from library" list: in the `unassigned` filter add `&& !e.retired`.

3. Per assigned row: replace the plain label with `title · {formatDosage(resolveDosage(ex, ae))}` and add an **"Edit dose"** button that toggles an inline `<DoseForm>` for that `exerciseId`.

4. Add a `DoseForm` sub-component (same file):

```tsx
function DoseForm({
  initial, onSave, onCancel,
}: {
  initial: ExerciseDosage;
  onSave: (d: ExerciseDosage) => Promise<void>;
  onCancel: () => void;
}) {
  const [d, setD] = useState<ExerciseDosage>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const num = (k: keyof ExerciseDosage) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    setD((p) => ({ ...p, [k]: v === "" ? undefined : Number(v) }));
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateDosage(d);
    if (v) { setErr(v); return; }
    setSaving(true);
    try { await onSave(d); } finally { setSaving(false); }
  }
  return (
    <form className="dose-form" onSubmit={(e) => void submit(e)}>
      <label>Sets <input type="number" min={0} value={d.sets ?? ""} onChange={num("sets")} /></label>
      <label>Reps <input type="number" min={0} value={d.reps ?? ""} onChange={num("reps")} /></label>
      <label>Hold (s) <input type="number" min={0} value={d.holdSeconds ?? ""} onChange={num("holdSeconds")} /></label>
      <label>Times/day <input type="number" min={0} value={d.perDay ?? ""} onChange={num("perDay")} /></label>
      <label>Days/week <input type="number" min={1} max={7} value={d.perWeek ?? ""} onChange={num("perWeek")} /></label>
      <label>Tempo <input type="text" value={d.tempo ?? ""} onChange={(e) => setD((p) => ({ ...p, tempo: e.target.value || undefined }))} /></label>
      <label className="dose-form-note">Note to patient
        <textarea rows={2} maxLength={300} value={d.notes ?? ""} onChange={(e) => setD((p) => ({ ...p, notes: e.target.value || undefined }))} />
      </label>
      {err && <p className="field-error">{err}</p>}
      <div className="dose-form-actions">
        <button type="submit" className="button primary" disabled={saving}>{saving ? "Saving…" : "Save dose"}</button>
        <button type="button" className="text-button" onClick={() => onSave({})}>Reset to default</button>
        <button type="button" className="text-button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
```

5. Wire "Save dose": `await setAssignedDosage(patientUid, personId, exerciseId, dose); const updated = await getAssignedExercises(patientUid, personId); setAssigned(updated);` then close the form. "Reset to default" passes `{}` → `setAssignedDosage(…, {})` (a `dosage: {}` override resolves identically to the default; acceptable — or call a dedicated clear; `{}` is simplest and safe).

6. Minimal CSS in `app/globals.css`:

```css
.dose-form { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem 0.75rem; padding: 0.6rem 0; }
.dose-form label { display: grid; gap: 2px; font-size: 12px; color: var(--color-text-secondary); }
.dose-form input, .dose-form textarea { border: 1px solid var(--color-border); border-radius: 8px; padding: 0.35rem 0.5rem; font: inherit; }
.dose-form-note { grid-column: 1 / -1; }
.dose-form-actions { grid-column: 1 / -1; display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/admin-exercise-assigner.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin-exercise-assigner.tsx tests/components/admin-exercise-assigner.test.tsx app/globals.css
git commit -m "feat(admin): edit per-patient exercise dose when assigning

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: PDF report — dose column on Assigned Exercises

**Files:**
- Modify: `components/download-report-button.tsx` (the `// ---- assigned exercises ----` block, ~line 473)

**Interfaces:**
- Consumes: `resolveDosage`, `formatDosage` from `@/lib/exercises`; `assignedExercises` already carries `dosage` (Task 2)

- [ ] **Step 1: Change the table rows**

The Assigned Exercises block builds rows as `[ex.title, ex.bodyPart, ex.stage]`. Change to `[ex.title, formatDosage(resolveDosage(ex, ae)), ex.description]` and keep 3 columns (widen the last one — set column x-offsets to `[margin + 2, margin + 70, margin + 120]` and let jspdf wrap, matching how other `tableRows` calls here handle long text; if `tableRows` truncates rather than wraps, keep `ex.bodyPart · ex.stage` merged into column 1 and use columns `[title+meta, dose, description]`). The map must keep the `ae` alongside `ex`:

```ts
assignedExercises
  .map((ae) => { const ex = exerciseMap.get(ae.exerciseId); return ex ? { ex, ae } : null; })
  .filter((r): r is { ex: NonNullable<ReturnType<typeof exerciseMap.get>>; ae: typeof assignedExercises[number] } => !!r)
  .map(({ ex, ae }) => [ex.title, formatDosage(resolveDosage(ex, ae)), ex.description])
```

Add imports: `import { resolveDosage, formatDosage } from "@/lib/exercises";`

- [ ] **Step 2: Verify**

There is no unit test for the PDF (jspdf + jsdom). Verify by:
1. `npx tsc --noEmit` — no new errors.
2. `npm run dev`, open the Browser pane at `/patient/recovery` signed in as a patient with assigned exercises + at least one pain check-in, click **Download PDF report**, confirm the Assigned Exercises table shows `title · dose · description` and nothing overflows the page. Screenshot for the reviewer.

- [ ] **Step 3: Commit**

```bash
git add components/download-report-button.tsx
git commit -m "feat(report): show exercise dose + description in the PDF

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: `exercise-figure.tsx` — explicit pose

**Files:**
- Modify: `components/exercise-figure.tsx`
- Test: `tests/components/exercise-figure.test.tsx`

**Interfaces:**
- Produces: `export type PoseName` (= the existing `Pose` union); `export const POSE_NAMES: PoseName[]`; `ExerciseFigure` accepts optional `pose?: string`
- Consumes: nothing new

- [ ] **Step 1: Write the failing test**

Check `tests/components/exercise-figure.test.tsx` exists; if not create it. Add:

```ts
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ExerciseFigure } from '@/components/exercise-figure'

describe('ExerciseFigure', () => {
  it('uses the explicit pose when given, ignoring the name', () => {
    const { container } = render(<ExerciseFigure name="totally unknown movement" pose="squat" />)
    // squat spec has 1 circle + >=5 segments (see SPECS); standing differs.
    const squat = render(<ExerciseFigure name="Sit to Stand Control" />).container
    expect(container.querySelectorAll('line').length).toBe(squat.querySelectorAll('line').length)
  })
  it('falls back to name-guessing when no pose is given', () => {
    const { container } = render(<ExerciseFigure name="Single Leg Balance" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
  it('falls back to standing for an unknown explicit pose value', () => {
    // @ts-expect-error deliberately invalid
    const { container } = render(<ExerciseFigure name="x" pose="not-a-pose" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/exercise-figure.test.tsx`
Expected: FAIL — `ExerciseFigure` doesn't accept `pose`.

- [ ] **Step 3: Implement**

```tsx
export type PoseName = Pose;
export const POSE_NAMES = Object.keys(SPECS) as PoseName[];

export function ExerciseFigure({ name, size = 56, pose }: { name: string; size?: number; pose?: string }) {
  const chosen: Pose = pose && (pose in SPECS) ? (pose as Pose) : poseForName(name);
  const spec = SPECS[chosen];
  // …unchanged…
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/exercise-figure.test.tsx tests/components/assigned-exercises.test.tsx`
Expected: PASS.

Then pass `pose={ex.pose}` where `<ExerciseFigure>` is rendered in `components/assigned-exercises.tsx`.

- [ ] **Step 5: Commit**

```bash
git add components/exercise-figure.tsx tests/components/exercise-figure.test.tsx components/assigned-exercises.tsx
git commit -m "feat(exercises): honour an explicit stick-figure pose

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Catalogue shape safety-net test

**Files:**
- Create: `tests/lib/exercise-content-shape.test.ts`

**Interfaces:**
- Consumes: `exercises` from `@/lib/exercises`; `POSE_NAMES` from `@/components/exercise-figure` (added in Task 6)

- [ ] **Step 1: Write the test (passes immediately; guards Plan 2)**

```ts
import { describe, it, expect } from 'vitest'
import { exercises } from '@/lib/exercises'
import { POSE_NAMES } from '@/components/exercise-figure'

describe('exercise catalogue shape', () => {
  for (const ex of exercises) {
    describe(ex.id, () => {
      it('has no empty strings in array content', () => {
        for (const arr of [ex.steps, ex.cues, ex.mistakes, ex.equipment]) {
          if (arr) expect(arr.every((s) => s.trim().length > 0)).toBe(true)
        }
      })
      it('has 2–8 steps when steps are present', () => {
        if (ex.steps) {
          expect(ex.steps.length).toBeGreaterThanOrEqual(2)
          expect(ex.steps.length).toBeLessThanOrEqual(8)
        }
      })
      it('has 1–5 cues / mistakes when present', () => {
        if (ex.cues) expect(ex.cues.length).toBeLessThanOrEqual(5)
        if (ex.mistakes) expect(ex.mistakes.length).toBeLessThanOrEqual(5)
      })
      it('has a usable defaultDosage when one is set', () => {
        if (ex.defaultDosage) {
          const d = ex.defaultDosage
          expect(d.reps != null || d.holdSeconds != null).toBe(true)
        }
      })
      it('uses a known pose when pose is set', () => {
        if (ex.pose) expect(POSE_NAMES).toContain(ex.pose)
      })
    })
  }
})
```

- [ ] **Step 2: Run — expected PASS**

Run: `npx vitest run tests/lib/exercise-content-shape.test.ts`
Expected: PASS (nothing has the new fields yet, so every conditional is skipped).

- [ ] **Step 3: Commit**

```bash
git add tests/lib/exercise-content-shape.test.ts
git commit -m "test(exercises): catalogue shape safety-net for content batches

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Wrap-up (after Task 7)

- [ ] Run `npm run test:run` — expect **only** the pre-existing `booking-flow` / `toast-provider` failures, nothing new.
- [ ] Run `npm run lint` — clean.
- [ ] `npm run deploy:dev`, then verify on `dev.physioonclick.co.uk`: patient exercise card shows a dose line and a working "How to do it" toggle (empty how-to for exercises with no write-up yet is fine — the toggle should not appear for them); admin patient-detail → assigned exercise → "Edit dose" saves and the row updates.
- [ ] Hand off to **Plan 2** (content batches) — to be written as `docs/superpowers/plans/2026-09-06-exercise-content-batches.md`.

## Self-Review

- **Spec coverage:** §1 data model → Task 1, 2, 6. §3 patient card → Task 3, 6. §4 admin dose → Task 4. §5 consumers → Task 5 (PDF), Task 4 (`retired` filter), Task 1 (re-export). §6 rollout (loose types) → Global Constraints. §7 testing → every task + Task 7. §2 authoring workflow → Plan 2 (out of scope here, noted in Wrap-up).
- **Placeholders:** the `vi.spyOn(module, 'exercises', 'get')` fallback in Task 3 is called out with two concrete alternatives — not a TODO.
- **Type consistency:** `ExerciseDosage` defined once (Task 1), consumed by Tasks 2–5. `assignExercise` 5-arg signature defined in Task 2, matches the Task 4 call. `Exercise.pose` is `string` in `lib/exercises.ts` (no component import); `PoseName` / `POSE_NAMES` live in `components/exercise-figure.tsx` (Task 6) for the figure prop + the Task 7 shape test. `getAssignedExercises` return type gains `dosage?` in Task 2 and is read in Tasks 3, 4, 5.
