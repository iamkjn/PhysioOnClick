# Mobile Onboarding — People Slide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth onboarding slide that introduces the "My People" feature so new users know they can book for family members, partners, and relatives.

**Architecture:** One new `_OnboardingPage(...)` entry appended to the `_pages` const list in `OnboardingScreen`. The dots indicator, button labels, and navigation all auto-update from `_pages.length` — no structural change needed.

**Tech Stack:** Flutter/Dart, `shared_preferences` (already used for onboarding gate).

## Global Constraints

- File to modify: `mobile_app/lib/src/features/onboarding/onboarding_screen.dart` — no other file changes.
- No new widgets, no new files, no new dependencies.
- No test suite is configured in this project — verification is manual (run the Flutter app and step through onboarding).
- The `_pages` list is `static const` — the new entry must also be a compile-time const.
- Exact copy values are mandatory verbatim (title, subtitle strings must match spec exactly, including newline placement).

---

### Task 1: Add the "Book for your whole family" onboarding slide

This is the only task. One block of six lines inserted as the 4th entry in `_pages`.

**Files:**
- Modify: `mobile_app/lib/src/features/onboarding/onboarding_screen.dart` (lines 29–51, the `_pages` list)

**Interfaces:**
- Consumes: `_OnboardingPage` widget already defined in the same file (lines 196–264). No new interface produced.

---

- [ ] **Step 1: Open the file and locate `_pages`**

The list starts at line 29. It currently has three `_OnboardingPage(...)` entries — blue, green, purple. You will append a fourth entry (amber) after the purple one, before the closing `];`.

- [ ] **Step 2: Insert the new slide entry**

Replace this block (the closing `];` of `_pages`):

```dart
    _OnboardingPage(
      gradient: [Color(0xFF3B1F6E), Color(0xFF5B2D8E)],
      icon: Icons.insights_rounded,
      iconBg: Color(0xFF4A2480),
      title: 'Track your\nrecovery',
      subtitle: 'Access your personalised rehab programme, exercise library and progress updates — all in one place.',
    ),
  ];
```

With this (the purple entry unchanged, new amber entry appended):

```dart
    _OnboardingPage(
      gradient: [Color(0xFF3B1F6E), Color(0xFF5B2D8E)],
      icon: Icons.insights_rounded,
      iconBg: Color(0xFF4A2480),
      title: 'Track your\nrecovery',
      subtitle: 'Access your personalised rehab programme, exercise library and progress updates — all in one place.',
    ),
    _OnboardingPage(
      gradient: [Color(0xFF78350F), Color(0xFFB45309)],
      icon: Icons.group_rounded,
      iconBg: Color(0xFF92400E),
      title: 'Book for your\nwhole family',
      subtitle: 'Add family members, partners, or relatives. Book their appointments just like your own — all from one account.',
    ),
  ];
```

- [ ] **Step 3: Verify the file compiles**

From the `mobile_app/` directory:

```bash
flutter analyze lib/src/features/onboarding/onboarding_screen.dart
```

Expected output: `No issues found!` (or only pre-existing warnings unrelated to this file).

- [ ] **Step 4: Run the app and step through onboarding manually**

```bash
# From mobile_app/ directory
flutter run
```

To force the onboarding to show again (it hides after first completion), run this in the Flutter DevTools console or add a temporary reset line before the `OnboardingScreen.isCompleted()` check — OR clear app data on the device/simulator:

```bash
# iOS Simulator: Device > Erase All Content and Settings
# Android emulator: wipe data from AVD Manager
```

Verify:
1. The onboarding now shows **4 dots** in the top-left indicator (was 3).
2. Slide 4 has an **amber/orange gradient**, group-people icon, title `"Book for your whole family"`, and the exact subtitle text.
3. The **"Get started"** label appears on slide 4 (not slide 3 as before).
4. **Back button** appears correctly on slides 2, 3, and 4.
5. **Skip** on any slide still navigates directly to the app.
6. Tapping **"Get started"** on slide 4 navigates to `RootShell` as before.

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/onboarding/onboarding_screen.dart
git commit -m "feat(onboarding): add People slide — book for your whole family"
```
