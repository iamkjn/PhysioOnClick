# Patient self-tests section implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Check your progress" section to `/patient/exercises` that shows the
self-tests relevant to a patient's assigned exercises, auto-derived from the existing
condition-hub mapping, with no new admin work.

**Architecture:** One new pure function in `lib/exercise-library.ts`
(`selfTestsForExercises`) reuses the existing `conditionsForExercise` helper to find which
condition hubs a patient's assigned exercises belong to, then filters `selfTests` by
`conditionSlugs`. One new client component (`components/patient-self-tests.tsx`) fetches
the patient's assigned exercises (same `getAssignedExercises` call `AssignedExercises`
already makes), resolves them to slugs, calls the new helper, and renders one card per
match — reusing the existing `SelfTestSteps` and `SelfTestResults` components from the
public exercise library so the styling and copy stay consistent with `/exercises/tests/*`.
The page (`app/patient/exercises/page.tsx`) renders it below `<AssignedExercises>`.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Vitest + Testing Library,
Firebase client SDK (`firebase/firestore`, read-only here).

## Global Constraints

- Every function in `lib/exercise-library.ts` is pure, side-effect free, deterministic, and
  has no `"use client"` — the barrel is imported by static pages too. (`lib/exercise-library.ts:1-11`)
- Patient-facing components fetch via `lib/recovery.ts`'s existing exported functions only —
  never touch Firestore directly from a component.
- No new Firestore fields, no new admin UI — the self-test/patient link is entirely derived
  from `lib/conditions.ts` + `lib/self-tests.ts`, both already committed and static.
- Match the existing `AssignedExercises` component's patterns: `useEffect` + `useState` data
  fetching with a `cancelled` guard, `SkeletonRow` while loading, `.panel.stack` wrapper,
  `.exercise-card-list` / `.exercise-card` / `.exercise-howto*` CSS classes (already defined
  in `app/globals.css`).
- The section renders nothing (not an empty panel) when there are no matching self-tests.

---

## File structure

- Modify: `lib/exercise-library.ts` — add `selfTestsForExercises(exerciseSlugs: string[]): SelfTest[]`.
- Modify: `tests/lib/exercise-library.test.ts` — unit tests for the new function.
- Create: `components/patient-self-tests.tsx` — the new client component.
- Create: `tests/components/patient-self-tests.test.tsx` — component tests.
- Modify: `app/patient/exercises/page.tsx` — render `<PatientSelfTests>` below `<AssignedExercises>`.

---

### Task 1: `selfTestsForExercises` helper

**Files:**
- Modify: `lib/exercise-library.ts` (add after `selfTestsByBodyArea`, end of file)
- Test: `tests/lib/exercise-library.test.ts` (add a new `describe` block)

**Interfaces:**
- Consumes: `conditionsForExercise(exerciseSlug: string): Condition[]` (already exported in
  this file), `selfTests: SelfTest[]` (already imported in this file from `@/lib/self-tests`).
- Produces: `selfTestsForExercises(exerciseSlugs: string[]): SelfTest[]` — used by Task 3.

- [ ] **Step 1: Write the failing tests**

Add to `tests/lib/exercise-library.test.ts` (append near the other `selfTests*` describe
blocks — search the file for `selfTestsForCondition` to find them):

```ts
describe('exercise-library: selfTestsForExercises', () => {
  it('returns self-tests for a condition hub the exercise belongs to', () => {
    // shoulder-external-rotation-band is in rotator-cuff-tendinopathy's "Build strength" stage
    const result = selfTestsForExercises(['shoulder-external-rotation-band'])
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((t) => t.conditionSlugs.includes('rotator-cuff-tendinopathy'))).toBe(true)
  })

  it('returns [] for an exercise with no condition-hub match', () => {
    // an exercise slug that exists but appears in no condition program, or an unknown slug
    expect(selfTestsForExercises(['no-such-exercise-slug'])).toEqual([])
  })

  it('returns [] for an empty input list', () => {
    expect(selfTestsForExercises([])).toEqual([])
  })

  it('de-dupes when two assigned exercises map to the same condition hub', () => {
    const result = selfTestsForExercises([
      'shoulder-external-rotation-band',
      'shoulder-internal-rotation-band',
    ])
    const slugs = result.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('preserves selfTests source order', () => {
    const result = selfTestsForExercises(allExerciseSlugs())
    const sourceOrder = selfTests.map((t) => t.slug)
    const resultOrder = result.map((t) => t.slug)
    expect(resultOrder).toEqual(sourceOrder.filter((s) => resultOrder.includes(s)))
  })
})
```

