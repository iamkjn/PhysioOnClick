# Home Dashboard & Guest Access Flow — Design Spec

**Date:** 2026-06-30
**Project:** PhysioOnClick (Next.js web + Flutter mobile)
**Status:** Approved by owner
**Builds on:** [2026-06-21-recovery-dashboard-design.md](2026-06-21-recovery-dashboard-design.md) (existing `painLogs` / `clinicalAssessments` / `dependents` data model — unchanged here) and [2026-06-18-patient-experience-platform-design.md](2026-06-18-patient-experience-platform-design.md) (dependent profiles)

---

## Problem

Two pieces of the intended product flow exist only partially today, on only one platform, or not at all:

1. **Home-page recovery snapshot.** The web app has a working person-switcher + pain-trend chart + adherence bar, but it's buried at `/patient/recovery` — not on the home page. The Flutter app has *no* patient-facing recovery view at all; recovery tracking only exists in the mobile admin (physio) section. Neither platform shows a single recovery percentage — only a 0–10 pain chart and a separate weekly adherence percentage.
2. **Guest gate is incomplete.** The product intent is: anyone can explore the app/site without an account, but booking an appointment or touching personal data (recovery, people) must require sign-in. Mobile only enforces this with a soft banner — guests can complete a real Cal.com booking and use the chat assistant fully unauthenticated. **Web's `/book` page has no auth check at all.**

This spec closes both gaps and adds the missing recovery-percentage metric, on web and mobile, without changing the underlying Firestore schema.

---

## 1. Recovery percentage

A single derived metric, computed identically (implemented separately per runtime) on web and mobile from the existing `patients/{uid}/people/{personId}/painLogs` collection:

```
baseline = score of the first-ever painLog for this person (chronologically earliest)
current  = average score of the last 3 painLog entries (or fewer if <3 exist)
recovery% = clamp(round((baseline - current) / baseline * 100), 0, 100)
```

Edge cases:
- **Zero pain logs:** no percentage shown. Display "Log your first check-in to see your recovery score" with a CTA into the pain check-in flow.
- **One pain log only:** baseline == current → 0%. This is correct: day one, no improvement measured yet.
- **`baseline == 0`:** cannot divide by zero (patient started pain-free, unusual but possible) → show "—" with a tooltip "Recovery score available once a pain score is logged."
- **Current worse than baseline:** clamps to 0%, never negative. The detailed trend chart underneath still shows the real regression — the headline number just doesn't go negative.

This is a headline stat shown *above* the existing 56-day pain-trend line chart (`components/recovery-chart.tsx` / mobile equivalent) — it summarizes, it does not replace the detailed chart.

**Implementation:**
- Web: new exported function in `lib/recovery.ts`, e.g. `computeRecoveryPercent(logs: PainLog[]): number | null`.
- Mobile: equivalent pure function colocated with `RecoveryService` (`mobile_app/lib/src/features/admin/recovery/recovery_service.dart` or a new patient-facing recovery file — see §3).

No new Firestore fields or collections — purely a client-side computation over existing `painLogs`.

---

## 2. Web home page (`app/page.tsx`)

`/` becomes auth-aware. A new client component is inserted at the position currently occupied by the hero `<section className="home-hero">`:

- **Guest (signed out):** today's marketing hero renders exactly as now — no visual change.
- **Signed in:** the hero is replaced by a dashboard panel containing:
  - Person dropdown: "Viewing: [Name] ▾" — built on the existing `PersonSwitcher` pattern (`lib/dependents.ts` for the list), with "Me" as default and **"+ Add a person"** as the final option (today's `PersonSwitcher` hides itself entirely when there are zero dependents — this new home version always shows, even with zero dependents, so users can discover "add a person").
  - Recovery % stat for the selected person (per §1), with a link to the full chart.
  - Quick links: Book a session (→ `/book`), My People (→ `/patient/people`), My Appointments (→ `/patient/appointments`).

Everything below the hero (trust bar, services grid) is unchanged for both guest and signed-in states.

---

## 3. Mobile home screen (`home_screen.dart`)

Mirrors the web split, since mobile only has one Home tab (no separate marketing/portal split to merge):

- `_Header` (greeting) is unchanged.
- `_HeroBanner` is conditionally replaced based on `FirebaseAuth.instance.authStateChanges()`:
  - **Guest:** current `_HeroBanner` (hero + Book/Services buttons), unchanged.
  - **Signed in:** new `_PatientDashboard` widget:
    - Person dropdown sourced from `PeopleRepository.watchDependents(uid)` + "Me" + "+ Add a person" (opens `AddPersonSheet`, reused from the People feature).
    - Recovery % card: big number + small ring/progress indicator, computed via the new mobile `computeRecoveryPercent` reading `RecoveryService.watchPainLogs(uid, personId, 3)` for "current" and a separate earliest-log query for "baseline".
    - Quick-action chips: Book, My People, My Appointments.
- `_TrustBar` and the feature cards below are unchanged for both states.

This is new patient-facing surface area on mobile — today recovery data is only ever rendered in the *admin* recovery panel. The widget reads the same Firestore paths the admin panel and web already use; no new write paths.

---

## 4. Guest access gate

Principle: explore everything public freely; booking, recovery data, people management, and the chat assistant require an account. The gate intercepts *before* the protected screen/action is reached — it doesn't let a guest partially use the feature first.

| Surface | Current behavior | Fix |
|---|---|---|
| Mobile Booking tab (`root_shell.dart` `_onNavTap`) | Switches to `BookingScreen()` regardless of auth; guest sees a soft "sign in to save bookings" banner but the Cal.com WebView is fully usable | If `FirebaseAuth.instance.currentUser == null`, tapping the tab does **not** change `_currentIndex` — instead shows the auth bottom sheet (promote the existing `_AuthBottomSheet` from `booking_screen.dart` into a shared widget, e.g. `core/widgets/auth_gate_sheet.dart`). Tab only switches once signed in. |
| Mobile chat FAB (`root_shell.dart`) | Opens `ChatPage` for anyone | Same shared auth-gate sheet shown for guests instead of pushing `ChatPage` |
| Mobile Profile tab → My People / Appointments | Already gated: `ProfileScreen` shows a sign-in prompt in place of all content when logged out | No change — already correct |
| Mobile new home dashboard (§3) | N/A (new) | Guest state shows the unchanged marketing hero (§3) — the recovery section simply isn't rendered for guests, so there's nothing to gate on Home itself. The gate lives at the entry points above. |
| **Web `/book`** | **No auth check — `CalEmbed` renders unconditionally, guests can complete a real booking with no PhysioOnClick account** | Page checks auth client-side before mounting `CalEmbed`. Signed out → render a sign-in/register panel (reuse `AuthPanel` styling) in place of the iframe; the iframe never loads for guests. |
| Web `/patient/recovery`, `/patient/people` | Already gated inline ("please sign in to view…") | No change — already correct |
| Web new home dashboard (§2) | N/A (new) | Same as mobile: guest state is just the unchanged hero; no separate gate needed here since the dashboard only renders when already signed in |

Out of the gate entirely (stay fully open for guests on both platforms): services, pricing, blog, about, contact/enquiry form.

---

## 5. Cal.com stability

Already fixed prior to this spec: the original `cal.js` inline embed (`window.Cal(...)`) silently failed when the script raced `lazyOnload` — replaced with a plain iframe in `components/cal-embed.tsx`, driven by `NEXT_PUBLIC_CAL_USERNAME`. This is confirmed stable; no further change planned on web.

Remaining gap: `mobile_app/lib/src/features/booking/booking_screen.dart:198` hardcodes `Uri.parse('https://cal.com/physioonclick')` as a literal string, duplicating (and risking drift from) the web's env-driven username. Fix: extract to a single named constant (e.g. `AppConfig.calComBookingUrl` in a new or existing `core/config.dart`), used by `BookingScreen`. Document in a comment that this must match `NEXT_PUBLIC_CAL_USERNAME` on web if the Cal.com account ever changes.

No replacement of Cal.com — the embed/WebView pattern is sound; the only real instability was the JS embed approach, already resolved.

---

## Out of Scope (this spec)

- No new Firestore collections, fields, or security-rule changes — reuses `dependents` and `patients/{uid}/people/{personId}/**` exactly as defined in the prior recovery-dashboard spec.
- No changes to the admin/physio-facing recovery panel (web `/admin/recovery` or mobile `AdminRecoveryPanelScreen`) — untouched.
- No web push / FCM changes.
- No changes to the Cal.com webhook, booking cancellation/reschedule flows, or pricing/service content.

---

## Success Criteria

- Signed-in patients see a person dropdown + recovery percentage on the home screen of both web and mobile, with no extra navigation required.
- Guests can browse the entire public site/app, but cannot reach a live Cal.com calendar, recovery data, people management, or the chat assistant without being prompted to sign in or register first — verified by attempting each as a logged-out user on both platforms.
- `booking_screen.dart` and `cal-embed.tsx` reference the Cal.com username from exactly one place each (no literal duplication left in mobile).
