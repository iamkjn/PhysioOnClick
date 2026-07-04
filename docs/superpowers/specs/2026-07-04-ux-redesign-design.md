# PhysioOnClick UX Overhaul Design

> **Platforms:** Next.js 15 web app + Flutter mobile app  
> **Theme:** Premium & confident — deep teal + dark navy, light mode, high-end private clinic brand  
> **Scope:** Full cross-platform redesign covering color system, typography, components, session flow, empty states, offline handling, and alert system

---

## 1. Color System

### Design Tokens

| Token | Hex | Usage |
|---|---|---|
| `--color-navy` | `#0D1B2A` | Primary text, headers, nav backgrounds |
| `--color-teal` | `#0B6E8E` | Brand primary, CTAs, active states, links |
| `--color-teal-dark` | `#084F68` | Teal hover state |
| `--color-teal-light` | `#E6F3F8` | Teal tints, pill backgrounds, highlights |
| `--color-gold` | `#B08030` | Booking CTA only — premium differentiation |
| `--color-gold-light` | `#FDF6E9` | Gold tint backgrounds |
| `--color-bg` | `#F7FAFC` | Page background |
| `--color-surface` | `#FFFFFF` | Card, modal, sheet backgrounds |
| `--color-border` | `#E2E8F0` | Dividers, input borders |
| `--color-text-primary` | `#0D1B2A` | Body text |
| `--color-text-secondary` | `#4A5568` | Captions, helper text |
| `--color-success` | `#059669` | Success states |
| `--color-error` | `#DC2626` | Error states, destructive actions |
| `--color-warning` | `#D97706` | Warning states |

### Flutter Equivalents

```dart
static const navy = Color(0xFF0D1B2A);
static const teal = Color(0xFF0B6E8E);
static const tealDark = Color(0xFF084F68);
static const tealLight = Color(0xFFE6F3F8);
static const gold = Color(0xFFB08030);
static const goldLight = Color(0xFFFDF6E9);
static const bg = Color(0xFFF7FAFC);
static const surface = Color(0xFFFFFFFF);
static const border = Color(0xFFE2E8F0);
static const textPrimary = Color(0xFF0D1B2A);
static const textSecondary = Color(0xFF4A5568);
static const success = Color(0xFF059669);
static const error = Color(0xFFDC2626);
static const warning = Color(0xFFD97706);
```

---

## 2. Typography

### Font Pairing

| Font | Role | Usage |
|---|---|---|
| **DM Serif Display** | Headlines | H1–H3, hero text, section titles |
| **DM Sans** | UI / Body | All other text: labels, body, captions, buttons |

### Web — Google Fonts import

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

### CSS scale

```css
--font-serif: 'DM Serif Display', Georgia, serif;
--font-sans: 'DM Sans', system-ui, sans-serif;

--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
```

### Flutter — pubspec.yaml additions

```yaml
dependencies:
  google_fonts: ^6.2.1
```

```dart
// In theme.dart
import 'package:google_fonts/google_fonts.dart';

textTheme: GoogleFonts.dmSansTextTheme(base.textTheme).copyWith(
  displayLarge: GoogleFonts.dmSerifDisplay(fontSize: 48, color: AppColors.navy),
  displayMedium: GoogleFonts.dmSerifDisplay(fontSize: 36, color: AppColors.navy),
  displaySmall: GoogleFonts.dmSerifDisplay(fontSize: 30, color: AppColors.navy),
  headlineLarge: GoogleFonts.dmSerifDisplay(fontSize: 24, color: AppColors.navy),
  headlineMedium: GoogleFonts.dmSerifDisplay(fontSize: 20, color: AppColors.navy),
),
```

---

## 3. Component Upgrades

### Cards

- Border radius: `20px` web / `20` Flutter
- Background: `--color-surface` / `AppColors.surface`
- Shadow: `0 2px 16px rgba(11,110,142,0.08)` (soft teal-tinted shadow)
- Border: `1px solid var(--color-border)`
- Padding: `24px` web / `EdgeInsets.all(24)` Flutter

### Primary Button (teal)

```css
background: var(--color-teal);
color: white;
border-radius: 14px;
padding: 14px 28px;
font: 600 16px var(--font-sans);
box-shadow: 0 4px 12px rgba(11,110,142,0.25);
transition: background 0.15s, transform 0.1s;

&:hover { background: var(--color-teal-dark); transform: translateY(-1px); }
&:active { transform: translateY(0); }
```

Flutter:
```dart
FilledButton.styleFrom(
  backgroundColor: AppColors.teal,
  foregroundColor: Colors.white,
  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
  padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
  elevation: 4,
  shadowColor: AppColors.teal.withOpacity(0.25),
)
```

