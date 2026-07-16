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
  /// alias, or localhost on web/iOS simulator); release builds hit production.
  static const apiBaseUrl = kDebugMode
      ? (kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000')
      : 'https://physioonclick.com';
}
