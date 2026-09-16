import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../core/page_transitions.dart';
import 'models/book_service.dart';
import 'time_details_screen.dart';

/// Step 1 of the native booking flow (service -> time/details -> assessment
/// -> payment -> confirmation). Lists the bookable services and pushes
/// [TimeDetailsScreen] for the chosen one.
class ServiceSelectScreen extends StatelessWidget {
  const ServiceSelectScreen({super.key});

  static void go(BuildContext context) {
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