### Booking CTA Button (gold — exclusive to booking actions)

```css
background: var(--color-gold);
color: white;
border-radius: 14px;
/* Same padding/font as primary */
box-shadow: 0 4px 12px rgba(176,128,48,0.25);

&:hover { background: #8C6420; }
```

### Input Fields

```css
border: 1.5px solid var(--color-border);
border-radius: 10px;
padding: 12px 16px;
font: 16px var(--font-sans);
color: var(--color-text-primary);
background: var(--color-surface);
transition: border-color 0.15s;

&:focus { outline: none; border-color: var(--color-teal); box-shadow: 0 0 0 3px var(--color-teal-light); }
```

### Mobile — Material 3 NavigationBar

Replace `BottomNavigationBar` with `NavigationBar`:

```dart
NavigationBar(
  backgroundColor: AppColors.surface,
  indicatorColor: AppColors.tealLight,
  labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
  destinations: const [
    NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
    NavigationDestination(icon: Icon(Icons.article_outlined), selectedIcon: Icon(Icons.article), label: 'Blog'),
    NavigationDestination(icon: Icon(Icons.calendar_today_outlined), selectedIcon: Icon(Icons.calendar_today), label: 'Book'),
    NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Account'),
  ],
)
```

---

## 4. Session Flow

### 4a. Web — Skeleton Shimmer on Load

All data-dependent sections (HomeDashboard, booking history, blog list) show animated skeleton placeholders while Firebase data loads, instead of layout shift or blank areas.

Skeleton CSS:
```css
.skeleton {
  background: linear-gradient(90deg, var(--color-border) 25%, var(--color-bg) 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
```

### 4b. Mobile — Branded Splash Screen

Current `SplashScreen` shows plain status text. Upgrade to:
- Full-screen navy/teal gradient background
- Centered logo + "PhysioOnClick" in DM Serif Display white
- Tagline in DM Sans: "Professional physiotherapy, online"
- `LinearProgressIndicator` in teal at bottom
- Status text in `textSecondary` at bottom center

### 4c. Onboarding — Once Per Install

**Requirement:** Onboarding shown exactly once per device installation. On all subsequent opens, skip to the auth check. 

Implementation (already partially in place via `OnboardingScreen.isCompleted()`):
- `SharedPreferences` key `onboarding_complete` set to `true` after user taps "Get Started" on the last onboarding slide
- `_resolveHome()` in `app.dart` reads this key before any navigation decision
- If `onboarding_complete == false` (first install) → show `OnboardingScreen`
- If `onboarding_complete == true` → proceed to auth check (no change to existing logic)

Onboarding screen upgrades:
- 3 slides: Welcome / How it works / Sign in or book
- DM Serif Display headlines, DM Sans body
- Teal dot indicators, gold "Get Started" CTA on last slide
- Skip button (top-right) on slides 1–2 that sets `onboarding_complete = true` and jumps to auth resolution

### 4d. Welcome-Back Moment

When `_resolveHome()` resolves a returning authenticated user directly to `RootShell`, show a welcome-back toast after the first frame renders:

```dart
// In RootShell — called once via a post-frame callback on first build
WidgetsBinding.instance.addPostFrameCallback((_) {
  if (_isFirstOpen) {
    AppToast.show(context, message: 'Welcome back, ${user.displayName?.split(' ').first}!', type: ToastType.info);
  }
});
```

Web equivalent: `HomeHeroSection` shows an `<InfoToast>` for 3 seconds after `onAuthStateChanged` fires with a user.

---

## 5. Empty States (Illustrated, Per Screen)

Each screen with potentially empty data has a dedicated illustrated empty state. Illustrations are SVG, teal/navy palette, consistent style.

### Empty State Component — Web

```tsx
interface EmptyStateProps {
  illustration: 'calendar' | 'chart' | 'people' | 'article' | 'chat' | 'search';
  title: string;
  body: string;
  cta?: { label: string; href?: string; onClick?: () => void };
}
```

### Empty State Widget — Flutter

```dart
class EmptyState extends StatelessWidget {
  final String assetPath; // SVG path in assets/empty_states/
  final String title;
  final String body;
  final Widget? cta;
}
```

### Per-Screen Assignments

