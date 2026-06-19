import 'package:flutter/material.dart';

import '../booking/booking_screen.dart';

const _services = [
  (
    title: 'Musculoskeletal Physiotherapy',
    description: 'Back pain, neck pain, tendon pain and persistent strain rehabilitation.',
    conditions: ['Back pain', 'Neck pain', 'Tendon pain', 'Muscle strain', 'Joint stiffness'],
    icon: Icons.accessibility_new_rounded,
    color: Color(0xFF0891B2),
    bgColor: Color(0xFFD8F3F9),
  ),
  (
    title: 'Post-Surgical Rehabilitation',
    description: 'Recovery support after joint replacement, ligament reconstruction and orthopaedic surgery.',
    conditions: ['Joint replacement', 'ACL repair', 'Rotator cuff', 'Hip replacement', 'Knee surgery'],
    icon: Icons.medical_services_rounded,
    color: Color(0xFF0E7490),
    bgColor: Color(0xFFE0F5FA),
  ),
  (
    title: 'Neurological Rehabilitation',
    description: 'Mobility, gait and functional support for neurological conditions.',
    conditions: ['Stroke rehab', 'MS support', 'Parkinson\'s', 'Balance issues', 'Gait training'],
    icon: Icons.psychology_rounded,
    color: Color(0xFF7C3AED),
    bgColor: Color(0xFFF3E8FF),
  ),
  (
    title: 'Paediatric Physiotherapy',
    description: 'Family-guided rehabilitation and movement support for children.',
    conditions: ['Developmental delay', 'Flat feet', 'Growing pains', 'Sports injuries', 'Posture issues'],
    icon: Icons.child_care_rounded,
    color: Color(0xFF16A34A),
    bgColor: Color(0xFFDCFCE7),
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
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const BookingScreen()),
                          );
                        },
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
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const BookingScreen()),
                );
              },
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
