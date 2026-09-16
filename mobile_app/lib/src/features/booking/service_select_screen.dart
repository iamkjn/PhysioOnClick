import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import '../../core/widgets/auth_gate_sheet.dart';
import 'models/book_service.dart';
import 'time_details_screen.dart';

/// Step 1 of the native booking flow (service -> time/details -> assessment
/// -> payment -> confirmation). Lists the bookable services and pushes
/// [TimeDetailsScreen] for the chosen one.
class ServiceSelectScreen extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final services = allBookServices();
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Book an appointment')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: services.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) {
          final s = services[i];
          return Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              title: Text(s.title, style: theme.textTheme.titleMedium),
              subtitle: Text('${s.duration} · £${s.price.toStringAsFixed(0)}'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.push(
                  context,
                  PhysioPageRoute(builder: (_) => TimeDetailsScreen(service: s)),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
