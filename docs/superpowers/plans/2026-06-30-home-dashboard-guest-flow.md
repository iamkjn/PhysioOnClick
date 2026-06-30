# Home Dashboard & Guest Access Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a signed-in home dashboard (person dropdown + recovery percentage) to both the website and the Flutter app, and close the guest-access gaps that let unauthenticated users book appointments or use account features without being prompted to sign in.

**Architecture:** Both the website's `/` and the mobile app's Home tab gain an auth-aware swap point: guests keep today's marketing hero unchanged; signed-in users see a new dashboard (person dropdown sourced from the existing `dependents` collection, plus a recovery-percentage stat derived from existing `painLogs` data). Separately, the booking flow on both platforms is changed from a soft "sign in to save" nudge to a hard intercept — guests are shown a sign-in/register prompt before they can reach the Cal.com calendar at all. No new Firestore collections, fields, or security rules.

**Tech Stack:** Next.js 15 App Router, React 19, Firebase Auth/Firestore (client SDK), Vitest + React Testing Library (web tests), Flutter 3.41, `cloud_firestore`/`firebase_auth` packages (mobile).

## Global Constraints

- Recovery percentage formula (implemented identically in TS and Dart): `baseline` = score of the first-ever `painLogs` entry for that person; `current` = average of the last 3 `painLogs` entries (fewer if less than 3 exist); `percent = clamp(round((baseline - current) / baseline * 100), 0, 100)`. Zero logs → no percentage shown. `baseline == 0` → percentage unavailable (avoid divide-by-zero).
- Firestore paths are unchanged: `dependents/{id}` (fields: `ownerId`, `name`, `dob`, `relationship`, `notes`, `avatarUrl?`) and `patients/{uid}/people/{personId}/painLogs/{YYYY-MM-DD}` (field: `score: number`). `personId === uid` for the account holder, `personId === dependent.id` for dependents.
- Gated (require sign-in, hard intercept before the protected screen/action is reached): booking (Cal.com), the recovery dashboard, people/dependents management, the mobile chat assistant.
- Always open to guests, no change: services, pricing, blog, about, contact/enquiry form.
- Cal.com username must come from exactly one place per platform: `NEXT_PUBLIC_CAL_USERNAME` on web (already correct), a single `AppConfig.calComBookingUrl` constant on mobile (currently hardcoded inline — fixed in Task 7).
- No test suite exists for Firebase-auth-stream-dependent UI in this repo (every `app/patient/*` page already follows this convention) — those pieces are verified manually via the dev server, not with Vitest. Pure logic (the percentage formula) gets real unit tests on both platforms.

---

## Task 1: Recovery percentage formula (web, pure function)

**Files:**
- Modify: `lib/recovery.ts`
- Test: `tests/lib/recovery.test.ts` (new file, new `tests/lib/` directory)

**Interfaces:**
- Produces: `computeRecoveryPercent(logs: PainLog[]): number | null` — exported from `lib/recovery.ts`. `PainLog` is the existing exported interface (`{ date: string; score: number; note: string; loggedAt: Date }`). Caller passes logs in chronological order (oldest first), matching what `getPainLogs` already returns.

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/recovery.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeRecoveryPercent, type PainLog } from '@/lib/recovery'

function log(score: number, date = '2026-01-01'): PainLog {
  return { date, score, note: '', loggedAt: new Date(date) }
}

