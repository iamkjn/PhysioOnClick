import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../admin/recovery/admin_patient_list_screen.dart';
import '../booking/booking_screen.dart';
import '../booking/who_is_this_for_screen.dart';
import '../chat/chat_page.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../services/services_screen.dart';

class RootShell extends StatefulWidget {
  const RootShell({super.key});

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int _currentIndex = 0;
  bool _isAdmin = false;

  // Screens are instantiated once and kept alive throughout the session.
  late final List<Widget> _baseScreens = const [
    HomeScreen(),
    ServicesScreen(),
    BookingScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _checkAdminRole();
  }

  Future<void> _checkAdminRole() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final snap = await FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .get();
    final role = snap.data()?['role'] as String?;
    if (role == 'admin' && mounted) {
      setState(() => _isAdmin = true);
    }
  }

  List<Widget> get _screens => [
        ..._baseScreens,
        if (_isAdmin) const AdminPatientListScreen(),
      ];

  // Nav items config — icons and labels.
  List<_NavConfig> get _navItems => [
        const _NavConfig(icon: Icons.home_rounded, label: 'Home'),
        const _NavConfig(icon: Icons.healing_rounded, label: 'Services'),
        const _NavConfig(
          icon: Icons.calendar_month_rounded,
          label: 'Booking',
          highlight: true,
        ),
        const _NavConfig(icon: Icons.person_rounded, label: 'Profile'),
        if (_isAdmin)
          const _NavConfig(
            icon: Icons.admin_panel_settings_rounded,
            label: 'Manage',
          ),
      ];

  void _onNavTap(int index) {
    final isBookingTab = index == 2;
    setState(() => _currentIndex = index);

    if (isBookingTab) {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const WhoIsThisForScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screens = _screens;
    final navItems = _navItems;
    final safeIndex = _currentIndex.clamp(0, screens.length - 1);

    return Scaffold(
      // Animated body: use a Stack with AnimatedOpacity to keep all screens
      // alive (preserving WebView state, scroll position, etc.) while still
      // fading between tabs.
      body: Stack(
        children: screens.asMap().entries.map((entry) {
          final i = entry.key;
          final screen = entry.value;
          return AnimatedOpacity(
            opacity: i == safeIndex ? 1.0 : 0.0,
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeInOut,
            child: IgnorePointer(
              ignoring: i != safeIndex,
              child: screen,
            ),
          );
        }).toList(),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const ChatPage()),
        ),
        backgroundColor: const Color(0xFF0891B2),
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
    required this.label,
    this.highlight = false,
  });

  final IconData icon;
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
        color: Colors.white,
        border: Border(
          top: BorderSide(color: const Color(0xFFC8E8F0), width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
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

              return _NavItem(
                icon: item.icon,
                label: item.label,
                selected: selected,
                highlight: item.highlight,
                onTap: () => widget.onTap(i),
                primaryColor: widget.primaryColor,
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
    required this.label,
    required this.selected,
    required this.onTap,
    required this.primaryColor,
    this.highlight = false,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color primaryColor;
  final bool highlight;

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem> with SingleTickerProviderStateMixin {
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
    _scale = Tween(begin: 1.0, end: 0.88)
        .chain(CurveTween(curve: Curves.easeInOut))
        .animate(_pressCtrl);
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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 36,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0891B2), Color(0xFF0E7490)],
                  ),
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0891B2).withValues(alpha: 0.35),
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
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: widget.primaryColor,
                ),
              ),
            ],
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
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutCubic,
                width: 56,
                height: 36,
                decoration: BoxDecoration(
                  color: widget.selected
                      ? widget.primaryColor.withValues(alpha: 0.12)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    widget.icon,
                    key: ValueKey(widget.selected),
                    color: widget.selected
                        ? widget.primaryColor
                        : const Color(0xFF5E7A84),
                    size: 22,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: widget.selected ? FontWeight.w700 : FontWeight.w500,
                  color: widget.selected
                      ? widget.primaryColor
                      : const Color(0xFF5E7A84),
                ),
                child: Text(widget.label),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
