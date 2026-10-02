import 'package:flutter/foundation.dart';

class AppConfig {
  AppConfig._();

  /// Must match NEXT_PUBLIC_CAL_USERNAME on the website (.env.local) —
  /// there is no shared runtime config between the two apps, so this is
  /// the single place to update on mobile if the Cal.com account changes.
  static const calComBookingUrl = 'https://cal.com/physioonclick';

  /// Base URL for the PhysioOnClick Next.js backend (chat, appointments sync, etc).
  /// Single source of truth — do not hardcode this elsewhere.
  /// Debug builds hit the local dev server (Android emulator's host-loopback
  /// alias, or localhost on web/iOS simulator); release builds hit the
  /// `physioonclick-dev` Cloudflare worker (dev.physioonclick.co.uk) — the
  /// same environment [switch-firebase-env.sh dev] points the Firebase SDK
  /// at, and Stripe test-mode keys live on that worker, not production.
  ///
  /// IMPORTANT: this previously pointed at `physioonclick.com`, a domain
  /// that was never registered to this project and never resolved — every
  /// release-build backend call (checkout, Cal.com slots, chat) silently
  /// failed. Fixed 2026-09-17.
  ///
  /// Production (the live site, real Stripe keys, production Firestore) is
  /// opted into per build with `--dart-define=APP_ENV=prod`, never by editing
  /// this file. Use scripts/build-release.sh, which also switches the Firebase
  /// config to the matching project so the two can't disagree.
  static const appEnv = String.fromEnvironment('APP_ENV', defaultValue: 'dev');

  static const apiBaseUrl = kDebugMode
      ? (kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000')
      : (appEnv == 'prod'
          ? 'https://physioonclick.co.uk'
          : 'https://dev.physioonclick.co.uk');
}