Add `selfTests` to the existing `import { selfTests } from '@/lib/self-tests'` at the top of
the test file if it is not already imported (check first — the file already imports
`conditions` and `exercises` the same way). Add `selfTestsForExercises` to the existing
`import { ... } from '@/lib/exercise-library'` block.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/lib/exercise-library.test.ts`
Expected: FAIL — `selfTestsForExercises is not a function` (or a TypeScript import error).

- [ ] **Step 3: Implement the function**

Append to `lib/exercise-library.ts`, after the existing `selfTestsByBodyArea` function:

```ts
/**
 * Self-check tests relevant to a set of exercise slugs: every `SelfTest` whose
 * `conditionSlugs` intersects the condition hubs those exercises appear in
 * (via `conditionsForExercise`), in `selfTests` source order. Returns `[]`
 * when no exercise resolves to a condition hub with a matching self-test
 * (including an empty or all-unknown `exerciseSlugs` list). Used to derive a
 * signed-in patient's relevant self-tests straight from their assigned
 * exercises, with no new data to maintain.
 */
export function selfTestsForExercises(exerciseSlugs: string[]): SelfTest[] {
  const conditionSlugs = new Set<string>();
  for (const slug of exerciseSlugs) {
    for (const condition of conditionsForExercise(slug)) {
      conditionSlugs.add(condition.slug);
    }
  }
  if (conditionSlugs.size === 0) return [];
  return selfTests.filter((test) =>
    test.conditionSlugs.some((cs) => conditionSlugs.has(cs)),
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/lib/exercise-library.test.ts`
Expected: PASS (all tests in the file, including the new `describe` block).

- [ ] **Step 5: Commit**

```bash
git add lib/exercise-library.ts tests/lib/exercise-library.test.ts
git commit -m "$(cat <<'EOF'
feat(exercise-library): add selfTestsForExercises helper

Derives a patient's relevant self-tests from their assigned exercises'
condition hubs, reusing the existing conditionsForExercise mapping —
no new data to maintain.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `PatientSelfTests` component

**Files:**
- Create: `components/patient-self-tests.tsx`
- Test: `tests/components/patient-self-tests.test.tsx`

**Interfaces:**
- Consumes: `selfTestsForExercises` (Task 1), `getAssignedExercises(uid, personId): Promise<AssignedExercise[]>` and `type AssignedExercise` (from `@/lib/recovery`, already exported), `exercises: Exercise[]` (from `@/lib/exercises`), `SelfTestSteps` (from `@/components/exercise-library/self-test-steps`), `SelfTestResults` (from `@/components/exercise-library/self-test-results`), `SkeletonRow` (from `@/components/skeleton`).
- Produces: `PatientSelfTests({ uid, personId }: { uid: string; personId: string })` — a
  default-less named export, used by Task 3.

- [ ] **Step 1: Write the failing test**

Create `tests/components/patient-self-tests.test.tsx`:

```tsx
import { render, waitFor, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const { FIXTURE_EX } = vi.hoisted(() => ({
  FIXTURE_EX: {
    id: 'ex-fix', slug: 'shoulder-external-rotation-band', title: 'Fixture Rotation',
    bodyPart: 'Shoulder', clinicalArea: 'upper_limb', tags: [] as string[],
    condition: '', stage: 'Build strength', description: 'A fixture exercise.',
  },
}))
vi.mock('@/lib/exercises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/exercises')>()
  return { ...actual, exercises: [FIXTURE_EX] }
})

const getAssignedExercisesMock = vi.fn()
vi.mock('@/lib/recovery', () => ({
  getAssignedExercises: (...args: unknown[]) => getAssignedExercisesMock(...args),
}))

import { PatientSelfTests } from '@/components/patient-self-tests'

describe('PatientSelfTests', () => {
  it('renders nothing while there is no match', async () => {
    getAssignedExercisesMock.mockResolvedValue([])
    const { container } = render(<PatientSelfTests uid="u1" personId="p1" />)
    await waitFor(() => expect(getAssignedExercisesMock).toHaveBeenCalledWith('u1', 'p1'))
    await waitFor(() => expect(container.querySelector('.exercise-card-list')).toBeNull())
  })

  it('shows a matching self-test with its assesses line', async () => {
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: 'ex-fix', assignedAt: new Date(), assignedBy: 'physio', active: true },
    ])
    render(<PatientSelfTests uid="u1" personId="p1" />)
    await waitFor(() => expect(screen.getByText('Full can test')).toBeTruthy())
    expect(screen.getByText(/supraspinatus/i)).toBeTruthy()
  })

  it('expands to show steps and results on "How to check"', async () => {
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: 'ex-fix', assignedAt: new Date(), assignedBy: 'physio', active: true },
    ])
    render(<PatientSelfTests uid="u1" personId="p1" />)
    const toggle = await screen.findByRole('button', { name: /how to check/i })
    expect(screen.queryByText('Likely normal')).toBeNull()
    fireEvent.click(toggle)
    expect(screen.getByText('Likely normal')).toBeTruthy()
  })

  it('links to the public self-test page', async () => {
    getAssignedExercisesMock.mockResolvedValue([
      { exerciseId: 'ex-fix', assignedAt: new Date(), assignedBy: 'physio', active: true },
    ])
    render(<PatientSelfTests uid="u1" personId="p1" />)
    const link = await screen.findByRole('link', { name: /full guide/i })
    expect(link.getAttribute('href')).toBe('/exercises/tests/full-can-test')
  })
})
```

This deliberately does not mock `@/lib/exercise-library` or `@/lib/conditions` or
`@/lib/self-tests` — the fixture exercise's real slug (`shoulder-external-rotation-band`)
is genuinely in `rotator-cuff-tendinopathy`'s "Build strength" stage (see
`lib/conditions.ts`), which real `selfTests` map to via `conditionSlugs`, so the real
`selfTestsForExercises` resolves it to the real "Full can test" record. This exercises the
actual condition/self-test data, catching a break in that mapping — the same reasoning
`tests/lib/exercise-library.test.ts` already uses.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/patient-self-tests.test.tsx`
Expected: FAIL — `Cannot find module '@/components/patient-self-tests'`.

- [ ] **Step 3: Implement the component**

Create `components/patient-self-tests.tsx`:

```tsx
// components/patient-self-tests.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getAssignedExercises, type AssignedExercise } from "@/lib/recovery";
import { exercises } from "@/lib/exercises";
import { selfTestsForExercises, type SelfTest } from "@/lib/exercise-library";
import { SelfTestSteps } from "@/components/exercise-library/self-test-steps";
import { SelfTestResults } from "@/components/exercise-library/self-test-results";
import { SkeletonRow } from "@/components/skeleton";

interface Props {
  uid: string;
  personId: string;
}

// Same wording as the public self-test page's disclaimer
// (app/exercises/tests/[slug]/page.tsx) — informational triage, not diagnosis.
const DISCLAIMER =
  "This is a guide, not a diagnosis. It cannot rule a problem in or out - a physiotherapist can. If your symptoms are severe, spreading, or you feel unwell, see a doctor.";

// "Check your progress" — self-tests relevant to the exercises the physio has
// assigned, derived from the condition hub(s) those exercises belong to (no
// separate admin assignment step). Renders nothing when there is no match.
export function PatientSelfTests({ uid, personId }: Props) {
  const [assigned, setAssigned] = useState<AssignedExercise[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setAssigned(null);
    getAssignedExercises(uid, personId)
      .then((a) => {
        if (!cancelled) setAssigned(a);
      })
      .catch(() => {
        if (!cancelled) setAssigned([]);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, personId]);

  const exerciseIdToSlug = useMemo(
    () => new Map(exercises.map((e) => [e.id, e.slug])),
    []
  );

  const tests: SelfTest[] = useMemo(() => {
    if (!assigned) return [];
    const slugs = assigned
      .map((ae) => exerciseIdToSlug.get(ae.exerciseId))
      .filter((s): s is string => Boolean(s));
    return selfTestsForExercises(slugs);
  }, [assigned, exerciseIdToSlug]);

  function toggleExpanded(slug: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  if (assigned === null) {
    return (
      <div className="panel stack">
        <h3>Check your progress</h3>
        <SkeletonRow count={2} />
      </div>
    );
  }

  if (tests.length === 0) return null;

  return (
    <div className="panel stack">
      <h3 style={{ margin: 0 }}>Check your progress</h3>
      <p className="muted" style={{ margin: "var(--space-1) 0 0" }}>
        Quick self-checks related to what you&apos;re working on.
      </p>

      <div className="exercise-card-list">
        {tests.map((test) => (
          <div key={test.slug} className="exercise-card">
            <div className="exercise-card-head">
              <div className="exercise-card-body">
                <strong>{test.name}</strong>
                <span>{test.assesses}</span>
              </div>
            </div>

            <div className="exercise-card-actions">
              <a href={`/exercises/tests/${test.slug}`} className="exercise-video-watch">
                Full guide ↗
              </a>
              <button
                type="button"
                className="exercise-howto-toggle"
                aria-expanded={expanded.has(test.slug)}
                aria-controls={`selftest-${test.slug}`}
                onClick={() => toggleExpanded(test.slug)}
              >
                {expanded.has(test.slug) ? "Hide steps ▴" : "How to check ▾"}
              </button>
            </div>

            {expanded.has(test.slug) && (
              <div className="exercise-howto" id={`selftest-${test.slug}`}>
                <SelfTestSteps steps={test.steps} testName={test.name} />
                <SelfTestResults
                  negative={test.negativeResult}
                  positive={test.positiveResult}
                  tips={test.tips}
                />
              </div>
            )}

            <p className="exercise-howto-foot muted">{DISCLAIMER}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/components/patient-self-tests.test.tsx`
Expected: PASS (all 4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/patient-self-tests.tsx tests/components/patient-self-tests.test.tsx
git commit -m "$(cat <<'EOF'
feat(patient): add PatientSelfTests component

Renders a "Check your progress" panel of self-tests derived from the
patient's assigned exercises, reusing SelfTestSteps/SelfTestResults
from the public exercise library for consistent styling and copy.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Wire into `/patient/exercises`

**Files:**
- Modify: `app/patient/exercises/page.tsx:1-115`
- Test: `tests/components/patient-self-tests.test.tsx` already covers the component in
  isolation; this task is a small page-level smoke check added to a new file so a page
  regression (e.g. missing `personId`) is caught without re-testing the whole component.
- Test: `tests/app/patient-exercises-page.test.tsx` (new)

**Interfaces:**
- Consumes: `PatientSelfTests` (Task 2).
- Produces: nothing new — this is the final wiring task.

- [ ] **Step 1: Write the failing test**

Create `tests/app/patient-exercises-page.test.tsx`:

```tsx
import { render, waitFor, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const authCallback = vi.fn()
vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
    authCallback.mockImplementation(cb)
    cb({ uid: 'u1', displayName: 'Pat Patient', email: 'pat@example.com' })
    return () => {}
  },
}))
vi.mock('@/components/person-provider', () => ({
  usePerson: () => ({ personId: 'u1' }),
}))
vi.mock('@/lib/session-summaries', () => ({
  getLatestSummaryId: vi.fn().mockResolvedValue(undefined),
}))

const AssignedExercisesMock = vi.fn(() => <div data-testid="assigned-exercises" />)
vi.mock('@/components/assigned-exercises', () => ({
  AssignedExercises: (props: unknown) => AssignedExercisesMock(props),
}))

const PatientSelfTestsMock = vi.fn(() => <div data-testid="patient-self-tests" />)
vi.mock('@/components/patient-self-tests', () => ({
  PatientSelfTests: (props: unknown) => PatientSelfTestsMock(props),
}))

import ExercisesPage from '@/app/patient/exercises/page'

describe('ExercisesPage', () => {
  it('renders PatientSelfTests below AssignedExercises with the same uid/personId', async () => {
    render(<ExercisesPage />)
    await waitFor(() => expect(screen.getByTestId('patient-self-tests')).toBeTruthy())
    expect(PatientSelfTestsMock).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'u1', personId: 'u1' })
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/app/patient-exercises-page.test.tsx`
Expected: FAIL — `getByTestId('patient-self-tests')` not found (component not rendered yet).

- [ ] **Step 3: Wire the component into the page**

In `app/patient/exercises/page.tsx`, add the import near the other component imports
(after the `AssignedExercises` import on line 9):

```tsx
import { AssignedExercises } from "@/components/assigned-exercises";
import { PatientSelfTests } from "@/components/patient-self-tests";
```

Then add the rendered component after the `<AssignedExercises>` section (currently
lines 110-112):

```tsx
      <section className="page-section">
        <AssignedExercises uid={uid} personId={personId} />
      </section>

      <section className="page-section">
        <PatientSelfTests uid={uid} personId={personId} />
      </section>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/app/patient-exercises-page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `npm run test:run`
Expected: same pass/fail counts as the pre-existing baseline, plus the new tests passing.
Per `[[project_flaky_tests_booking_toast]]`, `master` already has 9 pre-existing failures
in `booking`/`toast`-related tests unrelated to this change — do not treat those as
regressions; only investigate failures in files this plan touched or newly created.

- [ ] **Step 6: Commit**

```bash
git add app/patient/exercises/page.tsx tests/app/patient-exercises-page.test.tsx
git commit -m "$(cat <<'EOF'
feat(patient): show relevant self-tests on the exercises page

Wires PatientSelfTests into /patient/exercises below the assigned
exercise list, completing the patient-facing self-test section.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Manual verification (after Task 3)

Not part of the automated suite — do this once after all tasks land, using the existing
dev test account (`[[project_dev_test_account_george]]`: Seena George / dependent Anish
George on `dev.physioonclick.co.uk`, person switcher set to Anish):

1. `npm run dev`, sign in as the dev test account, switch to the person with assigned
   exercises.
2. Open `/patient/exercises`. Confirm the "Check your progress" section appears below
   "Your program" only if that person has an assigned exercise that maps to a condition hub
   with a self-test (e.g. a shoulder-band exercise → rotator cuff tendinopathy → "Full can
   test").
3. Click "How to check" — confirm steps + green/red result boxes expand inline.
4. Click "Full guide" — confirm it navigates to the matching `/exercises/tests/<slug>` page.
5. Switch to a person with no matching exercises (or none assigned) — confirm the section
   is entirely absent, not an empty panel.