describe('computeRecoveryPercent', () => {
  it('returns null when there are no logs', () => {
    expect(computeRecoveryPercent([])).toBeNull()
  })

  it('returns null when the baseline score is zero', () => {
    expect(computeRecoveryPercent([log(0), log(2)])).toBeNull()
  })

  it('returns 0 when there is only one log (baseline equals current)', () => {
    expect(computeRecoveryPercent([log(6)])).toBe(0)
  })

  it('computes improvement as a percentage of the baseline', () => {
    const logs = [log(8, '2026-01-01'), log(6, '2026-01-08'), log(4, '2026-01-15'), log(4, '2026-01-22')]
    expect(computeRecoveryPercent(logs)).toBe(50)
  })

  it('clamps at 0 when pain has gotten worse than baseline', () => {
    const logs = [log(3, '2026-01-01'), log(6, '2026-01-08'), log(6, '2026-01-15'), log(6, '2026-01-22')]
    expect(computeRecoveryPercent(logs)).toBe(0)
  })

  it('clamps at 100 when current pain is zero', () => {
    const logs = [log(5, '2026-01-01'), log(0, '2026-01-08'), log(0, '2026-01-15'), log(0, '2026-01-22')]
    expect(computeRecoveryPercent(logs)).toBe(100)
  })

  it('averages only the last 3 entries when more exist', () => {
    const logs = [
      log(10, '2026-01-01'),
      log(10, '2026-01-08'),
      log(10, '2026-01-15'),
      log(2, '2026-01-22'),
      log(2, '2026-01-29'),
      log(2, '2026-02-05'),
    ]
    expect(computeRecoveryPercent(logs)).toBe(80)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/lib/recovery.test.ts`
Expected: FAIL — `computeRecoveryPercent` is not exported from `lib/recovery.ts`.

- [ ] **Step 3: Implement the function**

In `lib/recovery.ts`, add this export (place it near the top, after the existing interfaces and before `personBase`):

```ts
export function computeRecoveryPercent(logs: PainLog[]): number | null {
  if (logs.length === 0) return null;
  const baseline = logs[0].score;
  if (baseline === 0) return null;
  const recent = logs.slice(-3);
  const current = recent.reduce((sum, log) => sum + log.score, 0) / recent.length;
  const pct = Math.round(((baseline - current) / baseline) * 100);
  return Math.min(100, Math.max(0, pct));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/lib/recovery.test.ts`
Expected: PASS, all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/recovery.ts tests/lib/recovery.test.ts
git commit -m "feat: add recovery percentage formula"
```

---

## Task 2: RecoveryPercentCard component (web)

**Files:**
- Create: `components/recovery-percent-card.tsx`
- Modify: `app/patient/recovery/page.tsx`

**Interfaces:**
- Consumes: `getPainLogs(uid, personId, days): Promise<PainLog[]>` and `computeRecoveryPercent(logs: PainLog[]): number | null` from `lib/recovery.ts` (Task 1).
- Produces: `RecoveryPercentCard` — named export, props `{ uid: string; personId: string }`, renders a `.panel.recovery-percent-card` div.

- [ ] **Step 1: Create the component**

Create `components/recovery-percent-card.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { getPainLogs, computeRecoveryPercent } from "@/lib/recovery";

interface Props {
  uid: string;
  personId: string;
}

export function RecoveryPercentCard({ uid, personId }: Props) {
  const [percent, setPercent] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    setPercent(undefined);
    getPainLogs(uid, personId, 9999)
      .then((logs) => setPercent(computeRecoveryPercent(logs)))
      .catch(() => setPercent(null));
  }, [uid, personId]);

  if (percent === undefined) {
    return (
      <div className="panel recovery-percent-card">
        <p className="muted">Loading recovery score…</p>
      </div>
    );
  }

  if (percent === null) {
    return (
      <div className="panel recovery-percent-card">
        <h3>Recovery score</h3>
        <p className="muted">Log your first check-in to see your recovery score.</p>
      </div>
    );
  }

  return (
    <div className="panel recovery-percent-card">
      <h3>Recovery score</h3>
      <div className="recovery-percent-value">{percent}%</div>
      <p className="muted">Improvement since your first pain check-in.</p>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the recovery page above the chart**

In `app/patient/recovery/page.tsx`, add the import:

```tsx
import { RecoveryPercentCard } from "@/components/recovery-percent-card";
```

Then insert a new section immediately before the existing `<section className="page-section"><RecoveryChart .../></section>` block (the chart section currently starts at line 79):

```tsx
      <section className="page-section">
        <RecoveryPercentCard uid={uid} personId={personId} />
      </section>

      <section className="page-section">
        <RecoveryChart ref={chartRef} uid={uid} personId={personId} />
      </section>
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`

Sign in as a patient with at least one logged pain score, open `/patient/recovery` in the browser, and confirm the "Recovery score" card renders above the chart with a percentage. Then check a patient account with zero pain logs shows "Log your first check-in to see your recovery score." instead.

- [ ] **Step 4: Commit**

```bash
git add components/recovery-percent-card.tsx app/patient/recovery/page.tsx
git commit -m "feat: add recovery percent card to /patient/recovery"
```

---

## Task 3: Extend PersonSwitcher for always-visible use with "+ Add a person" (web)

**Files:**
- Modify: `components/person-switcher.tsx`

**Interfaces:**
- Produces: `PersonSwitcher` props gain two new optional fields: `alwaysShow?: boolean` (default `false`, preserves existing hide-when-empty behavior) and `onAddPerson?: () => void` (when provided, appends a "+ Add a person" option to the dropdown). Existing required props (`uid`, `displayName`, `onSelect`) are unchanged — this is backward compatible with the existing usage in `app/patient/recovery/page.tsx`.

- [ ] **Step 1: Update the component**

Replace the full contents of `components/person-switcher.tsx`:

```tsx
// components/person-switcher.tsx
"use client";

import { useEffect, useState } from "react";
import { getDependents, type Dependent } from "@/lib/dependents";

const ADD_PERSON_VALUE = "__add_person__";

interface Props {
  uid: string;
  displayName: string;
  onSelect: (personId: string, name: string) => void;
  alwaysShow?: boolean;
  onAddPerson?: () => void;
}

export function PersonSwitcher({ uid, displayName, onSelect, alwaysShow = false, onAddPerson }: Props) {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [selected, setSelected] = useState(uid);

  useEffect(() => {
    getDependents(uid).then(setDependents);
  }, [uid]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === ADD_PERSON_VALUE) {
      onAddPerson?.();
      return;
    }
    setSelected(val);
    const name = val === uid ? displayName : (dependents.find((d) => d.id === val)?.name ?? "");
    onSelect(val, name);
  }

  if (dependents.length === 0 && !alwaysShow) return null;

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
        {onAddPerson ? <option value={ADD_PERSON_VALUE}>+ Add a person</option> : null}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

Run: `npm run dev`. Open `/patient/recovery` as a patient with zero dependents — confirm the switcher is still hidden (unchanged behavior, since Task 4 is the only caller that will pass `alwaysShow`).

- [ ] **Step 3: Commit**

```bash
git add components/person-switcher.tsx
git commit -m "feat: support always-visible PersonSwitcher with add-person option"
```

---

## Task 4: HomeDashboard component (web)

**Files:**
- Create: `components/home-dashboard.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `PersonSwitcher` (Task 3, props `uid`, `displayName`, `onSelect`, `alwaysShow`, `onAddPerson`), `RecoveryPercentCard` (Task 2, props `uid`, `personId`).
- Produces: `HomeDashboard` — named export, props `{ user: import("firebase/auth").User }`. Renders a `<section className="home-dashboard">` block. Consumed by Task 5.

- [ ] **Step 1: Create the component**

Create `components/home-dashboard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "firebase/auth";

import { PersonSwitcher } from "@/components/person-switcher";
import { RecoveryPercentCard } from "@/components/recovery-percent-card";

export function HomeDashboard({ user }: { user: User }) {
  const router = useRouter();
  const displayName = user.displayName || user.email || "Patient";
  const [personId, setPersonId] = useState(user.uid);
  const [personName, setPersonName] = useState(displayName);

  return (
    <section className="home-dashboard">
      <div className="site-shell">
        <div className="home-dashboard-header">
          <div>
            <span className="eyebrow">Welcome back</span>
            <h2>{displayName.split(" ")[0]}&apos;s recovery</h2>
            <p className="muted">Viewing recovery for {personName}</p>
          </div>
          <PersonSwitcher
            uid={user.uid}
            displayName={displayName}
            alwaysShow
            onAddPerson={() => router.push("/patient/people")}
            onSelect={(id, name) => {
              setPersonId(id);
              setPersonName(name);
            }}
          />
        </div>
        <div className="home-dashboard-grid">
          <RecoveryPercentCard uid={user.uid} personId={personId} />
          <div className="panel home-dashboard-links">
            <h3>Quick links</h3>
            <div className="home-dashboard-links-row">
              <Link className="button primary" href="/book" prefetch>
                Book a session
              </Link>
              <Link className="button secondary" href="/patient/people" prefetch>
                My People
              </Link>
              <Link className="button secondary" href="/patient/appointments" prefetch>
                My Appointments
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add the CSS**

Append to the end of `app/globals.css`:

```css
.home-dashboard {
  padding: 3rem 0 1rem;
  background: linear-gradient(135deg, #eafcff 0%, #f7fdff 100%);
}

.home-dashboard-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.home-dashboard-header h2 {
  margin: 0.25rem 0 0;
  font-size: 1.8rem;
}

.home-dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.25rem;
}

.recovery-percent-card .recovery-percent-value {
  font-size: 2.6rem;
  font-weight: 800;
  color: var(--primary);
  margin: 0.25rem 0;
}

.home-dashboard-links-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

@media (max-width: 760px) {
  .home-dashboard-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add components/home-dashboard.tsx app/globals.css
git commit -m "feat: add HomeDashboard component for signed-in home page"
```

(Manual verification happens in Task 5, once this is actually wired into a page.)

---

## Task 5: Auth-aware home hero swap (web)

**Files:**
- Create: `components/home-hero-section.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `HomeDashboard` (Task 4, props `{ user: User }`), `auth` from `lib/firebase.ts` (existing export, may be `null` if Firebase isn't configured — same pattern used in `app/patient/recovery/page.tsx`).
- Produces: `HomeHeroSection` — named export, props `{ founderName: string }`. Replaces the inline `<section className="home-hero">` block currently in `app/page.tsx`.

- [ ] **Step 1: Create the component**

Create `components/home-hero-section.tsx`, moving the existing hero markup from `app/page.tsx` verbatim and adding the auth branch:

```tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { HomeDashboard } from "@/components/home-dashboard";

export function HomeHeroSection({ founderName }: { founderName: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (user) {
    return <HomeDashboard user={user} />;
  }

  return (
    <section className="home-hero">
      <Image
        className="home-hero-image"
        src="/home-hero-premium.svg"
        alt="Illustrated physiotherapy consultation banner"
        fill
        priority
      />
      <div className="home-hero-overlay" />
      <div className="site-shell home-hero-content">
        <span className="location-pill">Glasgow & Online Across the UK</span>
        <h1>
          Expert Physiotherapy,
          <span> One Click Away</span>
        </h1>
        <p className="home-hero-copy">
          Evidence-based physiotherapy by {founderName}, HCPC registered physiotherapist. In-person in Glasgow or
          online consultations across the UK.
        </p>
        <div className="button-row">
          <Link className="button primary" href="/book" prefetch>
            Book Your Session
          </Link>
          <Link className="button secondary inverted" href="/services" prefetch>
            Explore Services
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Replace the hero block in app/page.tsx**

In `app/page.tsx`, add the import:

```tsx
import { HomeHeroSection } from "@/components/home-hero-section";
```

Replace the entire `<section className="home-hero">...</section>` block (currently lines 13–37) with:

```tsx
      <HomeHeroSection founderName={founder.name} />
```

The `Image` import in `app/page.tsx` stays — it's still used by the services grid further down the page.

- [ ] **Step 3: Verify manually**

Run: `npm run dev`. Visit `/` signed out — confirm the hero looks exactly as before. Sign in as a patient, revisit `/` — confirm the hero is replaced by the dashboard (person dropdown, recovery score, quick links), and that selecting a different person in the dropdown updates the recovery score shown.

- [ ] **Step 4: Commit**

```bash
git add components/home-hero-section.tsx app/page.tsx
git commit -m "feat: make home page hero auth-aware, show dashboard when signed in"
```

---

## Task 6: Gate /book behind sign-in (web)

**Files:**
- Create: `components/book-auth-gate.tsx`
- Modify: `app/book/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `auth` from `lib/firebase.ts`, `AuthPanel` (existing component, prop `role: "patient" | "admin"`), `CalEmbed` (existing component, no props).
- Produces: `BookAuthGate` — named export, no props. Renders `AuthPanel` when signed out, `CalEmbed` when signed in. This is the only change needed to close the gap where `/book` currently has no auth check at all.

- [ ] **Step 1: Create the gate component**

Create `components/book-auth-gate.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { AuthPanel } from "@/components/auth-panel";
import { CalEmbed } from "@/components/cal-embed";

export function BookAuthGate() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      return;
    }
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (user === undefined) {
    return <p className="muted">Checking your account…</p>;
  }

  if (!user) {
    return (
      <div className="book-auth-gate">
        <p className="lead">Sign in or create a free account to book your appointment.</p>
        <AuthPanel role="patient" />
      </div>
    );
  }

  return <CalEmbed />;
}
```

- [ ] **Step 2: Wire it into the /book page**

Replace the full contents of `app/book/page.tsx`:

```tsx
import type { Metadata } from "next";

import { BookAuthGate } from "@/components/book-auth-gate";

export const metadata: Metadata = {
  title: "Book an Appointment | PhysioOnClick",
  description:
    "Book your physiotherapy appointment online. Choose from initial assessments, follow-ups, and online consultations with a Glasgow HCPC-registered physiotherapist."
};

export default function BookPage() {
  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <span>Book online</span>
        <h1>Book your <span>appointment</span></h1>
        <p>Choose a service and a time that works for you. Your confirmation is sent instantly by email.</p>
      </section>
      <section className="page-section" style={{ paddingTop: "1rem" }}>
        <BookAuthGate />
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Add the CSS**

Append to the end of `app/globals.css`:

```css
.book-auth-gate {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`. Open `/book` in a private/incognito window (signed out) — confirm the Cal.com calendar does NOT load, and instead a sign-in/register panel is shown. Sign in, revisit `/book` — confirm the Cal.com calendar now loads normally.

- [ ] **Step 5: Commit**

```bash
git add components/book-auth-gate.tsx app/book/page.tsx app/globals.css
git commit -m "fix: require sign-in before the Cal.com calendar loads on /book"
```

---

## Task 7: Single source of truth for the Cal.com URL (mobile)

**Files:**
- Create: `mobile_app/lib/src/core/config.dart`
- Modify: `mobile_app/lib/src/features/booking/booking_screen.dart`

**Interfaces:**
- Produces: `AppConfig.calComBookingUrl` — `static const String`, value `'https://cal.com/physioonclick'`, must be kept in sync with web's `NEXT_PUBLIC_CAL_USERNAME` env var if the Cal.com account ever changes.

- [ ] **Step 1: Create the config file**

Create `mobile_app/lib/src/core/config.dart`:

```dart
class AppConfig {
  AppConfig._();

  /// Must match NEXT_PUBLIC_CAL_USERNAME on the website (.env.local) —
  /// there is no shared runtime config between the two apps, so this is
  /// the single place to update on mobile if the Cal.com account changes.
  static const calComBookingUrl = 'https://cal.com/physioonclick';
}
```

- [ ] **Step 2: Use the constant in BookingScreen**

In `mobile_app/lib/src/features/booking/booking_screen.dart`, add the import near the top:

```dart
import '../../core/config.dart';
```

Replace this line (currently line 198):

```dart
      ..loadRequest(Uri.parse('https://cal.com/physioonclick'));
```

with:

```dart
      ..loadRequest(Uri.parse(AppConfig.calComBookingUrl));
```

- [ ] **Step 3: Verify**

Run: `cd mobile_app && flutter analyze lib/src/core/config.dart lib/src/features/booking/booking_screen.dart`
Expected: "No issues found!"

- [ ] **Step 4: Commit**

```bash
cd mobile_app && git add lib/src/core/config.dart lib/src/features/booking/booking_screen.dart && git commit -m "fix: read Cal.com booking URL from a single config constant"
```

---

## Task 8: Recovery percentage formula + earliest-log query (mobile)

**Files:**
- Modify: `mobile_app/lib/src/features/admin/recovery/recovery_service.dart`
- Test: `mobile_app/test/recovery_percent_test.dart` (new file)

**Interfaces:**
- Produces:
  - `RecoveryService.watchEarliestPainLog(String uid, String personId): Stream<QuerySnapshot<Map<String, dynamic>>>` — same `painLogs` collection as `watchPainLogs`, ordered ascending by document ID, limited to 1.
  - `RecoveryService.computeRecoveryPercent({required int? baselineScore, required List<int> recentScores}): int?` — pure function, same formula as Task 1's TS version.

- [ ] **Step 1: Write the failing tests**

Create `mobile_app/test/recovery_percent_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/features/admin/recovery/recovery_service.dart';

void main() {
  group('RecoveryService.computeRecoveryPercent', () {
    test('returns null when there is no baseline', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: null,
        recentScores: [4, 4],
      );
      expect(result, isNull);
    });

    test('returns null when recent scores are empty', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: 8,
        recentScores: [],
      );
      expect(result, isNull);
    });

    test('returns null when baseline is zero', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: 0,
        recentScores: [2, 2],
      );
      expect(result, isNull);
    });

    test('computes 0 percent when current equals baseline', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: 6,
        recentScores: [6, 6, 6],
      );
      expect(result, 0);
    });

    test('computes positive improvement percent', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: 8,
        recentScores: [4, 4, 4],
      );
      expect(result, 50);
    });

    test('clamps to 0 when pain has gotten worse than baseline', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: 3,
        recentScores: [6, 6, 6],
      );
      expect(result, 0);
    });

    test('clamps to 100 when current pain is zero', () {
      final result = RecoveryService.computeRecoveryPercent(
        baselineScore: 5,
        recentScores: [0, 0, 0],
      );
      expect(result, 100);
    });
  });
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mobile_app && flutter test test/recovery_percent_test.dart`
Expected: FAIL to compile — `computeRecoveryPercent` is not a member of `RecoveryService`.

- [ ] **Step 3: Implement**

In `mobile_app/lib/src/features/admin/recovery/recovery_service.dart`, add these two members inside the `RecoveryService` class (after the existing `watchPainLogs` method):

```dart
  static Stream<QuerySnapshot<Map<String, dynamic>>> watchEarliestPainLog(
      String uid, String personId) {
    return _personBase(uid, personId)
        .collection('painLogs')
        .orderBy(FieldPath.documentId, descending: false)
        .limit(1)
        .snapshots();
  }

  static int? computeRecoveryPercent({
    required int? baselineScore,
    required List<int> recentScores,
  }) {
    if (baselineScore == null || baselineScore == 0 || recentScores.isEmpty) {
      return null;
    }
    final current =
        recentScores.reduce((a, b) => a + b) / recentScores.length;
    final pct = ((baselineScore - current) / baselineScore * 100).round();
    return pct.clamp(0, 100);
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd mobile_app && flutter test test/recovery_percent_test.dart`
Expected: PASS, all 7 tests green.

- [ ] **Step 5: Commit**

```bash
cd mobile_app && git add lib/src/features/admin/recovery/recovery_service.dart test/recovery_percent_test.dart && git commit -m "feat: add recovery percentage formula and earliest-log query"
```

---

## Task 9: Shared auth-gate bottom sheet + gate Booking tab and chat FAB (mobile)

**Files:**
- Create: `mobile_app/lib/src/core/widgets/auth_gate_sheet.dart`
- Modify: `mobile_app/lib/src/features/root/root_shell.dart`

**Interfaces:**
- Consumes: `AuthSheet` (existing widget, `mobile_app/lib/src/features/auth/auth_sheet.dart`, no-arg constructor, self-contained sign-in/register form).
- Produces: `showAuthGateSheet(BuildContext context, {required String message}): Future<void>` — top-level function, shows a modal bottom sheet with the given message above the existing `AuthSheet`, auto-dismisses once the user is signed in.

- [ ] **Step 1: Create the shared gate sheet**

Create `mobile_app/lib/src/core/widgets/auth_gate_sheet.dart`:

```dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../features/auth/auth_sheet.dart';

Future<void> showAuthGateSheet(BuildContext context, {required String message}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _AuthGateSheet(message: message),
  );
}

class _AuthGateSheet extends StatelessWidget {
  const _AuthGateSheet({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snap) {
        if (snap.data != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (context.mounted && Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          });
        }
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.85,
          maxChildSize: 0.95,
          builder: (_, scrollController) => Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: ListView(
              controller: scrollController,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC8E8F0),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    message,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      color: Color(0xFF0C2A38),
                    ),
                  ),
                ),
                const AuthSheet(),
              ],
            ),
          ),
        );
      },
    );
  }
}
```

- [ ] **Step 2: Gate the Booking tab in root_shell.dart**

In `mobile_app/lib/src/features/root/root_shell.dart`, add the import:

```dart
import '../../core/widgets/auth_gate_sheet.dart';
```

Replace the `_onNavTap` method:

```dart
  void _onNavTap(int index) {
    final isBookingTab = index == 2;

    if (isBookingTab && FirebaseAuth.instance.currentUser == null) {
      showAuthGateSheet(
        context,
        message: 'Sign in or create an account to book your appointment.',
      );
      return;
    }

    setState(() => _currentIndex = index);
    // Fade in the newly selected tab from 0.
    _tabFadeCtrl.forward(from: 0.0);

    if (isBookingTab) {
      // Microtask so the fade animation starts before the push overlay appears.
      Future.microtask(() {
        if (mounted) {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const WhoIsThisForScreen()),
          );
        }
      });
    }
  }
```

- [ ] **Step 3: Gate the chat FAB**

In the same file, replace the `floatingActionButton`:

```dart
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          if (FirebaseAuth.instance.currentUser == null) {
            showAuthGateSheet(
              context,
              message: 'Sign in to chat with our assistant.',
            );
            return;
          }
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const ChatPage()),
          );
        },
        backgroundColor: const Color(0xFF0891B2),
        foregroundColor: Colors.white,
        tooltip: 'Ask the assistant',
        child: const Icon(Icons.chat_bubble_rounded),
      ),
```

- [ ] **Step 4: Verify**

Run: `cd mobile_app && flutter analyze lib/src/core/widgets/auth_gate_sheet.dart lib/src/features/root/root_shell.dart`
Expected: "No issues found!"

Then run the app (`flutter run`), sign out (or use a fresh install), and confirm: tapping the Booking tab shows the sign-in sheet instead of switching tabs; tapping the chat FAB shows the same sheet instead of opening chat. Sign in from the sheet — confirm it auto-dismisses. Tap Booking again — confirm it now switches to the booking tab as before.

- [ ] **Step 5: Commit**

```bash
cd mobile_app && git add lib/src/core/widgets/auth_gate_sheet.dart lib/src/features/root/root_shell.dart && git commit -m "fix: intercept guests with a sign-in prompt before booking or chat"
```

---

## Task 10: PatientDashboard widget on mobile Home (mobile)

**Files:**
- Create: `mobile_app/lib/src/features/home/patient_dashboard.dart`
- Modify: `mobile_app/lib/src/features/home/home_screen.dart`

**Interfaces:**
- Consumes: `PeopleRepository.watchDependents(String userId): Stream<List<Dependent>>` (existing), `Dependent` model (existing, fields `id`, `name`, `relationship`), `AddPersonSheet.show(BuildContext context, {Dependent? existing}): Future<void>` (existing), `RecoveryService.watchEarliestPainLog` / `watchPainLogs` / `computeRecoveryPercent` (Task 8), `WhoIsThisForScreen.go(BuildContext context)` (existing static method), `PeopleScreen` and `AppointmentsScreen` (existing, no-arg constructors).
- Produces: `PatientDashboard` — exported widget, constructor `PatientDashboard({required User user})`.

- [ ] **Step 1: Create the widget**

Create `mobile_app/lib/src/features/home/patient_dashboard.dart`:

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../admin/recovery/recovery_service.dart';
import '../appointments/appointments_screen.dart';
import '../booking/who_is_this_for_screen.dart';
import '../people/add_person_sheet.dart';
import '../people/dependent_model.dart';
import '../people/people_repository.dart';
import '../people/people_screen.dart';

class PatientDashboard extends StatefulWidget {
  const PatientDashboard({super.key, required this.user});

  final User user;

  @override
  State<PatientDashboard> createState() => _PatientDashboardState();
}

class _PatientDashboardState extends State<PatientDashboard> {
  final _peopleRepo = PeopleRepository();
  String _personId = '';
  String _personName = '';

  String get _meName =>
      widget.user.displayName?.isNotEmpty == true ? widget.user.displayName! : 'Me';

  @override
  void initState() {
    super.initState();
    // widget.user is not available during field initialization, only from
    // initState() onward — see State lifecycle.
    _personId = widget.user.uid;
    _personName = _meName;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFC8E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your recovery', style: theme.textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            'Viewing recovery for $_personName',
            style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFF5E7A84)),
          ),
          const SizedBox(height: 12),
          StreamBuilder<List<Dependent>>(
            stream: _peopleRepo.watchDependents(widget.user.uid),
            builder: (context, snapshot) {
              final dependents = snapshot.data ?? const <Dependent>[];
              return _PersonDropdown(
                meName: _meName,
                meId: widget.user.uid,
                dependents: dependents,
                selectedId: _personId,
                onSelect: (id, name) => setState(() {
                  _personId = id;
                  _personName = name;
                }),
                onAddPerson: () => AddPersonSheet.show(context),
              );
            },
          ),
          const SizedBox(height: 16),
          _RecoveryPercentTile(uid: widget.user.uid, personId: _personId),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () => WhoIsThisForScreen.go(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0891B2),
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Book session'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const PeopleScreen()),
                  ),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('My People'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AppointmentsScreen()),
              ),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('My Appointments'),
            ),
          ),
        ],
      ),
    );
  }
}

