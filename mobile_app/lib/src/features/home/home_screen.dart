import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../booking/who_is_this_for_screen.dart';
import '../services/services_screen.dart';
import 'patient_dashboard.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
        children: [
          _Header(),
          const SizedBox(height: 20),
          StreamBuilder<User?>(
            stream: FirebaseAuth.instance.authStateChanges(),
            builder: (context, snapshot) {
              final user = snapshot.data;
              if (user != null) {
                return PatientDashboard(user: user);
              }
              return _HeroBanner(theme: theme);
            },
          ),
          const SizedBox(height: 24),
          _TrustBar(theme: theme),
          const SizedBox(height: 28),
          Text('Why choose PhysioOnClick', style: theme.textTheme.titleLarge),
          const SizedBox(height: 14),
          const _FeatureCard(
            title: 'Online across the UK',
            body: 'Remote assessments, exercise progression and guided rehab — from anywhere in the UK.',
            icon: Icons.videocam_rounded,
            color: Color(0xFF0891B2),
            bgColor: Color(0xFFD8F3F9),
          ),
          const SizedBox(height: 12),
          const _FeatureCard(
            title: 'Structured rehab programmes',
            body: 'Personalised exercise plans and progress tracking built around your recovery goals.',
            icon: Icons.fitness_center_rounded,
            color: Color(0xFF0E7490),
            bgColor: Color(0xFFE0F5FA),
          ),
          const SizedBox(height: 12),
          const _FeatureCard(
            title: 'HCPC registered',
            body: 'All sessions with a fully registered, CSP member physiotherapist (PH155757).',
            icon: Icons.verified_rounded,
            color: Color(0xFF16A34A),
            bgColor: Color(0xFFDCFCE7),
          ),
          const SizedBox(height: 28),
          _QuickBookCard(theme: theme),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        final user = snapshot.data;
        final greeting = _greeting();
        final name = user?.displayName?.split(' ').first;

        return Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF0891B2), Color(0xFF0E7490)],
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              alignment: Alignment.center,
              child: const Text(
                'P',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 22),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PhysioOnClick',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  Text(
                    name != null ? '$greeting, $name' : greeting,
                    style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFF5E7A84)),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }
}

class _HeroBanner extends StatelessWidget {
  const _HeroBanner({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0C2A38), Color(0xFF0B6480)],
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0891B2).withValues(alpha: 0.3),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
            ),
            child: const Text(
              'Online physiotherapy across the UK',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Expert physio,\none tap away',
            style: theme.textTheme.headlineLarge?.copyWith(
              color: Colors.white,
              fontSize: 32,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Evidence-based physiotherapy. Initial assessments, rehab programmes and injury guidance — online, anywhere in the UK.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.82),
              fontSize: 14,
              height: 1.55,
            ),
          ),
          const SizedBox(height: 22),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () => WhoIsThisForScreen.go(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF0891B2),
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  child: const Text('Book session'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ServicesScreen()),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(48),
                    side: const BorderSide(color: Colors.white38),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  child: const Text('Our services'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TrustBar extends StatelessWidget {
  const _TrustBar({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFC8E8F0)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _TrustItem(label: 'HCPC\nRegistered', icon: Icons.verified_rounded, color: const Color(0xFF0891B2)),
          _TrustDivider(),
          _TrustItem(label: 'CSP\nMember', icon: Icons.workspace_premium_rounded, color: const Color(0xFF16A34A)),
          _TrustDivider(),
          _TrustItem(label: 'UK-wide\nOnline', icon: Icons.language_rounded, color: const Color(0xFF0891B2)),
        ],
      ),
    );
  }
}

class _TrustDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 36, color: const Color(0xFFC8E8F0));
  }
}

class _TrustItem extends StatelessWidget {
  const _TrustItem({required this.label, required this.icon, required this.color});

  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 6),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Color(0xFF0F2D3A),
            height: 1.35,
          ),
        ),
      ],
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({
    required this.title,
    required this.body,
    required this.icon,
    required this.color,
    required this.bgColor,
  });

  final String title;
  final String body;
  final IconData icon;
  final Color color;
  final Color bgColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 5),
                  Text(body, style: theme.textTheme.bodyMedium),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickBookCard extends StatelessWidget {
  const _QuickBookCard({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => WhoIsThisForScreen.go(context),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFFD8F3F9),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFF9ADCEE)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ready to book?',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Online sessions · across the UK',
                    style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFF0E7490)),
                  ),
                ],
              ),
            ),
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF0891B2),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 22),
            ),
          ],
        ),
      ),
    );
  }
}
