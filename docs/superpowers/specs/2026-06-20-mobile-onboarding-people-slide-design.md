# Mobile Onboarding — People Slide Design

**Date:** 2026-06-20
**Status:** Approved
**Scope:** Add a fourth onboarding slide to the mobile app that introduces the "My People" (family/dependents) concept to new users.

---

## Problem

The onboarding flow has three slides (Expert physio → Book in minutes → Track your recovery) and then drops users straight into the app. The "My People" feature — which lets users add family members, partners, or relatives and book appointments on their behalf — exists in the Profile tab and surfaces during booking via the "Who is this for?" screen, but new users have no awareness of it. Many will never discover it.

---

## Approach

**Add a 4th onboarding slide** using the exact same `_OnboardingPage` widget as the existing three slides. One new entry appended to the `_pages` list. No structural changes, no new files, no new widgets.

---

## Design

### New slide — "Book for your whole family"

**File:** `mobile_app/lib/src/features/onboarding/onboarding_screen.dart`
**Change:** Add one `_OnboardingPage(...)` entry to the `_pages` const list.

| Field | Value |
|---|---|
| `gradient` | `[Color(0xFF78350F), Color(0xFFB45309)]` — warm amber, distinct from existing blue/green/purple slides |
| `icon` | `Icons.group_rounded` |
| `iconBg` | `Color(0xFF92400E)` |
| `title` | `'Book for your\nwhole family'` |
| `subtitle` | `'Add family members, partners, or relatives. Book their appointments just like your own — all from one account.'` |

### Automatic behaviour (no code changes needed)

- The dots indicator auto-expands from 3 to 4 dots (driven by `_pages.length`).
- "Get started" button label now appears on slide 4 instead of slide 3 (driven by `_page < _pages.length - 1` condition).
- Back, Next, and Skip all work without modification.

### Slide sequence after change

| # | Title | Gradient | Icon |
|---|---|---|---|
| 1 | Expert physio, one tap away | Dark blue | `health_and_safety_rounded` |
| 2 | Book in minutes | Green | `calendar_month_rounded` |
| 3 | Track your recovery | Purple | `insights_rounded` |
| 4 *(new)* | Book for your whole family | Amber/orange | `group_rounded` |

---

## Out of scope

- Any interactive prompt to add a family member during onboarding.
- Changes to the "My People" screen, AddPersonSheet, or WhoIsThisForScreen.
- Any changes to the web portal onboarding (not applicable — web has no onboarding flow).

---

## Files changed

| File | Change |
|---|---|
| `mobile_app/lib/src/features/onboarding/onboarding_screen.dart` | Add 4th `_OnboardingPage` entry to `_pages` |
