import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import '../auth/welcome_screen.dart';

const _kOnboardingDone = 'onboarding_done';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  static Future<bool> isCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_kOnboardingDone) ?? false;
  }

  static Future<void> markCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kOnboardingDone, true);
  }

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  static const _pages = [
    _OnboardingPage(
      gradient: [Color(0xFF0C2A38), Color(0xFF0B6480)],
      icon: Icons.health_and_safety_rounded,
      iconBg: Color(0xFF1A4A62),
      title: 'Expert physio,\none tap away',
      subtitle: 'Online consultations across the UK — with a fully HCPC registered physiotherapist.',
    ),
    _OnboardingPage(
      gradient: [Color(0xFF0E5C3C), Color(0xFF16834E)],
      icon: Icons.calendar_month_rounded,
      iconBg: Color(0xFF187B52),
      title: 'Book in\nminutes',
      subtitle: 'Choose your service, pick a time, and get instant confirmation. Initial assessments, follow-ups, and online sessions.',
    ),
    _OnboardingPage(
      gradient: [Color(0xFF3B1F6E), Color(0xFF5B2D8E)],
      icon: Icons.insights_rounded,
      iconBg: Color(0xFF4A2480),
      title: 'Track your\nrecovery',
      subtitle: 'Access your personalised rehab programme, exercise library and progress updates — all in one place.',
    ),
    _OnboardingPage(
      gradient: [Color(0xFF78350F), Color(0xFFB45309)],
      icon: Icons.group_rounded,
      iconBg: Color(0xFF92400E),
      title: 'Book for your\nwhole family',
      subtitle: 'Add family members, partners, or relatives. Book their appointments just like your own — all from one account.',
    ),
  ];

  void _finish() {
    OnboardingScreen.markCompleted();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        PhysioFadeRoute(builder: (_) => const WelcomeScreen()),
      );
    }
  }

  void _next() {
    if (_page < _pages.length - 1) {
      _controller.nextPage(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeInOut,
      );
    } else {
      _finish();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: _pages.length,
            onPageChanged: (i) => setState(() => _page = i),
            itemBuilder: (context, index) => _pages[index],
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: List.generate(
                      _pages.length,
                      (i) => AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        margin: const EdgeInsets.only(right: 6),
                        width: i == _page ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: i == _page
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.35),
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: _finish,
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.white.withValues(alpha: 0.75),
                      textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    child: const Text('Skip'),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            left: 24,
            right: 24,
            bottom: 0,
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 40),
                child: Row(
                  children: [
                    if (_page > 0)
                      GestureDetector(
                        onTap: () => _controller.previousPage(
                          duration: const Duration(milliseconds: 320),
                          curve: Curves.easeInOut,
                        ),
                        child: Container(
                          width: 54,
                          height: 54,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.24)),
                          ),
                          child: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 22),
                        ),
                      ),
                    if (_page > 0) const SizedBox(width: 12),
                    Expanded(
                      child: GestureDetector(
                        onTap: _next,
                        child: Container(
                          height: 54,
                          decoration: BoxDecoration(
                            color: _page < _pages.length - 1 ? Colors.white : AppColors.gold,
                            borderRadius: BorderRadius.circular(18),
                          ),
                          alignment: Alignment.center,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                _page < _pages.length - 1 ? 'Next' : 'Get started',
                                style: GoogleFonts.dmSans(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: _page < _pages.length - 1 ? AppColors.navy : Colors.white,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(
                                Icons.arrow_forward_rounded,
                                color: _page < _pages.length - 1 ? AppColors.teal : Colors.white,
                                size: 20,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  const _OnboardingPage({
    required this.gradient,
    required this.icon,
    required this.iconBg,
    required this.title,
    required this.subtitle,
  });

  final List<Color> gradient;
  final IconData icon;
  final Color iconBg;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: gradient,
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(32, 100, 32, 160),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(26),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
                ),
                child: Icon(icon, color: Colors.white, size: 40),
              ),
              const SizedBox(height: 36),
              Text(
                title,
                style: GoogleFonts.dmSerifDisplay(
                  color: Colors.white,
                  fontSize: 40,
                  height: 1.05,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                subtitle,
                style: GoogleFonts.dmSans(
                  color: Colors.white.withValues(alpha: 0.82),
                  fontSize: 16,
                  height: 1.6,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
