import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import '../../core/widgets/auth_gate_sheet.dart';
import 'booking_step_header.dart';
import 'models/book_service.dart';
import 'time_details_screen.dart';

/// Step 1 of the native booking flow (service -> time/details -> assessment
/// -> payment -> confirmation). Mirrors web's `BookingStepService`
/// (`components/booking-step-service.tsx`): a service is *selected* here
/// (not navigated-away-from on tap), with an optional focus-area chip row,
/// and a single "Continue" button advances to [TimeDetailsScreen] — the same
/// select-then-continue shape as web, not a list of tap-to-navigate rows.
class ServiceSelectScreen extends StatefulWidget {
  const ServiceSelectScreen({super.key});

  /// Routes to [ServiceSelectScreen] for authenticated users. For
  /// unauthenticated users, shows the auth gate sheet instead of allowing
  /// direct access to the booking flow — mirrors [WhoIsThisForScreen.go],
  /// the flow's other entry point. Without this gate, a signed-out user
  /// could fill out the entire assessment only to have submission silently
  /// no-op (AssessmentScreen._submit early-returns when signed out).
  static void go(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      showAuthGateSheet(
        context,
        message: 'Sign in or create an account to book your appointment.',
      );
      return;
    }
    Navigator.push(
      context,
      PhysioPageRoute(builder: (_) => const ServiceSelectScreen()),
    );
  }

  @override
  State<ServiceSelectScreen> createState() => _ServiceSelectScreenState();
}

class _ServiceSelectScreenState extends State<ServiceSelectScreen> {
  late BookServiceId _selectedId = allBookServices().first.id;
  final Set<String> _focusAreas = {};

  @override
  Widget build(BuildContext context) {
    final services = allBookServices();
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Book an appointment')),
      body: SafeArea(
        child: Column(
          children: [
            const BookingStepHeader(step: 1, totalSteps: 3, title: 'Choose your service'),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                children: [
                  ...services.map((s) {
                    final selected = s.id == _selectedId;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(18),
                        onTap: () => setState(() => _selectedId = s.id),
                        child: Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: selected ? AppColors.teal : AppColors.border,
                              width: selected ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      s.title,
                                      style: theme.textTheme.titleMedium
                                          ?.copyWith(fontWeight: FontWeight.w700),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(s.description, style: theme.textTheme.bodyMedium),
                                    const SizedBox(height: 8),
                                    Text(
                                      '£${s.price.toStringAsFixed(0)} · ${s.duration}',
                                      style: theme.textTheme.bodySmall?.copyWith(
                                        color: AppColors.textSecondary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Icon(
                                selected ? Icons.check_circle_rounded : Icons.circle_outlined,
                                color: selected ? AppColors.teal : AppColors.border,
                                size: 24,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 8),
                  Text(
                    'Focus area (optional)',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: kFocusAreas.map((area) {
                      final selected = _focusAreas.contains(area);
                      return ChoiceChip(
                        label: Text(area),
                        selected: selected,
                        onSelected: (_) => setState(() {
                          if (selected) {
                            _focusAreas.remove(area);
                          } else {
                            _focusAreas.add(area);
                          }
                        }),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.teal,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    onPressed: () {
                      final service = bookServiceFor(_selectedId);
                      Navigator.push(
                        context,
                        PhysioPageRoute(
                          builder: (_) => TimeDetailsScreen(
                            service: service,
                            focusAreas: _focusAreas.toList(),
                          ),
                        ),
                      );
                    },
                    child: const Text('Continue to times'),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
