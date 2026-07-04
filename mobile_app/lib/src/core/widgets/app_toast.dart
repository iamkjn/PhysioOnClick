import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../app_colors.dart';

enum ToastType { success, info, warning, error }

abstract final class AppToast {
  static void show(
    BuildContext context, {
    required String message,
    required ToastType type,
    Duration? duration,
  }) {
    final color = switch (type) {
      ToastType.success => AppColors.success,
      ToastType.info    => AppColors.teal,
      ToastType.warning => AppColors.warning,
      ToastType.error   => AppColors.error,
    };

    final icon = switch (type) {
      ToastType.success => Icons.check_circle_outline_rounded,
      ToastType.info    => Icons.info_outline_rounded,
      ToastType.warning => Icons.warning_amber_rounded,
      ToastType.error   => Icons.error_outline_rounded,
    };

    final autoDismiss = type == ToastType.success || type == ToastType.info;
    final effectiveDuration = duration ?? (autoDismiss
        ? const Duration(seconds: 3)
        : const Duration(days: 365)); // effectively manual

    final snackBar = SnackBar(
      content: Row(
        children: [
          Icon(icon, color: Colors.white, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.dmSans(
                color: Colors.white,
                fontWeight: FontWeight.w500,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
      backgroundColor: color,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: effectiveDuration,
      action: autoDismiss
          ? null
          : SnackBarAction(
              label: '✕',
              textColor: Colors.white,
              onPressed: () {
                ScaffoldMessenger.of(context).hideCurrentSnackBar();
              },
            ),
    );

    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }
}