class _PersonDropdown extends StatelessWidget {
  const _PersonDropdown({
    required this.meName,
    required this.meId,
    required this.dependents,
    required this.selectedId,
    required this.onSelect,
    required this.onAddPerson,
  });

  final String meName;
  final String meId;
  final List<Dependent> dependents;
  final String selectedId;
  final void Function(String id, String name) onSelect;
  final VoidCallback onAddPerson;

  static const _addPersonValue = '__add_person__';

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      value: selectedId,
      decoration: const InputDecoration(
        labelText: 'Viewing recovery for',
        border: OutlineInputBorder(),
        isDense: true,
      ),
      items: [
        DropdownMenuItem(value: meId, child: Text('$meName (Me)')),
        ...dependents.map(
          (d) => DropdownMenuItem(value: d.id, child: Text('${d.name} (${d.relationship})')),
        ),
        const DropdownMenuItem(value: _addPersonValue, child: Text('+ Add a person')),
      ],
      onChanged: (value) {
        if (value == null) return;
        if (value == _addPersonValue) {
          onAddPerson();
          return;
        }
        final name = value == meId ? meName : dependents.firstWhere((d) => d.id == value).name;
        onSelect(value, name);
      },
    );
  }
}

class _RecoveryPercentTile extends StatelessWidget {
  const _RecoveryPercentTile({required this.uid, required this.personId});

