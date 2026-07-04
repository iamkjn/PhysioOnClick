# UX Overhaul — Flutter Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Flutter mobile app with the new PhysioOnClick design system: navy/teal/gold color tokens, DM Serif Display + DM Sans typography, connectivity wrapper, AppToast utility, illustrated empty states, branded splash upgrade, onboarding CTA redesign, and a welcome-back toast on returning sign-in.

**Architecture:** Color tokens are centralised in `app_colors.dart`. `theme.dart` references them and adds Google Fonts. New utility widgets (`ConnectivityWrapper`, `AppToast`, `EmptyState`) are created in `core/widgets/` following the existing pattern (`auth_gate_sheet.dart`, `avatar_widget.dart` already live there). `app.dart` wraps the home widget with `ConnectivityWrapper`; `root_shell.dart` gets the welcome toast. The existing custom `_AnimatedNavBar` is retained (it has better animations than M3 `NavigationBar`) — only its color tokens are updated.

**Tech Stack:** Flutter 3.41+, Dart SDK ^3.8.1, `google_fonts: ^6.2.1`, `connectivity_plus: ^6.0.0`. Firebase Auth/Firestore/Storage already present.

## Global Constraints

- Light mode only.
- `flutter pub get` must succeed after Task 1 before any other task starts.
- `flutter analyze` must exit 0 after each task.
- `flutter test mobile_app/test/` must exit 0 (existing 7 recovery tests must keep passing).
- Commit after each task: `git add <files> && git commit -m "feat(mobile): ..."`.
- All color values come from `AppColors` constants — never hardcode hex in widget files.
- Working directory for all flutter/dart commands: `cd mobile_app`.

---

### Task 1: Dependencies + Color Tokens

**Files:**
- Modify: `mobile_app/pubspec.yaml` (add `google_fonts`, `connectivity_plus`)
- Create: `mobile_app/lib/src/core/app_colors.dart`

**Interfaces:**
- Produces: `AppColors` class with static constants: `navy`, `teal`, `tealDark`, `tealLight`, `gold`, `goldLight`, `bg`, `surface`, `border`, `textPrimary`, `textSecondary`, `success`, `error`, `warning`. All tasks import `AppColors` from `'../../core/app_colors.dart'` (adjust relative path as needed).

- [ ] **Step 1: Add dependencies to `mobile_app/pubspec.yaml`**

In the `dependencies:` section, after `http: ^1.2.2`, add:

```yaml
  google_fonts: ^6.2.1
  connectivity_plus: ^6.0.0
```

- [ ] **Step 2: Run `flutter pub get`**

```bash
cd mobile_app && flutter pub get
```

Expected: resolves without errors. You will see `google_fonts` and `connectivity_plus` in the dependency tree.

- [ ] **Step 3: Create `mobile_app/lib/src/core/app_colors.dart`**

```dart
import 'package:flutter/material.dart';

abstract final class AppColors {
  static const navy          = Color(0xFF0D1B2A);
  static const teal          = Color(0xFF0B6E8E);
  static const tealDark      = Color(0xFF084F68);
  static const tealLight     = Color(0xFFE6F3F8);
  static const gold          = Color(0xFFB08030);
  static const goldLight     = Color(0xFFFDF6E9);
  static const bg            = Color(0xFFF7FAFC);
  static const surface       = Color(0xFFFFFFFF);
  static const border        = Color(0xFFE2E8F0);
  static const textPrimary   = Color(0xFF0D1B2A);
  static const textSecondary = Color(0xFF4A5568);
  static const success       = Color(0xFF059669);
  static const error         = Color(0xFFDC2626);
  static const warning       = Color(0xFFD97706);
}
```

- [ ] **Step 4: Analyze**

```bash
cd mobile_app && flutter analyze lib/src/core/app_colors.dart
```

Expected: no issues.

- [ ] **Step 5: Commit**

```bash
git add mobile_app/pubspec.yaml mobile_app/pubspec.lock mobile_app/lib/src/core/app_colors.dart
git commit -m "feat(mobile): add AppColors tokens and google_fonts/connectivity_plus deps"
```

---

### Task 2: Theme — DM Serif Display + DM Sans + New Tokens

**Files:**
- Modify: `mobile_app/lib/src/core/theme.dart`

