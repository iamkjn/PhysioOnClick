import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import '../../core/analytics/analytics_service.dart';
import '../../core/app_colors.dart';
import '../../core/widgets/app_toast.dart';
import '../../core/widgets/auth_gate_sheet.dart';
import '../admin/bookings/admin_bookings_screen.dart';
import '../admin/dashboard/admin_dashboard_screen.dart';
import '../admin/enquiries/admin_enquiries_screen.dart';
import '../admin/profile/admin_profile_screen.dart';
import '../admin/recovery/admin_patient_list_screen.dart';
import '../booking/booking_screen.dart';
import '../chat/chat_page.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../services/services_screen.dart';

class RootShell extends StatefulWidget {
  const RootShell({super.key});

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell>
    with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  bool _isAdmin = false;
  late final AnimationController _tabFadeCtrl;
  late final Animation<double> _fade;

  // Screens are instantiated once and kept alive throughout the session.
  // Admin accounts get a fully separate, admin-focused nav (dashboard,
  // bookings, enquiries, patients) instead of the patient booking flow —
  // an admin signing in from their phone wants fast triage, not "book a
  // session for myself".
  late final List<Widget> _patientScreens = const [
    HomeScreen(),
    ServicesScreen(),
    BookingScreen(),
    ProfileScreen(),
  ];

  late final List<Widget> _adminScreens = const [
    AdminDashboardScreen(),
    AdminBookingsScreen(),
    AdminEnquiriesScreen(),
    AdminPatientListScreen(),
    AdminProfileScreen(),
  ];

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
    if (Firebase.apps.isEmpty) return;

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

  @override
  void dispose() {
    _tabFadeCtrl.dispose();
    super.dispose();
  }

  // Must stay in sync with web's isAdminUser (lib/admin-auth.ts) — admin
  // custom claim OR email match, not just the Firestore users/{uid}.role
  // field. The real admin account (hello@physioonclick.co.uk) relies on the
  // email-match branch and has role: "patient" in Firestore, so checking
  // only the role field silently locked it out of the mobile admin section.
  static const _adminEmail = 'hello@physioonclick.co.uk';

  Future<void> _checkAdminRole() async {
    if (Firebase.apps.isEmpty) return;

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    if (user.email == _adminEmail) {
      if (mounted) setState(() => _isAdmin = true);
      return;
    }

    final tokenResult = await user.getIdTokenResult(true);
    if (tokenResult.claims?['admin'] == true) {
      if (mounted) setState(() => _isAdmin = true);
      return;
    }

    final snap = await FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .get();
    final role = snap.data()?['role'] as String?;
    if (role == 'admin' && mounted) {
      setState(() => _isAdmin = true);
    }
  }

  List<Widget> get _screens => _isAdmin ? _adminScreens : _patientScreens;

  // Nav items config — icons and labels. Each tab has a lighter outline
  // icon for the unselected state and a filled icon for the selected
  // state (matching the site's refreshed, less-cluttered iconography).
  static const _patientNavItems = [
    _NavConfig(icon: Icons.home_rounded, outlineIcon: Icons.home_outlined, label: 'Home'),
    _NavConfig(icon: Icons.medical_services_rounded, outlineIcon: Icons.medical_services_outlined, label: 'Services'),
    _NavConfig(
      icon: Icons.event_available_rounded,
      outlineIcon: Icons.event_available_rounded,
      label: 'Booking',
      highlight: true,
    ),
    _NavConfig(icon: Icons.person_rounded, outlineIcon: Icons.person_outline_rounded, label: 'Profile'),
  ];

  static const _adminNavItems = [
    _NavConfig(icon: Icons.dashboard_rounded, outlineIcon: Icons.dashboard_outlined, label: 'Dashboard'),
    _NavConfig(icon: Icons.event_available_rounded, outlineIcon: Icons.event_available_outlined, label: 'Bookings'),
    _NavConfig(icon: Icons.mail_rounded, outlineIcon: Icons.mail_outline_rounded, label: 'Enquiries'),
    _NavConfig(icon: Icons.people_alt_rounded, outlineIcon: Icons.people_alt_outlined, label: 'Patients'),
    _NavConfig(icon: Icons.person_rounded, outlineIcon: Icons.person_outline_rounded, label: 'Profile'),
  ];

  List<_NavConfig> get _navItems => _isAdmin ? _adminNavItems : _patientNavItems;

  // Tab labels used as GA4 screen names, index-aligned with the matching
  // screens list above.
  static const _patientTabScreenNames = ['home', 'services', 'booking', 'profile'];
  static const _adminTabScreenNames = ['admin_dashboard', 'admin_bookings', 'admin_enquiries', 'admin_patients', 'profile'];

