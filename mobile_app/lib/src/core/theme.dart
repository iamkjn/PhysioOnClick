import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

ThemeData buildPhysioTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.teal,
      primary: AppColors.teal,
      secondary: AppColors.navy,
      surface: AppColors.surface,
      error: AppColors.error,
    ),
  );

  // DM Sans base for all text, then override display/headline to DM Serif Display.
  final dmSansBase = GoogleFonts.dmSansTextTheme(base.textTheme);

  return base.copyWith(
    scaffoldBackgroundColor: AppColors.bg,
    textTheme: dmSansBase.copyWith(
      displayLarge: GoogleFonts.dmSerifDisplay(
        fontSize: 48, color: AppColors.navy, height: 1.05),
      displayMedium: GoogleFonts.dmSerifDisplay(
        fontSize: 36, color: AppColors.navy, height: 1.05),
      displaySmall: GoogleFonts.dmSerifDisplay(
        fontSize: 30, color: AppColors.navy, height: 1.1),
      headlineLarge: GoogleFonts.dmSerifDisplay(
        fontSize: 26, color: AppColors.navy, height: 1.1),
      headlineMedium: GoogleFonts.dmSerifDisplay(
        fontSize: 22, color: AppColors.navy, height: 1.15),
      headlineSmall: GoogleFonts.dmSerifDisplay(
        fontSize: 20, color: AppColors.navy, height: 1.2),
      titleLarge: GoogleFonts.dmSans(
        fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.navy),
      titleMedium: GoogleFonts.dmSans(
        fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.navy),
      bodyLarge: GoogleFonts.dmSans(
        fontSize: 16, color: AppColors.textSecondary, height: 1.6),
      bodyMedium: GoogleFonts.dmSans(
        fontSize: 14, color: AppColors.textSecondary, height: 1.55),
      bodySmall: GoogleFonts.dmSans(
        fontSize: 12, color: AppColors.textSecondary),
      labelLarge: GoogleFonts.dmSans(
        fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.navy),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.navy,
      elevation: 0,
      centerTitle: false,
      surfaceTintColor: AppColors.surface,
      titleTextStyle: GoogleFonts.dmSans(
        fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.navy),
    ),
    cardTheme: CardThemeData(
      color: AppColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: AppColors.border),
        borderRadius: BorderRadius.circular(20),
      ),
      margin: EdgeInsets.zero,
    ),
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: AppColors.surface,
      selectedColor: AppColors.teal,
      side: const BorderSide(color: AppColors.border),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surface,
      border: OutlineInputBorder(
        borderSide: const BorderSide(color: AppColors.border),
        borderRadius: BorderRadius.circular(10),
      ),
      enabledBorder: OutlineInputBorder(
        borderSide: const BorderSide(color: AppColors.border, width: 1.5),
        borderRadius: BorderRadius.circular(10),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: const BorderSide(color: AppColors.teal, width: 1.5),
        borderRadius: BorderRadius.circular(10),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.teal,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 4,
        shadowColor: AppColors.teal.withValues(alpha: 0.25),
        textStyle: GoogleFonts.dmSans(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.teal,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.dmSans(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.navy,
        minimumSize: const Size.fromHeight(52),
        side: const BorderSide(color: AppColors.border, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.dmSans(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    // BottomNavigationBar colours kept for the custom _AnimatedNavBar in root_shell.dart
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      selectedItemColor: AppColors.teal,
      unselectedItemColor: AppColors.textSecondary,
      showUnselectedLabels: true,
      type: BottomNavigationBarType.fixed,
      backgroundColor: AppColors.surface,
    ),
  );
}
