import 'package:flutter/material.dart';

import '../../core/app_colors.dart';

/// The web booking flow (`components/booking-step-service.tsx` /
/// `booking-step-time.tsx`) shows "Step X of 3" as a small text eyebrow.
/// Mobile shows the same step count as an actual filled progress bar plus
/// the same text underneath — a visual affordance web's plain text doesn't
/// need (it sits next to a persistent summary sidebar; mobile has no room
/// for one), while keeping the "Step X of 3" wording identical to web.
class BookingStepHeader extends StatelessWidget {
  const BookingStepHeader({
    required this.step,
    required this.totalSteps,
    required this.title,
    super.key,
  });

  final int step;
  final int totalSteps;
  final String title;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: step / totalSteps,
              minHeight: 6,
              backgroundColor: AppColors.border,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.teal),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Step $step of $totalSteps',
            style: theme.textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(title, style: theme.textTheme.headlineSmall),
        ],
      ),
    );
  }
}
