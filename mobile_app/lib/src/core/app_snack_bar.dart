import 'package:flutter/material.dart';

/// Submit-level feedback for forms. Field errors stay inline via validators.
void showAppSnackBar(BuildContext context, String message, {bool isError = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        backgroundColor: isError ? const Color(0xFFDC2626) : const Color(0xFF0F2D3A),
      ),
    );
}
