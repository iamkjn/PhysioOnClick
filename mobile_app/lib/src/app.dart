import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';

import 'core/page_transitions.dart';
import 'core/theme.dart';
import 'features/appointments/appointment_detail_screen.dart';
import 'features/auth/welcome_screen.dart';
import 'features/blog/blog_detail_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/root/root_shell.dart';
import 'features/splash/splash_screen.dart';

class PhysioOnClickMobileApp extends StatefulWidget {
  const PhysioOnClickMobileApp({super.key});

  @override
  State<PhysioOnClickMobileApp> createState() => _PhysioOnClickMobileAppState();
}

class _PhysioOnClickMobileAppState extends State<PhysioOnClickMobileApp> {
  final navigatorKey = GlobalKey<NavigatorState>();
  AppLinks? _appLinks;
  Widget? _home;

  @override
  void initState() {
    super.initState();
    _appLinks = AppLinks();
    _initLinks();
    _initFcmListeners();
    _resolveHome();
  }

  /// Determines the correct entry point:
  /// - Onboarding not done      → OnboardingScreen
  /// - Onboarding done + authed → RootShell (skip welcome on re-open)
  /// - Onboarding done + guest  → WelcomeScreen
  Future<void> _resolveHome() async {
    bool onboardingDone = false;
    try {
      onboardingDone = await OnboardingScreen.isCompleted()
          .timeout(const Duration(seconds: 3));
    } catch (_) {
      onboardingDone = false;
    }

    if (!mounted) return;

    if (!onboardingDone) {
      setState(() => _home = const OnboardingScreen());
      return;
    }

    // Onboarding done — check persistent auth
    final user = FirebaseAuth.instance.currentUser;
    setState(() => _home = user != null ? const RootShell() : const WelcomeScreen());
  }

  void _initFcmListeners() {
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null) _handleNotificationTap(message);
    });
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }

  void _handleNotificationTap(RemoteMessage message) {
    final bookingId = message.data['bookingId'] as String?;
    if (bookingId == null) return;
    navigatorKey.currentState?.push(
      PhysioPageRoute(
        builder: (_) => AppointmentDetailScreen(bookingId: bookingId),
      ),
    );
  }

  Future<void> _initLinks() async {
    final initial = await _appLinks?.getInitialLink();
    if (initial != null) _handleIncomingUri(initial);
    _appLinks?.uriLinkStream.listen(_handleIncomingUri);
  }

  void _handleIncomingUri(Uri uri) {
    final isBlogLink =
        (uri.scheme == 'physioonclick' && uri.host == 'blog' && uri.pathSegments.isNotEmpty) ||
        (uri.pathSegments.length >= 2 && uri.pathSegments.first == 'blog');

    if (!isBlogLink) return;

    final slug = uri.scheme == 'physioonclick'
        ? uri.pathSegments.first
        : uri.pathSegments[1];
    navigatorKey.currentState?.pushNamed('/blog/$slug');
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PhysioOnClick',
      debugShowCheckedModeBanner: false,
      navigatorKey: navigatorKey,
      theme: buildPhysioTheme(),
      // Use custom iOS-style slide for all route transitions.
      onGenerateRoute: (settings) {
        final name = settings.name ?? '';

        if (name.startsWith('/blog/')) {
          final slug = name.replaceFirst('/blog/', '');
          return PhysioPageRoute(
            builder: (_) => BlogDetailScreen.fromSlug(slug: slug),
            settings: settings,
          );
        }

        return null;
      },
      home: _home ?? const SplashScreen(),
    );
  }
}