  final String uid;
  final String personId;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: RecoveryService.watchEarliestPainLog(uid, personId),
      builder: (context, baselineSnap) {
        final baselineDocs = baselineSnap.data?.docs ?? const [];
        if (baselineDocs.isEmpty) {
          return _tile(const Text('Log your first check-in to see your recovery score.'));
        }

        final baselineScore = baselineDocs.first.data()['score'] as int?;

        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: RecoveryService.watchPainLogs(uid, personId, 3),
          builder: (context, recentSnap) {
            final recentScores = (recentSnap.data?.docs ?? const [])
                .map((d) => d.data()['score'] as int)
                .toList();
            final percent = RecoveryService.computeRecoveryPercent(
              baselineScore: baselineScore,
              recentScores: recentScores,
            );

            return _tile(
              Row(
                children: [
                  Text(
                    percent == null ? '—' : '$percent%',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0891B2),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Improvement since your first pain check-in',
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _tile(Widget child) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFECFEFF),
        borderRadius: BorderRadius.circular(16),
      ),
      child: child,
    );
  }
}
```

- [ ] **Step 2: Wire it into HomeScreen**

In `mobile_app/lib/src/features/home/home_screen.dart`, add the import:

```dart
import 'patient_dashboard.dart';
```

Replace this line in `HomeScreen.build` (currently `_HeroBanner(theme: theme),`):

```dart
          _HeroBanner(theme: theme),
```

with:

```dart
          StreamBuilder<User?>(
            stream: FirebaseAuth.instance.authStateChanges(),
            builder: (context, snapshot) {
              final user = snapshot.data;
              if (user != null) {
                return PatientDashboard(user: user);
              }
              return _HeroBanner(theme: theme);
            },
          ),
```

(`FirebaseAuth` and `User` are already imported at the top of `home_screen.dart`.)

- [ ] **Step 3: Verify**

Run: `cd mobile_app && flutter analyze lib/src/features/home/patient_dashboard.dart lib/src/features/home/home_screen.dart`
Expected: "No issues found!"

Then run the app (`flutter run`): as a guest, confirm Home still shows the marketing hero. Sign in as a patient, return to Home — confirm it now shows the dashboard card with the person dropdown, recovery percentage, and the Book/My People/My Appointments buttons. Add a dependent via "+ Add a person" and confirm it appears in the dropdown and switching to it updates the recovery percentage.

- [ ] **Step 4: Commit**

```bash
cd mobile_app && git add lib/src/features/home/patient_dashboard.dart lib/src/features/home/home_screen.dart && git commit -m "feat: add patient dashboard to mobile Home screen for signed-in users"
```

---

## Self-Review Notes

- **Spec coverage:** §1 (recovery %) → Tasks 1, 8. §2 (web home) → Tasks 2–5. §3 (mobile home) → Tasks 8, 10. §4 (guest gate web `/book`) → Task 6; mobile booking/chat → Task 9; people/recovery already gated, no task needed. §5 (Cal.com) → Task 7.
- **Type consistency checked:** `computeRecoveryPercent` signature matches between its Task 1 definition and Task 2's usage; `RecoveryService.computeRecoveryPercent`/`watchEarliestPainLog` signatures match between Task 8's definition and Task 10's usage; `PersonSwitcher`'s new props match between Task 3's definition and Task 4's usage.
- **No placeholders:** every step has complete, runnable code.
