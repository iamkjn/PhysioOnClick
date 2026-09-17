import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../booking/who_is_this_for_screen.dart';

/// Mirrors web's `serviceImagePath` (`lib/site-data.ts`) — real cover
/// photography checked into `public/images/service-covers/`, one PNG per
/// service slug, served directly by the Next.js static file handler.
String serviceImageUrl(String slug) => '$kApiBase/images/service-covers/service-$slug.png';

/// The six real services from `lib/site-data.ts`'s `services` array — titles,
/// summaries and condition lists copied verbatim from there. Keep this in
/// sync by hand if that file's copy changes; there is no shared runtime
/// catalogue between the two apps (same convention as
/// `booking/models/book_service.dart`'s pricing mirror).
const _services = [
  (
    slug: 'musculoskeletal-physiotherapy',
    title: 'Musculoskeletal Physiotherapy',
    description:
        'Assessment and rehabilitation for joint, tendon, spine and muscle pain with a practical, evidence-based treatment plan.',
    conditions: ['Back and neck pain', 'Shoulder impingement', 'Tendon pain', 'Persistent sports injuries', 'Work-related strain'],
    icon: Icons.accessibility_new_rounded,
    color: Color(0xFF0891B2),
    bgColor: Color(0xFFD8F3F9),
  ),
  (
    slug: 'post-surgical-rehabilitation',
    title: 'Post-Surgical Rehabilitation',
    description: 'Structured rehabilitation after arthroplasty, ligament reconstruction and orthopaedic procedures.',
    conditions: ['Total knee replacement rehab', 'Total hip replacement rehab', 'ACL reconstruction', 'Rotator cuff repair', 'Fracture recovery'],
    icon: Icons.medical_services_rounded,
    color: Color(0xFF0E7490),
    bgColor: Color(0xFFE0F5FA),
  ),
  (
    slug: 'neurological-rehabilitation',
    title: 'Neurological Rehabilitation',
    description: 'Goal-led rehabilitation for neurological conditions focused on mobility, confidence and function.',
    conditions: ['Stroke rehabilitation', 'Parkinsonian movement challenges', 'Balance difficulties', 'Functional mobility loss', 'Neurological deconditioning'],
    icon: Icons.psychology_rounded,
    color: Color(0xFF7C3AED),
    bgColor: Color(0xFFF3E8FF),
  ),
  (
    slug: 'paediatric-physiotherapy',
    title: 'Paediatric Physiotherapy',
    description: 'Child-centred physiotherapy for movement confidence, developmental support and family-guided rehab.',
    conditions: ['Developmental delay', 'Coordination challenges', 'Mobility support', 'Post-operative paediatric rehab', 'Strength and endurance building'],
    icon: Icons.child_care_rounded,
    color: Color(0xFF16A34A),
    bgColor: Color(0xFFDCFCE7),
  ),
  (
    slug: 'gait-and-mobility-assessment',
    title: 'Gait & Mobility Assessment',
    description: 'Movement analysis, walking assessment and rehabilitation planning for confidence and independence.',
    conditions: ['Walking changes after surgery', 'Falls risk', 'Balance confidence issues', 'Mobility aid review', 'Reduced walking tolerance'],
    icon: Icons.directions_walk_rounded,
    color: Color(0xFFD97706),
    bgColor: Color(0xFFFEF3C7),
  ),
  (
    slug: 'online-rehab-programmes',
    title: 'Online Rehab Programmes',
    description: 'UK-wide digital physiotherapy support with review calls, progress tracking and guided exercise plans.',
    conditions: ['Remote recovery support', 'Self-management planning', 'Exercise progression', 'Return-to-work guidance', 'Long-term rehab follow-up'],
    icon: Icons.videocam_rounded,
    color: Color(0xFF0EA5E9),
    bgColor: Color(0xFFE0F2FE),
  ),
];

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
        children: [
          Text('Our Services', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 6),
          Text(
            'Evidence-based physiotherapy online across the UK.',
            style: theme.textTheme.bodyLarge,
          ),
          const SizedBox(height: 20),
          ..._services.map(
            (service) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _ServiceCard(service: service),
            ),
          ),
          const SizedBox(height: 4),
          _BookingCTA(theme: theme),
        ],
      ),
    );
  }
}

class _ServiceCard extends StatefulWidget {
  const _ServiceCard({required this.service});

  final ({
    String slug,
    String title,
    String description,
    List<String> conditions,
    IconData icon,
    Color color,
    Color bgColor,
  }) service;

  @override
  State<_ServiceCard> createState() => _ServiceCardState();
}

class _ServiceCardState extends State<_ServiceCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = widget.service;

    return GestureDetector(
      onTap: () => setState(() => _expanded = !_expanded),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeInOut,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: _expanded ? s.color.withValues(alpha: 0.4) : const Color(0xFFC8E8F0),
            width: _expanded ? 1.5 : 1,
          ),
          boxShadow: _expanded
              ? [
                  BoxShadow(
                    color: s.color.withValues(alpha: 0.12),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: AspectRatio(
                  aspectRatio: 16 / 9,
                  child: Image.network(
                    serviceImageUrl(s.slug),
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: s.bgColor,
                      alignment: Alignment.center,
                      child: Icon(s.icon, color: s.color, size: 32),
                    ),
                    loadingBuilder: (context, child, progress) {
                      if (progress == null) return child;
                      return Container(
                        color: s.bgColor,
                        alignment: Alignment.center,
                        child: SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, color: s.color),
                        ),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: s.bgColor,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(s.icon, color: s.color, size: 26),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s.title,
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          s.description,
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  AnimatedRotation(
                    turns: _expanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 220),
                    child: Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: s.color,
                      size: 24,
                    ),
                  ),
                ],
              ),
              AnimatedCrossFade(
                firstChild: const SizedBox.shrink(),
                secondChild: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 18),
                    const Divider(color: Color(0xFFC8E8F0), height: 1),
                    const SizedBox(height: 16),
                    Text(
                      'Common conditions',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF5E7A84),
                        letterSpacing: 0.04,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: s.conditions
                          .map(
                            (c) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: s.bgColor,
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(color: s.color.withValues(alpha: 0.2)),
                              ),
                              child: Text(
                                c,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: s.color,
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => WhoIsThisForScreen.go(context),
                        icon: const Icon(Icons.calendar_month_rounded, size: 18),
                        label: Text('Book ${s.title.split(' ').first} session'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: s.color,
                          minimumSize: const Size.fromHeight(48),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                crossFadeState: _expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
                duration: const Duration(milliseconds: 220),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookingCTA extends StatelessWidget {
  const _BookingCTA({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0C2A38), Color(0xFF0B6480)],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Not sure which service?',
            style: theme.textTheme.titleMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Book an initial assessment — we\'ll guide you through the right care pathway.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.82),
              fontSize: 14,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => WhoIsThisForScreen.go(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF0891B2),
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
              ),
              child: const Text('Book initial assessment'),
            ),
          ),
        ],
      ),
    );
  }
}
