import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/foundation.dart';

/// App-wide Firebase Analytics wrapper.
///
/// Mirrors the web app's `lib/analytics.ts` API (`track` / `trackScreen`) so the
/// SAME event names flow from both platforms into the same GA4 property — the
/// funnels, engagement time, and DebugView in the Firebase console then combine
/// web + mobile automatically.
///
/// Every call is fire-and-forget and swallows errors: analytics must never
/// surface a failure to the user. On platforms where Analytics is unavailable
/// (e.g. the Flutter web preview without a registered web app) the whole thing
/// no-ops because [instance] is guarded by [_enabled].
class Analytics {
  Analytics._();

  static FirebaseAnalytics? _analytics;
  static bool _enabled = false;

  /// Returns the shared observer to drop into `MaterialApp.navigatorObservers`,
  /// which logs a `screen_view` automatically for every named route push/pop.
  static FirebaseAnalyticsObserver? _observer;

  /// Call once during bootstrap, after Firebase.initializeApp succeeds.
  static Future<void> initialize() async {
    try {
      _analytics = FirebaseAnalytics.instance;
      await _analytics!.setAnalyticsCollectionEnabled(true);
      _observer = FirebaseAnalyticsObserver(analytics: _analytics!);
      _enabled = true;
    } catch (_) {
      _enabled = false;
    }
  }

  static FirebaseAnalyticsObserver? get observer => _observer;

  /// Log a custom event. Safe to call anywhere, anytime.
  static void track(String name, [Map<String, Object>? params]) {
    if (!_enabled || _analytics == null) return;
    try {
      _analytics!.logEvent(name: name, parameters: params);
    } catch (_) {
      // ignore — analytics must never break the app
    }
  }

  /// Log a manual screen view. Use for tabs/sheets that are NOT named routes
  /// (the [observer] already covers real route navigation).
  static void trackScreen(String screenName) {
    if (!_enabled || _analytics == null) return;
    try {
      _analytics!.logScreenView(screenName: screenName);
    } catch (_) {
      // ignore
    }
  }

  /// Associates events with the signed-in user (hashed UID only — never PII).
  static void setUser(String? uid) {
    if (!_enabled || _analytics == null) return;
    try {
      _analytics!.setUserId(id: uid);
    } catch (_) {
      // ignore
    }
  }

  static bool get isEnabled => _enabled && !kIsWeb;
}