  void _onNavTap(int index) {
    // The booking-tab auth gate only applies to the patient nav — admin
    // accounts are already authenticated by the time _isAdmin is true, and
    // the admin nav has no patient-booking tab at all.
    if (!_isAdmin) {
      final isBookingTab = index == 2;
      final isGuest = Firebase.apps.isEmpty || FirebaseAuth.instance.currentUser == null;
      if (isBookingTab && isGuest) {
        Analytics.track('auth_gate_shown', {'source': 'booking_tab'});
        showAuthGateSheet(
          context,
          message: 'Sign in or create an account to book your appointment.',
        );
        return;
      }
    }

    final tabScreenNames = _isAdmin ? _adminTabScreenNames : _patientTabScreenNames;
    if (index < tabScreenNames.length) {
      final name = tabScreenNames[index];
      Analytics.track('tab_switch', {'tab': name});
      Analytics.trackScreen(name);
    }

    setState(() => _currentIndex = index);
    // Fade in the newly selected tab from 0.
    _tabFadeCtrl.forward(from: 0.0);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screens = _screens;
    final navItems = _navItems;
    final safeIndex = _currentIndex.clamp(0, screens.length - 1);

    return Scaffold(
      // IndexedStack keeps all screens alive (preserving WebView/scroll state)
      // while only painting the selected screen. AnimatedOpacity+IgnorePointer
      // was replaced because Platform Views (WebView) intercept OS touch events
      // at the native layer even when Flutter marks them as non-interactive,
      // which froze the home screen.
      body: FadeTransition(
        opacity: _fade,
        child: IndexedStack(index: safeIndex, children: screens),
      ),
      // The chat assistant is a patient-facing feature — admin's nav has no
      // use for it, so it's dropped entirely rather than shown disabled.
      floatingActionButton: _isAdmin
          ? null
          : FloatingActionButton(
              onPressed: () {
                final isGuest =
                    Firebase.apps.isEmpty ||
                    FirebaseAuth.instance.currentUser == null;

                if (isGuest) {
                  Analytics.track('auth_gate_shown', {'source': 'chat_fab'});
                  showAuthGateSheet(
                    context,
                    message: 'Sign in to chat with our assistant.',
                  );
                  return;
                }
                Analytics.track('chat_open', {'source': 'fab'});
                Navigator.of(
                  context,
                ).push(MaterialPageRoute(builder: (_) => const ChatPage()));
              },
              backgroundColor: AppColors.teal,
              foregroundColor: Colors.white,
              tooltip: 'Ask the assistant',
              child: const Icon(Icons.chat_bubble_rounded),
            ),
      bottomNavigationBar: _AnimatedNavBar(
        items: navItems,
        selectedIndex: safeIndex,
        onTap: _onNavTap,
        primaryColor: theme.colorScheme.primary,
      ),
    );
  }
}

// ─── Nav bar with animated sliding pill indicator ─────────────────────────

class _NavConfig {
  const _NavConfig({
    required this.icon,
    required this.outlineIcon,
    required this.label,
    this.highlight = false,
  });

  /// Filled icon, shown when this tab is selected.
  final IconData icon;

  /// Lighter outline icon, shown when this tab is not selected.
  final IconData outlineIcon;
  final String label;
  final bool highlight;
}

class _AnimatedNavBar extends StatefulWidget {
  const _AnimatedNavBar({
    required this.items,
    required this.selectedIndex,
    required this.onTap,
    required this.primaryColor,
  });

  final List<_NavConfig> items;
  final int selectedIndex;
  final ValueChanged<int> onTap;
  final Color primaryColor;

  @override
  State<_AnimatedNavBar> createState() => _AnimatedNavBarState();
}

class _AnimatedNavBarState extends State<_AnimatedNavBar> {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border, width: 1)),
        boxShadow: [
          BoxShadow(
            color: AppColors.navy.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: widget.items.asMap().entries.map((entry) {
              final i = entry.key;
              final item = entry.value;
              final selected = i == widget.selectedIndex;

              return Expanded(
                child: _NavItem(
                  icon: item.icon,
                  outlineIcon: item.outlineIcon,
                  label: item.label,
                  selected: selected,
                  highlight: item.highlight,
                  onTap: () => widget.onTap(i),
                  primaryColor: widget.primaryColor,
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatefulWidget {
  const _NavItem({
    required this.icon,
    required this.outlineIcon,
    required this.label,
    required this.selected,
    required this.onTap,
    required this.primaryColor,
    this.highlight = false,
  });

  final IconData icon;
  final IconData outlineIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color primaryColor;
  final bool highlight;

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pressCtrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _pressCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      reverseDuration: const Duration(milliseconds: 200),
    );
    _scale = Tween(
      begin: 1.0,
      end: 0.88,
    ).chain(CurveTween(curve: Curves.easeInOut)).animate(_pressCtrl);
  }

  @override
  void dispose() {
    _pressCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Highlighted Booking tab gets a pill with gradient.
    if (widget.highlight && !widget.selected) {
      return GestureDetector(
        onTapDown: (_) => _pressCtrl.forward(),
        onTapUp: (_) {
          _pressCtrl.reverse();
          widget.onTap();
        },
        onTapCancel: () => _pressCtrl.reverse(),
        behavior: HitTestBehavior.opaque,
        child: ScaleTransition(
          scale: _scale,
          child: SizedBox(
            width: double.infinity,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 52,
                  height: 36,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.teal, AppColors.tealDark],
                    ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.teal.withValues(alpha: 0.35),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Icon(widget.icon, color: Colors.white, size: 20),
                ),
                const SizedBox(height: 4),
                Text(
                  widget.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: widget.primaryColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return GestureDetector(
      onTapDown: (_) => _pressCtrl.forward(),
      onTapUp: (_) {
        _pressCtrl.reverse();
        widget.onTap();
      },
      onTapCancel: () => _pressCtrl.reverse(),
      behavior: HitTestBehavior.opaque,
      child: ScaleTransition(
        scale: _scale,
        child: SizedBox(
          width: double.infinity,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutCubic,
                width: 52,
                height: 36,
                decoration: BoxDecoration(
                  color: widget.selected
                      ? widget.primaryColor.withValues(alpha: 0.12)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  transitionBuilder: (child, animation) =>
                      ScaleTransition(scale: animation, child: FadeTransition(opacity: animation, child: child)),
                  child: Icon(
                    widget.selected ? widget.icon : widget.outlineIcon,
                    key: ValueKey(widget.selected),
                    color: widget.selected
                        ? widget.primaryColor
                        : AppColors.textSecondary,
                    size: 23,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: widget.selected
                      ? FontWeight.w700
                      : FontWeight.w500,
                  color: widget.selected
                      ? widget.primaryColor
                      : AppColors.textSecondary,
                ),
                child: Text(
                  widget.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
