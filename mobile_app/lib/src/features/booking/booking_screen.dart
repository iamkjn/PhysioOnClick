import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/config.dart';
import '../auth/auth_sheet.dart';
import 'booking_record.dart';

class _SignInBanner extends StatelessWidget {
  const _SignInBanner({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFD8F3F9),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF9ADCEE)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: Color(0xFF0891B2), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Sign in to save and track your bookings',
              style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFF0C2A38)),
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: () => showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (_) => const _AuthBottomSheet(),
            ),
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFF0891B2),
              textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Sign in'),
          ),
        ],
      ),
    );
  }
}

class _AuthBottomSheet extends StatelessWidget {
  const _AuthBottomSheet();

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snap) {
        if (snap.data != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (context.mounted && Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          });
        }
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.85,
          maxChildSize: 0.95,
          builder: (_, scrollController) => Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: ListView(
              controller: scrollController,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC8E8F0),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const AuthSheet(),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _RecentBookingsList extends StatelessWidget {
  const _RecentBookingsList({required this.userId, required this.theme});

  final String userId;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('bookings')
          .where('bookedBy', isEqualTo: userId)
          .orderBy('sessionDate', descending: true)
          .limit(10)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final items = snapshot.data?.docs
                .map((doc) => BookingRecord.fromMap(doc.data(), doc.id))
                .toList() ??
            <BookingRecord>[];

        if (items.isEmpty) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'No bookings found yet. Book an appointment above.',
              style: theme.textTheme.bodyMedium,
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final item = items[index];
            return Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.service,
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    Text(item.appointmentLabel, style: theme.textTheme.bodyMedium),
                    const SizedBox(height: 4),
                    Text('Status: ${item.status}', style: theme.textTheme.bodySmall),
                    if (item.notes.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(item.notes, style: theme.textTheme.bodySmall),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  late final WebViewController _controller;
  bool _webLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _webLoading = true),
          onPageFinished: (_) => setState(() => _webLoading = false),
        ),
      )
      ..loadRequest(Uri.parse(AppConfig.calComBookingUrl));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, authSnapshot) {
          if (authSnapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final user = authSnapshot.data;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                child: Text('Book an appointment', style: theme.textTheme.headlineMedium),
              ),
              if (user == null)
                _SignInBanner(theme: theme),
              Expanded(
                flex: 3,
                child: Stack(
                  children: [
                    WebViewWidget(controller: _controller),
                    if (_webLoading)
                      const Center(child: CircularProgressIndicator()),
                  ],
                ),
              ),
              if (user != null) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                  child: Text('Your recent bookings', style: theme.textTheme.titleLarge),
                ),
                Expanded(
                  flex: 2,
                  child: _RecentBookingsList(userId: user.uid, theme: theme),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}
