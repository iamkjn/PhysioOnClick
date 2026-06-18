import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../booking/booking_screen.dart';
import '../booking/who_is_this_for_screen.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../services/services_screen.dart';

class RootShell extends StatefulWidget {
  const RootShell({super.key});

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int currentIndex = 0;

  final screens = const [
    HomeScreen(),
    ServicesScreen(),
    BookingScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: IndexedStack(
        index: currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
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
              children: [
                _NavItem(
                  icon: Icons.home_rounded,
                  label: 'Home',
                  selected: currentIndex == 0,
                  onTap: () => setState(() => currentIndex = 0),
                  primaryColor: theme.colorScheme.primary,
                ),
                _NavItem(
                  icon: Icons.healing_rounded,
                  label: 'Services',
                  selected: currentIndex == 1,
                  onTap: () => setState(() => currentIndex = 1),
                  primaryColor: theme.colorScheme.primary,
                ),
                _NavItem(
                  icon: Icons.calendar_month_rounded,
                  label: 'Booking',
                  selected: currentIndex == 2,
                  onTap: () {
                    final user = FirebaseAuth.instance.currentUser;
                    if (user != null) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const WhoIsThisForScreen(),
                        ),
                      );
                    } else {
                      setState(() => currentIndex = 2);
                    }
                  },
                  primaryColor: theme.colorScheme.primary,
                  isHighlighted: true,
                ),
                _NavItem(
                  icon: Icons.person_rounded,
                  label: 'Profile',
                  selected: currentIndex == 3,
                  onTap: () => setState(() => currentIndex = 3),
                  primaryColor: theme.colorScheme.primary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
    required this.primaryColor,
    this.isHighlighted = false,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color primaryColor;
  final bool isHighlighted;

  @override
  Widget build(BuildContext context) {
    if (isHighlighted && !selected) {
      return GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
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
              ),
              child: Icon(icon, color: Colors.white, size: 22),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: primaryColor,
              ),
            ),
          ],
        ),
      );
    }

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 56,
              height: 36,
              decoration: BoxDecoration(
                color: selected ? primaryColor.withValues(alpha: 0.12) : Colors.transparent,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(
                icon,
                color: selected ? primaryColor : const Color(0xFF5E7A84),
                size: 22,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? primaryColor : const Color(0xFF5E7A84),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
