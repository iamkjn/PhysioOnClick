import 'package:flutter/material.dart';

const _avatarColours = [
  Color(0xFF0891B2),
  Color(0xFF16A34A),
  Color(0xFF7C3AED),
  Color(0xFFD97706),
  Color(0xFFDC2626),
  Color(0xFF0E7490),
  Color(0xFF059669),
  Color(0xFF9333EA),
];

Color avatarColor(String name) {
  if (name.isEmpty) return _avatarColours[0];
  final hash = name.codeUnits.fold(0, (a, b) => a + b);
  return _avatarColours[hash % _avatarColours.length];
}

String avatarInitials(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty) return '?';
  if (parts.length == 1) return parts[0][0].toUpperCase();
  return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
}
