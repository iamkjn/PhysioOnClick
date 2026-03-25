import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';

import 'core/theme.dart';
import 'features/blog/blog_detail_screen.dart';
import 'features/root/root_shell.dart';

class PhysioOnClickMobileApp extends StatefulWidget {
  const PhysioOnClickMobileApp({super.key});

  @override
  State<PhysioOnClickMobileApp> createState() => _PhysioOnClickMobileAppState();
}

class _PhysioOnClickMobileAppState extends State<PhysioOnClickMobileApp> {
  final navigatorKey = GlobalKey<NavigatorState>();
  AppLinks? _appLinks;

  @override
  void initState() {
    super.initState();
    _appLinks = AppLinks();
    _initLinks();
  }

  Future<void> _initLinks() async {
    final initial = await _appLinks?.getInitialLink();
    if (initial != null) {
      _handleIncomingUri(initial);
    }

    _appLinks?.uriLinkStream.listen(_handleIncomingUri);
  }

  void _handleIncomingUri(Uri uri) {
    final isBlogLink = (uri.scheme == 'physioonclick' && uri.host == 'blog' && uri.pathSegments.isNotEmpty) ||
        (uri.pathSegments.length >= 2 && uri.pathSegments.first == 'blog');

    if (!isBlogLink) {
      return;
    }

    final slug = uri.scheme == 'physioonclick' ? uri.pathSegments.first : uri.pathSegments[1];
    navigatorKey.currentState?.pushNamed('/blog/$slug');
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PhysioOnClick',
      debugShowCheckedModeBanner: false,
      navigatorKey: navigatorKey,
      theme: buildPhysioTheme(),
      onGenerateRoute: (settings) {
        final name = settings.name ?? '';
        if (name.startsWith('/blog/')) {
          final slug = name.replaceFirst('/blog/', '');
          return MaterialPageRoute(
            builder: (_) => BlogDetailScreen.fromSlug(slug: slug),
            settings: settings,
          );
        }

        return null;
      },
      home: const RootShell(),
    );
  }
}