| Screen | Illustration | Title | Body | CTA |
|---|---|---|---|---|
| My Appointments (no bookings) | calendar | "No appointments yet" | "Book your first session with a physio today" | "Book Now" → /book |
| Recovery Dashboard (no pain logs) | chart | "No data yet" | "Check in after your first session to track your progress" | "Book a Session" → /book |
| My People (no dependents) | people | "Just you for now" | "Add a family member to manage their care alongside yours" | "Add Person" → /patient/people/new |
| Blog list (load fails) | article | "Articles unavailable" | "We couldn't load articles right now. Check back soon." | "Retry" → reload |
| Chat (no history) | chat | "No messages yet" | "Ask our physio anything — we usually reply within a few hours" | "Start a Conversation" |
| Search (no results) | search | "Nothing found" | "Try different keywords or browse all articles" | "Browse All" |

---

## 6. Offline / No Internet Screen

A full-screen overlay that blocks the UI when connectivity is lost, preventing users from seeing broken or partial content.

### Behaviour

- Appears as soon as connectivity is lost (no grace delay)
- Blocks all interaction beneath it
- "Retry" button triggers a connectivity re-check; on success, overlay fades out and the underlying screen resumes
- Auto-dismisses if connectivity is restored (no manual retry needed)

### Web Implementation

```tsx
// ConnectivityBanner.tsx — client component mounted at root layout
'use client';

export function ConnectivityOverlay() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);
    return () => { window.removeEventListener('online', setOnline); window.removeEventListener('offline', setOffline); };
  }, []);

  if (isOnline) return null;

  return (
    <div className="connectivity-overlay">
      {/* SVG illustration: wifi icon with broken signal */}
      <h2>No internet connection</h2>
      <p>Check your WiFi or mobile data, then try again.</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
}
```

Mounted in `app/layout.tsx` inside `<body>`.

### Flutter Implementation

Package: `connectivity_plus: ^6.0.0` (add to pubspec.yaml)

```dart
// ConnectivityWrapper — wraps MaterialApp's home
class ConnectivityWrapper extends StatefulWidget {
  final Widget child;
  const ConnectivityWrapper({required this.child, super.key});
}

class _ConnectivityWrapperState extends State<ConnectivityWrapper> {
  late final StreamSubscription<List<ConnectivityResult>> _sub;
  bool _isOffline = false;

  @override
  void initState() {
    super.initState();
    _sub = Connectivity().onConnectivityChanged.listen((results) {
      final offline = results.every((r) => r == ConnectivityResult.none);
      if (offline != _isOffline) setState(() => _isOffline = offline);
    });
  }

  @override
  void dispose() { _sub.cancel(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    if (!_isOffline) return widget.child;
    return _OfflineScreen(onRetry: () async {
      final results = await Connectivity().checkConnectivity();
      if (results.any((r) => r != ConnectivityResult.none)) {
        setState(() => _isOffline = false);
      }
    });
  }
}
```

`_OfflineScreen`:
- Full navy/white background, centered column
- SVG illustration (wifi broken)
- DM Serif Display headline: "No internet connection"
- DM Sans body: "Check your WiFi or mobile data, then try again."
- Teal `FilledButton`: "Retry"

Mounted in `app.dart` by wrapping the `home` widget: `ConnectivityWrapper(child: _home ?? SplashScreen(...))`.

---

## 7. Alert System

### Toast / Snackbar Types

| Type | Color | Icon | Duration | Dismiss |
|---|---|---|---|---|
| Success | `#059669` | check_circle | 3s | Auto |
| Info | `#0B6E8E` | info | 3s | Auto |
| Warning | `#D97706` | warning_amber | Manual | Tap × |
| Error | `#DC2626` | error_outline | Manual | Tap × |

### Web — Toast Component

```tsx
// components/toast.tsx
export type ToastType = 'success' | 'info' | 'warning' | 'error';

const ICON: Record<ToastType, string> = {
  success: '✓', info: 'ℹ', warning: '⚠', error: '✕',
};
const BG: Record<ToastType, string> = {
  success: '#059669', info: '#0B6E8E', warning: '#D97706', error: '#DC2626',
};
const AUTO_DISMISS: ToastType[] = ['success', 'info'];

export function Toast({ message, type, onDismiss }: {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!AUTO_DISMISS.includes(type)) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [type, onDismiss]);

  return (
    <div className="toast" style={{ background: BG[type] }}>
      <span className="toast-icon">{ICON[type]}</span>
      <span className="toast-message">{message}</span>
      {!AUTO_DISMISS.includes(type) && (
        <button className="toast-dismiss" onClick={onDismiss} aria-label="Dismiss">✕</button>
      )}
    </div>
  );
}

// useToast hook — provides show(message, type) globally via context
```

Toasts appear at the **bottom-center** of the viewport, stacked vertically if multiple are active. They slide up from the bottom on enter, slide down on exit. Max 3 visible at once (oldest auto-dismissed first).

### Flutter — AppToast

