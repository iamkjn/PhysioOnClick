import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../app_colors.dart';

class ConnectivityWrapper extends StatefulWidget {
  const ConnectivityWrapper({required this.child, super.key});

  final Widget child;

  @override
  State<ConnectivityWrapper> createState() => _ConnectivityWrapperState();
}

class _ConnectivityWrapperState extends State<ConnectivityWrapper> {
  late final StreamSubscription<List<ConnectivityResult>> _sub;
  bool _isOffline = false;

  static bool _isNone(List<ConnectivityResult> results) =>
      results.every((r) => r == ConnectivityResult.none);

  @override
  void initState() {
    super.initState();
    // Subscribe to changes — no initial check needed; assume online at start.
    _sub = Connectivity().onConnectivityChanged.listen((results) {
      final offline = _isNone(results);
      if (offline != _isOffline && mounted) {
        setState(() => _isOffline = offline);
      }
    });
  }

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }

  Future<void> _retry() async {
    final results = await Connectivity().checkConnectivity();
    if (_isNone(results)) return; // still offline
    if (mounted) setState(() => _isOffline = false);
  }

  @override
  Widget build(BuildContext context) {
    if (!_isOffline) return widget.child;
    return _OfflineScreen(onRetry: _retry);
  }
}

class _OfflineScreen extends StatelessWidget {
  const _OfflineScreen({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Wifi-off illustration
                Container(
                  width: 100,
                  height: 100,
                  decoration: const BoxDecoration(
                    color: AppColors.tealLight,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.wifi_off_rounded,
                    size: 48,
                    color: AppColors.teal,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'No internet connection',
                  style: GoogleFonts.dmSerifDisplay(
                    fontSize: 24,
                    color: AppColors.navy,
                    height: 1.2,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  'Check your WiFi or mobile data, then try again.',
                  style: GoogleFonts.dmSans(
                    fontSize: 15,
                    color: AppColors.textSecondary,
                    height: 1.6,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),
                FilledButton(
                  onPressed: onRetry,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
