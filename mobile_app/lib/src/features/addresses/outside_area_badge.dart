import 'package:flutter/material.dart';

import '../../core/app_colors.dart';

const kOutsideAreaLabel = 'Outside our home-visit area';

/// Shared "outside our home-visit area" pill (address book + booking).
class OutsideAreaBadge extends StatelessWidget {
  const OutsideAreaBadge({super.key});
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(top: 4),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: AppColors.goldLight,
          borderRadius: BorderRadius.circular(999),
        ),
        child: const Text(kOutsideAreaLabel,
            style: TextStyle(fontSize: 12, color: AppColors.gold, fontWeight: FontWeight.w600)),
      );
}
