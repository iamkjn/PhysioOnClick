class AppConfig {
  AppConfig._();

  /// Must match NEXT_PUBLIC_CAL_USERNAME on the website (.env.local) —
  /// there is no shared runtime config between the two apps, so this is
  /// the single place to update on mobile if the Cal.com account changes.
  static const calComBookingUrl = 'https://cal.com/physioonclick';
}