```dart
class AppToast {
  static void show(
    BuildContext context, {
    required String message,
    required ToastType type,
    Duration? duration,
  }) {
    final snackBar = SnackBar(
      content: Row(children: [
        Icon(_iconFor(type), color: Colors.white),
        const SizedBox(width: 8),
        Expanded(child: Text(message, style: GoogleFonts.dmSans(color: Colors.white))),
      ]),
      backgroundColor: _colorFor(type),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: duration ?? _defaultDurationFor(type),
      action: _isManualDismiss(type)
          ? SnackBarAction(label: '✕', textColor: Colors.white, onPressed: () {
              ScaffoldMessenger.of(context).hideCurrentSnackBar();
            })
          : null,
    );
    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }
}
```

### Confirmation Dialogs

Used for destructive or irreversible actions (cancel booking, delete person, sign out).

Web:
```tsx
<ConfirmDialog
  title="Cancel appointment?"
  body="This will cancel your booking. You can rebook at any time."
  confirmLabel="Cancel Appointment"
  confirmVariant="destructive"  // red button
  onConfirm={handleCancel}
/>
```

Flutter:
```dart
showDialog(context: context, builder: (_) => AlertDialog(
  title: Text('Cancel appointment?', style: GoogleFonts.dmSerifDisplay()),
  content: Text('This will cancel your booking. You can rebook at any time.', style: GoogleFonts.dmSans()),
  actions: [
    TextButton(onPressed: () => Navigator.pop(context), child: const Text('Keep')),
    TextButton(
      onPressed: () { Navigator.pop(context); onConfirm(); },
      style: TextButton.styleFrom(foregroundColor: AppColors.error),
      child: const Text('Cancel Appointment'),
    ),
  ],
));
```

### When to Show Each Alert

| Action | Alert type | Message |
|---|---|---|
| Booking confirmed | Success toast | "Your appointment is booked!" |
| Pain log saved | Success toast | "Check-in logged — great work!" |
| Person added | Success toast | "Added to your account" |
| Sign-in failed | Error toast | "Couldn't sign in. Check your details and try again." |
| Save failed (network) | Error toast | "Couldn't save — please try again" |
| Session restored | Info toast | "Welcome back, [first name]!" |
| Profile incomplete | Warning toast | "Complete your profile to get the most from PhysioOnClick" |
| Cancel booking | Confirmation dialog | — |
| Delete person | Confirmation dialog | — |
| Sign out | Confirmation dialog | — |

---

## 8. Implementation Notes

### Files to Create or Modify — Web

| File | Action | Purpose |
|---|---|---|
| `app/globals.css` | Modify | Add all CSS tokens, skeleton animation, overlay styles |
| `app/layout.tsx` | Modify | Add Google Fonts `<link>`, mount `ConnectivityOverlay` |
| `components/connectivity-overlay.tsx` | Create | Offline full-screen block |
| `components/toast.tsx` | Create | Toast component |
| `components/toast-provider.tsx` | Create | Context + `useToast` hook |
| `components/empty-state.tsx` | Create | Reusable illustrated empty state |
| `components/confirm-dialog.tsx` | Create | Reusable confirmation modal |
| `components/skeleton.tsx` | Create | Shimmer skeleton blocks |
| `app/page.tsx` | Modify | Apply new token classes to hero, trust bar |
| `app/book/page.tsx` | Modify | Apply new card styling |
| `app/patient/` pages | Modify | Apply empty states, skeleton loaders |

### Files to Create or Modify — Flutter

| File | Action | Purpose |
|---|---|---|
| `lib/src/core/app_colors.dart` | Create | All color tokens as static constants |
| `lib/src/core/theme.dart` | Modify | Apply DM Serif Display + DM Sans, M3 tokens |
| `lib/src/core/widgets/app_toast.dart` | Create | `AppToast.show()` utility |
| `lib/src/core/widgets/empty_state.dart` | Create | Reusable empty state widget |
| `lib/src/core/widgets/connectivity_wrapper.dart` | Create | Offline screen wrapper |
| `lib/src/features/splash/splash_screen.dart` | Modify | Branded gradient splash |
| `lib/src/features/onboarding/onboarding_screen.dart` | Modify | Design upgrade + gold CTA |
| `lib/src/features/root/root_shell.dart` | Modify | NavigationBar upgrade, welcome toast |
| `lib/src/app.dart` | Modify | Wrap home in `ConnectivityWrapper` |
| `pubspec.yaml` | Modify | Add `google_fonts`, `connectivity_plus` |
| `assets/empty_states/` | Create | SVG illustrations (calendar, chart, people, article, chat, search, wifi-off) |
