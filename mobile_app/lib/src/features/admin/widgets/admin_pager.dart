import 'package:flutter/material.dart';

import '../../../core/app_colors.dart';

/// Shared Previous/Next pager for admin list screens (bookings, enquiries,
/// patients) — mirrors web's bookings-table pagination pattern.
class AdminPager extends StatelessWidget {
  const AdminPager({
    required this.page,
    required this.pageCount,
    required this.onPrev,
    required this.onNext,
    super.key,
  });

  final int page;
  final int pageCount;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          OutlinedButton(
            onPressed: page > 1 ? onPrev : null,
            child: const Text('Previous'),
          ),
          Text('Page $page of $pageCount', style: const TextStyle(fontWeight: FontWeight.w600)),
          OutlinedButton(
            onPressed: page < pageCount ? onNext : null,
            child: const Text('Next'),
          ),
        ],
      ),
    );
  }
}