**Interfaces:**
- Consumes: `AppColors` from `app_colors.dart`
- Produces: updated `buildPhysioTheme()` — same function signature, now uses DM Serif Display for display/headline styles and DM Sans for all body/UI text.

- [ ] **Step 1: Rewrite `mobile_app/lib/src/core/theme.dart`**

Replace the entire file:

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

ThemeData buildPhysioTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.teal,
      primary: AppColors.teal,
      secondary: AppColors.navy,
      surface: AppColors.surface,
      error: AppColors.error,
    ),
  );

  // DM Sans base for all text, then override display/headline to DM Serif Display.
  final dmSansBase = GoogleFonts.dmSansTextTheme(base.textTheme);

  return base.copyWith(
    scaffoldBackgroundColor: AppColors.bg,
    textTheme: dmSansBase.copyWith(
      displayLarge: GoogleFonts.dmSerifDisplay(
        fontSize: 48, color: AppColors.navy, height: 1.05),
      displayMedium: GoogleFonts.dmSerifDisplay(
        fontSize: 36, color: AppColors.navy, height: 1.05),
      displaySmall: GoogleFonts.dmSerifDisplay(
        fontSize: 30, color: AppColors.navy, height: 1.1),
      headlineLarge: GoogleFonts.dmSerifDisplay(
        fontSize: 26, color: AppColors.navy, height: 1.1),
      headlineMedium: GoogleFonts.dmSerifDisplay(
        fontSize: 22, color: AppColors.navy, height: 1.15),
      headlineSmall: GoogleFonts.dmSerifDisplay(
        fontSize: 20, color: AppColors.navy, height: 1.2),
      titleLarge: GoogleFonts.dmSans(
        fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.navy),
      titleMedium: GoogleFonts.dmSans(
        fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.navy),
      bodyLarge: GoogleFonts.dmSans(
        fontSize: 16, color: AppColors.textSecondary, height: 1.6),
      bodyMedium: GoogleFonts.dmSans(
        fontSize: 14, color: AppColors.textSecondary, height: 1.55),
      bodySmall: GoogleFonts.dmSans(
        fontSize: 12, color: AppColors.textSecondary),
      labelLarge: GoogleFonts.dmSans(
        fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.navy),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.navy,
      elevation: 0,
      centerTitle: false,
      surfaceTintColor: AppColors.surface,
      titleTextStyle: GoogleFonts.dmSans(
        fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.navy),
    ),
    cardTheme: CardThemeData(
      color: AppColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: AppColors.border),
        borderRadius: BorderRadius.circular(20),
      ),
      margin: EdgeInsets.zero,
    ),
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: AppColors.surface,
      selectedColor: AppColors.teal,
      side: const BorderSide(color: AppColors.border),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surface,
      border: OutlineInputBorder(
        borderSide: const BorderSide(color: AppColors.border),
        borderRadius: BorderRadius.circular(10),
      ),
      enabledBorder: OutlineInputBorder(
        borderSide: const BorderSide(color: AppColors.border, width: 1.5),
        borderRadius: BorderRadius.circular(10),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: const BorderSide(color: AppColors.teal, width: 1.5),
        borderRadius: BorderRadius.circular(10),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.teal,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 4,
        shadowColor: AppColors.teal.withValues(alpha: 0.25),
        textStyle: GoogleFonts.dmSans(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.teal,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.dmSans(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.navy,
        minimumSize: const Size.fromHeight(52),
        side: const BorderSide(color: AppColors.border, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.dmSans(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    // BottomNavigationBar colours kept for the custom _AnimatedNavBar in root_shell.dart
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      selectedItemColor: AppColors.teal,
      unselectedItemColor: AppColors.textSecondary,
      showUnselectedLabels: true,
      type: BottomNavigationBarType.fixed,
      backgroundColor: AppColors.surface,
    ),
  );
}
```

- [ ] **Step 2: Run analyze and tests**

```bash
cd mobile_app && flutter analyze lib/src/core/theme.dart && flutter test test/
```

Expected: analyze — no issues. Tests — 7 passed (recovery tests unaffected by theme change).

- [ ] **Step 3: Commit**

```bash
git add mobile_app/lib/src/core/theme.dart
git commit -m "feat(mobile): apply DM Serif Display + DM Sans and new color tokens to theme"
```

---

### Task 3: Connectivity Wrapper

**Files:**
- Create: `mobile_app/lib/src/core/widgets/connectivity_wrapper.dart`
- Modify: `mobile_app/lib/src/app.dart` (wrap home widget)

**Interfaces:**
- Consumes: `AppColors`, `connectivity_plus`
- Produces: `ConnectivityWrapper({ required Widget child })` — wraps any widget; shows a full-screen `_OfflineScreen` when the device has no connectivity; auto-dismisses when connectivity is restored; "Retry" button triggers a manual connectivity re-check.

- [ ] **Step 1: Create `mobile_app/lib/src/core/widgets/connectivity_wrapper.dart`**

```dart
import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../app_colors.dart';

class ConnectivityWrapper extends StatefulWidget {
  const ConnectivityWrapper({required this.child, super.key});

  final Widget child;

  @override
  State<ConnectivityWrapper> createState() => _ConnectivityWrapperState();
}

class _ConnectivityWrapperState extends State<ConnectivityWrapper> {
  late final StreamSubscription<List<ConnectivityResult>> _sub;
  bool _isOffline = false;

  static bool _isNone(List<ConnectivityResult> results) =>
      results.every((r) => r == ConnectivityResult.none);

  @override
  void initState() {
    super.initState();
    // Subscribe to changes — no initial check needed; assume online at start.
    _sub = Connectivity().onConnectivityChanged.listen((results) {
      final offline = _isNone(results);
      if (offline != _isOffline && mounted) {
        setState(() => _isOffline = offline);
      }
    });
  }

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }

  Future<void> _retry() async {
    final results = await Connectivity().checkConnectivity();
    if (_isNone(results)) return; // still offline
    if (mounted) setState(() => _isOffline = false);
  }

  @override
  Widget build(BuildContext context) {
    if (!_isOffline) return widget.child;
    return _OfflineScreen(onRetry: _retry);
  }
}

class _OfflineScreen extends StatelessWidget {
  const _OfflineScreen({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Wifi-off illustration
                Container(
                  width: 100,
                  height: 100,
                  decoration: const BoxDecoration(
                    color: AppColors.tealLight,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.wifi_off_rounded,
                    size: 48,
                    color: AppColors.teal,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'No internet connection',
                  style: GoogleFonts.dmSerifDisplay(
                    fontSize: 24,
                    color: AppColors.navy,
                    height: 1.2,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  'Check your WiFi or mobile data, then try again.',
                  style: GoogleFonts.dmSans(
                    fontSize: 15,
                    color: AppColors.textSecondary,
                    height: 1.6,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),
                FilledButton(
                  onPressed: onRetry,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Wrap the home widget in `mobile_app/lib/src/app.dart`**

Read `lib/src/app.dart`. Add the import at the top:

```dart
import 'core/widgets/connectivity_wrapper.dart';
```

Find the `home:` line in `MaterialApp` (currently `home: _home ?? SplashScreen(status: _splashStatus)`). Wrap the home expression:

```dart
home: ConnectivityWrapper(
  child: _home ?? SplashScreen(status: _splashStatus),
),
```

- [ ] **Step 3: Analyze and test**

```bash
cd mobile_app && flutter analyze lib/src/core/widgets/connectivity_wrapper.dart lib/src/app.dart && flutter test test/
```

Expected: no issues, 7 tests pass.

- [ ] **Step 4: Commit**

```bash
git add mobile_app/lib/src/core/widgets/connectivity_wrapper.dart mobile_app/lib/src/app.dart
git commit -m "feat(mobile): add ConnectivityWrapper — full-screen offline screen with retry"
```

---

### Task 4: AppToast Utility

**Files:**
- Create: `mobile_app/lib/src/core/widgets/app_toast.dart`

**Interfaces:**
- Produces: `AppToast.show(BuildContext context, { required String message, required ToastType type, Duration? duration })` — static method that calls `ScaffoldMessenger.of(context).showSnackBar(...)`. `ToastType` enum: `success`, `info`, `warning`, `error`. Auto-dismiss for `success`/`info` (3s), manual dismiss for `warning`/`error`.

- [ ] **Step 1: Create `mobile_app/lib/src/core/widgets/app_toast.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../app_colors.dart';

enum ToastType { success, info, warning, error }

abstract final class AppToast {
  static void show(
    BuildContext context, {
    required String message,
    required ToastType type,
    Duration? duration,
  }) {
    final color = switch (type) {
      ToastType.success => AppColors.success,
      ToastType.info    => AppColors.teal,
      ToastType.warning => AppColors.warning,
      ToastType.error   => AppColors.error,
    };

    final icon = switch (type) {
      ToastType.success => Icons.check_circle_outline_rounded,
      ToastType.info    => Icons.info_outline_rounded,
      ToastType.warning => Icons.warning_amber_rounded,
      ToastType.error   => Icons.error_outline_rounded,
    };

    final autoDismiss = type == ToastType.success || type == ToastType.info;
    final effectiveDuration = duration ?? (autoDismiss
        ? const Duration(seconds: 3)
        : const Duration(days: 1)); // effectively manual

    final snackBar = SnackBar(
      content: Row(
        children: [
          Icon(icon, color: Colors.white, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.dmSans(
                color: Colors.white,
                fontWeight: FontWeight.w500,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
      backgroundColor: color,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: effectiveDuration,
      action: autoDismiss
          ? null
          : SnackBarAction(
              label: '✕',
              textColor: Colors.white,
              onPressed: () {
                ScaffoldMessenger.of(context).hideCurrentSnackBar();
              },
            ),
    );

    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }
}
```

- [ ] **Step 2: Analyze**

```bash
cd mobile_app && flutter analyze lib/src/core/widgets/app_toast.dart
```

Expected: no issues.

- [ ] **Step 3: Commit**

```bash
git add mobile_app/lib/src/core/widgets/app_toast.dart
git commit -m "feat(mobile): add AppToast utility — 4-type snackbar system"
```

---

### Task 5: EmptyState Widget

**Files:**
- Create: `mobile_app/lib/src/core/widgets/empty_state.dart`

**Interfaces:**
- Produces: `EmptyState({ required String title, required String body, IconData? icon, Color? iconColor, Widget? cta })` — centered column with a teal circle icon container, DM Serif Display title, DM Sans body, and an optional CTA widget.

- [ ] **Step 1: Create `mobile_app/lib/src/core/widgets/empty_state.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../app_colors.dart';

class EmptyState extends StatelessWidget {
  const EmptyState({
    required this.title,
    required this.body,
    this.icon = Icons.inbox_outlined,
    this.iconColor = AppColors.teal,
    this.cta,
    super.key,
  });

  final String title;
  final String body;
  final IconData icon;
  final Color iconColor;
  final Widget? cta;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: const BoxDecoration(
                color: AppColors.tealLight,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 40, color: iconColor),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: GoogleFonts.dmSerifDisplay(
                fontSize: 22,
                color: AppColors.navy,
                height: 1.2,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            Text(
              body,
              style: GoogleFonts.dmSans(
                fontSize: 15,
                color: AppColors.textSecondary,
                height: 1.6,
              ),
              textAlign: TextAlign.center,
            ),
            if (cta != null) ...[
              const SizedBox(height: 24),
              cta!,
            ],
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Apply to the appointments screen**

Find `mobile_app/lib/src/features/appointments/` or whichever file shows the appointments list. Look for a "no bookings" or empty list condition. Add the import and replace any plain `Text('No appointments')` or similar:

```dart
import 'package:mobile_app/src/core/widgets/empty_state.dart';
// adjust import path to match the feature file's location
```

If the appointments list is empty, render:

```dart
EmptyState(
  title: 'No appointments yet',
  body: 'Book your first session with a physio today.',
  icon: Icons.calendar_today_outlined,
  cta: FilledButton(
    onPressed: () {
      // Navigate to booking — use WhoIsThisForScreen.go() or push BookingScreen
      WhoIsThisForScreen.go(context);
    },
    style: FilledButton.styleFrom(
      backgroundColor: AppColors.gold,
      foregroundColor: Colors.white,
      minimumSize: const Size(160, 48),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    child: const Text('Book Now'),
  ),
)
```

If you cannot find an appointments list screen (the patient appointments page may live on web only), skip the integration step and just commit the widget file.

- [ ] **Step 3: Apply to My People / dependents screen**

Find the dependents/people list screen. If it has an empty state condition, replace its text with:

```dart
EmptyState(
  title: 'Just you for now',
  body: 'Add a family member or friend to book appointments on their behalf.',
  icon: Icons.group_outlined,
  cta: FilledButton(
    onPressed: () { /* open add-person form */ },
    child: const Text('Add a Person'),
  ),
)
```

- [ ] **Step 4: Analyze and test**

```bash
cd mobile_app && flutter analyze lib/src/core/widgets/empty_state.dart && flutter test test/
```

Expected: no issues, 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/core/widgets/empty_state.dart
git commit -m "feat(mobile): add EmptyState widget and apply to appointments/people screens"
```

---

### Task 6: Onboarding Design Upgrade

**Files:**
- Modify: `mobile_app/lib/src/features/onboarding/onboarding_screen.dart`

**Goal:** Replace hardcoded `TextStyle` values with `google_fonts` + `AppColors`. The last slide's "Get started" button gets the gold colour. Skip button keeps white. Logic (`isCompleted`, `markCompleted`, page navigation) is untouched.

**Interfaces:**
- Consumes: `AppColors`, `google_fonts`
- Produces: same `OnboardingScreen` API — no external interface changes.

- [ ] **Step 1: Add imports to `onboarding_screen.dart`**

At the top of the file, add:

```dart
import 'package:google_fonts/google_fonts.dart';
import '../../core/app_colors.dart';
```

- [ ] **Step 2: Update `_OnboardingPage.build()` typography**

Find the `_OnboardingPage` `build` method. Replace the `Text` widget for the title:

```dart
// BEFORE:
Text(
  title,
  style: const TextStyle(
    color: Colors.white,
    fontSize: 40,
    fontWeight: FontWeight.w800,
    height: 1.05,
    letterSpacing: -0.5,
  ),
),

// AFTER:
Text(
  title,
  style: GoogleFonts.dmSerifDisplay(
    color: Colors.white,
    fontSize: 40,
    height: 1.05,
  ),
),
```

Replace the `Text` widget for the subtitle:

```dart
// BEFORE:
Text(
  subtitle,
  style: TextStyle(
    color: Colors.white.withValues(alpha: 0.82),
    fontSize: 16,
    height: 1.6,
  ),
),

// AFTER:
Text(
  subtitle,
  style: GoogleFonts.dmSans(
    color: Colors.white.withValues(alpha: 0.82),
    fontSize: 16,
    height: 1.6,
  ),
),
```

- [ ] **Step 3: Style the "Get started" / "Next" button**

Find the forward button `GestureDetector` → `Container` in `_OnboardingScreenState.build()`. The container currently has `color: Colors.white`. Change it so the last slide uses gold:

```dart
// Replace the decoration of the forward button Container:
decoration: BoxDecoration(
  color: _page < _pages.length - 1 ? Colors.white : AppColors.gold,
  borderRadius: BorderRadius.circular(18),
),
```

Update the text inside that button to match:

```dart
Text(
  _page < _pages.length - 1 ? 'Next' : 'Get started',
  style: GoogleFonts.dmSans(
    fontSize: 16,
    fontWeight: FontWeight.w700,
    color: _page < _pages.length - 1 ? AppColors.navy : Colors.white,
  ),
),
```

Update the trailing arrow icon to match:

```dart
Icon(
  Icons.arrow_forward_rounded,
  color: _page < _pages.length - 1 ? AppColors.teal : Colors.white,
  size: 20,
),
```

- [ ] **Step 4: Analyze**

```bash
cd mobile_app && flutter analyze lib/src/features/onboarding/onboarding_screen.dart
```

Expected: no issues.

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/features/onboarding/onboarding_screen.dart
git commit -m "feat(mobile): upgrade onboarding typography to DM Serif Display + gold CTA on last slide"
```

---

### Task 7: RootShell — Token Update + Welcome Toast

**Files:**
- Modify: `mobile_app/lib/src/features/root/root_shell.dart`

**Goal:** Replace hardcoded colour literals in `_NavItem` and `_AnimatedNavBar` with `AppColors` constants. Add a one-time welcome-back toast when a returning signed-in user lands on `RootShell`.

**Interfaces:**
- Consumes: `AppColors`, `AppToast`, `ToastType` from `app_toast.dart`
- Produces: updated `RootShell` — same public API, no structural changes.

- [ ] **Step 1: Add imports to `root_shell.dart`**

At the top of the file, add:

```dart
import 'package:google_fonts/google_fonts.dart';
import '../../core/app_colors.dart';
import '../../core/widgets/app_toast.dart';
```

- [ ] **Step 2: Add welcome toast in `_RootShellState.initState()`**

Find `initState()`. After `_checkAdminRole()`, add a post-frame callback:

```dart
@override
void initState() {
  super.initState();
  _tabFadeCtrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 220),
    value: 1.0,
  );
  _fade = CurvedAnimation(parent: _tabFadeCtrl, curve: Curves.easeInOut);
  _checkAdminRole();
  _showWelcomeToast();
}

void _showWelcomeToast() {
  WidgetsBinding.instance.addPostFrameCallback((_) {
    if (!mounted) return;
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final firstName = user.displayName?.split(' ').first ?? 'there';
    AppToast.show(
      context,
      message: 'Welcome back, $firstName!',
      type: ToastType.info,
    );
  });
}
```

- [ ] **Step 3: Replace hardcoded colours in `_AnimatedNavBar`**

Find `_AnimatedNavBar.build()`. Update the container decoration:

```dart
// BEFORE:
color: Colors.white,
border: Border(
  top: BorderSide(color: const Color(0xFFC8E8F0), width: 1),
),
BoxShadow(
  color: Colors.black.withValues(alpha: 0.05),
  ...
),

// AFTER:
color: AppColors.surface,
border: Border(
  top: BorderSide(color: AppColors.border, width: 1),
),
BoxShadow(
  color: AppColors.navy.withValues(alpha: 0.05),
  ...
),
```

- [ ] **Step 4: Replace hardcoded colours in `_NavItem`**

Find `_NavItem.build()`. The `highlight` (Booking) pill gradient uses `Color(0xFF0891B2)` and `Color(0xFF0E7490)`. Replace:

```dart
// BEFORE gradient:
colors: [Color(0xFF0891B2), Color(0xFF0E7490)],

// AFTER:
colors: [AppColors.teal, AppColors.tealDark],
```

Replace the shadow colour on the pill:

```dart
// BEFORE:
color: const Color(0xFF0891B2).withValues(alpha: 0.35),

// AFTER:
color: AppColors.teal.withValues(alpha: 0.35),
```

Replace the label colour for the highlighted (unselected) item:

```dart
// BEFORE:
color: widget.primaryColor,

// Keep as-is — primaryColor is passed from theme.colorScheme.primary, which is now AppColors.teal.
```

Find the regular (non-highlight) `_NavItem` — the unselected icon and label colour `const Color(0xFF5E7A84)`. Replace:

```dart
// BEFORE:
color: const Color(0xFF5E7A84),

// AFTER:
color: AppColors.textSecondary,
```

Apply this replacement in **both** the `AnimatedSwitcher` (icon colour) and `AnimatedDefaultTextStyle` (text colour).

- [ ] **Step 5: Update the FAB background colour**

Find `floatingActionButton:`. Replace `backgroundColor: const Color(0xFF0891B2)` with `backgroundColor: AppColors.teal`.

- [ ] **Step 6: Analyze and test**

```bash
cd mobile_app && flutter analyze lib/src/features/root/root_shell.dart && flutter test test/
```

Expected: no issues, 7 tests pass.

- [ ] **Step 7: Commit**

```bash
git add mobile_app/lib/src/features/root/root_shell.dart
git commit -m "feat(mobile): update nav bar tokens to AppColors and add welcome-back toast"
```

---

## Self-Review Checklist

| Spec section | Covered by task |
|---|---|
| Color tokens centralised | Task 1 |
| DM Serif Display + DM Sans fonts | Task 2 |
| Theme updated with new tokens | Task 2 |
| ConnectivityWrapper — offline screen with retry | Task 3 |
| Wrap app home in ConnectivityWrapper | Task 3 |
| AppToast — 4 types, auto/manual dismiss | Task 4 |
| EmptyState widget | Task 5 |
| Empty state on appointments screen | Task 5 |
| Empty state on people screen | Task 5 |
| Onboarding: DM Serif Display headlines | Task 6 |
| Onboarding: gold CTA on last slide | Task 6 |
| Onboarding: once per install (already working via SharedPreferences) | No change needed |
| RootShell: AppColors tokens replacing hex | Task 7 |
| Welcome-back toast on returning sign-in | Task 7 |
| `flutter analyze` exits 0 after each task | ✓ in every task |
| Existing 7 recovery tests keep passing | ✓ in every task |
