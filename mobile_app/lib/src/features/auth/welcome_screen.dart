import 'package:flutter/material.dart';

import '../../core/page_transitions.dart';
import '../root/root_shell.dart';
import 'sign_in_screen.dart';
import 'sign_up_screen.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    )..forward();

    _fade = CurvedAnimation(
      parent: _ctrl,
      curve: const Interval(0.0, 0.75, curve: Curves.easeOut),
    );
    _slide = Tween(begin: const Offset(0, 0.06), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _ctrl,
        curve: const Interval(0.0, 0.75, curve: Curves.easeOutCubic),
      ),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _continueAsGuest() {
    Navigator.of(context).pushAndRemoveUntil(
      PhysioFadeRoute(builder: (_) => const RootShell()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0C2A38), Color(0xFF0B5870), Color(0xFF0891B2)],
            stops: [0.0, 0.55, 1.0],
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fade,
            child: SlideTransition(
              position: _slide,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  children: [
                    const Spacer(flex: 3),

                    // Logo mark
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.13),
                        borderRadius: BorderRadius.circular(26),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.22),
                          width: 1.5,
                        ),
                      ),
                      child: const Icon(
                        Icons.health_and_safety_rounded,
                        color: Colors.white,
                        size: 44,
                      ),
                    ),

                    const SizedBox(height: 22),

                    const Text(
                      'PhysioOnClick',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),

                    const SizedBox(height: 10),

                    Text(
                      'Expert physiotherapy,\none tap away',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.75),
                        fontSize: 16,
                        height: 1.55,
                      ),
                    ),

                    const Spacer(flex: 3),

                    // Trust signals
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        _TrustChip(
                          icon: Icons.verified_rounded,
                          label: 'HCPC Registered',
                        ),
                        SizedBox(width: 10),
                        _TrustChip(
                          icon: Icons.language_rounded,
                          label: 'UK-wide Online',
                        ),
                      ],
                    ),

                    const Spacer(flex: 2),

                    // Primary CTA — Create account
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.of(context).push(
                          PhysioPageRoute(builder: (_) => const SignUpScreen()),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF0891B2),
                          minimumSize: const Size.fromHeight(56),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                          textStyle: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                          elevation: 0,
                        ),
                        child: const Text('Create account'),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Secondary CTA — Sign in
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).push(
                          PhysioPageRoute(builder: (_) => const SignInScreen()),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          minimumSize: const Size.fromHeight(56),
                          side: BorderSide(
                            color: Colors.white.withValues(alpha: 0.45),
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                          textStyle: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                        child: const Text('Sign in'),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Guest option
                    GestureDetector(
                      onTap: _continueAsGuest,
                      child: Text(
                        'Explore without account',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.55),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          decoration: TextDecoration.underline,
                          decorationColor: Colors.white.withValues(alpha: 0.35),
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TrustChip extends StatelessWidget {
  const _TrustChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.11),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 13),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
